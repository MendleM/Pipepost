import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateLicense, activateLicense } from "../src/license.js";
import * as http from "../src/http.js";
import * as config from "../src/config.js";

vi.mock("../src/http.js");
vi.mock("../src/config.js");

const mockHttp = vi.mocked(http);
const mockConfig = vi.mocked(config);

beforeEach(() => {
  vi.restoreAllMocks();
  mockConfig.readConfig.mockReturnValue({});
  mockConfig.writeConfig.mockReturnValue(undefined);
});

describe("validateLicense", () => {
  it("returns free tier when no license key configured", async () => {
    mockConfig.readConfig.mockReturnValue({});
    const result = await validateLicense();
    expect(result).toEqual({ valid: false, tier: "free" });
  });

  it("returns cached pro status if cache is fresh (< 24h)", async () => {
    const now = new Date();
    mockConfig.readConfig.mockReturnValue({
      license: {
        key: "abc",
        instance_id: "inst1",
        cached_status: "active",
        cached_at: now.toISOString(),
      },
    });

    const result = await validateLicense();
    expect(result).toEqual({ valid: true, tier: "pro" });
    expect(mockHttp.httpRequest).not.toHaveBeenCalled();
  });

  it("calls Lemon Squeezy when cache is stale (> 24h)", async () => {
    const stale = new Date(Date.now() - 25 * 60 * 60 * 1000);
    mockConfig.readConfig.mockReturnValue({
      license: {
        key: "abc",
        instance_id: "inst1",
        cached_status: "active",
        cached_at: stale.toISOString(),
      },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { valid: true, license_key: { status: "active" } },
    });

    const result = await validateLicense();
    expect(result).toEqual({ valid: true, tier: "pro" });
    expect(mockHttp.httpRequest).toHaveBeenCalledOnce();
    expect(mockConfig.writeConfig).toHaveBeenCalled();
  });

  it("degrades to free tier on network failure with no cache", async () => {
    mockConfig.readConfig.mockReturnValue({
      license: { key: "abc", instance_id: "inst1", cached_status: "active", cached_at: "" },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "NETWORK_ERROR", message: "timeout", retryable: true },
    });

    const result = await validateLicense();
    expect(result).toEqual({ valid: false, tier: "free" });
  });

  it("degrades to free tier when license is expired", async () => {
    const stale = new Date(Date.now() - 25 * 60 * 60 * 1000);
    mockConfig.readConfig.mockReturnValue({
      license: { key: "abc", instance_id: "inst1", cached_status: "active", cached_at: stale.toISOString() },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { valid: false, license_key: { status: "expired" } },
    });

    const result = await validateLicense();
    expect(result).toEqual({ valid: false, tier: "free" });
  });
});

describe("activateLicense", () => {
  it("activates and stores instance_id on success", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: {
        activated: true,
        instance: { id: "new-inst" },
        license_key: { status: "active" },
      },
    });

    const result = await activateLicense("my-key");
    expect(result.success).toBe(true);
    expect(mockConfig.writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        license: expect.objectContaining({
          key: "my-key",
          instance_id: "new-inst",
          cached_status: "active",
        }),
      })
    );
  });

  it("returns error on activation failure", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "AUTH_FAILED", message: "Invalid key", retryable: false },
    });

    const result = await activateLicense("bad-key");
    expect(result.success).toBe(false);
  });
});

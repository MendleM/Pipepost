import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateLicense, activateLicense } from "../src/license.js";
import * as http from "../src/http.js";
import * as config from "../src/config.js";
import * as credits from "../src/credits.js";

vi.mock("../src/http.js");
vi.mock("../src/config.js");
vi.mock("../src/credits.js");

const mockHttp = vi.mocked(http);
const mockConfig = vi.mocked(config);
const mockCredits = vi.mocked(credits);

beforeEach(() => {
  vi.restoreAllMocks();
  mockConfig.readConfig.mockReturnValue({});
  mockConfig.writeConfig.mockReturnValue(undefined);
  mockCredits.addCredits.mockReturnValue(undefined);
});

describe("validateLicense", () => {
  it("returns invalid with 0 credits when no license key configured", async () => {
    mockConfig.readConfig.mockReturnValue({});
    const result = await validateLicense();
    expect(result).toEqual({ valid: false, credits: 0 });
  });

  it("returns cached status if cache is fresh (< 24h)", async () => {
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
    expect(result).toEqual({ valid: true, credits: 30 });
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
    expect(result).toEqual({ valid: true, credits: 30 });
    expect(mockHttp.httpRequest).toHaveBeenCalledOnce();
    expect(mockConfig.writeConfig).toHaveBeenCalled();
  });

  it("degrades to 0 credits on network failure with no cache", async () => {
    mockConfig.readConfig.mockReturnValue({
      license: { key: "abc", instance_id: "inst1", cached_status: "active", cached_at: "" },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "NETWORK_ERROR", message: "timeout", retryable: true },
    });

    const result = await validateLicense();
    expect(result).toEqual({ valid: false, credits: 0 });
  });

  it("returns 0 credits when license is expired", async () => {
    const stale = new Date(Date.now() - 25 * 60 * 60 * 1000);
    mockConfig.readConfig.mockReturnValue({
      license: { key: "abc", instance_id: "inst1", cached_status: "active", cached_at: stale.toISOString() },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { valid: false, license_key: { status: "expired" } },
    });

    const result = await validateLicense();
    expect(result).toEqual({ valid: false, credits: 0 });
  });
});

describe("activateLicense", () => {
  it("activates, stores instance_id, and adds credits on success", async () => {
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
    if (result.success) {
      expect(result.data).toHaveProperty("credits_added", 30);
    }
    expect(mockConfig.writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        license: expect.objectContaining({
          key: "my-key",
          instance_id: "new-inst",
          cached_status: "active",
        }),
      })
    );
    expect(mockCredits.addCredits).toHaveBeenCalledWith(30);
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

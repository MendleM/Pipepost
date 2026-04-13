import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkTier, canPublish, recordPublish } from "../src/tier.js";
import * as license from "../src/license.js";
import * as config from "../src/config.js";

vi.mock("../src/license.js");
vi.mock("../src/config.js");

const mockLicense = vi.mocked(license);
const mockConfig = vi.mocked(config);

beforeEach(() => {
  vi.restoreAllMocks();
  mockConfig.readConfig.mockReturnValue({});
  mockConfig.writeConfig.mockReturnValue(undefined);
});

describe("checkTier", () => {
  it("returns pro when license is valid", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: true, tier: "pro" });
    expect(await checkTier()).toBe("pro");
  });

  it("returns free when license is invalid", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: false, tier: "free" });
    expect(await checkTier()).toBe("free");
  });
});

describe("canPublish", () => {
  it("always allows pro tier", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: true, tier: "pro" });
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 100, month: "2026-04" } });
    expect(await canPublish()).toEqual({ allowed: true, remaining: Infinity });
  });

  it("allows free tier under 3 publishes", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: false, tier: "free" });
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 1, month: "2026-04" } });
    expect(await canPublish()).toEqual({ allowed: true, remaining: 2 });
  });

  it("blocks free tier at 3 publishes", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: false, tier: "free" });
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 3, month: "2026-04" } });
    expect(await canPublish()).toEqual({ allowed: false, remaining: 0 });
  });

  it("resets counter when month changes", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: false, tier: "free" });
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 3, month: "2026-03" } });
    expect(await canPublish()).toEqual({ allowed: true, remaining: 3 });
  });
});

describe("recordPublish", () => {
  it("increments publish count for current month", () => {
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 1, month: "2026-04" } });
    recordPublish();
    const written = mockConfig.writeConfig.mock.calls[0][0];
    expect(written.usage?.publishes_this_month).toBe(2);
  });

  it("starts fresh counter for new month", () => {
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 5, month: "2026-03" } });
    recordPublish();
    const written = mockConfig.writeConfig.mock.calls[0][0];
    expect(written.usage?.publishes_this_month).toBe(1);
  });
});

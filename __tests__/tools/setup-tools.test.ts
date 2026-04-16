import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/config.js", () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

vi.mock("../../src/credits.js", () => ({
  getCredits: vi.fn(),
}));

vi.mock("../../src/license.js", () => ({
  activateLicense: vi.fn(),
}));

import { handleSetup, handleStatus } from "../../src/tools/setup-tools.js";
import { readConfig, writeConfig } from "../../src/config.js";
import { getCredits } from "../../src/credits.js";

const mockedReadConfig = vi.mocked(readConfig);
const mockedWriteConfig = vi.mocked(writeConfig);
const mockedGetCredits = vi.mocked(getCredits);

beforeEach(() => {
  vi.clearAllMocks();
  mockedReadConfig.mockReturnValue({});
});

// ── handleSetup ──

describe("handleSetup", () => {
  it("saves api_key for devto", async () => {
    const result = await handleSetup({
      platform: "devto",
      credentials: { api_key: "my-devto-key" },
    });

    expect(result.success).toBe(true);
    expect(mockedWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        platforms: expect.objectContaining({
          devto: { api_key: "my-devto-key" },
        }),
      })
    );
  });

  it("requires url and admin_key for ghost", async () => {
    // Missing admin_key
    const result = await handleSetup({
      platform: "ghost",
      credentials: { url: "https://ghost.io" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("admin_key");
    }

    // Both present
    const ok = await handleSetup({
      platform: "ghost",
      credentials: { url: "https://ghost.io", admin_key: "id:secret" },
    });
    expect(ok.success).toBe(true);
  });

  it("requires token and publication_id for hashnode", async () => {
    const missing = await handleSetup({
      platform: "hashnode",
      credentials: { token: "ht" },
    });
    expect(missing.success).toBe(false);
    if (!missing.success) {
      expect(missing.error.message).toContain("publication_id");
    }

    const ok = await handleSetup({
      platform: "hashnode",
      credentials: { token: "ht", publication_id: "pid" },
    });
    expect(ok.success).toBe(true);
  });

  it("requires url, username, and app_password for wordpress", async () => {
    const missing = await handleSetup({
      platform: "wordpress",
      credentials: { url: "https://wp.example.com", username: "admin" },
    });
    expect(missing.success).toBe(false);
    if (!missing.success) {
      expect(missing.error.message).toContain("app_password");
    }

    const ok = await handleSetup({
      platform: "wordpress",
      credentials: { url: "https://wp.example.com", username: "admin", app_password: "pass" },
    });
    expect(ok.success).toBe(true);
  });

  it("saves token for medium", async () => {
    const result = await handleSetup({
      platform: "medium",
      credentials: { token: "my-medium-token" },
    });
    expect(result.success).toBe(true);
    expect(mockedWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        platforms: expect.objectContaining({
          medium: { token: "my-medium-token" },
        }),
      })
    );
  });

  it("saves access_key for unsplash", async () => {
    const result = await handleSetup({
      platform: "unsplash",
      credentials: { access_key: "unsplash-key-123" },
    });
    expect(result.success).toBe(true);
    expect(mockedWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        images: expect.objectContaining({
          unsplash_access_key: "unsplash-key-123",
        }),
      })
    );
  });

  it("saves handle and app_password for bluesky", async () => {
    const result = await handleSetup({
      platform: "bluesky",
      credentials: { handle: "test.bsky.social", app_password: "abcd-efgh-ijkl-mnop" },
    });
    expect(result.success).toBe(true);
    expect(mockedWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        social: expect.objectContaining({
          bluesky: { handle: "test.bsky.social", app_password: "abcd-efgh-ijkl-mnop" },
        }),
      })
    );
  });

  it("requires both handle and app_password for bluesky", async () => {
    const result = await handleSetup({
      platform: "bluesky",
      credentials: { handle: "test.bsky.social" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("saves instance_url and access_token for mastodon", async () => {
    const result = await handleSetup({
      platform: "mastodon",
      credentials: { instance_url: "https://mastodon.social", access_token: "mast-token" },
    });
    expect(result.success).toBe(true);
    expect(mockedWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        social: expect.objectContaining({
          mastodon: { instance_url: "https://mastodon.social", access_token: "mast-token" },
        }),
      })
    );
  });

  it("requires both instance_url and access_token for mastodon", async () => {
    const result = await handleSetup({
      platform: "mastodon",
      credentials: { instance_url: "https://mastodon.social" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("access_token");
    }
  });

  it("returns error for invalid platform", async () => {
    const result = await handleSetup({
      platform: "fakebook",
      credentials: { token: "x" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("not supported");
    }
  });
});

// ── handleStatus ──

describe("handleStatus", () => {
  it("returns version, credit info, and platform status", async () => {
    mockedReadConfig.mockReturnValue({
      platforms: {
        devto: { api_key: "dk" },
        ghost: { url: "https://ghost.io", admin_key: "id:secret" },
      },
      social: {
        twitter: { consumer_key: "ck", consumer_secret: "cs", access_token: "at", access_token_secret: "ats" },
      },
      license: {
        key: "lk",
        instance_id: "iid",
        cached_status: "active",
        cached_at: "2026-04-16T00:00:00Z",
      },
    });
    mockedGetCredits.mockReturnValue({ balance: 10, freeRemaining: 2, total: 12 });

    const result = await handleStatus();
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as {
        credits: { purchased: number; free_remaining: number; total: number };
        platforms_configured: string[];
        social_configured: string[];
        license_status: string;
      };
      expect(data.credits.purchased).toBe(10);
      expect(data.credits.free_remaining).toBe(2);
      expect(data.credits.total).toBe(12);
      expect(data.platforms_configured).toContain("devto");
      expect(data.platforms_configured).toContain("ghost");
      expect(data.social_configured).toContain("twitter");
      expect(data.license_status).toBe("active");
    }
  });

  it("returns 'none' license status when no license configured", async () => {
    mockedReadConfig.mockReturnValue({});
    mockedGetCredits.mockReturnValue({ balance: 0, freeRemaining: 3, total: 3 });

    const result = await handleStatus();
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { license_status: string };
      expect(data.license_status).toBe("none");
    }
  });
});

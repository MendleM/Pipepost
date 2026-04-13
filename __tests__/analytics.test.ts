import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleAnalytics } from "../src/tools/analytics-tools.js";
import * as http from "../src/http.js";
import * as config from "../src/config.js";

vi.mock("../src/http.js");
vi.mock("../src/config.js");

const mockHttp = vi.mocked(http);
const mockConfig = vi.mocked(config);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("handleAnalytics", () => {
  it("returns error when no platforms are configured", async () => {
    mockConfig.readConfig.mockReturnValue({});

    const result = await handleAnalytics({ limit: 10 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("No platforms configured");
    }
  });

  it("returns error when requested platform is not configured", async () => {
    mockConfig.readConfig.mockReturnValue({
      platforms: { devto: { api_key: "key" } },
    });

    const result = await handleAnalytics({ platform: "ghost", limit: 10 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("ghost");
    }
  });

  it("fetches Dev.to analytics with views, reactions, and comments", async () => {
    mockConfig.readConfig.mockReturnValue({
      platforms: { devto: { api_key: "fake-key" } },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: [
        {
          title: "My Post",
          url: "https://dev.to/user/my-post",
          page_views_count: 150,
          positive_reactions_count: 12,
          comments_count: 3,
          published_at: "2026-04-10T12:00:00Z",
        },
        {
          title: "Another Post",
          url: "https://dev.to/user/another-post",
          page_views_count: 80,
          positive_reactions_count: 5,
          comments_count: 1,
          published_at: "2026-04-08T12:00:00Z",
        },
      ],
    });

    const result = await handleAnalytics({ platform: "devto", limit: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platforms).toHaveLength(1);
      expect(result.data.platforms[0].platform).toBe("devto");
      expect(result.data.platforms[0].posts).toHaveLength(2);
      expect(result.data.platforms[0].posts[0].views).toBe(150);
      expect(result.data.platforms[0].posts[0].reactions).toBe(12);
      expect(result.data.platforms[0].posts[0].comments).toBe(3);
      expect(result.data.summary.total_posts).toBe(2);
      expect(result.data.summary.total_views).toBe(230);
      expect(result.data.summary.total_reactions).toBe(17);
    }
  });

  it("sends correct Dev.to API request", async () => {
    mockConfig.readConfig.mockReturnValue({
      platforms: { devto: { api_key: "test-key" } },
    });

    mockHttp.httpRequest.mockResolvedValue({ success: true, data: [] });

    await handleAnalytics({ platform: "devto", limit: 5 });

    const [url, opts] = mockHttp.httpRequest.mock.calls[0];
    expect(url).toBe("https://dev.to/api/articles/me?per_page=5");
    expect(opts.method).toBe("GET");
    expect(opts.headers?.["api-key"]).toBe("test-key");
  });

  it("fetches Ghost analytics with post metadata", async () => {
    mockConfig.readConfig.mockReturnValue({
      platforms: {
        ghost: { url: "https://myblog.com", admin_key: "abc123:deadbeefcafebabe1234567890abcdef" },
      },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: {
        posts: [
          {
            title: "Ghost Post",
            slug: "ghost-post",
            status: "published",
            published_at: "2026-04-12T10:00:00Z",
            updated_at: "2026-04-12T10:00:00Z",
            url: "https://myblog.com/ghost-post/",
          },
        ],
      },
    });

    const result = await handleAnalytics({ platform: "ghost", limit: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platforms).toHaveLength(1);
      expect(result.data.platforms[0].platform).toBe("ghost");
      expect(result.data.platforms[0].posts).toHaveLength(1);
      expect(result.data.platforms[0].posts[0].title).toBe("Ghost Post");
      expect(result.data.platforms[0].posts[0].status).toBe("published");
    }
  });

  it("sends correct Ghost API request with JWT auth", async () => {
    mockConfig.readConfig.mockReturnValue({
      platforms: {
        ghost: { url: "https://myblog.com", admin_key: "abc123:deadbeefcafebabe1234567890abcdef" },
      },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { posts: [] },
    });

    await handleAnalytics({ platform: "ghost", limit: 5 });

    const [url, opts] = mockHttp.httpRequest.mock.calls[0];
    expect(url).toContain("https://myblog.com/ghost/api/admin/posts/");
    expect(url).toContain("limit=5");
    expect(opts.headers?.["Authorization"]).toMatch(/^Ghost /);
  });

  it("returns Medium note about unsupported analytics", async () => {
    mockConfig.readConfig.mockReturnValue({
      platforms: { medium: { token: "med-token" } },
    });

    const result = await handleAnalytics({ platform: "medium", limit: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platforms).toHaveLength(1);
      expect(result.data.platforms[0].platform).toBe("medium");
      expect(result.data.platforms[0].posts).toHaveLength(0);
      expect(result.data.platforms[0].note).toContain("does not support analytics");
    }
  });

  it("aggregates across all configured platforms", async () => {
    mockConfig.readConfig.mockReturnValue({
      platforms: {
        devto: { api_key: "key" },
        medium: { token: "tok" },
      },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: [
        {
          title: "Post",
          url: "https://dev.to/p",
          page_views_count: 100,
          positive_reactions_count: 10,
          comments_count: 2,
          published_at: "2026-04-10",
        },
      ],
    });

    const result = await handleAnalytics({ limit: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platforms).toHaveLength(2);
      const platformNames = result.data.platforms.map((p) => p.platform);
      expect(platformNames).toContain("devto");
      expect(platformNames).toContain("medium");
      expect(result.data.summary.total_posts).toBe(1);
      expect(result.data.summary.total_views).toBe(100);
    }
  });

  it("handles API errors gracefully per platform", async () => {
    mockConfig.readConfig.mockReturnValue({
      platforms: { devto: { api_key: "bad-key" } },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "AUTH_FAILED", message: "HTTP 401: Unauthorized", retryable: false },
    });

    const result = await handleAnalytics({ platform: "devto", limit: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platforms[0].posts).toHaveLength(0);
      expect(result.data.platforms[0].note).toContain("Error");
    }
  });

  it("defaults limit to 10", async () => {
    mockConfig.readConfig.mockReturnValue({
      platforms: { devto: { api_key: "key" } },
    });

    mockHttp.httpRequest.mockResolvedValue({ success: true, data: [] });

    await handleAnalytics({ platform: "devto" });

    const [url] = mockHttp.httpRequest.mock.calls[0];
    expect(url).toContain("per_page=10");
  });
});

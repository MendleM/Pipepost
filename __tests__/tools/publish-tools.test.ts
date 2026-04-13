import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all dependencies before importing the module under test
vi.mock("../../src/config.js", () => ({
  readConfig: vi.fn(),
}));

vi.mock("../../src/credits.js", () => ({
  hasCredits: vi.fn(),
  useCredit: vi.fn(),
  addCredits: vi.fn(),
}));

vi.mock("../../src/publish/devto.js", () => ({
  publishToDevto: vi.fn(),
  listDevtoPosts: vi.fn(),
}));

vi.mock("../../src/publish/ghost.js", () => ({
  publishToGhost: vi.fn(),
  listGhostPosts: vi.fn(),
}));

vi.mock("../../src/publish/hashnode.js", () => ({
  publishToHashnode: vi.fn(),
  listHashnodePosts: vi.fn(),
}));

vi.mock("../../src/publish/wordpress.js", () => ({
  publishToWordpress: vi.fn(),
  listWordpressPosts: vi.fn(),
}));

vi.mock("../../src/publish/medium.js", () => ({
  publishToMedium: vi.fn(),
}));

import { handlePublish, handleListPosts, handleCrossPublish } from "../../src/tools/publish-tools.js";
import { readConfig } from "../../src/config.js";
import { useCredit, addCredits } from "../../src/credits.js";
import { publishToDevto, listDevtoPosts } from "../../src/publish/devto.js";
import { publishToGhost, listGhostPosts } from "../../src/publish/ghost.js";
import { publishToHashnode, listHashnodePosts } from "../../src/publish/hashnode.js";
import { publishToWordpress, listWordpressPosts } from "../../src/publish/wordpress.js";
import { publishToMedium } from "../../src/publish/medium.js";

const mockedReadConfig = vi.mocked(readConfig);
const mockedUseCredit = vi.mocked(useCredit);
const mockedAddCredits = vi.mocked(addCredits);
const mockedPublishToDevto = vi.mocked(publishToDevto);
const mockedListDevtoPosts = vi.mocked(listDevtoPosts);
const mockedPublishToGhost = vi.mocked(publishToGhost);
const mockedListGhostPosts = vi.mocked(listGhostPosts);
const mockedPublishToHashnode = vi.mocked(publishToHashnode);
const mockedListHashnodePosts = vi.mocked(listHashnodePosts);
const mockedPublishToWordpress = vi.mocked(publishToWordpress);
const mockedListWordpressPosts = vi.mocked(listWordpressPosts);
const mockedPublishToMedium = vi.mocked(publishToMedium);

const BASE_INPUT = {
  platform: "devto",
  title: "Test Article",
  content: "Some markdown content here.",
  status: "draft" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── handlePublish ──

describe("handlePublish", () => {
  it("calls devto client and returns success when config is valid", async () => {
    mockedUseCredit.mockReturnValue({ success: true, remaining: 2 });
    mockedReadConfig.mockReturnValue({
      platforms: { devto: { api_key: "test-key" } },
    });
    mockedPublishToDevto.mockResolvedValue({
      success: true,
      data: { post_id: "123", url: "https://dev.to/test", platform: "devto" },
    });

    const result = await handlePublish(BASE_INPUT);
    expect(result.success).toBe(true);
    expect(mockedPublishToDevto).toHaveBeenCalledOnce();
    expect(mockedPublishToDevto).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Test Article" }),
      "test-key"
    );
  });

  it("returns PUBLISH_LIMIT error when no credits remain", async () => {
    mockedUseCredit.mockReturnValue({ success: false, remaining: 0 });

    const result = await handlePublish(BASE_INPUT);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("PUBLISH_LIMIT");
    }
  });

  it("returns AUTH_FAILED and refunds credit when platform config is missing", async () => {
    mockedUseCredit.mockReturnValue({ success: true, remaining: 2 });
    mockedReadConfig.mockReturnValue({ platforms: {} });

    const result = await handlePublish(BASE_INPUT);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTH_FAILED");
    }
    // Credit should be refunded on failure
    expect(mockedAddCredits).toHaveBeenCalledWith(1);
  });

  it("passes featured_image_url to devto client", async () => {
    mockedUseCredit.mockReturnValue({ success: true, remaining: 2 });
    mockedReadConfig.mockReturnValue({
      platforms: { devto: { api_key: "test-key" } },
    });
    mockedPublishToDevto.mockResolvedValue({
      success: true,
      data: { post_id: "123", url: "https://dev.to/test", platform: "devto" },
    });

    await handlePublish({
      ...BASE_INPUT,
      featured_image_url: "https://example.com/image.png",
    });

    expect(mockedPublishToDevto).toHaveBeenCalledWith(
      expect.objectContaining({ featured_image_url: "https://example.com/image.png" }),
      "test-key"
    );
  });

  it("passes series to devto client", async () => {
    mockedUseCredit.mockReturnValue({ success: true, remaining: 2 });
    mockedReadConfig.mockReturnValue({
      platforms: { devto: { api_key: "test-key" } },
    });
    mockedPublishToDevto.mockResolvedValue({
      success: true,
      data: { post_id: "123", url: "https://dev.to/test", platform: "devto" },
    });

    await handlePublish({ ...BASE_INPUT, series: "My Series" });

    expect(mockedPublishToDevto).toHaveBeenCalledWith(
      expect.objectContaining({ series: "My Series" }),
      "test-key"
    );
  });

  it("returns VALIDATION_ERROR for unsupported platform", async () => {
    mockedUseCredit.mockReturnValue({ success: true, remaining: 2 });

    const result = await handlePublish({ ...BASE_INPUT, platform: "fakeplatform" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});

// ── handleCrossPublish ──

describe("handleCrossPublish", () => {
  it("publishes to 3 platforms with a single credit charge", async () => {
    mockedUseCredit.mockReturnValue({ success: true, remaining: 4 });
    mockedReadConfig.mockReturnValue({
      platforms: {
        devto: { api_key: "dk" },
        ghost: { url: "https://ghost.example.com", admin_key: "id:secret" },
        hashnode: { token: "ht", publication_id: "pid" },
      },
    });

    mockedPublishToDevto.mockResolvedValue({
      success: true,
      data: { post_id: "1", url: "https://dev.to/x", platform: "devto" },
    });
    mockedPublishToGhost.mockResolvedValue({
      success: true,
      data: { post_id: "2", url: "https://ghost.example.com/x", platform: "ghost" },
    });
    mockedPublishToHashnode.mockResolvedValue({
      success: true,
      data: { post_id: "3", url: "https://hashnode.com/x", platform: "hashnode" },
    });

    const result = await handleCrossPublish({
      platforms: ["devto", "ghost", "hashnode"],
      title: "Cross Post",
      content: "Some content.",
      status: "draft",
    });

    // Only 1 credit consumed for the entire cross-publish
    expect(mockedUseCredit).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { summary: string; results: unknown[] };
      expect(data.results).toHaveLength(3);
      expect(data.summary).toContain("3/3");
    }
  });

  it("returns success with mixed results when some platforms fail", async () => {
    mockedUseCredit.mockReturnValue({ success: true, remaining: 4 });
    mockedReadConfig.mockReturnValue({
      platforms: {
        devto: { api_key: "dk" },
      },
    });

    mockedPublishToDevto.mockResolvedValue({
      success: true,
      data: { post_id: "1", url: "https://dev.to/x", platform: "devto" },
    });

    // ghost is not configured, so it will fail with AUTH_FAILED
    const result = await handleCrossPublish({
      platforms: ["devto", "ghost"],
      title: "Cross Post",
      content: "Some content.",
      status: "draft",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { summary: string; results: Array<{ success: boolean }> };
      expect(data.summary).toContain("1/2");
      expect(data.results.filter((r) => !r.success)).toHaveLength(1);
    }
  });

  it("returns PUBLISH_LIMIT when no credits remain", async () => {
    mockedUseCredit.mockReturnValue({ success: false, remaining: 0 });

    const result = await handleCrossPublish({
      platforms: ["devto"],
      title: "Test",
      content: "Content",
      status: "draft",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("PUBLISH_LIMIT");
    }
  });

  it("refunds credit when all platforms fail", async () => {
    mockedUseCredit.mockReturnValue({ success: true, remaining: 4 });
    mockedReadConfig.mockReturnValue({ platforms: {} }); // no platforms configured

    const result = await handleCrossPublish({
      platforms: ["devto", "ghost"],
      title: "Cross Post",
      content: "Some content.",
      status: "draft",
    });

    // All failed → credit refunded
    expect(mockedAddCredits).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { summary: string };
      expect(data.summary).toContain("refunded");
    }
  });

  it("returns VALIDATION_ERROR when platforms array is empty", async () => {
    const result = await handleCrossPublish({
      platforms: [],
      title: "Test",
      content: "Content",
      status: "draft",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});

// ── handleListPosts ──

describe("handleListPosts", () => {
  it("lists devto posts", async () => {
    mockedReadConfig.mockReturnValue({
      platforms: { devto: { api_key: "dk" } },
    });
    mockedListDevtoPosts.mockResolvedValue({
      success: true,
      data: { posts: [{ id: "1", title: "Post", url: "https://dev.to/p", status: "published", published_at: "2026-01-01" }] },
    });

    const result = await handleListPosts({ platform: "devto", status: "all", limit: 30 });
    expect(result.success).toBe(true);
    expect(mockedListDevtoPosts).toHaveBeenCalledWith("dk", 1, 30);
  });

  it("lists ghost posts", async () => {
    mockedReadConfig.mockReturnValue({
      platforms: { ghost: { url: "https://ghost.io", admin_key: "id:secret" } },
    });
    mockedListGhostPosts.mockResolvedValue({
      success: true,
      data: { posts: [] },
    });

    const result = await handleListPosts({ platform: "ghost", status: "all", limit: 15 });
    expect(result.success).toBe(true);
    expect(mockedListGhostPosts).toHaveBeenCalledWith(
      { url: "https://ghost.io", admin_key: "id:secret" },
      1,
      15
    );
  });

  it("lists hashnode posts", async () => {
    mockedReadConfig.mockReturnValue({
      platforms: { hashnode: { token: "ht", publication_id: "pid" } },
    });
    mockedListHashnodePosts.mockResolvedValue({
      success: true,
      data: { posts: [] },
    });

    const result = await handleListPosts({ platform: "hashnode", status: "all", limit: 20 });
    expect(result.success).toBe(true);
    expect(mockedListHashnodePosts).toHaveBeenCalledWith(
      { token: "ht", publication_id: "pid" },
      20
    );
  });

  it("lists wordpress posts", async () => {
    mockedReadConfig.mockReturnValue({
      platforms: { wordpress: { url: "https://wp.example.com", username: "admin", app_password: "pass" } },
    });
    mockedListWordpressPosts.mockResolvedValue({
      success: true,
      data: { posts: [] },
    });

    const result = await handleListPosts({ platform: "wordpress", status: "all", limit: 10 });
    expect(result.success).toBe(true);
    expect(mockedListWordpressPosts).toHaveBeenCalledWith(
      { url: "https://wp.example.com", username: "admin", app_password: "pass" },
      1,
      10
    );
  });

  it("returns VALIDATION_ERROR for medium (listing not supported)", async () => {
    mockedReadConfig.mockReturnValue({
      platforms: { medium: { token: "mt" } },
    });

    const result = await handleListPosts({ platform: "medium", status: "all", limit: 30 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("Medium API does not support listing posts");
    }
  });
});

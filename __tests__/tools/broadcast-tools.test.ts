import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/config.js", () => ({
  readConfig: vi.fn(),
}));

vi.mock("../../src/broadcast/bluesky.js", () => ({
  postToBluesky: vi.fn(),
  postThreadToBluesky: vi.fn(),
}));

vi.mock("../../src/broadcast/mastodon.js", () => ({
  postToMastodon: vi.fn(),
  postThreadToMastodon: vi.fn(),
}));

import { handleBlueskyPost, handleMastodonPost } from "../../src/tools/broadcast-tools.js";
import { readConfig } from "../../src/config.js";
import { postToBluesky, postThreadToBluesky } from "../../src/broadcast/bluesky.js";
import { postToMastodon, postThreadToMastodon } from "../../src/broadcast/mastodon.js";

const mockedReadConfig = vi.mocked(readConfig);
const mockedPostToBluesky = vi.mocked(postToBluesky);
const mockedPostThread = vi.mocked(postThreadToBluesky);
const mockedPostToMastodon = vi.mocked(postToMastodon);
const mockedPostMastodonThread = vi.mocked(postThreadToMastodon);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleBlueskyPost", () => {
  it("fails when Bluesky not configured", async () => {
    mockedReadConfig.mockReturnValue({});
    const result = await handleBlueskyPost({ text: "hello" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
    expect(result.error.message).toContain("app-passwords");
  });

  it("fails when neither text nor thread provided", async () => {
    mockedReadConfig.mockReturnValue({
      social: { bluesky: { handle: "test.bsky.social", app_password: "abcd" } },
    });
    const result = await handleBlueskyPost({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("fails when both text and thread provided", async () => {
    mockedReadConfig.mockReturnValue({
      social: { bluesky: { handle: "test.bsky.social", app_password: "abcd" } },
    });
    const result = await handleBlueskyPost({ text: "a", thread: ["b", "c"] });
    expect(result.success).toBe(false);
  });

  it("routes single post to postToBluesky", async () => {
    mockedReadConfig.mockReturnValue({
      social: { bluesky: { handle: "test.bsky.social", app_password: "abcd" } },
    });
    mockedPostToBluesky.mockResolvedValue({
      success: true,
      data: {
        uri: "at://did:plc:abc/app.bsky.feed.post/xyz",
        cid: "cid1",
        url: "https://bsky.app/profile/test.bsky.social/post/xyz",
      },
    });

    const result = await handleBlueskyPost({ text: "hello" });

    expect(result.success).toBe(true);
    expect(mockedPostToBluesky).toHaveBeenCalledWith("hello", {
      handle: "test.bsky.social",
      app_password: "abcd",
    });
    expect(mockedPostThread).not.toHaveBeenCalled();
  });

  it("routes thread to postThreadToBluesky", async () => {
    mockedReadConfig.mockReturnValue({
      social: { bluesky: { handle: "test.bsky.social", app_password: "abcd" } },
    });
    mockedPostThread.mockResolvedValue({
      success: true,
      data: {
        posts: [
          { uri: "at://x/1", cid: "c1", url: "https://bsky.app/profile/test.bsky.social/post/1" },
          { uri: "at://x/2", cid: "c2", url: "https://bsky.app/profile/test.bsky.social/post/2" },
        ],
      },
    });

    const result = await handleBlueskyPost({ thread: ["one", "two"] });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(mockedPostThread).toHaveBeenCalled();
    expect(mockedPostToBluesky).not.toHaveBeenCalled();
    const data = result.data as { count: number; thread_url: string };
    expect(data.count).toBe(2);
    expect(data.thread_url).toBe("https://bsky.app/profile/test.bsky.social/post/1");
  });
});

describe("handleMastodonPost", () => {
  it("fails when Mastodon not configured", async () => {
    mockedReadConfig.mockReturnValue({});
    const result = await handleMastodonPost({ text: "hi" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
    expect(result.error.message).toContain("write:statuses");
  });

  it("fails when neither text nor thread provided", async () => {
    mockedReadConfig.mockReturnValue({
      social: { mastodon: { instance_url: "https://m.social", access_token: "t" } },
    });
    const result = await handleMastodonPost({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("fails when both text and thread provided", async () => {
    mockedReadConfig.mockReturnValue({
      social: { mastodon: { instance_url: "https://m.social", access_token: "t" } },
    });
    const result = await handleMastodonPost({ text: "a", thread: ["b"] });
    expect(result.success).toBe(false);
  });

  it("routes single post to postToMastodon", async () => {
    mockedReadConfig.mockReturnValue({
      social: { mastodon: { instance_url: "https://m.social", access_token: "t" } },
    });
    mockedPostToMastodon.mockResolvedValue({
      success: true,
      data: { id: "abc", url: "https://m.social/@user/abc" },
    });

    const result = await handleMastodonPost({ text: "hello" });

    expect(result.success).toBe(true);
    expect(mockedPostToMastodon).toHaveBeenCalledWith(
      "hello",
      { instance_url: "https://m.social", access_token: "t" },
      undefined
    );
    expect(mockedPostMastodonThread).not.toHaveBeenCalled();
  });

  it("routes thread to postThreadToMastodon", async () => {
    mockedReadConfig.mockReturnValue({
      social: { mastodon: { instance_url: "https://m.social", access_token: "t" } },
    });
    mockedPostMastodonThread.mockResolvedValue({
      success: true,
      data: {
        posts: [
          { id: "1", url: "https://m.social/@user/1" },
          { id: "2", url: "https://m.social/@user/2" },
        ],
      },
    });

    const result = await handleMastodonPost({ thread: ["one", "two"] });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(mockedPostMastodonThread).toHaveBeenCalled();
    expect(mockedPostToMastodon).not.toHaveBeenCalled();
    const data = result.data as { count: number; thread_url: string };
    expect(data.count).toBe(2);
    expect(data.thread_url).toBe("https://m.social/@user/1");
  });

  it("forwards max_length override to the client", async () => {
    mockedReadConfig.mockReturnValue({
      social: { mastodon: { instance_url: "https://m.social", access_token: "t" } },
    });
    mockedPostToMastodon.mockResolvedValue({
      success: true,
      data: { id: "abc", url: "https://m.social/@user/abc" },
    });

    await handleMastodonPost({ text: "hello", max_length: 1000 });

    expect(mockedPostToMastodon).toHaveBeenCalledWith(
      "hello",
      expect.anything(),
      { maxLength: 1000 }
    );
  });
});

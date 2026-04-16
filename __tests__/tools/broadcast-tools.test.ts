import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/config.js", () => ({
  readConfig: vi.fn(),
}));

vi.mock("../../src/broadcast/bluesky.js", () => ({
  postToBluesky: vi.fn(),
  postThreadToBluesky: vi.fn(),
  listBlueskyMentions: vi.fn(),
  searchBlueskyPosts: vi.fn(),
  getBlueskyThread: vi.fn(),
  replyToBluesky: vi.fn(),
}));

vi.mock("../../src/broadcast/mastodon.js", () => ({
  postToMastodon: vi.fn(),
  postThreadToMastodon: vi.fn(),
}));

import {
  handleBlueskyPost,
  handleMastodonPost,
  handleBlueskyMentions,
  handleBlueskySearch,
  handleBlueskyThread,
  handleBlueskyReply,
} from "../../src/tools/broadcast-tools.js";
import { readConfig } from "../../src/config.js";
import {
  postToBluesky,
  postThreadToBluesky,
  listBlueskyMentions,
  searchBlueskyPosts,
  getBlueskyThread,
  replyToBluesky,
} from "../../src/broadcast/bluesky.js";
import { postToMastodon, postThreadToMastodon } from "../../src/broadcast/mastodon.js";

const mockedReadConfig = vi.mocked(readConfig);
const mockedPostToBluesky = vi.mocked(postToBluesky);
const mockedPostThread = vi.mocked(postThreadToBluesky);
const mockedPostToMastodon = vi.mocked(postToMastodon);
const mockedPostMastodonThread = vi.mocked(postThreadToMastodon);
const mockedListMentions = vi.mocked(listBlueskyMentions);
const mockedSearchPosts = vi.mocked(searchBlueskyPosts);
const mockedGetThread = vi.mocked(getBlueskyThread);
const mockedReplyToBluesky = vi.mocked(replyToBluesky);

const blueskyCreds = {
  social: { bluesky: { handle: "test.bsky.social", app_password: "abcd" } },
};

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

describe("handleBlueskyMentions", () => {
  it("fails when Bluesky not configured", async () => {
    mockedReadConfig.mockReturnValue({});
    const result = await handleBlueskyMentions({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
    expect(mockedListMentions).not.toHaveBeenCalled();
  });

  it("forwards limit, cursor, and reasons to the client", async () => {
    mockedReadConfig.mockReturnValue(blueskyCreds);
    mockedListMentions.mockResolvedValue({
      success: true,
      data: { notifications: [], cursor: undefined },
    });

    await handleBlueskyMentions({
      limit: 10,
      cursor: "c1",
      reasons: ["mention"],
    });

    expect(mockedListMentions).toHaveBeenCalledWith(
      blueskyCreds.social.bluesky,
      { limit: 10, cursor: "c1", reasons: ["mention"] }
    );
  });

  it("passes through client responses unchanged", async () => {
    mockedReadConfig.mockReturnValue(blueskyCreds);
    mockedListMentions.mockResolvedValue({
      success: true,
      data: {
        notifications: [
          {
            uri: "at://x/1",
            cid: "c1",
            reason: "reply",
            author: { did: "did:plc:a", handle: "a.bsky.social" },
            text: "hi",
            isRead: false,
            indexedAt: "2026-04-14T00:00:00Z",
          },
        ],
        cursor: "next",
      },
    });

    const result = await handleBlueskyMentions({});

    expect(result.success).toBe(true);
    if (!result.success) return;
    const data = result.data as { notifications: unknown[]; cursor?: string };
    expect(data.notifications).toHaveLength(1);
    expect(data.cursor).toBe("next");
  });
});

describe("handleBlueskySearch", () => {
  it("requires no auth — runs even with empty config", async () => {
    mockedReadConfig.mockReturnValue({});
    mockedSearchPosts.mockResolvedValue({
      success: true,
      data: { posts: [], cursor: undefined },
    });

    const result = await handleBlueskySearch({ query: "mcp" });

    expect(result.success).toBe(true);
    expect(mockedSearchPosts).toHaveBeenCalled();
  });

  it("forwards every optional filter to the client", async () => {
    mockedSearchPosts.mockResolvedValue({
      success: true,
      data: { posts: [], cursor: undefined },
    });

    await handleBlueskySearch({
      query: "claude code",
      limit: 5,
      cursor: "c1",
      sort: "top",
      since: "2026-04-01",
      mentions: "pipepost.bsky.social",
      author: "someone.bsky.social",
      lang: "en",
      tag: ["ai"],
    });

    expect(mockedSearchPosts).toHaveBeenCalledWith("claude code", {
      limit: 5,
      cursor: "c1",
      sort: "top",
      since: "2026-04-01",
      mentions: "pipepost.bsky.social",
      author: "someone.bsky.social",
      lang: "en",
      tag: ["ai"],
    });
  });
});

describe("handleBlueskyThread", () => {
  it("runs without Bluesky auth — public AppView", async () => {
    mockedReadConfig.mockReturnValue({});
    mockedGetThread.mockResolvedValue({
      success: true,
      data: {
        post: {
          uri: "at://x/1",
          cid: "c1",
          author: { did: "did:plc:a", handle: "a.bsky.social" },
          text: "hi",
          indexedAt: "2026-04-14T00:00:00Z",
          url: "https://bsky.app/profile/a.bsky.social/post/1",
        },
        replies: [],
      },
    });

    const result = await handleBlueskyThread({
      uri: "at://did:plc:a/app.bsky.feed.post/1",
    });

    expect(result.success).toBe(true);
    expect(mockedGetThread).toHaveBeenCalledWith(
      "at://did:plc:a/app.bsky.feed.post/1",
      { depth: undefined, parentHeight: undefined }
    );
  });

  it("maps depth and parent_height options", async () => {
    mockedGetThread.mockResolvedValue({
      success: true,
      data: {
        post: {
          uri: "at://x/1",
          cid: "c1",
          author: { did: "did:plc:a", handle: "a.bsky.social" },
          text: "",
          indexedAt: "2026-04-14T00:00:00Z",
          url: "https://bsky.app/profile/a.bsky.social/post/1",
        },
        replies: [],
      },
    });

    await handleBlueskyThread({
      uri: "at://did:plc:a/app.bsky.feed.post/1",
      depth: 3,
      parent_height: 10,
    });

    expect(mockedGetThread).toHaveBeenCalledWith(
      "at://did:plc:a/app.bsky.feed.post/1",
      { depth: 3, parentHeight: 10 }
    );
  });
});

describe("handleBlueskyReply", () => {
  it("fails when Bluesky not configured", async () => {
    mockedReadConfig.mockReturnValue({});
    const result = await handleBlueskyReply({
      parent_uri: "at://x/1",
      text: "hi",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
    expect(mockedReplyToBluesky).not.toHaveBeenCalled();
  });

  it("fails when neither text nor thread provided", async () => {
    mockedReadConfig.mockReturnValue(blueskyCreds);
    const result = await handleBlueskyReply({
      parent_uri: "at://x/1",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("fails when both text and thread provided", async () => {
    mockedReadConfig.mockReturnValue(blueskyCreds);
    const result = await handleBlueskyReply({
      parent_uri: "at://x/1",
      text: "a",
      thread: ["b", "c"],
    });
    expect(result.success).toBe(false);
  });

  it("routes single reply as a string payload", async () => {
    mockedReadConfig.mockReturnValue(blueskyCreds);
    mockedReplyToBluesky.mockResolvedValue({
      success: true,
      data: {
        posts: [
          {
            uri: "at://y/1",
            cid: "c1",
            url: "https://bsky.app/profile/test.bsky.social/post/1",
          },
        ],
      },
    });

    const result = await handleBlueskyReply({
      parent_uri: "at://x/1",
      text: "thanks",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(mockedReplyToBluesky).toHaveBeenCalledWith(
      "at://x/1",
      "thanks",
      blueskyCreds.social.bluesky
    );
    const data = result.data as { count: number; url: string };
    expect(data.count).toBe(1);
    expect(data.url).toBe("https://bsky.app/profile/test.bsky.social/post/1");
  });

  it("routes threaded reply as an array payload", async () => {
    mockedReadConfig.mockReturnValue(blueskyCreds);
    mockedReplyToBluesky.mockResolvedValue({
      success: true,
      data: {
        posts: [
          { uri: "at://y/1", cid: "c1", url: "https://bsky.app/profile/test.bsky.social/post/1" },
          { uri: "at://y/2", cid: "c2", url: "https://bsky.app/profile/test.bsky.social/post/2" },
        ],
      },
    });

    const result = await handleBlueskyReply({
      parent_uri: "at://x/1",
      thread: ["one", "two"],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(mockedReplyToBluesky).toHaveBeenCalledWith(
      "at://x/1",
      ["one", "two"],
      blueskyCreds.social.bluesky
    );
    const data = result.data as { count: number };
    expect(data.count).toBe(2);
  });

  it("propagates client errors", async () => {
    mockedReadConfig.mockReturnValue(blueskyCreds);
    mockedReplyToBluesky.mockResolvedValue({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Post not found",
        platform: "bluesky",
        retryable: false,
      },
    });

    const result = await handleBlueskyReply({
      parent_uri: "at://gone/1",
      text: "hi",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });
});

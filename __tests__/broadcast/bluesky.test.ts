import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  postToBluesky,
  postThreadToBluesky,
  listBlueskyMentions,
  searchBlueskyPosts,
  getBlueskyThread,
  replyToBluesky,
} from "../../src/broadcast/bluesky.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const creds = { handle: "test.bsky.social", app_password: "abcd-efgh-ijkl-mnop" };

function mockSession() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ accessJwt: "jwt-token", did: "did:plc:abc123" }),
  });
}

function mockCreateRecord(rkey = "post1") {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({
      uri: `at://did:plc:abc123/app.bsky.feed.post/${rkey}`,
      cid: `cid-${rkey}`,
    }),
  });
}

describe("postToBluesky", () => {
  it("creates a session then posts and returns a public URL", async () => {
    mockSession();
    mockCreateRecord("post1");

    const result = await postToBluesky("hello world", creds);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.url).toBe("https://bsky.app/profile/test.bsky.social/post/post1");
    expect(result.data.uri).toBe("at://did:plc:abc123/app.bsky.feed.post/post1");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("rejects empty text", async () => {
    const result = await postToBluesky("   ", creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects text over 300 characters", async () => {
    const long = "a".repeat(301);
    const result = await postToBluesky(long, creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(result.error.message).toContain("300");
  });

  it("counts graphemes so emoji don't count as multiple chars", async () => {
    // 300 emoji (each is 2 UTF-16 code units but 1 grapheme)
    mockSession();
    mockCreateRecord();
    const text = "🚀".repeat(300);
    const result = await postToBluesky(text, creds);
    expect(result.success).toBe(true);
  });

  it("attaches link facets for bare URLs", async () => {
    mockSession();
    mockCreateRecord();

    await postToBluesky("check out https://pipepost.dev for more", creds);

    const createRecordCall = mockFetch.mock.calls[1];
    const body = JSON.parse(createRecordCall[1].body);
    expect(body.record.facets).toBeDefined();
    expect(body.record.facets.length).toBe(1);
    expect(body.record.facets[0].features[0].uri).toBe("https://pipepost.dev");
  });

  it("surfaces session auth failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Invalid identifier or password",
    });

    const result = await postToBluesky("hi", creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
    expect(result.error.platform).toBe("bluesky");
  });
});

describe("postThreadToBluesky", () => {
  it("chains replies: each post references root + previous parent", async () => {
    mockSession();
    mockCreateRecord("root");
    mockCreateRecord("reply1");
    mockCreateRecord("reply2");

    const result = await postThreadToBluesky(["post 1", "post 2", "post 3"], creds);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.posts).toHaveLength(3);

    // First post has no reply field
    const post1Body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(post1Body.record.reply).toBeUndefined();

    // Second post replies to first (parent = root = post1)
    const post2Body = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(post2Body.record.reply.root.uri).toBe("at://did:plc:abc123/app.bsky.feed.post/root");
    expect(post2Body.record.reply.parent.uri).toBe("at://did:plc:abc123/app.bsky.feed.post/root");

    // Third post replies with root = post1, parent = post2
    const post3Body = JSON.parse(mockFetch.mock.calls[3][1].body);
    expect(post3Body.record.reply.root.uri).toBe("at://did:plc:abc123/app.bsky.feed.post/root");
    expect(post3Body.record.reply.parent.uri).toBe("at://did:plc:abc123/app.bsky.feed.post/reply1");
  });

  it("rejects empty thread", async () => {
    const result = await postThreadToBluesky([], creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a thread where any post is over 300 chars", async () => {
    const result = await postThreadToBluesky(["ok", "a".repeat(301)], creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.message).toContain("Post 2");
  });
});

describe("listBlueskyMentions", () => {
  function mockNotifications(notifications: unknown[], cursor?: string) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ notifications, cursor }),
    });
  }

  it("authenticates and defaults to mention + reply reasons with limit 50", async () => {
    mockSession();
    mockNotifications([]);

    await listBlueskyMentions(creds);

    const url = mockFetch.mock.calls[1][0] as string;
    expect(url).toContain("listNotifications");
    expect(url).toContain("limit=50");
    expect(url).toContain("reasons=mention");
    expect(url).toContain("reasons=reply");
  });

  it("forwards custom reasons, limit, and cursor", async () => {
    mockSession();
    mockNotifications([]);

    await listBlueskyMentions(creds, {
      limit: 10,
      cursor: "next-page",
      reasons: ["like", "repost"],
    });

    const url = mockFetch.mock.calls[1][0] as string;
    expect(url).toContain("limit=10");
    expect(url).toContain("cursor=next-page");
    expect(url).toContain("reasons=like");
    expect(url).toContain("reasons=repost");
    expect(url).not.toContain("reasons=mention");
  });

  it("clamps limit to the 1..100 range", async () => {
    mockSession();
    mockNotifications([]);

    await listBlueskyMentions(creds, { limit: 999 });

    const url = mockFetch.mock.calls[1][0] as string;
    expect(url).toContain("limit=100");
  });

  it("maps the AT response into our flatter shape", async () => {
    mockSession();
    mockNotifications(
      [
        {
          uri: "at://did:plc:other/app.bsky.feed.post/hello",
          cid: "cid-hello",
          author: { did: "did:plc:other", handle: "friend.bsky.social" },
          reason: "reply",
          reasonSubject: "at://did:plc:abc/app.bsky.feed.post/orig",
          record: { text: "nice thread" },
          isRead: false,
          indexedAt: "2026-04-14T10:00:00Z",
        },
      ],
      "cursor-next"
    );

    const result = await listBlueskyMentions(creds);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.notifications).toHaveLength(1);
    expect(result.data.notifications[0].text).toBe("nice thread");
    expect(result.data.notifications[0].reason).toBe("reply");
    expect(result.data.notifications[0].reasonSubject).toContain("orig");
    expect(result.data.cursor).toBe("cursor-next");
  });

  it("surfaces auth failure from createSession", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "bad password",
    });

    const result = await listBlueskyMentions(creds);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
  });
});

describe("searchBlueskyPosts", () => {
  function mockSearch(posts: unknown[], cursor?: string) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ posts, cursor }),
    });
  }

  it("rejects empty query without hitting the network", async () => {
    const result = await searchBlueskyPosts("   ", creds);
    expect(result.success).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("authenticates and defaults to latest sort, limit 25, against bsky.social", async () => {
    mockSession();
    mockSearch([]);

    await searchBlueskyPosts("claude code", creds);

    // Session roundtrip + search = 2 calls.
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const url = mockFetch.mock.calls[1][0] as string;
    const opts = mockFetch.mock.calls[1][1] as { headers?: Record<string, string> };
    expect(url).toContain("bsky.social");
    expect(url).toContain("searchPosts");
    expect(url).toContain("q=claude+code");
    expect(url).toContain("limit=25");
    expect(url).toContain("sort=latest");
    // Authenticated — the public AppView 403s unauthenticated searchPosts.
    expect(opts.headers?.Authorization).toContain("Bearer");
  });

  it("forwards all optional filters as query params", async () => {
    mockSession();
    mockSearch([]);

    await searchBlueskyPosts("mcp", creds, {
      limit: 100,
      cursor: "c1",
      sort: "top",
      since: "2026-04-01",
      mentions: "pipepost.bsky.social",
      author: "someone.bsky.social",
      lang: "en",
      tag: ["ai", "typescript"],
    });

    const url = mockFetch.mock.calls[1][0] as string;
    expect(url).toContain("limit=100");
    expect(url).toContain("cursor=c1");
    expect(url).toContain("sort=top");
    expect(url).toContain("since=2026-04-01");
    expect(url).toContain("mentions=pipepost.bsky.social");
    expect(url).toContain("author=someone.bsky.social");
    expect(url).toContain("lang=en");
    expect(url).toContain("tag=ai");
    expect(url).toContain("tag=typescript");
  });

  it("flattens AT responses into search hits with public URLs", async () => {
    mockSession();
    mockSearch(
      [
        {
          uri: "at://did:plc:xyz/app.bsky.feed.post/abc",
          cid: "cid-abc",
          author: { did: "did:plc:xyz", handle: "author.bsky.social" },
          record: { text: "hello mcp" },
          indexedAt: "2026-04-14T09:00:00Z",
          replyCount: 3,
          likeCount: 7,
        },
      ],
      "next"
    );

    const result = await searchBlueskyPosts("mcp", creds);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.posts).toHaveLength(1);
    expect(result.data.posts[0].url).toBe(
      "https://bsky.app/profile/author.bsky.social/post/abc"
    );
    expect(result.data.posts[0].replyCount).toBe(3);
    expect(result.data.posts[0].likeCount).toBe(7);
    expect(result.data.cursor).toBe("next");
  });

  it("defaults missing reply/like counts to zero", async () => {
    mockSession();
    mockSearch([
      {
        uri: "at://did:plc:xyz/app.bsky.feed.post/abc",
        cid: "cid-abc",
        author: { did: "did:plc:xyz", handle: "a.bsky.social" },
        record: { text: "" },
        indexedAt: "2026-04-14T09:00:00Z",
      },
    ]);

    const result = await searchBlueskyPosts("mcp", creds);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.posts[0].replyCount).toBe(0);
    expect(result.data.posts[0].likeCount).toBe(0);
  });

  it("surfaces auth failure from createSession", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "bad password",
    });

    const result = await searchBlueskyPosts("mcp", creds);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
  });
});

describe("getBlueskyThread", () => {
  function mockThread(thread: unknown) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ thread }),
    });
  }

  it("rejects non at-uri inputs up-front", async () => {
    const result = await getBlueskyThread("https://bsky.app/profile/a/post/b");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("forwards depth and parentHeight defaults", async () => {
    mockThread({
      post: {
        uri: "at://did:plc:abc/app.bsky.feed.post/root",
        cid: "cid-root",
        author: { did: "did:plc:abc", handle: "root.bsky.social" },
        record: { text: "top" },
        indexedAt: "2026-04-14T08:00:00Z",
      },
      replies: [],
    });

    await getBlueskyThread("at://did:plc:abc/app.bsky.feed.post/root");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("depth=6");
    expect(url).toContain("parentHeight=80");
  });

  it("recursively normalizes parent + replies, skipping notFoundPost nodes", async () => {
    mockThread({
      post: {
        uri: "at://did:plc:abc/app.bsky.feed.post/mid",
        cid: "cid-mid",
        author: { did: "did:plc:abc", handle: "mid.bsky.social" },
        record: { text: "middle" },
        indexedAt: "2026-04-14T08:00:00Z",
      },
      parent: {
        post: {
          uri: "at://did:plc:abc/app.bsky.feed.post/top",
          cid: "cid-top",
          author: { did: "did:plc:abc", handle: "top.bsky.social" },
          record: { text: "parent" },
          indexedAt: "2026-04-14T07:00:00Z",
        },
        replies: [],
      },
      replies: [
        {
          post: {
            uri: "at://did:plc:xyz/app.bsky.feed.post/r1",
            cid: "cid-r1",
            author: { did: "did:plc:xyz", handle: "r1.bsky.social" },
            record: { text: "reply 1" },
            indexedAt: "2026-04-14T09:00:00Z",
          },
          replies: [],
        },
        // notFoundPost-style entry: missing post.uri — must be filtered out.
        { $type: "app.bsky.feed.defs#notFoundPost" },
      ],
    });

    const result = await getBlueskyThread("at://did:plc:abc/app.bsky.feed.post/mid");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.post.text).toBe("middle");
    expect(result.data.parent?.post.text).toBe("parent");
    expect(result.data.replies).toHaveLength(1);
    expect(result.data.replies[0].post.text).toBe("reply 1");
  });

  it("returns NOT_FOUND when the server yields a notFoundPost root", async () => {
    mockThread({ $type: "app.bsky.feed.defs#notFoundPost" });

    const result = await getBlueskyThread(
      "at://did:plc:gone/app.bsky.feed.post/zzz"
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });

  it("surfaces HTTP errors from the AppView", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "boom",
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "boom",
    });

    const result = await getBlueskyThread(
      "at://did:plc:abc/app.bsky.feed.post/x"
    );

    expect(result.success).toBe(false);
  }, 10000);
});

describe("replyToBluesky", () => {
  // Replies always: fetchPostMeta (1 call to public AppView) → createSession → createRecord(s).
  function mockParentMeta(opts: {
    uri: string;
    cid: string;
    rootUri?: string;
    rootCid?: string;
  }) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        thread: {
          post: {
            uri: opts.uri,
            cid: opts.cid,
            record: opts.rootUri
              ? { reply: { root: { uri: opts.rootUri, cid: opts.rootCid } } }
              : {},
          },
        },
      }),
    });
  }

  it("rejects empty replies without any network call", async () => {
    const result = await replyToBluesky(
      "at://did:plc:abc/app.bsky.feed.post/x",
      [],
      creds
    );
    expect(result.success).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects blank reply text", async () => {
    const result = await replyToBluesky(
      "at://did:plc:abc/app.bsky.feed.post/x",
      "   ",
      creds
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects replies over 300 chars", async () => {
    const result = await replyToBluesky(
      "at://did:plc:abc/app.bsky.feed.post/x",
      "a".repeat(301),
      creds
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.message).toContain("300");
  });

  it("uses parent as root when parent is a top-level post", async () => {
    const parentUri = "at://did:plc:abc/app.bsky.feed.post/top";
    mockParentMeta({ uri: parentUri, cid: "cid-top" });
    mockSession();
    mockCreateRecord("reply1");

    const result = await replyToBluesky(parentUri, "nice take", creds);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.posts).toHaveLength(1);

    const replyBody = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(replyBody.record.reply.parent.uri).toBe(parentUri);
    expect(replyBody.record.reply.root.uri).toBe(parentUri);
    expect(replyBody.record.reply.root.cid).toBe("cid-top");
  });

  it("walks back to the thread root when parent is itself a reply", async () => {
    const parentUri = "at://did:plc:abc/app.bsky.feed.post/mid";
    const rootUri = "at://did:plc:abc/app.bsky.feed.post/orig";
    mockParentMeta({
      uri: parentUri,
      cid: "cid-mid",
      rootUri,
      rootCid: "cid-orig",
    });
    mockSession();
    mockCreateRecord("reply1");

    await replyToBluesky(parentUri, "a thoughtful reply", creds);

    const replyBody = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(replyBody.record.reply.parent.uri).toBe(parentUri);
    expect(replyBody.record.reply.parent.cid).toBe("cid-mid");
    expect(replyBody.record.reply.root.uri).toBe(rootUri);
    expect(replyBody.record.reply.root.cid).toBe("cid-orig");
  });

  it("chains threaded replies: first points at parent, rest chain off prior reply", async () => {
    const parentUri = "at://did:plc:abc/app.bsky.feed.post/top";
    mockParentMeta({ uri: parentUri, cid: "cid-top" });
    mockSession();
    mockCreateRecord("reply1");
    mockCreateRecord("reply2");
    mockCreateRecord("reply3");

    const result = await replyToBluesky(
      parentUri,
      ["first", "second", "third"],
      creds
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.posts).toHaveLength(3);

    // First reply: parent = original post, root = original post.
    const r1 = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(r1.record.reply.parent.uri).toBe(parentUri);
    expect(r1.record.reply.root.uri).toBe(parentUri);

    // Second reply: parent = reply1, root still = original post.
    const r2 = JSON.parse(mockFetch.mock.calls[3][1].body);
    expect(r2.record.reply.parent.uri).toBe(
      "at://did:plc:abc123/app.bsky.feed.post/reply1"
    );
    expect(r2.record.reply.root.uri).toBe(parentUri);

    // Third reply: parent = reply2, root = original.
    const r3 = JSON.parse(mockFetch.mock.calls[4][1].body);
    expect(r3.record.reply.parent.uri).toBe(
      "at://did:plc:abc123/app.bsky.feed.post/reply2"
    );
    expect(r3.record.reply.root.uri).toBe(parentUri);
  });

  it("returns NOT_FOUND if parent lookup fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ thread: { $type: "app.bsky.feed.defs#notFoundPost" } }),
    });

    const result = await replyToBluesky(
      "at://did:plc:gone/app.bsky.feed.post/x",
      "hi",
      creds
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });

  it("surfaces auth failure from createSession", async () => {
    const parentUri = "at://did:plc:abc/app.bsky.feed.post/top";
    mockParentMeta({ uri: parentUri, cid: "cid-top" });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "bad password",
    });

    const result = await replyToBluesky(parentUri, "hi", creds);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
  });
});

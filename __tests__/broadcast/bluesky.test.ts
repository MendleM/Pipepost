import { describe, it, expect, vi, beforeEach } from "vitest";
import { postToBluesky, postThreadToBluesky } from "../../src/broadcast/bluesky.js";

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

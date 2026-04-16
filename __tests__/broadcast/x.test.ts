import { describe, it, expect, vi, beforeEach } from "vitest";
import { postToX, postThreadToX, buildOAuthHeader } from "../../src/broadcast/x.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const creds = {
  consumer_key: "ckey",
  consumer_secret: "csecret",
  access_token: "atok",
  access_token_secret: "asecret",
};

function mockTweet(id = "1234567890") {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 201,
    json: async () => ({ data: { id, text: "..." } }),
  });
}

describe("buildOAuthHeader", () => {
  it("produces a signed OAuth 1.0a header with the required fields", () => {
    const header = buildOAuthHeader(
      "POST",
      "https://api.twitter.com/2/tweets",
      creds,
      { nonce: "NONCE123", timestamp: "1700000000" }
    );

    expect(header.startsWith("OAuth ")).toBe(true);
    expect(header).toContain('oauth_consumer_key="ckey"');
    expect(header).toContain('oauth_token="atok"');
    expect(header).toContain('oauth_signature_method="HMAC-SHA1"');
    expect(header).toContain('oauth_nonce="NONCE123"');
    expect(header).toContain('oauth_timestamp="1700000000"');
    expect(header).toContain('oauth_version="1.0"');
    expect(header).toMatch(/oauth_signature="[^"]+"/);
  });

  it("produces a deterministic signature given the same inputs", () => {
    const h1 = buildOAuthHeader(
      "POST",
      "https://api.twitter.com/2/tweets",
      creds,
      { nonce: "N", timestamp: "1700000000" }
    );
    const h2 = buildOAuthHeader(
      "POST",
      "https://api.twitter.com/2/tweets",
      creds,
      { nonce: "N", timestamp: "1700000000" }
    );
    expect(h1).toBe(h2);
  });

  it("produces different signatures for different URLs", () => {
    const h1 = buildOAuthHeader(
      "POST",
      "https://api.twitter.com/2/tweets",
      creds,
      { nonce: "N", timestamp: "1700000000" }
    );
    const h2 = buildOAuthHeader(
      "POST",
      "https://api.twitter.com/2/tweets/1234",
      creds,
      { nonce: "N", timestamp: "1700000000" }
    );
    expect(h1).not.toBe(h2);
  });

  it("percent-encodes characters that encodeURIComponent leaves alone", () => {
    // The helper must encode ! * ' ( ) per RFC 3986. We check by feeding
    // a nonce that exercises percent-encoding in the header params.
    const header = buildOAuthHeader(
      "POST",
      "https://api.twitter.com/2/tweets",
      creds,
      { nonce: "abc!", timestamp: "1700000000" }
    );
    expect(header).toContain('oauth_nonce="abc%21"');
  });
});

describe("postToX", () => {
  it("posts a tweet and returns id + viewable url", async () => {
    mockTweet("1111111111");

    const result = await postToX("hello x", creds);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBe("1111111111");
    expect(result.data.url).toBe("https://x.com/i/status/1111111111");

    const call = mockFetch.mock.calls[0];
    expect(call[0]).toBe("https://api.twitter.com/2/tweets");
    const body = JSON.parse(call[1].body);
    expect(body.text).toBe("hello x");
    expect(call[1].headers.Authorization.startsWith("OAuth ")).toBe(true);
  });

  it("includes reply.in_reply_to_tweet_id when replyToId is provided", async () => {
    mockTweet();
    await postToX("reply", creds, { replyToId: "555" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reply).toEqual({ in_reply_to_tweet_id: "555" });
  });

  it("rejects empty text", async () => {
    const result = await postToX("   ", creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects text over 280 characters", async () => {
    const result = await postToX("a".repeat(281), creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(result.error.message).toContain("280");
  });

  it("counts graphemes so emoji don't overcount", async () => {
    mockTweet();
    const text = "🚀".repeat(280);
    const result = await postToX(text, creds);
    expect(result.success).toBe(true);
  });

  it("surfaces auth failures from X", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Invalid credentials",
    });

    const result = await postToX("hi", creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
    expect(result.error.platform).toBe("x");
  });

  it("surfaces rate limits from X", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Too Many Requests",
    });

    const result = await postToX("hi", creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("RATE_LIMITED");
    expect(result.error.platform).toBe("x");
  });

  it("surfaces PLATFORM_ERROR when response is missing data.id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ data: {} }),
    });

    const result = await postToX("hi", creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("PLATFORM_ERROR");
  });
});

describe("postThreadToX", () => {
  it("chains replies by setting reply.in_reply_to_tweet_id to prior tweet id", async () => {
    mockTweet("root");
    mockTweet("reply1");
    mockTweet("reply2");

    const result = await postThreadToX(["one", "two", "three"], creds);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.posts).toHaveLength(3);

    const body1 = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body1.reply).toBeUndefined();

    const body2 = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body2.reply).toEqual({ in_reply_to_tweet_id: "root" });

    const body3 = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(body3.reply).toEqual({ in_reply_to_tweet_id: "reply1" });
  });

  it("rejects empty thread", async () => {
    const result = await postThreadToX([], creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a thread where any post is over the max length", async () => {
    const result = await postThreadToX(["ok", "a".repeat(281)], creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.message).toContain("Post 2");
  });

  it("aborts mid-thread when a post fails and returns the error", async () => {
    mockTweet("root");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "token revoked",
    });

    const result = await postThreadToX(["ok1", "ok2", "ok3"], creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

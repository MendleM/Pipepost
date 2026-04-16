import { describe, it, expect, vi, beforeEach } from "vitest";
import { postToMastodon, postThreadToMastodon } from "../../src/broadcast/mastodon.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const creds = {
  instance_url: "https://mastodon.social",
  access_token: "mast-token-abc",
};

function mockStatus(id = "s1") {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({
      id,
      url: `https://mastodon.social/@test/${id}`,
    }),
  });
}

describe("postToMastodon", () => {
  it("posts a status and returns id + url", async () => {
    mockStatus("status1");

    const result = await postToMastodon("hello fediverse", creds);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBe("status1");
    expect(result.data.url).toBe("https://mastodon.social/@test/status1");

    const call = mockFetch.mock.calls[0];
    expect(call[0]).toBe("https://mastodon.social/api/v1/statuses");
    const body = JSON.parse(call[1].body);
    expect(body.status).toBe("hello fediverse");
    expect(body.visibility).toBe("public");
    expect(call[1].headers.Authorization).toBe("Bearer mast-token-abc");
  });

  it("strips a trailing slash from instance_url", async () => {
    mockStatus();
    await postToMastodon("hi", { instance_url: "https://hachyderm.io/", access_token: "t" });
    expect(mockFetch.mock.calls[0][0]).toBe("https://hachyderm.io/api/v1/statuses");
  });

  it("rejects empty text", async () => {
    const result = await postToMastodon("   ", creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects text over 500 characters by default", async () => {
    const result = await postToMastodon("a".repeat(501), creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(result.error.message).toContain("500");
  });

  it("honors maxLength override for instances with higher limits", async () => {
    mockStatus();
    const result = await postToMastodon("a".repeat(1000), creds, { maxLength: 2000 });
    expect(result.success).toBe(true);
  });

  it("counts graphemes so emoji don't overcount", async () => {
    mockStatus();
    const text = "🚀".repeat(500);
    const result = await postToMastodon(text, creds);
    expect(result.success).toBe(true);
  });

  it("surfaces auth failures from the instance", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Invalid access token",
    });

    const result = await postToMastodon("hi", creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
    expect(result.error.platform).toBe("mastodon");
  });

  it("passes in_reply_to_id when provided", async () => {
    mockStatus();
    await postToMastodon("reply", creds, { inReplyToId: "parent-123" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.in_reply_to_id).toBe("parent-123");
  });
});

describe("postThreadToMastodon", () => {
  it("chains replies by setting in_reply_to_id to the prior post's id", async () => {
    mockStatus("root");
    mockStatus("reply1");
    mockStatus("reply2");

    const result = await postThreadToMastodon(["one", "two", "three"], creds);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.posts).toHaveLength(3);

    // First post: no in_reply_to_id
    const body1 = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body1.in_reply_to_id).toBeUndefined();

    // Second: replies to root
    const body2 = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body2.in_reply_to_id).toBe("root");

    // Third: replies to reply1 (chain walks back to root)
    const body3 = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(body3.in_reply_to_id).toBe("reply1");
  });

  it("rejects empty thread", async () => {
    const result = await postThreadToMastodon([], creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a thread where any post is over the max length", async () => {
    const result = await postThreadToMastodon(["ok", "a".repeat(501)], creds);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.message).toContain("Post 2");
  });
});

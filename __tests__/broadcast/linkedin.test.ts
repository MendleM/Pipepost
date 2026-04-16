import { describe, it, expect, vi, beforeEach } from "vitest";
import { postToLinkedIn, fetchPersonUrn } from "../../src/broadcast/linkedin.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const credsWithUrn = {
  access_token: "li-token-abc",
  person_urn: "urn:li:person:ABC123",
};

function mockUgcPost(id = "urn:li:share:6789012345") {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 201,
    json: async () => ({ id }),
  });
}

function mockUserInfo(sub = "ABC123") {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ sub, name: "Test Member" }),
  });
}

describe("postToLinkedIn", () => {
  it("posts content and returns id + viewable url", async () => {
    mockUgcPost("urn:li:share:1111");

    const result = await postToLinkedIn("hello linkedin", credsWithUrn);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBe("urn:li:share:1111");
    expect(result.data.url).toBe(
      "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A1111/"
    );

    const call = mockFetch.mock.calls[0];
    expect(call[0]).toBe("https://api.linkedin.com/v2/ugcPosts");
    const body = JSON.parse(call[1].body);
    expect(body.author).toBe("urn:li:person:ABC123");
    expect(body.lifecycleState).toBe("PUBLISHED");
    expect(
      body.specificContent["com.linkedin.ugc.ShareContent"].shareCommentary.text
    ).toBe("hello linkedin");
    expect(call[1].headers.Authorization).toBe("Bearer li-token-abc");
    expect(call[1].headers["X-Restli-Protocol-Version"]).toBe("2.0.0");
  });

  it("fetches the person URN from /v2/userinfo when not supplied", async () => {
    mockUserInfo("DERIVED_URN");
    mockUgcPost();

    const result = await postToLinkedIn("hello", { access_token: "t" });

    expect(result.success).toBe(true);
    const firstCall = mockFetch.mock.calls[0];
    expect(firstCall[0]).toBe("https://api.linkedin.com/v2/userinfo");
    const postCall = mockFetch.mock.calls[1];
    const body = JSON.parse(postCall[1].body);
    expect(body.author).toBe("urn:li:person:DERIVED_URN");
  });

  it("rejects empty text", async () => {
    const result = await postToLinkedIn("   ", credsWithUrn);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects text over 3000 characters", async () => {
    const result = await postToLinkedIn("a".repeat(3001), credsWithUrn);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(result.error.message).toContain("3000");
  });

  it("counts graphemes so emoji don't overcount", async () => {
    mockUgcPost();
    const text = "🚀".repeat(1500);
    const result = await postToLinkedIn(text, credsWithUrn);
    expect(result.success).toBe(true);
  });

  it("surfaces auth failures from LinkedIn", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Invalid access token",
    });

    const result = await postToLinkedIn("hi", credsWithUrn);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
    expect(result.error.platform).toBe("linkedin");
  });

  it("surfaces PLATFORM_ERROR when the post response is missing an id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({}),
    });

    const result = await postToLinkedIn("hi", credsWithUrn);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("PLATFORM_ERROR");
    expect(result.error.platform).toBe("linkedin");
  });
});

describe("fetchPersonUrn", () => {
  it("returns the urn:li:person: prefixed URN from userinfo.sub", async () => {
    mockUserInfo("MEMBER_SUB_42");
    const result = await fetchPersonUrn("tok");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toBe("urn:li:person:MEMBER_SUB_42");
  });

  it("surfaces PLATFORM_ERROR when userinfo lacks sub", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ name: "Test" }),
    });
    const result = await fetchPersonUrn("tok");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("PLATFORM_ERROR");
  });

  it("surfaces AUTH_FAILED when the token is rejected", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => "forbidden",
    });
    const result = await fetchPersonUrn("tok");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("AUTH_FAILED");
    expect(result.error.platform).toBe("linkedin");
  });
});

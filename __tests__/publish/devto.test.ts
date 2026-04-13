import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishToDevto, listDevtoPosts } from "../../src/publish/devto.js";
import * as http from "../../src/http.js";

vi.mock("../../src/http.js");
const mockHttp = vi.mocked(http);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("publishToDevto", () => {
  it("publishes article and returns URL and ID", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { id: 12345, url: "https://dev.to/user/my-post-abc1" },
    });

    const result = await publishToDevto(
      { title: "My Post", content: "Hello", tags: ["javascript"], status: "published" },
      "fake-api-key"
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.post_id).toBe("12345");
      expect(result.data.url).toBe("https://dev.to/user/my-post-abc1");
      expect(result.data.platform).toBe("devto");
    }
  });

  it("sends correct headers and body shape", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { id: 1, url: "https://dev.to/user/post" },
    });

    await publishToDevto(
      { title: "Test", content: "Body", tags: ["typescript"], status: "draft" },
      "my-key"
    );

    const [url, opts] = mockHttp.httpRequest.mock.calls[0];
    expect(url).toBe("https://dev.to/api/articles");
    expect(opts.method).toBe("POST");
    expect(opts.headers?.["api-key"]).toBe("my-key");
    const body = opts.body as { article: { title: string; body_markdown: string; published: boolean; tags: string[] } };
    expect(body.article.title).toBe("Test");
    expect(body.article.body_markdown).toBe("Body");
    expect(body.article.published).toBe(false);
    expect(body.article.tags).toEqual(["typescript"]);
  });

  it("returns error on API failure", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "AUTH_FAILED", message: "HTTP 401: Unauthorized", retryable: false },
    });

    const result = await publishToDevto(
      { title: "Test", content: "Body" },
      "bad-key"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTH_FAILED");
      expect(result.error.platform).toBe("devto");
    }
  });
});

describe("listDevtoPosts", () => {
  it("returns formatted post list", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: [
        { id: 1, title: "Post 1", url: "https://dev.to/p1", published: true, published_at: "2026-04-13" },
        { id: 2, title: "Post 2", url: "https://dev.to/p2", published: false, published_at: null },
      ],
    });

    const result = await listDevtoPosts("my-key");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.posts[0].id).toBe("1");
      expect(result.data.posts[0].status).toBe("published");
      expect(result.data.posts[1].status).toBe("draft");
    }
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishToGhost, listGhostPosts } from "../../src/publish/ghost.js";
import * as http from "../../src/http.js";

vi.mock("../../src/http.js");
const mockHttp = vi.mocked(http);

beforeEach(() => {
  vi.restoreAllMocks();
});

const GHOST_CREDS = {
  url: "https://myblog.com",
  admin_key: "abc123:deadbeefcafebabe1234567890abcdef",
};

describe("publishToGhost", () => {
  it("publishes article and returns URL and ID", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { posts: [{ id: "ghost-1", url: "https://myblog.com/my-post/", slug: "my-post" }] },
    });

    const result = await publishToGhost(
      { title: "My Post", content: "Hello world", tags: ["javascript"], status: "draft" },
      GHOST_CREDS
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.post_id).toBe("ghost-1");
      expect(result.data.url).toBe("https://myblog.com/my-post/");
      expect(result.data.platform).toBe("ghost");
    }
  });

  it("sends correct URL and Authorization header", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { posts: [{ id: "1", url: "https://myblog.com/p/", slug: "p" }] },
    });

    await publishToGhost(
      { title: "Test", content: "Body" },
      GHOST_CREDS
    );

    const [url, opts] = mockHttp.httpRequest.mock.calls[0];
    expect(url).toBe("https://myblog.com/ghost/api/admin/posts/");
    expect(opts.method).toBe("POST");
    expect(opts.headers?.["Authorization"]).toMatch(/^Ghost /);
  });

  it("sends mobiledoc body with correct structure", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { posts: [{ id: "1", url: "https://myblog.com/p/", slug: "p" }] },
    });

    await publishToGhost(
      { title: "Test", content: "# Hello", tags: ["dev"], status: "published" },
      GHOST_CREDS
    );

    const body = mockHttp.httpRequest.mock.calls[0][1].body as {
      posts: Array<{ title: string; html: string; status: string; tags: Array<{ name: string }> }>;
    };
    expect(body.posts[0].title).toBe("Test");
    expect(body.posts[0].status).toBe("published");
    expect(body.posts[0].tags).toEqual([{ name: "dev" }]);
  });

  it("returns error on API failure", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "AUTH_FAILED", message: "HTTP 401: Unauthorized", retryable: false },
    });

    const result = await publishToGhost(
      { title: "Test", content: "Body" },
      GHOST_CREDS
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTH_FAILED");
      expect(result.error.platform).toBe("ghost");
    }
  });
});

describe("listGhostPosts", () => {
  it("returns formatted post list", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: {
        posts: [
          { id: "g1", title: "Post 1", url: "https://myblog.com/p1/", status: "published", published_at: "2026-04-13" },
          { id: "g2", title: "Post 2", url: "https://myblog.com/p2/", status: "draft", published_at: null },
        ],
      },
    });

    const result = await listGhostPosts(GHOST_CREDS, 1, 15);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.posts[0].id).toBe("g1");
      expect(result.data.posts[0].status).toBe("published");
      expect(result.data.posts[1].status).toBe("draft");
    }
  });

  it("returns error on API failure", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "NETWORK_ERROR", message: "timeout", retryable: true },
    });

    const result = await listGhostPosts(GHOST_CREDS);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.platform).toBe("ghost");
    }
  });
});

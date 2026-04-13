import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishToHashnode, listHashnodePosts } from "../../src/publish/hashnode.js";
import * as http from "../../src/http.js";

vi.mock("../../src/http.js");
const mockHttp = vi.mocked(http);

beforeEach(() => {
  vi.restoreAllMocks();
});

const HASHNODE_CREDS = {
  token: "hn-token-123",
  publication_id: "pub-abc",
};

describe("publishToHashnode", () => {
  it("publishes article and returns URL and ID", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: {
        data: {
          publishPost: {
            post: { id: "hn-1", url: "https://blog.hashnode.dev/my-post", slug: "my-post" },
          },
        },
      },
    });

    const result = await publishToHashnode(
      { title: "My Post", content: "Hello", tags: ["javascript"] },
      HASHNODE_CREDS
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.post_id).toBe("hn-1");
      expect(result.data.url).toBe("https://blog.hashnode.dev/my-post");
      expect(result.data.platform).toBe("hashnode");
    }
  });

  it("sends correct GraphQL mutation shape", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: {
        data: {
          publishPost: {
            post: { id: "1", url: "https://blog.hashnode.dev/p", slug: "p" },
          },
        },
      },
    });

    await publishToHashnode(
      { title: "Test", content: "Body", tags: ["typescript"] },
      HASHNODE_CREDS
    );

    const [url, opts] = mockHttp.httpRequest.mock.calls[0];
    expect(url).toBe("https://gql.hashnode.com");
    expect(opts.method).toBe("POST");
    expect(opts.headers?.["Authorization"]).toBe("hn-token-123");
    const body = opts.body as { query: string; variables: { input: { title: string } } };
    expect(body.query).toContain("publishPost");
    expect(body.variables.input.title).toBe("Test");
    expect(body.variables.input.publicationId).toBe("pub-abc");
  });

  it("returns error on API failure", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "AUTH_FAILED", message: "HTTP 401: Unauthorized", retryable: false },
    });

    const result = await publishToHashnode(
      { title: "Test", content: "Body" },
      HASHNODE_CREDS
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.platform).toBe("hashnode");
    }
  });

  it("returns error on GraphQL errors", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: {
        errors: [{ message: "Publication not found" }],
      },
    });

    const result = await publishToHashnode(
      { title: "Test", content: "Body" },
      HASHNODE_CREDS
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("PLATFORM_ERROR");
      expect(result.error.message).toContain("Publication not found");
    }
  });
});

describe("listHashnodePosts", () => {
  it("returns formatted post list", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: {
        data: {
          publication: {
            posts: {
              edges: [
                { node: { id: "h1", title: "Post 1", url: "https://blog.hashnode.dev/p1", publishedAt: "2026-04-13" } },
                { node: { id: "h2", title: "Post 2", url: "https://blog.hashnode.dev/p2", publishedAt: null } },
              ],
            },
          },
        },
      },
    });

    const result = await listHashnodePosts(HASHNODE_CREDS);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.posts[0].id).toBe("h1");
    }
  });

  it("returns error on API failure", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "NETWORK_ERROR", message: "timeout", retryable: true },
    });

    const result = await listHashnodePosts(HASHNODE_CREDS);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.platform).toBe("hashnode");
    }
  });
});

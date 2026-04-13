import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishToWordpress, listWordpressPosts } from "../../src/publish/wordpress.js";
import * as http from "../../src/http.js";

vi.mock("../../src/http.js");
const mockHttp = vi.mocked(http);

beforeEach(() => {
  vi.restoreAllMocks();
});

const WP_CREDS = {
  url: "https://mysite.com",
  username: "admin",
  app_password: "xxxx yyyy zzzz",
};

describe("publishToWordpress", () => {
  it("publishes article and returns URL and ID", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { id: 42, link: "https://mysite.com/my-post/", status: "draft" },
    });

    const result = await publishToWordpress(
      { title: "My Post", content: "Hello", tags: ["dev"], status: "draft" },
      WP_CREDS
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.post_id).toBe("42");
      expect(result.data.url).toBe("https://mysite.com/my-post/");
      expect(result.data.platform).toBe("wordpress");
    }
  });

  it("sends correct URL and Basic auth header", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { id: 1, link: "https://mysite.com/p/", status: "draft" },
    });

    await publishToWordpress(
      { title: "Test", content: "Body" },
      WP_CREDS
    );

    const [url, opts] = mockHttp.httpRequest.mock.calls[0];
    expect(url).toBe("https://mysite.com/wp-json/wp/v2/posts");
    expect(opts.method).toBe("POST");
    const expectedAuth = Buffer.from("admin:xxxx yyyy zzzz").toString("base64");
    expect(opts.headers?.["Authorization"]).toBe(`Basic ${expectedAuth}`);
  });

  it("sends correct body shape", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { id: 1, link: "https://mysite.com/p/", status: "publish" },
    });

    await publishToWordpress(
      { title: "Test", content: "# Hello", status: "published" },
      WP_CREDS
    );

    const body = mockHttp.httpRequest.mock.calls[0][1].body as {
      title: string;
      content: string;
      status: string;
    };
    expect(body.title).toBe("Test");
    expect(body.content).toBe("# Hello");
    expect(body.status).toBe("publish");
  });

  it("returns error on API failure", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "AUTH_FAILED", message: "HTTP 401: Unauthorized", retryable: false },
    });

    const result = await publishToWordpress(
      { title: "Test", content: "Body" },
      WP_CREDS
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.platform).toBe("wordpress");
    }
  });
});

describe("listWordpressPosts", () => {
  it("returns formatted post list", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: [
        { id: 1, title: { rendered: "Post 1" }, link: "https://mysite.com/p1/", status: "publish", date: "2026-04-13" },
        { id: 2, title: { rendered: "Post 2" }, link: "https://mysite.com/p2/", status: "draft", date: "2026-04-12" },
      ],
    });

    const result = await listWordpressPosts(WP_CREDS, 1, 10);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.posts[0].id).toBe("1");
      expect(result.data.posts[0].status).toBe("published");
      expect(result.data.posts[1].status).toBe("draft");
    }
  });

  it("returns error on API failure", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "NETWORK_ERROR", message: "timeout", retryable: true },
    });

    const result = await listWordpressPosts(WP_CREDS);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.platform).toBe("wordpress");
    }
  });
});

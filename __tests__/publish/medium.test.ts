import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishToMedium } from "../../src/publish/medium.js";
import * as http from "../../src/http.js";

vi.mock("../../src/http.js");
const mockHttp = vi.mocked(http);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("publishToMedium", () => {
  it("fetches user ID then publishes article", async () => {
    mockHttp.httpRequest
      .mockResolvedValueOnce({
        success: true,
        data: { data: { id: "user-123" } },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { data: { id: "post-abc", url: "https://medium.com/@user/my-post-abc123" } },
      });

    const result = await publishToMedium(
      { title: "My Post", content: "Hello", tags: ["javascript"], status: "draft" },
      "med-token-xyz"
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.post_id).toBe("post-abc");
      expect(result.data.url).toBe("https://medium.com/@user/my-post-abc123");
      expect(result.data.platform).toBe("medium");
    }

    // Verify first call was GET /me
    expect(mockHttp.httpRequest.mock.calls[0][0]).toBe("https://api.medium.com/v1/me");
    // Verify second call was POST with user ID
    expect(mockHttp.httpRequest.mock.calls[1][0]).toBe("https://api.medium.com/v1/users/user-123/posts");
  });

  it("sends correct body shape", async () => {
    mockHttp.httpRequest
      .mockResolvedValueOnce({
        success: true,
        data: { data: { id: "user-1" } },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { data: { id: "p1", url: "https://medium.com/p" } },
      });

    await publishToMedium(
      { title: "Test", content: "# Hello", tags: ["dev"], status: "published" },
      "token"
    );

    const body = mockHttp.httpRequest.mock.calls[1][1].body as {
      title: string;
      contentFormat: string;
      content: string;
      tags: string[];
      publishStatus: string;
    };
    expect(body.title).toBe("Test");
    expect(body.contentFormat).toBe("markdown");
    expect(body.content).toBe("# Hello");
    expect(body.tags).toEqual(["dev"]);
    expect(body.publishStatus).toBe("public");
  });

  it("returns error when user fetch fails", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "AUTH_FAILED", message: "HTTP 401: Unauthorized", retryable: false },
    });

    const result = await publishToMedium(
      { title: "Test", content: "Body" },
      "bad-token"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.platform).toBe("medium");
    }
    expect(mockHttp.httpRequest).toHaveBeenCalledOnce(); // should not attempt publish
  });

  it("returns error when publish fails", async () => {
    mockHttp.httpRequest
      .mockResolvedValueOnce({
        success: true,
        data: { data: { id: "user-1" } },
      })
      .mockResolvedValueOnce({
        success: false,
        error: { code: "RATE_LIMITED", message: "HTTP 429: Too many requests", retryable: true },
      });

    const result = await publishToMedium(
      { title: "Test", content: "Body" },
      "token"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("RATE_LIMITED");
      expect(result.error.platform).toBe("medium");
    }
  });

  it("maps draft status correctly", async () => {
    mockHttp.httpRequest
      .mockResolvedValueOnce({
        success: true,
        data: { data: { id: "user-1" } },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { data: { id: "p1", url: "https://medium.com/p" } },
      });

    await publishToMedium(
      { title: "Test", content: "Body", status: "draft" },
      "token"
    );

    const body = mockHttp.httpRequest.mock.calls[1][1].body as { publishStatus: string };
    expect(body.publishStatus).toBe("draft");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleCoverImage } from "../src/tools/image-tools.js";
import * as http from "../src/http.js";
import * as config from "../src/config.js";

vi.mock("../src/http.js");
vi.mock("../src/config.js");

const mockHttp = vi.mocked(http);
const mockConfig = vi.mocked(config);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("handleCoverImage", () => {
  it("returns error when unsplash key is not configured", async () => {
    mockConfig.readConfig.mockReturnValue({});

    const result = await handleCoverImage({ query: "nature" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("Unsplash API key not configured");
    }
  });

  it("returns error when query is empty", async () => {
    mockConfig.readConfig.mockReturnValue({
      images: { unsplash_access_key: "test-key" },
    });

    const result = await handleCoverImage({ query: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("query is required");
    }
  });

  it("searches Unsplash and returns formatted results", async () => {
    mockConfig.readConfig.mockReturnValue({
      images: { unsplash_access_key: "test-key" },
    });

    mockHttp.httpRequest.mockImplementation(async (url) => {
      if (url.includes("/search/photos")) {
        return {
          success: true,
          data: {
            total: 100,
            results: [
              {
                id: "photo-1",
                description: "A mountain landscape",
                alt_description: "mountain view",
                urls: {
                  regular: "https://images.unsplash.com/photo-1?w=1080",
                  small: "https://images.unsplash.com/photo-1?w=400",
                },
                user: {
                  name: "John Doe",
                  links: { html: "https://unsplash.com/@johndoe" },
                },
              },
            ],
          },
        };
      }
      // download endpoint - fire and forget
      return { success: true, data: {} };
    });

    const result = await handleCoverImage({ query: "mountain" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("mountain");
      expect(result.data.orientation).toBe("landscape");
      expect(result.data.total_available).toBe(100);
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].id).toBe("photo-1");
      expect(result.data.results[0].attribution.text).toBe("Photo by John Doe on Unsplash");
      expect(result.data.results[0].attribution.photographer).toBe("John Doe");
    }
  });

  it("passes orientation and count to API", async () => {
    mockConfig.readConfig.mockReturnValue({
      images: { unsplash_access_key: "test-key" },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { total: 0, results: [] },
    });

    await handleCoverImage({ query: "cats", orientation: "portrait", count: 5 });

    const searchCall = mockHttp.httpRequest.mock.calls.find(([url]) =>
      url.includes("/search/photos")
    );
    expect(searchCall).toBeDefined();
    expect(searchCall![0]).toContain("orientation=portrait");
    expect(searchCall![0]).toContain("per_page=5");
  });

  it("sends correct authorization header", async () => {
    mockConfig.readConfig.mockReturnValue({
      images: { unsplash_access_key: "my-access-key" },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { total: 0, results: [] },
    });

    await handleCoverImage({ query: "coding" });

    const searchCall = mockHttp.httpRequest.mock.calls.find(([url]) =>
      url.includes("/search/photos")
    );
    expect(searchCall![1].headers).toEqual({
      Authorization: "Client-ID my-access-key",
    });
  });

  it("returns API error on failure", async () => {
    mockConfig.readConfig.mockReturnValue({
      images: { unsplash_access_key: "bad-key" },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "AUTH_FAILED", message: "HTTP 401: Unauthorized", retryable: false },
    });

    const result = await handleCoverImage({ query: "test" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTH_FAILED");
    }
  });

  it("triggers download endpoint for API compliance", async () => {
    mockConfig.readConfig.mockReturnValue({
      images: { unsplash_access_key: "test-key" },
    });

    mockHttp.httpRequest.mockImplementation(async (url) => {
      if (url.includes("/search/photos")) {
        return {
          success: true,
          data: {
            total: 1,
            results: [
              {
                id: "abc123",
                description: null,
                alt_description: "alt text",
                urls: { regular: "https://img.com/r", small: "https://img.com/s" },
                user: { name: "Jane", links: { html: "https://unsplash.com/@jane" } },
              },
            ],
          },
        };
      }
      return { success: true, data: {} };
    });

    await handleCoverImage({ query: "test" });

    // Should have called download endpoint
    const downloadCall = mockHttp.httpRequest.mock.calls.find(([url]) =>
      url.includes("/photos/abc123/download")
    );
    expect(downloadCall).toBeDefined();
  });
});

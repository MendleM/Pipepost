import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpRequest } from "../src/http.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("httpRequest", () => {
  it("returns parsed JSON on 2xx", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: "123" }),
    });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "POST",
      body: { title: "Hello" },
    });

    expect(result).toEqual({ success: true, data: { id: "123" } });
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("sends JSON body and headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await httpRequest("https://api.example.com/posts", {
      method: "POST",
      body: { title: "Test" },
      headers: { "api-key": "abc" },
    });

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.example.com/posts");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(opts.headers["api-key"]).toBe("abc");
    expect(JSON.parse(opts.body)).toEqual({ title: "Test" });
  });

  it("returns NETWORK_ERROR on fetch rejection", async () => {
    mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "ECONNREFUSED",
        retryable: true,
      },
    });
  });

  it("retries once on 5xx then returns PLATFORM_ERROR", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => "Bad Gateway",
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => "Bad Gateway",
      });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      success: false,
      error: {
        code: "PLATFORM_ERROR",
        message: "HTTP 502: Bad Gateway",
        retryable: true,
      },
    });
  });

  it("succeeds on retry after first 5xx", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "Unavailable",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true, data: { ok: true } });
  });

  it("returns AUTH_FAILED on 401", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(mockFetch).toHaveBeenCalledOnce(); // no retry on 4xx
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTH_FAILED");
    }
  });

  it("returns AUTH_FAILED on 403", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => "Forbidden",
    });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTH_FAILED");
    }
  });

  it("returns RATE_LIMITED on 429", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limited",
    });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("RATE_LIMITED");
    }
  });

  it("returns NOT_FOUND on 404", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Not found",
    });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("respects abort signal for timeout", async () => {
    mockFetch.mockImplementation(
      () => new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 50);
      })
    );

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
      timeoutMs: 10,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NETWORK_ERROR");
    }
  });
});

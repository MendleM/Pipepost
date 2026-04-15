import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractUrls, checkSingleLink, checkLinks } from "../../src/audit/links.js";

// ── URL extraction tests (pure, no mocking) ────────────────────────

describe("extractUrls", () => {
  it("extracts markdown link URLs", () => {
    const md = "Check out [Google](https://google.com) and [GitHub](https://github.com).";
    const urls = extractUrls(md);
    expect(urls).toContain("https://google.com");
    expect(urls).toContain("https://github.com");
  });

  it("extracts image URLs", () => {
    const md = "![Alt text](https://example.com/image.png)";
    const urls = extractUrls(md);
    expect(urls).toContain("https://example.com/image.png");
  });

  it("extracts raw URLs", () => {
    const md = "Visit https://example.com/page for more info.";
    const urls = extractUrls(md);
    expect(urls).toContain("https://example.com/page");
  });

  it("deduplicates URLs", () => {
    const md = "[Link](https://example.com) and https://example.com again.";
    const urls = extractUrls(md);
    expect(urls.filter((u) => u === "https://example.com")).toHaveLength(1);
  });

  it("strips trailing punctuation from raw URLs", () => {
    const md = "See https://example.com/page.";
    const urls = extractUrls(md);
    expect(urls).toContain("https://example.com/page");
  });

  it("ignores non-HTTP URLs", () => {
    const md = "[Mail](mailto:test@example.com) and [FTP](ftp://files.example.com)";
    const urls = extractUrls(md);
    expect(urls).toHaveLength(0);
  });

  it("handles content with no URLs", () => {
    const md = "# Just a Title\n\nNo links here at all.";
    const urls = extractUrls(md);
    expect(urls).toHaveLength(0);
  });

  it("handles multiple URL types together", () => {
    const md = `
# Article

Check [docs](https://docs.example.com) and ![img](https://img.example.com/pic.jpg).

Also see https://raw.example.com/page for reference.
    `;
    const urls = extractUrls(md);
    expect(urls).toHaveLength(3);
    expect(urls).toContain("https://docs.example.com");
    expect(urls).toContain("https://img.example.com/pic.jpg");
    expect(urls).toContain("https://raw.example.com/page");
  });
});

// ── Link checking tests (mocked fetch) ─────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("checkSingleLink", () => {
  it("returns ok for 200 response", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      headers: new Headers(),
    });

    const result = await checkSingleLink("https://example.com");
    expect(result.status).toBe("ok");
    expect(result.status_code).toBe(200);
  });

  it("returns redirected for 301 response", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 301,
      headers: new Headers({ location: "https://example.com/new" }),
    });

    const result = await checkSingleLink("https://example.com/old");
    expect(result.status).toBe("redirected");
    expect(result.status_code).toBe(301);
    expect(result.message).toContain("https://example.com/new");
  });

  it("returns broken for 404 response", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 404,
      headers: new Headers(),
    });

    const result = await checkSingleLink("https://example.com/missing");
    expect(result.status).toBe("broken");
    expect(result.status_code).toBe(404);
  });

  it("returns broken for 500 response", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 500,
      headers: new Headers(),
    });

    const result = await checkSingleLink("https://example.com/error");
    expect(result.status).toBe("broken");
    expect(result.status_code).toBe(500);
  });

  it("returns timeout on AbortError", async () => {
    mockFetch.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));

    const result = await checkSingleLink("https://example.com/slow");
    expect(result.status).toBe("timeout");
    expect(result.status_code).toBeNull();
  });

  it("returns error on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const result = await checkSingleLink("https://example.com/down");
    expect(result.status).toBe("error");
    expect(result.message).toBe("ECONNREFUSED");
  });

  it("retries with GET on 405 Method Not Allowed", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 405, headers: new Headers() })
      .mockResolvedValueOnce({ status: 200, headers: new Headers() });

    const result = await checkSingleLink("https://example.com/no-head");
    expect(result.status).toBe("ok");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Second call should be GET
    expect(mockFetch.mock.calls[1][1].method).toBe("GET");
  });
});

describe("checkLinks", () => {
  it("returns empty result for content with no URLs", async () => {
    const result = await checkLinks("No links here.");
    expect(result.total).toBe(0);
    expect(result.links).toHaveLength(0);
  });

  it("checks all URLs in content", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 200, headers: new Headers() })
      .mockResolvedValueOnce({ status: 404, headers: new Headers() });

    const md = "[Good](https://good.example.com) and [Bad](https://bad.example.com)";
    const result = await checkLinks(md);

    expect(result.total).toBe(2);
    expect(result.ok).toBe(1);
    expect(result.broken).toBe(1);
  });

  it("computes correct summary counts", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 200, headers: new Headers() })
      .mockResolvedValueOnce({ status: 301, headers: new Headers({ location: "https://new.example.com" }) })
      .mockResolvedValueOnce({ status: 404, headers: new Headers() });

    const md = `
[OK](https://ok.example.com)
[Redirect](https://redirect.example.com)
[Broken](https://broken.example.com)
    `;
    const result = await checkLinks(md);

    expect(result.total).toBe(3);
    expect(result.ok).toBe(1);
    expect(result.redirected).toBe(1);
    expect(result.broken).toBe(1);
    expect(result.timeout).toBe(0);
    expect(result.error).toBe(0);
  });
});

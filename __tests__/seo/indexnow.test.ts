import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleIndexNow } from "../../src/tools/seo-tools.js";
import * as http from "../../src/http.js";
import * as config from "../../src/config.js";

vi.mock("../../src/http.js");
vi.mock("../../src/config.js");

const mockHttp = vi.mocked(http);
const mockConfig = vi.mocked(config);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("handleIndexNow", () => {
  it("returns error when url is empty", async () => {
    mockConfig.readConfig.mockReturnValue({});

    const result = await handleIndexNow({ url: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("url is required");
    }
  });

  it("returns error for invalid URL", async () => {
    mockConfig.readConfig.mockReturnValue({});

    const result = await handleIndexNow({ url: "not-a-url" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("Invalid URL");
    }
  });

  it("generates and caches a key on first use", async () => {
    mockConfig.readConfig.mockReturnValue({});
    mockConfig.writeConfig.mockImplementation(() => {});
    mockHttp.httpRequest.mockResolvedValue({ success: true, data: {} });

    await handleIndexNow({ url: "https://myblog.com/post-1" });

    // writeConfig should be called with a generated key
    expect(mockConfig.writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        indexnow_key: expect.stringMatching(/^[a-f0-9]{32}$/),
      })
    );
  });

  it("reuses existing key from config", async () => {
    mockConfig.readConfig.mockReturnValue({ indexnow_key: "existing-key-abc" });
    mockHttp.httpRequest.mockResolvedValue({ success: true, data: {} });

    await handleIndexNow({ url: "https://myblog.com/post-1" });

    // writeConfig should NOT be called for key generation
    expect(mockConfig.writeConfig).not.toHaveBeenCalled();

    // Both API calls should use the existing key
    for (const call of mockHttp.httpRequest.mock.calls) {
      const body = call[1].body as { key: string };
      expect(body.key).toBe("existing-key-abc");
    }
  });

  it("submits to IndexNow and Bing", async () => {
    mockConfig.readConfig.mockReturnValue({ indexnow_key: "test-key" });
    mockHttp.httpRequest.mockResolvedValue({ success: true, data: {} });

    const result = await handleIndexNow({ url: "https://myblog.com/post-1" });

    expect(mockHttp.httpRequest).toHaveBeenCalledTimes(2);

    const urls = mockHttp.httpRequest.mock.calls.map(([url]) => url);
    expect(urls).toContain("https://api.indexnow.org/indexnow");
    expect(urls).toContain("https://www.bing.com/indexnow");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.urls_submitted).toBe(1);
      expect(result.data.engines_notified).toContain("IndexNow");
      expect(result.data.engines_notified).toContain("Bing");
    }
  });

  it("extracts host and builds correct payload", async () => {
    mockConfig.readConfig.mockReturnValue({ indexnow_key: "test-key" });
    mockHttp.httpRequest.mockResolvedValue({ success: true, data: {} });

    await handleIndexNow({ url: "https://myblog.com/post-1" });

    const [, opts] = mockHttp.httpRequest.mock.calls[0];
    const body = opts.body as { host: string; key: string; urlList: string[] };
    expect(body.host).toBe("myblog.com");
    expect(body.key).toBe("test-key");
    expect(body.urlList).toEqual(["https://myblog.com/post-1"]);
  });

  it("submits batch of URLs", async () => {
    mockConfig.readConfig.mockReturnValue({ indexnow_key: "test-key" });
    mockHttp.httpRequest.mockResolvedValue({ success: true, data: {} });

    const result = await handleIndexNow({
      url: "https://myblog.com/post-1",
      urls: ["https://myblog.com/post-2", "https://myblog.com/post-3"],
    });

    const [, opts] = mockHttp.httpRequest.mock.calls[0];
    const body = opts.body as { urlList: string[] };
    expect(body.urlList).toEqual([
      "https://myblog.com/post-1",
      "https://myblog.com/post-2",
      "https://myblog.com/post-3",
    ]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.urls_submitted).toBe(3);
    }
  });

  it("reports partial failures", async () => {
    mockConfig.readConfig.mockReturnValue({ indexnow_key: "test-key" });
    mockHttp.httpRequest
      .mockResolvedValueOnce({ success: true, data: {} })
      .mockResolvedValueOnce({
        success: false,
        error: { code: "NETWORK_ERROR", message: "Connection refused", retryable: true },
      });

    const result = await handleIndexNow({ url: "https://myblog.com/post-1" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.engines_notified).toEqual(["IndexNow"]);
      expect(result.data.errors).toEqual(["Bing: Connection refused"]);
    }
  });
});

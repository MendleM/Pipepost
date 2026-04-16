import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseInline,
  markdownToProseMirror,
  fetchSubstackUserId,
  publishToSubstack,
  listSubstackPosts,
  type SubstackCredentials,
} from "../../src/publish/substack.js";
import * as http from "../../src/http.js";

vi.mock("../../src/http.js");
const mockHttp = vi.mocked(http);

beforeEach(() => {
  vi.restoreAllMocks();
});

const creds: SubstackCredentials = {
  connect_sid: "sid-abc",
  publication_url: "https://example.substack.com",
  user_id: 42,
};

// ─── parseInline ──────────────────────────────────────────────────────────────

describe("parseInline", () => {
  it("returns empty array for empty string", () => {
    expect(parseInline("")).toEqual([]);
  });

  it("returns plain text node when no markup", () => {
    expect(parseInline("hello world")).toEqual([
      { type: "text", text: "hello world" },
    ]);
  });

  it("parses bold", () => {
    expect(parseInline("a **bold** b")).toEqual([
      { type: "text", text: "a " },
      { type: "text", text: "bold", marks: [{ type: "strong" }] },
      { type: "text", text: " b" },
    ]);
  });

  it("parses italic with single asterisks", () => {
    expect(parseInline("an *italic* word")).toEqual([
      { type: "text", text: "an " },
      { type: "text", text: "italic", marks: [{ type: "em" }] },
      { type: "text", text: " word" },
    ]);
  });

  it("parses inline code with backticks", () => {
    expect(parseInline("call `foo()` now")).toEqual([
      { type: "text", text: "call " },
      { type: "text", text: "foo()", marks: [{ type: "code" }] },
      { type: "text", text: " now" },
    ]);
  });

  it("parses links", () => {
    const result = parseInline("see [docs](https://x.com)");
    expect(result).toEqual([
      { type: "text", text: "see " },
      {
        type: "text",
        text: "docs",
        marks: [{ type: "link", attrs: { href: "https://x.com" } }],
      },
    ]);
  });

  it("ignores image syntax", () => {
    // Image links like ![alt](url) should not be parsed as link nodes here —
    // they're handled separately at the block layer (and we drop them in v0.9.0).
    const result = parseInline("![alt](https://img.png)");
    expect(result.some((n) => n.marks?.[0]?.type === "link")).toBe(false);
  });

  it("does not double-mark overlapping ranges", () => {
    // The bold inside a link should not produce two nodes — link wins.
    const result = parseInline("[**title**](https://x.com)");
    expect(result).toHaveLength(1);
    expect(result[0].marks?.[0].type).toBe("link");
  });
});

// ─── markdownToProseMirror ────────────────────────────────────────────────────

describe("markdownToProseMirror", () => {
  it("returns empty doc for empty markdown", () => {
    expect(markdownToProseMirror("")).toEqual({ type: "doc", content: [] });
  });

  it("converts paragraphs", () => {
    const doc = markdownToProseMirror("First.\n\nSecond.");
    expect(doc.content).toHaveLength(2);
    expect(doc.content[0]).toMatchObject({ type: "paragraph" });
    expect(doc.content[1]).toMatchObject({ type: "paragraph" });
  });

  it("converts headings with level attr", () => {
    const doc = markdownToProseMirror("# Title\n\n## Sub");
    expect(doc.content[0]).toMatchObject({
      type: "heading",
      attrs: { level: 1 },
    });
    expect(doc.content[1]).toMatchObject({
      type: "heading",
      attrs: { level: 2 },
    });
  });

  it("clamps heading level at 6", () => {
    const doc = markdownToProseMirror("####### way too deep");
    expect(doc.content[0]).toMatchObject({
      type: "heading",
      attrs: { level: 6 },
    });
  });

  it("converts fenced code blocks with language attr", () => {
    const doc = markdownToProseMirror("```ts\nconst x = 1;\n```");
    expect(doc.content[0]).toEqual({
      type: "code_block",
      attrs: { language: "ts" },
      content: [{ type: "text", text: "const x = 1;" }],
    });
  });

  it("converts fenced code blocks without language", () => {
    const doc = markdownToProseMirror("```\nplain\n```");
    expect(doc.content[0]).toMatchObject({ type: "code_block" });
    expect(doc.content[0].attrs).toBeUndefined();
  });

  it("converts blockquotes", () => {
    const doc = markdownToProseMirror("> a quoted line\n> another");
    expect(doc.content[0]).toMatchObject({ type: "blockquote" });
    const quote = doc.content[0];
    expect(quote.content?.length).toBe(2);
  });

  it("converts bullet lists", () => {
    const doc = markdownToProseMirror("- one\n- two\n- three");
    expect(doc.content[0]).toMatchObject({ type: "bullet_list" });
    expect(doc.content[0].content?.length).toBe(3);
  });

  it("preserves bold inside paragraphs", () => {
    const doc = markdownToProseMirror("hi **bold** end");
    const para = doc.content[0] as { content?: Array<{ marks?: Array<{ type: string }> }> };
    const marks = para.content?.find((n) => n.marks)?.marks;
    expect(marks?.[0]).toEqual({ type: "strong" });
  });

  it("does not treat **bold** start of line as a bullet", () => {
    const doc = markdownToProseMirror("**bold paragraph**");
    expect(doc.content[0].type).toBe("paragraph");
  });
});

// ─── fetchSubstackUserId ──────────────────────────────────────────────────────

describe("fetchSubstackUserId", () => {
  it("returns id from /user/profile/self", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { id: 12345, name: "Author" },
    });
    const result = await fetchSubstackUserId("sid");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(12345);
  });

  it("sends connect.sid cookie", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { id: 1 },
    });
    await fetchSubstackUserId("my-sid");
    expect(mockHttp.httpRequest.mock.calls[0][1].headers).toEqual({
      Cookie: "connect.sid=my-sid",
    });
  });

  it("returns AUTH_FAILED when id missing", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { name: "no id" },
    });
    const result = await fetchSubstackUserId("sid");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTH_FAILED");
      expect(result.error.platform).toBe("substack");
    }
  });

  it("propagates HTTP errors", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: {
        code: "AUTH_FAILED",
        message: "HTTP 401: Unauthorized",
        retryable: false,
      },
    });
    const result = await fetchSubstackUserId("bad-sid");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.platform).toBe("substack");
  });
});

// ─── publishToSubstack ────────────────────────────────────────────────────────

describe("publishToSubstack", () => {
  it("rejects when user_id is missing", async () => {
    const result = await publishToSubstack(
      { title: "T", content: "c" },
      { connect_sid: "s", publication_url: "https://x.substack.com" }
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("AUTH_FAILED");
  });

  it("creates draft only when status=draft", async () => {
    mockHttp.httpRequest.mockResolvedValueOnce({
      success: true,
      data: { id: 999, slug: "draft-slug" },
    });
    const result = await publishToSubstack(
      { title: "Hello", content: "# Title", status: "draft" },
      creds
    );
    expect(mockHttp.httpRequest).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.post_id).toBe("999");
      expect(result.data.url).toContain("/publish/post/999");
      expect(result.data.platform).toBe("substack");
    }
  });

  it("publishes draft when status=published", async () => {
    mockHttp.httpRequest
      .mockResolvedValueOnce({
        success: true,
        data: { id: 1001 },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 1001,
          slug: "my-post",
          canonical_url: "https://example.substack.com/p/my-post",
        },
      });

    const result = await publishToSubstack(
      { title: "T", subtitle: "Sub", content: "Body", status: "published" },
      creds
    );

    expect(mockHttp.httpRequest).toHaveBeenCalledTimes(2);
    expect(mockHttp.httpRequest.mock.calls[0][0]).toBe(
      "https://example.substack.com/api/v1/drafts"
    );
    expect(mockHttp.httpRequest.mock.calls[1][0]).toBe(
      "https://example.substack.com/api/v1/drafts/1001/publish"
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe("https://example.substack.com/p/my-post");
    }
  });

  it("sends correct draft body shape", async () => {
    mockHttp.httpRequest.mockResolvedValueOnce({
      success: true,
      data: { id: 1 },
    });

    await publishToSubstack(
      { title: "T", subtitle: "S", content: "# H\n\nbody", status: "draft" },
      creds
    );

    const body = mockHttp.httpRequest.mock.calls[0][1].body as {
      draft_title: string;
      draft_subtitle: string;
      draft_body: string;
      draft_bylines: Array<{ id: number; is_guest: boolean }>;
      audience: string;
    };

    expect(body.draft_title).toBe("T");
    expect(body.draft_subtitle).toBe("S");
    expect(body.draft_bylines).toEqual([{ id: 42, is_guest: false }]);
    expect(body.audience).toBe("everyone");

    // draft_body should be a JSON-stringified ProseMirror doc
    const doc = JSON.parse(body.draft_body);
    expect(doc.type).toBe("doc");
    expect(Array.isArray(doc.content)).toBe(true);
  });

  it("trims trailing slash on publication_url", async () => {
    mockHttp.httpRequest.mockResolvedValueOnce({
      success: true,
      data: { id: 7 },
    });

    await publishToSubstack(
      { title: "T", content: "x", status: "draft" },
      { ...creds, publication_url: "https://example.substack.com/" }
    );

    expect(mockHttp.httpRequest.mock.calls[0][0]).toBe(
      "https://example.substack.com/api/v1/drafts"
    );
  });

  it("propagates draft creation errors", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: {
        code: "PLATFORM_ERROR",
        message: "HTTP 500: server",
        retryable: true,
      },
    });

    const result = await publishToSubstack(
      { title: "T", content: "x" },
      creds
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.platform).toBe("substack");
      expect(result.error.code).toBe("PLATFORM_ERROR");
    }
  });

  it("propagates publish step errors", async () => {
    mockHttp.httpRequest
      .mockResolvedValueOnce({
        success: true,
        data: { id: 5 },
      })
      .mockResolvedValueOnce({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "HTTP 429",
          retryable: true,
        },
      });

    const result = await publishToSubstack(
      { title: "T", content: "x", status: "published" },
      creds
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("RATE_LIMITED");
      expect(result.error.platform).toBe("substack");
    }
  });
});

// ─── listSubstackPosts ────────────────────────────────────────────────────────

describe("listSubstackPosts", () => {
  it("merges drafts and published posts", async () => {
    mockHttp.httpRequest
      .mockResolvedValueOnce({
        success: true,
        data: [{ id: 1, draft_title: "Draft A", draft_updated_at: "2026-04-01" }],
      })
      .mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 2,
            title: "Published B",
            slug: "pub-b",
            post_date: "2026-03-15",
          },
        ],
      });

    const result = await listSubstackPosts(creds, 10);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.posts[0]).toMatchObject({
        id: "1",
        title: "Draft A",
        status: "draft",
      });
      expect(result.data.posts[1]).toMatchObject({
        id: "2",
        title: "Published B",
        status: "published",
        url: "https://example.substack.com/p/pub-b",
      });
    }
  });

  it("handles published payload wrapped in {posts: [...]}", async () => {
    mockHttp.httpRequest
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({
        success: true,
        data: { posts: [{ id: 9, title: "Wrapped", slug: "w" }] },
      });

    const result = await listSubstackPosts(creds);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(1);
      expect(result.data.posts[0].id).toBe("9");
    }
  });

  it("returns error if drafts call fails", async () => {
    mockHttp.httpRequest
      .mockResolvedValueOnce({
        success: false,
        error: { code: "AUTH_FAILED", message: "401", retryable: false },
      })
      .mockResolvedValueOnce({ success: true, data: [] });

    const result = await listSubstackPosts(creds);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.platform).toBe("substack");
    }
  });
});

import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";
import type { PublishResult, PostSummary } from "./types.js";

const SUBSTACK_BASE = "https://substack.com/api/v1";

export interface SubstackCredentials {
  /** Value of the `connect.sid` cookie from a logged-in Substack browser session. */
  connect_sid: string;
  /** Publication URL, e.g. "https://username.substack.com" — no trailing slash. */
  publication_url: string;
  /** Numeric user id from /api/v1/user/profile/self. Cached after first publish. */
  user_id?: number;
}

interface SubstackPublishInput {
  title: string;
  /** Subtitle/dek (Substack's `draft_subtitle`). Falls back to empty string. */
  subtitle?: string;
  content: string;
  status?: "draft" | "published";
  /**
   * Audience for paid publications. Defaults to "everyone".
   * Possible values: everyone, only_paid, founding, only_free.
   */
  audience?: "everyone" | "only_paid" | "founding" | "only_free";
}

// ─────────────────────────────────────────────────────────────────────────────
// ProseMirror conversion
// ─────────────────────────────────────────────────────────────────────────────

interface InlineMark {
  type: "strong" | "em" | "code" | "link";
  attrs?: { href: string };
}

interface InlineNode {
  type: "text";
  text: string;
  marks?: InlineMark[];
}

interface BlockNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: Array<InlineNode | BlockNode>;
}

interface ProseMirrorDoc {
  type: "doc";
  content: BlockNode[];
}

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;
const ITALIC_PATTERN = /(?<!\*)\*([^*]+)\*(?!\*)/g;
const CODE_PATTERN = /`([^`]+)`/g;

interface InlineMatch {
  start: number;
  end: number;
  text: string;
  mark: InlineMark;
}

/**
 * Convert a single line of inline-formatted markdown into ProseMirror text
 * nodes. Supports bold (`**text**`), italic (`*text*`), inline code
 * (`` `code` ``), and links (`[text](url)`). Image syntax (`![alt](url)`)
 * is intentionally ignored — images are handled at the block level.
 *
 * Overlapping markup follows precedence link > bold > italic > code, matching
 * the python-substack reference implementation. Returns an empty array for
 * empty input so callers can drop empty paragraphs.
 */
export function parseInline(text: string): InlineNode[] {
  if (!text) return [];

  const matches: InlineMatch[] = [];

  for (const m of text.matchAll(LINK_PATTERN)) {
    // Skip image syntax — `![alt](url)` is a leading-`!` link.
    const start = m.index ?? 0;
    if (start > 0 && text[start - 1] === "!") continue;
    matches.push({
      start,
      end: start + m[0].length,
      text: m[1],
      mark: { type: "link", attrs: { href: m[2] } },
    });
  }

  for (const m of text.matchAll(BOLD_PATTERN)) {
    const start = m.index ?? 0;
    if (overlaps(matches, start)) continue;
    matches.push({
      start,
      end: start + m[0].length,
      text: m[1],
      mark: { type: "strong" },
    });
  }

  for (const m of text.matchAll(ITALIC_PATTERN)) {
    const start = m.index ?? 0;
    if (overlaps(matches, start)) continue;
    matches.push({
      start,
      end: start + m[0].length,
      text: m[1],
      mark: { type: "em" },
    });
  }

  for (const m of text.matchAll(CODE_PATTERN)) {
    const start = m.index ?? 0;
    if (overlaps(matches, start)) continue;
    matches.push({
      start,
      end: start + m[0].length,
      text: m[1],
      mark: { type: "code" },
    });
  }

  matches.sort((a, b) => a.start - b.start);

  const nodes: InlineNode[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) {
      nodes.push({ type: "text", text: text.slice(cursor, match.start) });
    }
    nodes.push({ type: "text", text: match.text, marks: [match.mark] });
    cursor = match.end;
  }
  if (cursor < text.length) {
    nodes.push({ type: "text", text: text.slice(cursor) });
  }

  return nodes.filter((n) => n.text);
}

function overlaps(matches: InlineMatch[], position: number): boolean {
  return matches.some((m) => m.start <= position && position < m.end);
}

interface MarkdownBlock {
  kind: "text" | "code";
  language?: string;
  lines: string[];
}

function splitBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split("\n");
  const blocks: MarkdownBlock[] = [];
  let current: string[] = [];
  let inFence = false;
  let fenceLang: string | undefined;

  const flushText = () => {
    if (current.length > 0) {
      blocks.push({ kind: "text", lines: current });
      current = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      if (inFence) {
        blocks.push({ kind: "code", language: fenceLang, lines: current });
        current = [];
        inFence = false;
        fenceLang = undefined;
      } else {
        flushText();
        const lang = trimmed.slice(3).trim();
        fenceLang = lang || undefined;
        inFence = true;
      }
      continue;
    }

    if (inFence) {
      current.push(line);
      continue;
    }

    if (trimmed === "") {
      flushText();
      continue;
    }
    current.push(line);
  }

  if (inFence) {
    // Unterminated fence — treat collected lines as code anyway so we don't lose them.
    blocks.push({ kind: "code", language: fenceLang, lines: current });
  } else {
    flushText();
  }

  return blocks;
}

/**
 * Convert a markdown string into a Substack ProseMirror document.
 *
 * Supported block types: paragraphs, headings (H1–H6), fenced code blocks,
 * blockquotes, bullet lists. Inline formatting per parseInline. Unsupported
 * constructs (tables, images, ordered lists) degrade to plain paragraphs.
 */
export function markdownToProseMirror(markdown: string): ProseMirrorDoc {
  const doc: ProseMirrorDoc = { type: "doc", content: [] };

  for (const block of splitBlocks(markdown)) {
    if (block.kind === "code") {
      const codeText = block.lines.join("\n");
      const codeBlock: BlockNode = {
        type: "code_block",
        content: codeText ? [{ type: "text", text: codeText }] : [],
      };
      if (block.language) codeBlock.attrs = { language: block.language };
      doc.content.push(codeBlock);
      continue;
    }

    appendTextBlock(doc, block.lines);
  }

  return doc;
}

function appendTextBlock(doc: ProseMirrorDoc, lines: string[]): void {
  let pendingBullets: InlineNode[][] | null = null;
  let pendingQuotes: string[] | null = null;

  const flushBullets = () => {
    if (!pendingBullets) return;
    doc.content.push({
      type: "bullet_list",
      content: pendingBullets.map((nodes) => ({
        type: "list_item",
        content: [{ type: "paragraph", content: nodes }],
      })),
    });
    pendingBullets = null;
  };

  const flushQuotes = () => {
    if (!pendingQuotes) return;
    const paragraphs = pendingQuotes
      .map((line) => parseInline(line))
      .filter((nodes) => nodes.length > 0)
      .map((nodes) => ({ type: "paragraph", content: nodes }));
    const node: BlockNode = { type: "blockquote" };
    if (paragraphs.length > 0) node.content = paragraphs;
    doc.content.push(node);
    pendingQuotes = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Heading
    if (line.startsWith("#")) {
      flushBullets();
      flushQuotes();
      const hashes = line.match(/^#+/)?.[0] ?? "";
      const level = Math.min(hashes.length, 6);
      const text = line.slice(hashes.length).trim();
      if (text) {
        doc.content.push({
          type: "heading",
          attrs: { level },
          content: parseInline(text),
        });
      }
      continue;
    }

    // Blockquote
    if (line.startsWith("> ") || line === ">") {
      flushBullets();
      const quote = line === ">" ? "" : line.slice(2);
      (pendingQuotes ??= []).push(quote);
      continue;
    }

    // Bullet list — `* item` or `- item` (NOT `**bold**`)
    let bulletText: string | null = null;
    if (line.startsWith("- ")) bulletText = line.slice(2).trim();
    else if (line.startsWith("* ") && !line.startsWith("**")) bulletText = line.slice(2).trim();

    if (bulletText !== null) {
      flushQuotes();
      const inline = parseInline(bulletText);
      if (inline.length > 0) (pendingBullets ??= []).push(inline);
      continue;
    }

    // Plain paragraph
    flushBullets();
    flushQuotes();
    doc.content.push({ type: "paragraph", content: parseInline(line) });
  }

  flushBullets();
  flushQuotes();
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP layer
// ─────────────────────────────────────────────────────────────────────────────

function cookieHeader(connectSid: string): Record<string, string> {
  return { Cookie: `connect.sid=${connectSid}` };
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Fetch the authenticated Substack user's numeric id. Required as part of
 * `draft_bylines` on every draft. Cached on `SubstackCredentials.user_id`
 * after first publish so subsequent calls skip this round trip.
 */
export async function fetchSubstackUserId(
  connectSid: string
): Promise<ToolResult<number>> {
  const result = await httpRequest(`${SUBSTACK_BASE}/user/profile/self`, {
    method: "GET",
    headers: cookieHeader(connectSid),
  });

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "substack",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { id?: number };
  if (typeof data.id !== "number") {
    return makeError(
      "AUTH_FAILED",
      "Substack /user/profile/self response missing numeric `id`. The connect.sid cookie may have expired — re-export it from your browser and run setup again.",
      { platform: "substack" }
    );
  }
  return makeSuccess(data.id);
}

/**
 * Publish a markdown article to Substack.
 *
 * Two-step flow: POST `/api/v1/drafts` to create the draft (stores body as a
 * JSON-stringified ProseMirror doc), then optionally POST `/{id}/publish` to
 * push it live. When `status` is `"draft"` we stop after step one.
 *
 * The user id (required for `draft_bylines`) must be supplied on `creds`. The
 * caller (handlePublish) is responsible for fetching it via
 * fetchSubstackUserId on first use and writing the result back to config.
 */
export async function publishToSubstack(
  input: SubstackPublishInput,
  creds: SubstackCredentials
): Promise<ToolResult<PublishResult>> {
  if (typeof creds.user_id !== "number") {
    return makeError(
      "AUTH_FAILED",
      "Substack credentials missing user_id — caller must resolve it via fetchSubstackUserId first.",
      { platform: "substack" }
    );
  }

  const pubUrl = trimSlash(creds.publication_url);
  const doc = markdownToProseMirror(input.content);

  const draftBody = {
    draft_title: input.title,
    draft_subtitle: input.subtitle ?? "",
    draft_body: JSON.stringify(doc),
    draft_bylines: [{ id: creds.user_id, is_guest: false }],
    audience: input.audience ?? "everyone",
  };

  const draftResult = await httpRequest(`${pubUrl}/api/v1/drafts`, {
    method: "POST",
    headers: cookieHeader(creds.connect_sid),
    body: draftBody,
  });

  if (!draftResult.success) {
    return makeError(draftResult.error.code, draftResult.error.message, {
      platform: "substack",
      retryable: draftResult.error.retryable,
    });
  }

  const draft = draftResult.data as { id?: number; slug?: string };
  if (typeof draft.id !== "number") {
    return makeError(
      "PLATFORM_ERROR",
      "Substack draft response missing numeric `id`",
      { platform: "substack" }
    );
  }

  // Draft URL — Substack's editor URL format. We use this as a sensible
  // fallback when status === "draft" (no public URL exists yet).
  const draftUrl = `${pubUrl}/publish/post/${draft.id}`;

  if (input.status !== "published") {
    return makeSuccess({
      post_id: String(draft.id),
      url: draftUrl,
      platform: "substack",
    });
  }

  const publishResult = await httpRequest(
    `${pubUrl}/api/v1/drafts/${draft.id}/publish`,
    {
      method: "POST",
      headers: cookieHeader(creds.connect_sid),
      body: { send: true, share_automatically: false },
    }
  );

  if (!publishResult.success) {
    return makeError(publishResult.error.code, publishResult.error.message, {
      platform: "substack",
      retryable: publishResult.error.retryable,
    });
  }

  const published = publishResult.data as { id?: number; slug?: string; canonical_url?: string };
  const publicUrl = published.canonical_url
    ?? (published.slug ? `${pubUrl}/p/${published.slug}` : draftUrl);

  return makeSuccess({
    post_id: String(published.id ?? draft.id),
    url: publicUrl,
    platform: "substack",
  });
}

/**
 * List draft + published posts from a Substack publication. Combines the
 * `/drafts` and `/post_management/published` endpoints since Substack
 * separates them.
 */
export async function listSubstackPosts(
  creds: SubstackCredentials,
  limit = 25
): Promise<ToolResult<{ posts: PostSummary[] }>> {
  const pubUrl = trimSlash(creds.publication_url);

  const [draftResult, publishedResult] = await Promise.all([
    httpRequest(`${pubUrl}/api/v1/drafts?limit=${limit}`, {
      method: "GET",
      headers: cookieHeader(creds.connect_sid),
    }),
    httpRequest(
      `${pubUrl}/api/v1/post_management/published?offset=0&limit=${limit}&order_by=post_date&order_direction=desc`,
      { method: "GET", headers: cookieHeader(creds.connect_sid) }
    ),
  ]);

  if (!draftResult.success) {
    return makeError(draftResult.error.code, draftResult.error.message, {
      platform: "substack",
      retryable: draftResult.error.retryable,
    });
  }
  if (!publishedResult.success) {
    return makeError(publishedResult.error.code, publishedResult.error.message, {
      platform: "substack",
      retryable: publishedResult.error.retryable,
    });
  }

  const drafts = (draftResult.data as Array<{
    id: number;
    draft_title?: string;
    title?: string;
    draft_updated_at?: string;
    updated_at?: string;
  }>) ?? [];

  // The published endpoint sometimes wraps results in `{ posts: [...] }`,
  // sometimes returns a bare array. Handle both.
  const publishedRaw = publishedResult.data as
    | { posts?: Array<{ id: number; title?: string; canonical_url?: string; post_date?: string; slug?: string }> }
    | Array<{ id: number; title?: string; canonical_url?: string; post_date?: string; slug?: string }>;
  const published = Array.isArray(publishedRaw) ? publishedRaw : (publishedRaw.posts ?? []);

  const posts: PostSummary[] = [
    ...drafts.map((d) => ({
      id: String(d.id),
      title: d.draft_title ?? d.title ?? "(untitled draft)",
      url: `${pubUrl}/publish/post/${d.id}`,
      status: "draft",
      published_at: d.draft_updated_at ?? d.updated_at ?? "",
    })),
    ...published.map((p) => ({
      id: String(p.id),
      title: p.title ?? "(untitled)",
      url: p.canonical_url ?? (p.slug ? `${pubUrl}/p/${p.slug}` : pubUrl),
      status: "published",
      published_at: p.post_date ?? "",
    })),
  ];

  return makeSuccess({ posts });
}

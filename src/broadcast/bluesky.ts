import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";

const BLUESKY_HOST = "https://bsky.social";
const APPVIEW_HOST = "https://api.bsky.app";
const PUBLIC_APPVIEW = "https://public.api.bsky.app";
const MAX_POST_LENGTH = 300;

// Hosts for authenticated AppView reads, tried in order on failure.
// Both respond to searchPosts/listNotifications; either can go sluggish
// (sustained 5xx for 30+s) without warning, so we failover between them.
const APPVIEW_HOSTS = [APPVIEW_HOST, BLUESKY_HOST] as const;

// Per-attempt timeout for AppView reads. Bluesky's AppView has been slow
// enough (5-10s+) under load that the shared 10s default clipped legit
// requests; 20s lets a sluggish-but-working response land before we retry
// against the alternate host.
const APPVIEW_READ_TIMEOUT_MS = 20_000;

// Host selection rationale:
//   - bsky.social  = PDS (Personal Data Server). Primary target for writes
//                    (createSession, createRecord, replies, posts). Also
//                    proxies AppView reads, which we use as the failover
//                    host when api.bsky.app is sluggish.
//   - api.bsky.app = authenticated AppView. Primary target for aggregated
//                    reads (searchPosts, listNotifications). When it
//                    5xx's we retry via bsky.social which reaches the
//                    same AppView through a different upstream path.
//   - public.api.bsky.app = public AppView. Used for unauthenticated
//                    getPostThread reads. BunnyCDN blocks searchPosts here.

export interface BlueskyCredentials {
  handle: string;
  app_password: string;
}

interface BlueskySession {
  accessJwt: string;
  did: string;
}

export interface BlueskyPost {
  uri: string;
  cid: string;
  url: string;
}

export interface BlueskyMention {
  uri: string;
  cid: string;
  reason: string;
  author: { did: string; handle: string; displayName?: string };
  text: string;
  isRead: boolean;
  indexedAt: string;
  /** at-uri of the post being replied to, if the notification is about a reply */
  reasonSubject?: string;
}

export interface BlueskySearchHit {
  uri: string;
  cid: string;
  author: { did: string; handle: string; displayName?: string };
  text: string;
  indexedAt: string;
  url: string;
  replyCount: number;
  likeCount: number;
}

export interface BlueskyThreadPost {
  uri: string;
  cid: string;
  author: { did: string; handle: string; displayName?: string };
  text: string;
  indexedAt: string;
  url: string;
}

export interface BlueskyThread {
  post: BlueskyThreadPost;
  parent?: BlueskyThread;
  replies: BlueskyThread[];
}

/**
 * Open a session against bsky.social using an app password.
 *
 * App passwords are generated at https://bsky.app/settings/app-passwords
 * and are distinct from the account's main password. Sessions are short-
 * lived access tokens that we use immediately and discard.
 */
async function createSession(
  credentials: BlueskyCredentials
): Promise<ToolResult<BlueskySession>> {
  const result = await httpRequest(
    `${BLUESKY_HOST}/xrpc/com.atproto.server.createSession`,
    {
      method: "POST",
      body: {
        identifier: credentials.handle,
        password: credentials.app_password,
      },
    }
  );

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "bluesky",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { accessJwt?: string; did?: string };
  if (!data.accessJwt || !data.did) {
    return makeError("AUTH_FAILED", "Bluesky session response missing accessJwt/did", {
      platform: "bluesky",
    });
  }

  return makeSuccess({ accessJwt: data.accessJwt, did: data.did });
}

/**
 * Authenticated GET against the Bluesky AppView, with host failover.
 *
 * Tries api.bsky.app first (direct AppView), then bsky.social (PDS proxy
 * to the same AppView) on 5xx or timeout. Both hosts have exhibited
 * sustained multi-request 5xx windows independently, so falling back to
 * the other host is materially more reliable than simply retrying the
 * same one. Non-5xx errors (auth, validation) short-circuit immediately —
 * retrying a 401 against a different host won't help.
 */
async function appViewGet(
  path: string,
  queryString: string,
  accessJwt: string
): Promise<ToolResult> {
  let lastError: ToolResult | null = null;
  for (const host of APPVIEW_HOSTS) {
    const url = queryString
      ? `${host}/xrpc/${path}?${queryString}`
      : `${host}/xrpc/${path}`;
    const result = await httpRequest(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessJwt}` },
      timeoutMs: APPVIEW_READ_TIMEOUT_MS,
    });
    if (result.success) return result;
    lastError = result;
    // Only failover on server-side or network failures. Auth/validation
    // errors are deterministic and will just repeat on the other host.
    if (
      result.error.code !== "PLATFORM_ERROR" &&
      result.error.code !== "NETWORK_ERROR"
    ) {
      return result;
    }
  }
  return lastError ?? makeError("PLATFORM_ERROR", "AppView read failed");
}

/**
 * Detect URL facets in a post so Bluesky renders them as clickable links.
 *
 * Bluesky stores post text as plain UTF-8 bytes with separate `facets`
 * annotations marking ranges as links/mentions. Without facets, a URL
 * appears as plain text and is not clickable. We scan for bare URLs and
 * emit `app.bsky.richtext.facet` entries with byte offsets.
 */
function extractLinkFacets(text: string): unknown[] {
  const facets: unknown[] = [];
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);

  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    // Compute byte offsets (not char offsets — AT Protocol requires bytes).
    const prefixBytes = encoder.encode(text.slice(0, match.index));
    const urlBytes = encoder.encode(url);
    facets.push({
      index: {
        byteStart: prefixBytes.length,
        byteEnd: prefixBytes.length + urlBytes.length,
      },
      features: [
        {
          $type: "app.bsky.richtext.facet#link",
          uri: url,
        },
      ],
    });
    void bytes; // appease unused-variable lint
  }

  return facets;
}

/** Derive a public bsky.app URL from an AT Protocol post URI. */
function atUriToPublicUrl(handle: string, uri: string): string {
  // uri format: at://<did>/app.bsky.feed.post/<rkey>
  const match = uri.match(/\/app\.bsky\.feed\.post\/([a-z0-9]+)$/i);
  if (!match) return uri;
  return `https://bsky.app/profile/${handle}/post/${match[1]}`;
}

/**
 * Fetch a single post's thread context from the public AppView so we can
 * learn its `cid` and walk back to the thread root. Needed when we want to
 * reply to an arbitrary post: the reply record requires both `parent` and
 * `root` references, and the root isn't the parent when replying within
 * an existing conversation.
 */
async function fetchPostMeta(
  uri: string
): Promise<ToolResult<{ uri: string; cid: string; root: { uri: string; cid: string } }>> {
  const result = await httpRequest(
    `${PUBLIC_APPVIEW}/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=0&parentHeight=0`,
    { method: "GET" }
  );
  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "bluesky",
      retryable: result.error.retryable,
    });
  }
  const thread = (result.data as { thread?: { post?: { uri: string; cid: string; record?: { reply?: { root?: { uri: string; cid: string } } } } } }).thread;
  const post = thread?.post;
  if (!post?.uri || !post?.cid) {
    return makeError("NOT_FOUND", `Post not found: ${uri}`, { platform: "bluesky" });
  }
  // If the post is itself a reply, its record.reply.root is the thread root.
  // Otherwise the post itself is the root.
  const rootRef = post.record?.reply?.root;
  const root = rootRef?.uri && rootRef?.cid
    ? { uri: rootRef.uri, cid: rootRef.cid }
    : { uri: post.uri, cid: post.cid };
  return makeSuccess({ uri: post.uri, cid: post.cid, root });
}

/**
 * Publish a single post to Bluesky.
 *
 * Enforces the 300-character limit, auto-detects URL facets so links are
 * clickable, and returns the public bsky.app URL for sharing.
 */
export async function postToBluesky(
  text: string,
  credentials: BlueskyCredentials
): Promise<ToolResult<BlueskyPost>> {
  if (!text.trim()) {
    return makeError("VALIDATION_ERROR", "Post text cannot be empty");
  }
  if ([...text].length > MAX_POST_LENGTH) {
    return makeError(
      "VALIDATION_ERROR",
      `Bluesky posts must be <= ${MAX_POST_LENGTH} characters (got ${[...text].length})`
    );
  }

  const session = await createSession(credentials);
  if (!session.success) return session;

  const facets = extractLinkFacets(text);
  const record: Record<string, unknown> = {
    $type: "app.bsky.feed.post",
    text,
    createdAt: new Date().toISOString(),
  };
  if (facets.length > 0) record.facets = facets;

  const result = await httpRequest(
    `${BLUESKY_HOST}/xrpc/com.atproto.repo.createRecord`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${session.data.accessJwt}` },
      body: {
        repo: session.data.did,
        collection: "app.bsky.feed.post",
        record,
      },
    }
  );

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "bluesky",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { uri: string; cid: string };
  return makeSuccess({
    uri: data.uri,
    cid: data.cid,
    url: atUriToPublicUrl(credentials.handle, data.uri),
  });
}

/**
 * Publish a sequence of posts as a reply-chained thread.
 *
 * The first post stands on its own; each subsequent post is a reply to the
 * previous one, with `root` anchored to the very first post so the whole
 * thread renders as a single conversation on bsky.app.
 */
export async function postThreadToBluesky(
  posts: string[],
  credentials: BlueskyCredentials
): Promise<ToolResult<{ posts: BlueskyPost[] }>> {
  if (posts.length === 0) {
    return makeError("VALIDATION_ERROR", "Thread must contain at least one post");
  }
  for (const [i, p] of posts.entries()) {
    if ([...p].length > MAX_POST_LENGTH) {
      return makeError(
        "VALIDATION_ERROR",
        `Post ${i + 1} exceeds ${MAX_POST_LENGTH} chars (got ${[...p].length})`
      );
    }
  }

  const session = await createSession(credentials);
  if (!session.success) return session;

  const results: BlueskyPost[] = [];
  let root: { uri: string; cid: string } | null = null;
  let parent: { uri: string; cid: string } | null = null;

  for (const text of posts) {
    const facets = extractLinkFacets(text);
    const record: Record<string, unknown> = {
      $type: "app.bsky.feed.post",
      text,
      createdAt: new Date().toISOString(),
    };
    if (facets.length > 0) record.facets = facets;
    if (root && parent) {
      record.reply = {
        root: { uri: root.uri, cid: root.cid },
        parent: { uri: parent.uri, cid: parent.cid },
      };
    }

    const result = await httpRequest(
      `${BLUESKY_HOST}/xrpc/com.atproto.repo.createRecord`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.data.accessJwt}` },
        body: {
          repo: session.data.did,
          collection: "app.bsky.feed.post",
          record,
        },
      }
    );

    if (!result.success) {
      return makeError(result.error.code, result.error.message, {
        platform: "bluesky",
        retryable: result.error.retryable,
      });
    }

    const data = result.data as { uri: string; cid: string };
    results.push({
      uri: data.uri,
      cid: data.cid,
      url: atUriToPublicUrl(credentials.handle, data.uri),
    });
    if (!root) root = { uri: data.uri, cid: data.cid };
    parent = { uri: data.uri, cid: data.cid };
  }

  return makeSuccess({ posts: results });
}

/**
 * Fetch notifications addressed to the authenticated account.
 *
 * By default returns only mentions and replies — the two notification types
 * that call for a response. Caller may override via `reasons`. The raw
 * AT Protocol endpoint returns a pile of likes/follows/reposts too, which
 * are noise for an engagement engine.
 */
export async function listBlueskyMentions(
  credentials: BlueskyCredentials,
  options?: { limit?: number; cursor?: string; reasons?: string[] }
): Promise<ToolResult<{ notifications: BlueskyMention[]; cursor?: string }>> {
  const session = await createSession(credentials);
  if (!session.success) return session;

  const reasons = options?.reasons ?? ["mention", "reply"];
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  for (const r of reasons) params.append("reasons", r);
  if (options?.cursor) params.set("cursor", options.cursor);

  const result = await appViewGet(
    "app.bsky.notification.listNotifications",
    params.toString(),
    session.data.accessJwt
  );

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "bluesky",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as {
    notifications: Array<{
      uri: string;
      cid: string;
      author: { did: string; handle: string; displayName?: string };
      reason: string;
      reasonSubject?: string;
      record: { text?: string };
      isRead: boolean;
      indexedAt: string;
    }>;
    cursor?: string;
  };

  const notifications: BlueskyMention[] = data.notifications.map((n) => ({
    uri: n.uri,
    cid: n.cid,
    reason: n.reason,
    author: n.author,
    text: n.record?.text ?? "",
    isRead: n.isRead,
    indexedAt: n.indexedAt,
    reasonSubject: n.reasonSubject,
  }));

  return makeSuccess({ notifications, cursor: data.cursor });
}

/**
 * Search public Bluesky posts.
 *
 * Bluesky restricts `searchPosts` on the public AppView (BunnyCDN 403s
 * unauthenticated requests to prevent scraping abuse), so this call must
 * go through an authenticated AppView session. We hit `api.bsky.app`
 * directly — the PDS will proxy search requests but its upstream is flaky
 * (intermittent 502/503/504). Credentials are required — same app password
 * used for posting.
 *
 * `mentions` filter is useful for "who's talking about us" queries, and
 * `author` filter for "what has this person said recently." `sort: latest`
 * is default — for the growth engine we want freshness, not popularity.
 */
export async function searchBlueskyPosts(
  query: string,
  credentials: BlueskyCredentials,
  options?: {
    limit?: number;
    cursor?: string;
    sort?: "top" | "latest";
    since?: string;
    mentions?: string;
    author?: string;
    lang?: string;
    tag?: string[];
  }
): Promise<ToolResult<{ posts: BlueskySearchHit[]; cursor?: string }>> {
  if (!query.trim()) {
    return makeError("VALIDATION_ERROR", "Search query cannot be empty");
  }

  const session = await createSession(credentials);
  if (!session.success) return session;

  const limit = Math.min(Math.max(options?.limit ?? 25, 1), 100);
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("limit", String(limit));
  params.set("sort", options?.sort ?? "latest");
  if (options?.cursor) params.set("cursor", options.cursor);
  if (options?.since) params.set("since", options.since);
  if (options?.mentions) params.set("mentions", options.mentions);
  if (options?.author) params.set("author", options.author);
  if (options?.lang) params.set("lang", options.lang);
  if (options?.tag) for (const t of options.tag) params.append("tag", t);

  const result = await appViewGet(
    "app.bsky.feed.searchPosts",
    params.toString(),
    session.data.accessJwt
  );

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "bluesky",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as {
    posts: Array<{
      uri: string;
      cid: string;
      author: { did: string; handle: string; displayName?: string };
      record: { text?: string };
      indexedAt: string;
      replyCount?: number;
      likeCount?: number;
    }>;
    cursor?: string;
  };

  const posts: BlueskySearchHit[] = data.posts.map((p) => ({
    uri: p.uri,
    cid: p.cid,
    author: p.author,
    text: p.record?.text ?? "",
    indexedAt: p.indexedAt,
    url: atUriToPublicUrl(p.author.handle, p.uri),
    replyCount: p.replyCount ?? 0,
    likeCount: p.likeCount ?? 0,
  }));

  return makeSuccess({ posts, cursor: data.cursor });
}

/**
 * Recursively normalize a threadViewPost node into our flatter shape. The
 * raw AT Protocol response is nested unions (threadViewPost, notFoundPost,
 * blockedPost); we care about the readable posts only. Depth-bounded by
 * whatever the server returned.
 */
function normalizeThreadNode(node: unknown): BlueskyThread | null {
  if (!node || typeof node !== "object") return null;
  const n = node as {
    $type?: string;
    post?: {
      uri: string;
      cid: string;
      author: { did: string; handle: string; displayName?: string };
      record: { text?: string };
      indexedAt: string;
    };
    parent?: unknown;
    replies?: unknown[];
  };
  // Skip notFoundPost / blockedPost variants.
  if (!n.post?.uri || !n.post?.cid) return null;

  const post: BlueskyThreadPost = {
    uri: n.post.uri,
    cid: n.post.cid,
    author: n.post.author,
    text: n.post.record?.text ?? "",
    indexedAt: n.post.indexedAt,
    url: atUriToPublicUrl(n.post.author.handle, n.post.uri),
  };

  const parent = n.parent ? normalizeThreadNode(n.parent) ?? undefined : undefined;
  const replies = Array.isArray(n.replies)
    ? n.replies.map(normalizeThreadNode).filter((r): r is BlueskyThread => r !== null)
    : [];

  return { post, parent, replies };
}

/**
 * Fetch the full conversation around a Bluesky post so the engagement
 * engine can understand context — what's been said above (parents) and
 * already replied below (replies). Hits the unauthenticated AppView.
 */
export async function getBlueskyThread(
  uri: string,
  options?: { depth?: number; parentHeight?: number }
): Promise<ToolResult<BlueskyThread>> {
  if (!uri.startsWith("at://")) {
    return makeError("VALIDATION_ERROR", `Expected an at-uri, got: ${uri}`);
  }
  const depth = options?.depth ?? 6;
  const parentHeight = options?.parentHeight ?? 80;
  const params = new URLSearchParams();
  params.set("uri", uri);
  params.set("depth", String(depth));
  params.set("parentHeight", String(parentHeight));

  const result = await httpRequest(
    `${PUBLIC_APPVIEW}/xrpc/app.bsky.feed.getPostThread?${params.toString()}`,
    { method: "GET" }
  );

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "bluesky",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { thread?: unknown };
  const normalized = normalizeThreadNode(data.thread);
  if (!normalized) {
    return makeError("NOT_FOUND", `Thread not found or unviewable: ${uri}`, {
      platform: "bluesky",
    });
  }
  return makeSuccess(normalized);
}

/**
 * Reply to an existing Bluesky post.
 *
 * Looks up the parent's cid and walks back to the thread root (because
 * reply records require both `parent` and `root` references). Accepts a
 * single reply or a chained thread of replies; when a thread is supplied,
 * only the first reply points at `parentUri` — subsequent posts chain off
 * the prior reply, just like `postThreadToBluesky`.
 */
export async function replyToBluesky(
  parentUri: string,
  text: string | string[],
  credentials: BlueskyCredentials
): Promise<ToolResult<{ posts: BlueskyPost[] }>> {
  const replies = Array.isArray(text) ? text : [text];
  if (replies.length === 0) {
    return makeError("VALIDATION_ERROR", "Provide at least one reply");
  }
  for (const [i, r] of replies.entries()) {
    if (!r.trim()) {
      return makeError("VALIDATION_ERROR", `Reply ${i + 1} is empty`);
    }
    if ([...r].length > MAX_POST_LENGTH) {
      return makeError(
        "VALIDATION_ERROR",
        `Reply ${i + 1} exceeds ${MAX_POST_LENGTH} chars (got ${[...r].length})`
      );
    }
  }

  const parentMeta = await fetchPostMeta(parentUri);
  if (!parentMeta.success) return parentMeta;

  const session = await createSession(credentials);
  if (!session.success) return session;

  const results: BlueskyPost[] = [];
  const root = parentMeta.data.root;
  let currentParent: { uri: string; cid: string } = {
    uri: parentMeta.data.uri,
    cid: parentMeta.data.cid,
  };

  for (const replyText of replies) {
    const facets = extractLinkFacets(replyText);
    const record: Record<string, unknown> = {
      $type: "app.bsky.feed.post",
      text: replyText,
      createdAt: new Date().toISOString(),
      reply: {
        root: { uri: root.uri, cid: root.cid },
        parent: { uri: currentParent.uri, cid: currentParent.cid },
      },
    };
    if (facets.length > 0) record.facets = facets;

    const result = await httpRequest(
      `${BLUESKY_HOST}/xrpc/com.atproto.repo.createRecord`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.data.accessJwt}` },
        body: {
          repo: session.data.did,
          collection: "app.bsky.feed.post",
          record,
        },
      }
    );

    if (!result.success) {
      return makeError(result.error.code, result.error.message, {
        platform: "bluesky",
        retryable: result.error.retryable,
      });
    }

    const data = result.data as { uri: string; cid: string };
    results.push({
      uri: data.uri,
      cid: data.cid,
      url: atUriToPublicUrl(credentials.handle, data.uri),
    });
    currentParent = { uri: data.uri, cid: data.cid };
  }

  return makeSuccess({ posts: results });
}

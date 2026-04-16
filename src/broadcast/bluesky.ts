import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";

const BLUESKY_HOST = "https://bsky.social";
const MAX_POST_LENGTH = 300;

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

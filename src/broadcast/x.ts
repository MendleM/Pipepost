import { createHmac, randomBytes } from "node:crypto";
import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";

/** X (Twitter) post cap. We target the free and basic tiers, not Premium. */
const MAX_LENGTH = 280;

export interface XCredentials {
  consumer_key: string;
  consumer_secret: string;
  access_token: string;
  access_token_secret: string;
}

export interface XPost {
  id: string;
  url: string;
}

/**
 * Percent-encode per RFC 3986. `encodeURIComponent` leaves `!*'()` alone but
 * OAuth 1.0a requires them to be encoded — otherwise the signature won't
 * match what the server computes.
 */
function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/**
 * Build an OAuth 1.0a `Authorization` header for an X API v2 call.
 *
 * X's v2 write endpoints accept JSON bodies, and for OAuth 1.0a signing
 * with a JSON body the signature base includes only the OAuth params plus
 * the URL's query string (if any). The body itself is NOT part of the
 * signature.
 */
export function buildOAuthHeader(
  method: "GET" | "POST",
  url: string,
  credentials: XCredentials,
  {
    nonce,
    timestamp,
  }: { nonce?: string; timestamp?: string } = {}
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.consumer_key,
    oauth_nonce: nonce ?? randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp ?? Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.access_token,
    oauth_version: "1.0",
  };

  // Strip query string off the URL — query params enter the base string
  // as regular params, not as part of the URL portion.
  const [baseUrl, queryString] = url.split("?");
  const queryParams: Record<string, string> = {};
  if (queryString) {
    for (const pair of queryString.split("&")) {
      const [k, v = ""] = pair.split("=");
      queryParams[decodeURIComponent(k)] = decodeURIComponent(v);
    }
  }

  const allParams = { ...oauthParams, ...queryParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(allParams[k])}`)
    .join("&");

  const signatureBase = [
    method.toUpperCase(),
    rfc3986(baseUrl),
    rfc3986(paramString),
  ].join("&");

  const signingKey = `${rfc3986(credentials.consumer_secret)}&${rfc3986(credentials.access_token_secret)}`;
  const signature = createHmac("sha1", signingKey)
    .update(signatureBase)
    .digest("base64");

  const headerParams: Record<string, string> = {
    ...oauthParams,
    oauth_signature: signature,
  };
  return (
    "OAuth " +
    Object.keys(headerParams)
      .sort()
      .map((k) => `${rfc3986(k)}="${rfc3986(headerParams[k])}"`)
      .join(", ")
  );
}

/**
 * Publish a single post to X via the v2 `/tweets` endpoint.
 *
 * The caller may pass `replyToId` to chain this post as a reply — we use
 * that internally when building threads.
 */
export async function postToX(
  text: string,
  credentials: XCredentials,
  options?: { replyToId?: string }
): Promise<ToolResult<XPost>> {
  if (!text.trim()) {
    return makeError("VALIDATION_ERROR", "Post text cannot be empty");
  }
  if ([...text].length > MAX_LENGTH) {
    return makeError(
      "VALIDATION_ERROR",
      `X posts must be <= ${MAX_LENGTH} characters (got ${[...text].length})`
    );
  }

  const url = "https://api.twitter.com/2/tweets";
  const body: Record<string, unknown> = { text };
  if (options?.replyToId) {
    body.reply = { in_reply_to_tweet_id: options.replyToId };
  }

  const authHeader = buildOAuthHeader("POST", url, credentials);

  const result = await httpRequest(url, {
    method: "POST",
    headers: { Authorization: authHeader },
    body,
  });

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "x",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { data?: { id?: string } };
  if (!data.data?.id) {
    return makeError("PLATFORM_ERROR", "X response missing tweet id", {
      platform: "x",
    });
  }

  return makeSuccess({
    id: data.data.id,
    url: `https://x.com/i/status/${data.data.id}`,
  });
}

/**
 * Publish a sequence of posts as a reply-chained thread on X.
 *
 * Each post after the first sets `reply.in_reply_to_tweet_id` to the id
 * returned by the previous call. If any call fails mid-thread we return
 * the error immediately — callers should be prepared to retry with the
 * tail of the thread.
 */
export async function postThreadToX(
  posts: string[],
  credentials: XCredentials
): Promise<ToolResult<{ posts: XPost[] }>> {
  if (posts.length === 0) {
    return makeError("VALIDATION_ERROR", "Thread must contain at least one post");
  }
  for (const [i, p] of posts.entries()) {
    if ([...p].length > MAX_LENGTH) {
      return makeError(
        "VALIDATION_ERROR",
        `Post ${i + 1} exceeds ${MAX_LENGTH} chars (got ${[...p].length})`
      );
    }
  }

  const results: XPost[] = [];
  let replyTo: string | undefined;

  for (const text of posts) {
    const result = await postToX(text, credentials, { replyToId: replyTo });
    if (!result.success) return result;
    results.push(result.data);
    replyTo = result.data.id;
  }

  return makeSuccess({ posts: results });
}

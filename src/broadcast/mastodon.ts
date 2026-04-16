import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";

const DEFAULT_MAX_LENGTH = 500;

export interface MastodonCredentials {
  instance_url: string;
  access_token: string;
}

export interface MastodonPost {
  id: string;
  url: string;
}

/** Strip trailing slash so we can safely concatenate API paths. */
function normalizeInstance(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Publish a single status to a Mastodon instance.
 *
 * Mastodon is federated — every instance has its own URL and its own access
 * tokens. Tokens are created at `https://<instance>/settings/applications`
 * with at least the `write:statuses` scope. The default per-post limit is
 * 500 characters, though individual instances may raise or lower that.
 */
export async function postToMastodon(
  text: string,
  credentials: MastodonCredentials,
  options?: { inReplyToId?: string; maxLength?: number }
): Promise<ToolResult<MastodonPost>> {
  const maxLength = options?.maxLength ?? DEFAULT_MAX_LENGTH;

  if (!text.trim()) {
    return makeError("VALIDATION_ERROR", "Post text cannot be empty");
  }
  if ([...text].length > maxLength) {
    return makeError(
      "VALIDATION_ERROR",
      `Mastodon posts must be <= ${maxLength} characters (got ${[...text].length})`
    );
  }

  const instance = normalizeInstance(credentials.instance_url);
  const body: Record<string, unknown> = {
    status: text,
    visibility: "public",
  };
  if (options?.inReplyToId) body.in_reply_to_id = options.inReplyToId;

  const result = await httpRequest(`${instance}/api/v1/statuses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${credentials.access_token}` },
    body,
  });

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "mastodon",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { id?: string; url?: string };
  if (!data.id || !data.url) {
    return makeError("PLATFORM_ERROR", "Mastodon response missing id/url", {
      platform: "mastodon",
    });
  }

  return makeSuccess({ id: data.id, url: data.url });
}

/**
 * Publish a sequence of statuses as a reply-chained thread.
 *
 * Mastodon threads are just linked statuses — each one sets `in_reply_to_id`
 * to the previous post's id. Unlike Bluesky there's no separate "root"
 * reference; the server walks the chain to reconstruct the thread.
 */
export async function postThreadToMastodon(
  posts: string[],
  credentials: MastodonCredentials,
  options?: { maxLength?: number }
): Promise<ToolResult<{ posts: MastodonPost[] }>> {
  if (posts.length === 0) {
    return makeError("VALIDATION_ERROR", "Thread must contain at least one post");
  }
  const maxLength = options?.maxLength ?? DEFAULT_MAX_LENGTH;
  for (const [i, p] of posts.entries()) {
    if ([...p].length > maxLength) {
      return makeError(
        "VALIDATION_ERROR",
        `Post ${i + 1} exceeds ${maxLength} chars (got ${[...p].length})`
      );
    }
  }

  const results: MastodonPost[] = [];
  let replyTo: string | undefined;

  for (const text of posts) {
    const result = await postToMastodon(text, credentials, {
      inReplyToId: replyTo,
      maxLength,
    });
    if (!result.success) return result;
    results.push(result.data);
    replyTo = result.data.id;
  }

  return makeSuccess({ posts: results });
}

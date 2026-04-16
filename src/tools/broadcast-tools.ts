import { z } from "zod";
import { readConfig } from "../config.js";
import {
  postToBluesky,
  postThreadToBluesky,
  listBlueskyMentions,
  searchBlueskyPosts,
  getBlueskyThread,
  replyToBluesky,
} from "../broadcast/bluesky.js";
import { postToMastodon, postThreadToMastodon } from "../broadcast/mastodon.js";
import { makeError, makeSuccess } from "../errors.js";

/** Zod schema for the `bluesky_post` tool input. */
export const blueskyPostSchema = z.object({
  text: z.string().optional().describe("Single post text (<= 300 chars). Mutually exclusive with `thread`."),
  thread: z.array(z.string()).optional().describe("Array of posts to chain as a reply thread. Each <= 300 chars."),
});

/**
 * Post directly to Bluesky.
 *
 * Free tool — posting is an API call with no LLM inference, so there's no
 * credit cost. Requires `social.bluesky.{handle, app_password}` in config;
 * app passwords come from https://bsky.app/settings/app-passwords.
 *
 * Supports a single post (`text`) or a threaded series (`thread`). Bare URLs
 * in the text are auto-detected as clickable link facets.
 */
export async function handleBlueskyPost(
  input: z.infer<typeof blueskyPostSchema>
) {
  if (!input.text && (!input.thread || input.thread.length === 0)) {
    return makeError("VALIDATION_ERROR", "Provide either `text` or `thread`");
  }
  if (input.text && input.thread && input.thread.length > 0) {
    return makeError("VALIDATION_ERROR", "Provide either `text` or `thread`, not both");
  }

  const config = readConfig();
  const creds = config.social?.bluesky;
  if (!creds?.handle || !creds?.app_password) {
    return makeError(
      "AUTH_FAILED",
      'Bluesky not configured. Run the "setup" tool with platform: "bluesky" and credentials: { handle, app_password }. App passwords come from https://bsky.app/settings/app-passwords.'
    );
  }

  if (input.thread && input.thread.length > 0) {
    const result = await postThreadToBluesky(input.thread, creds);
    if (!result.success) return result;
    return makeSuccess({
      posts: result.data.posts,
      thread_url: result.data.posts[0]?.url,
      count: result.data.posts.length,
    });
  }

  const result = await postToBluesky(input.text!, creds);
  if (!result.success) return result;
  return makeSuccess({
    url: result.data.url,
    uri: result.data.uri,
  });
}

/** Zod schema for the `mastodon_post` tool input. */
export const mastodonPostSchema = z.object({
  text: z.string().optional().describe("Single post text. Mutually exclusive with `thread`."),
  thread: z.array(z.string()).optional().describe("Array of posts to chain as a reply thread."),
  max_length: z.number().int().positive().optional().describe("Override the default 500-character limit if your instance allows longer posts."),
});

/**
 * Post directly to a Mastodon instance.
 *
 * Free tool — posting is an API call with no LLM inference. Requires
 * `social.mastodon.{instance_url, access_token}` in config; tokens are
 * created at `https://<instance>/settings/applications` with the
 * `write:statuses` scope.
 */
export async function handleMastodonPost(
  input: z.infer<typeof mastodonPostSchema>
) {
  if (!input.text && (!input.thread || input.thread.length === 0)) {
    return makeError("VALIDATION_ERROR", "Provide either `text` or `thread`");
  }
  if (input.text && input.thread && input.thread.length > 0) {
    return makeError("VALIDATION_ERROR", "Provide either `text` or `thread`, not both");
  }

  const config = readConfig();
  const creds = config.social?.mastodon;
  if (!creds?.instance_url || !creds?.access_token) {
    return makeError(
      "AUTH_FAILED",
      'Mastodon not configured. Run the "setup" tool with platform: "mastodon" and credentials: { instance_url, access_token }. Create an application at https://<your-instance>/settings/applications with the write:statuses scope.'
    );
  }

  const options = input.max_length ? { maxLength: input.max_length } : undefined;

  if (input.thread && input.thread.length > 0) {
    const result = await postThreadToMastodon(input.thread, creds, options);
    if (!result.success) return result;
    return makeSuccess({
      posts: result.data.posts,
      thread_url: result.data.posts[0]?.url,
      count: result.data.posts.length,
    });
  }

  const result = await postToMastodon(input.text!, creds, options);
  if (!result.success) return result;
  return makeSuccess({
    url: result.data.url,
    id: result.data.id,
  });
}

// ── Bluesky listening + reply tools ────────────────────────────────────────

/** Zod schema for the `bluesky_mentions` tool input. */
export const blueskyMentionsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().describe("Max notifications to return (default 50, max 100)."),
  cursor: z.string().optional().describe("Pagination cursor from a prior response."),
  reasons: z.array(z.string()).optional().describe('Filter by notification reason. Default: ["mention","reply"]. Other valid: like, repost, follow, quote.'),
});

/**
 * List notifications addressed to the configured Bluesky account. Filtered
 * to mentions and replies by default — the two signals that call for an
 * engagement response.
 */
export async function handleBlueskyMentions(
  input: z.infer<typeof blueskyMentionsSchema>
) {
  const config = readConfig();
  const creds = config.social?.bluesky;
  if (!creds?.handle || !creds?.app_password) {
    return makeError(
      "AUTH_FAILED",
      'Bluesky not configured. Run the "setup" tool with platform: "bluesky".'
    );
  }
  return listBlueskyMentions(creds, {
    limit: input.limit,
    cursor: input.cursor,
    reasons: input.reasons,
  });
}

/** Zod schema for the `bluesky_search` tool input. */
export const blueskySearchSchema = z.object({
  query: z.string().describe("Lucene-style search query. Examples: 'claude code', '\"MCP server\"', 'content publishing'."),
  limit: z.number().int().min(1).max(100).optional().describe("Max posts to return (default 25, max 100)."),
  cursor: z.string().optional(),
  sort: z.enum(["top", "latest"]).optional().describe("'latest' (default) for freshness, 'top' for engagement."),
  since: z.string().optional().describe("ISO date or datetime — only posts after this time."),
  mentions: z.string().optional().describe("Filter to posts that mention this handle."),
  author: z.string().optional().describe("Filter to posts by this handle."),
  lang: z.string().optional().describe("BCP-47 language code (e.g. 'en')."),
  tag: z.array(z.string()).optional().describe("Filter to posts with ALL of these hashtags (no # prefix)."),
});

/**
 * Search public Bluesky posts.
 *
 * Bluesky's public AppView blocks unauthenticated searchPosts (CDN-level
 * 403), so this requires the same credentials used for posting. Results
 * themselves are still public — auth is just Bluesky's rate-limit gate.
 */
export async function handleBlueskySearch(
  input: z.infer<typeof blueskySearchSchema>
) {
  const config = readConfig();
  const creds = config.social?.bluesky;
  if (!creds?.handle || !creds?.app_password) {
    return makeError(
      "AUTH_FAILED",
      'Bluesky search requires authentication (Bluesky blocks unauthenticated search). Run the "setup" tool with platform: "bluesky".'
    );
  }
  return searchBlueskyPosts(input.query, creds, {
    limit: input.limit,
    cursor: input.cursor,
    sort: input.sort,
    since: input.since,
    mentions: input.mentions,
    author: input.author,
    lang: input.lang,
    tag: input.tag,
  });
}

/** Zod schema for the `bluesky_thread` tool input. */
export const blueskyThreadSchema = z.object({
  uri: z.string().describe("AT-URI of the post to fetch context for (e.g. at://did:plc:.../app.bsky.feed.post/xyz)."),
  depth: z.number().int().min(0).max(1000).optional().describe("How many reply levels below to include (default 6)."),
  parent_height: z.number().int().min(0).max(1000).optional().describe("How many parent levels above to include (default 80)."),
});

/**
 * Fetch the full conversation around a post so a reply can be drafted in
 * context. Unauthenticated.
 */
export async function handleBlueskyThread(
  input: z.infer<typeof blueskyThreadSchema>
) {
  return getBlueskyThread(input.uri, {
    depth: input.depth,
    parentHeight: input.parent_height,
  });
}

/** Zod schema for the `bluesky_reply` tool input. */
export const blueskyReplySchema = z.object({
  parent_uri: z.string().describe("AT-URI of the post being replied to."),
  text: z.string().optional().describe("Single reply text (<= 300 chars). Mutually exclusive with `thread`."),
  thread: z.array(z.string()).optional().describe("Chain of replies — first reply points at parent_uri, subsequent posts chain off the prior reply."),
});

/**
 * Reply to an existing Bluesky post (single reply or chained thread).
 * Looks up the parent's cid + thread root automatically.
 */
export async function handleBlueskyReply(
  input: z.infer<typeof blueskyReplySchema>
) {
  if (!input.text && (!input.thread || input.thread.length === 0)) {
    return makeError("VALIDATION_ERROR", "Provide either `text` or `thread`");
  }
  if (input.text && input.thread && input.thread.length > 0) {
    return makeError("VALIDATION_ERROR", "Provide either `text` or `thread`, not both");
  }

  const config = readConfig();
  const creds = config.social?.bluesky;
  if (!creds?.handle || !creds?.app_password) {
    return makeError(
      "AUTH_FAILED",
      'Bluesky not configured. Run the "setup" tool with platform: "bluesky".'
    );
  }

  const payload = input.thread && input.thread.length > 0 ? input.thread : input.text!;
  const result = await replyToBluesky(input.parent_uri, payload, creds);
  if (!result.success) return result;
  return makeSuccess({
    posts: result.data.posts,
    count: result.data.posts.length,
    url: result.data.posts[0]?.url,
  });
}

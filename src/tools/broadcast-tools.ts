import { z } from "zod";
import { readConfig } from "../config.js";
import { postToBluesky, postThreadToBluesky } from "../broadcast/bluesky.js";
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

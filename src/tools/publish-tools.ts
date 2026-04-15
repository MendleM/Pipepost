import { z } from "zod";
import { publishToDevto, listDevtoPosts } from "../publish/devto.js";
import { publishToGhost, listGhostPosts } from "../publish/ghost.js";
import { publishToHashnode, listHashnodePosts } from "../publish/hashnode.js";
import { publishToWordpress, listWordpressPosts } from "../publish/wordpress.js";
import { publishToMedium } from "../publish/medium.js";
import { readConfig } from "../config.js";
import { hasCredits, useCredit, addCredits } from "../credits.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";
import {
  validateRequired,
  validatePlatform,
  validateStringLength,
  validateTags,
  validateUrl,
} from "../validate.js";

/** Zod schema for the `publish` tool input. */
export const publishSchema = z.object({
  platform: z.string().describe("Publishing platform: devto, ghost, hashnode, wordpress, medium"),
  title: z.string().describe("Article title"),
  content: z.string().describe("Article content in markdown"),
  tags: z.array(z.string()).optional().describe("Tags for the article"),
  status: z.enum(["draft", "published"]).optional().default("draft").describe("Publish status"),
  featured_image_url: z.string().optional().describe("Featured image URL"),
  canonical_url: z.string().optional().describe("Canonical URL for cross-posting"),
  series: z.string().optional().describe("Series name (supported on Dev.to and Hashnode)"),
});

/**
 * Shared platform dispatch logic. Validates inputs, reads config, and routes
 * to the correct platform publisher. Used by both handlePublish (with credits)
 * and cross-publish (single credit for all platforms).
 */
async function dispatchPublish(input: z.infer<typeof publishSchema>): Promise<ToolResult> {
  const errors = [
    validateRequired(input.title, "title"),
    validateRequired(input.content, "content"),
    validatePlatform(input.platform),
    validateStringLength(input.title, "title", 300),
    validateTags(input.tags),
    input.canonical_url ? validateUrl(input.canonical_url) : null,
    input.featured_image_url ? validateUrl(input.featured_image_url) : null,
  ].filter(Boolean);

  if (errors.length > 0) {
    return makeError("VALIDATION_ERROR", errors.join("; "));
  }

  const content = input.content;
  const config = readConfig();

  if (input.platform === "devto") {
    const apiKey = config.platforms?.devto?.api_key;
    if (!apiKey) {
      return makeError("AUTH_FAILED", 'Dev.to API key not configured. Run the "setup" tool with platform: "devto".');
    }
    return publishToDevto(
      {
        title: input.title,
        content,
        tags: input.tags,
        status: input.status,
        canonical_url: input.canonical_url,
        featured_image_url: input.featured_image_url,
        series: input.series,
      },
      apiKey
    );
  }

  if (input.platform === "ghost") {
    const ghostConfig = config.platforms?.ghost;
    if (!ghostConfig?.url || !ghostConfig?.admin_key) {
      return makeError("AUTH_FAILED", 'Ghost not configured. Run the "setup" tool with platform: "ghost".');
    }
    return publishToGhost(
      { title: input.title, content, tags: input.tags, status: input.status, canonical_url: input.canonical_url, featured_image_url: input.featured_image_url },
      ghostConfig
    );
  }

  if (input.platform === "hashnode") {
    const hnConfig = config.platforms?.hashnode;
    if (!hnConfig?.token || !hnConfig?.publication_id) {
      return makeError("AUTH_FAILED", 'Hashnode not configured. Run the "setup" tool with platform: "hashnode".');
    }
    return publishToHashnode(
      { title: input.title, content, tags: input.tags, canonical_url: input.canonical_url, featured_image_url: input.featured_image_url, series: input.series },
      hnConfig
    );
  }

  if (input.platform === "wordpress") {
    const wpConfig = config.platforms?.wordpress;
    if (!wpConfig?.url || !wpConfig?.username || !wpConfig?.app_password) {
      return makeError("AUTH_FAILED", 'WordPress not configured. Run the "setup" tool with platform: "wordpress".');
    }
    const wpResult = await publishToWordpress(
      { title: input.title, content, tags: input.tags, status: input.status, canonical_url: input.canonical_url },
      wpConfig
    );
    if (wpResult.success && input.featured_image_url) {
      return makeSuccess({
        ...wpResult.data,
        note: "WordPress featured images require manual upload via the admin dashboard. The featured_image_url was not applied.",
      });
    }
    return wpResult;
  }

  if (input.platform === "medium") {
    const medToken = config.platforms?.medium?.token;
    if (!medToken) {
      return makeError("AUTH_FAILED", 'Medium not configured. Run the "setup" tool with platform: "medium".');
    }
    return publishToMedium(
      { title: input.title, content, tags: input.tags, status: input.status, canonical_url: input.canonical_url, featured_image_url: input.featured_image_url },
      medToken
    );
  }

  return makeError("PLATFORM_ERROR", `Platform ${input.platform} is not supported`);
}

/**
 * Publish an article to a single platform.
 *
 * Consumes one credit upfront and refunds it if the publish fails.
 * Validates inputs, resolves platform credentials from config, and
 * delegates to the appropriate platform client.
 */
export async function handlePublish(input: z.infer<typeof publishSchema>) {
  // Check credits
  const credit = useCredit();
  if (!credit.success) {
    return makeError("PUBLISH_LIMIT", "No credits remaining. Purchase more at pipepost.dev or wait for monthly free credits to reset.");
  }

  const result = await dispatchPublish(input);

  // Refund the credit if the publish failed — the user shouldn't pay for a failed attempt.
  if (!result.success) {
    addCredits(1);
    return makeError(result.error.code, result.error.message, {
      platform: result.error.platform,
      retryable: result.error.retryable,
    });
  }

  return result;
}

/** Zod schema for the `list_posts` tool input. */
export const listPostsSchema = z.object({
  platform: z.string().describe("Platform to list posts from"),
  status: z.enum(["draft", "published", "all"]).optional().default("all"),
  limit: z.number().optional().default(30),
});

/** List recent posts from a platform. Medium does not support listing. */
export async function handleListPosts(input: z.infer<typeof listPostsSchema>) {
  const platformErr = validatePlatform(input.platform);
  if (platformErr) return makeError("VALIDATION_ERROR", platformErr);

  const config = readConfig();

  if (input.platform === "devto") {
    const apiKey = config.platforms?.devto?.api_key;
    if (!apiKey) {
      return makeError("AUTH_FAILED", "Dev.to API key not configured");
    }
    return listDevtoPosts(apiKey, 1, input.limit);
  }

  if (input.platform === "ghost") {
    const ghostConfig = config.platforms?.ghost;
    if (!ghostConfig?.url || !ghostConfig?.admin_key) {
      return makeError("AUTH_FAILED", "Ghost not configured");
    }
    return listGhostPosts(ghostConfig, 1, input.limit);
  }

  if (input.platform === "hashnode") {
    const hnConfig = config.platforms?.hashnode;
    if (!hnConfig?.token || !hnConfig?.publication_id) {
      return makeError("AUTH_FAILED", "Hashnode not configured");
    }
    return listHashnodePosts(hnConfig, input.limit);
  }

  if (input.platform === "wordpress") {
    const wpConfig = config.platforms?.wordpress;
    if (!wpConfig?.url || !wpConfig?.username || !wpConfig?.app_password) {
      return makeError("AUTH_FAILED", "WordPress not configured");
    }
    return listWordpressPosts(wpConfig, 1, input.limit);
  }

  if (input.platform === "medium") {
    return makeError("VALIDATION_ERROR", "Medium API does not support listing posts.");
  }

  return makeError("PLATFORM_ERROR", `Platform ${input.platform} does not support listing posts`);
}

// ── Cross-publish: publish to multiple platforms in one call ──

/** Zod schema for the `cross_publish` tool input. */
export const crossPublishSchema = z.object({
  platforms: z.array(z.string()).describe("Platforms to publish to: devto, ghost, hashnode, wordpress, medium"),
  title: z.string().describe("Article title"),
  content: z.string().describe("Article content in markdown"),
  tags: z.array(z.string()).optional().describe("Tags for the article"),
  status: z.enum(["draft", "published"]).optional().default("draft").describe("Publish status"),
  featured_image_url: z.string().optional().describe("Featured image URL"),
  canonical_url: z.string().optional().describe("Canonical URL for cross-posting"),
  series: z.string().optional().describe("Series name (supported on Dev.to and Hashnode)"),
  primary_platform: z.string().optional().describe("Platform to treat as canonical source. Its published URL becomes the canonical_url for all other platforms. Defaults to the first platform in the list."),
});

/**
 * Publish to multiple platforms in one call, consuming only a single credit.
 *
 * The first platform (or `primary_platform` if specified) is published first
 * and its URL becomes the `canonical_url` for all subsequent platforms. This
 * automatic canonical-URL wiring prevents duplicate-content SEO penalties when
 * cross-posting. A user-provided `canonical_url` is never overridden.
 *
 * Each platform publish is attempted independently; partial failures are
 * reported in the results array. If all platforms fail, the credit is refunded.
 */
export async function handleCrossPublish(input: z.infer<typeof crossPublishSchema>) {
  if (!input.platforms.length) {
    return makeError("VALIDATION_ERROR", "At least one platform is required");
  }

  // Check credits upfront — 1 credit for the entire cross-publish
  const credit = useCredit();
  if (!credit.success) {
    return makeError("PUBLISH_LIMIT", "No credits remaining. Purchase more at pipepost.dev or wait for monthly free credits to reset.");
  }

  // Determine platform ordering: primary platform goes first so we can
  // capture its URL for canonical wiring.
  const primaryPlatform = input.primary_platform || input.platforms[0];
  const orderedPlatforms = input.platforms.includes(primaryPlatform)
    ? [primaryPlatform, ...input.platforms.filter((p) => p !== primaryPlatform)]
    : input.platforms; // primary_platform not in list — fall back to original order

  const results: { platform: string; success: boolean; url?: string; error?: string; canonical_source?: boolean }[] = [];
  let canonicalUrl: string | undefined = input.canonical_url;
  let canonicalSourcePlatform: string | undefined;

  for (const platform of orderedPlatforms) {
    const result = await dispatchPublish({
      ...input,
      platform,
      // For subsequent platforms, auto-set canonical_url to the primary's URL
      // only when the user hasn't provided their own canonical_url.
      canonical_url: canonicalUrl,
    });

    if (result.success) {
      const data = result.data as { url?: string };
      const isCanonicalSource = !canonicalUrl && data.url;
      results.push({ platform, success: true, url: data.url, ...(isCanonicalSource ? { canonical_source: true } : {}) });

      // After the first successful publish, capture the URL for subsequent platforms.
      if (!canonicalUrl && data.url) {
        canonicalUrl = data.url;
        canonicalSourcePlatform = platform;
      }
    } else {
      results.push({ platform, success: false, error: result.error.message });

      // If the primary platform failed, subsequent platforms won't get
      // auto-wired canonical URLs — but they'll still publish normally.
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  // Refund the credit if every platform failed — the user got no value.
  if (succeeded === 0) {
    addCredits(1);
    return makeSuccess({
      summary: `All ${failed} platform(s) failed. Credit was refunded due to publish failure.`,
      results,
    });
  }

  const canonicalNote = canonicalSourcePlatform
    ? ` Canonical URL sourced from ${canonicalSourcePlatform}.`
    : input.canonical_url
      ? " User-provided canonical URL applied to all platforms."
      : "";

  return makeSuccess({
    summary: `Published to ${succeeded}/${results.length} platforms${failed > 0 ? ` (${failed} failed)` : ""}.${canonicalNote}`,
    results,
  });
}

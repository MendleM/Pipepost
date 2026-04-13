import { z } from "zod";
import { publishToDevto, listDevtoPosts } from "../publish/devto.js";
import { appendBadge } from "../publish/badge.js";
import { readConfig } from "../config.js";
import { checkTier, canPublish, recordPublish } from "../tier.js";
import { makeError } from "../errors.js";
import {
  validateRequired,
  validatePlatform,
  validateStringLength,
  validateTags,
  validateUrl,
} from "../validate.js";

export const publishSchema = z.object({
  platform: z.string().describe("Publishing platform: devto, ghost, hashnode, wordpress, medium"),
  title: z.string().describe("Article title"),
  content: z.string().describe("Article content in markdown"),
  tags: z.array(z.string()).optional().describe("Tags for the article"),
  status: z.enum(["draft", "published"]).optional().default("draft").describe("Publish status"),
  featured_image_url: z.string().optional().describe("Featured image URL"),
  canonical_url: z.string().optional().describe("Canonical URL for cross-posting"),
});

export async function handlePublish(input: z.infer<typeof publishSchema>) {
  // Validate inputs
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

  // Check tier for non-devto platforms
  const tier = await checkTier();
  if (input.platform !== "devto" && tier !== "pro") {
    return makeError("TIER_REQUIRED", `Publishing to ${input.platform} requires Pro tier. Free tier supports Dev.to only.`);
  }

  // Check publish limit
  const limit = await canPublish();
  if (!limit.allowed) {
    return makeError("PUBLISH_LIMIT", `Free tier limit reached (3/month). Upgrade to Pro for unlimited publishing.`);
  }

  // Append badge on free tier
  let content = input.content;
  if (tier === "free") {
    content = appendBadge(content);
  }

  // Get platform credentials
  const config = readConfig();

  if (input.platform === "devto") {
    const apiKey = config.platforms?.devto?.api_key;
    if (!apiKey) {
      return makeError("AUTH_FAILED", 'Dev.to API key not configured. Run the "setup" tool with platform: "devto".');
    }

    const result = await publishToDevto(
      {
        title: input.title,
        content,
        tags: input.tags,
        status: input.status,
        canonical_url: input.canonical_url,
      },
      apiKey
    );

    if (result.success) {
      recordPublish();
    }

    return result;
  }

  // Other platforms will be added in Phase 2
  return makeError("PLATFORM_ERROR", `Platform ${input.platform} is not yet implemented`);
}

export const listPostsSchema = z.object({
  platform: z.string().describe("Platform to list posts from"),
  status: z.enum(["draft", "published", "all"]).optional().default("all"),
  limit: z.number().optional().default(30),
});

export async function handleListPosts(input: z.infer<typeof listPostsSchema>) {
  const platformErr = validatePlatform(input.platform);
  if (platformErr) return makeError("VALIDATION_ERROR", platformErr);

  const tier = await checkTier();
  if (tier !== "pro") return makeError("TIER_REQUIRED", "Listing posts requires Pro tier");

  const config = readConfig();

  if (input.platform === "devto") {
    const apiKey = config.platforms?.devto?.api_key;
    if (!apiKey) {
      return makeError("AUTH_FAILED", "Dev.to API key not configured");
    }
    return listDevtoPosts(apiKey, 1, input.limit);
  }

  return makeError("PLATFORM_ERROR", `Platform ${input.platform} is not yet implemented`);
}

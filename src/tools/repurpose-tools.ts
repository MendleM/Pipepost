import { z } from "zod";
import { repurposeContent } from "../repurpose/index.js";
import type { RepurposePlatform } from "../repurpose/types.js";
import { hasCredits } from "../credits.js";
import { makeError, makeSuccess } from "../errors.js";
import { validateRequired } from "../validate.js";

const VALID_REPURPOSE_PLATFORMS: RepurposePlatform[] = [
  "twitter", "linkedin", "reddit", "hackernews", "bluesky", "newsletter",
];

/** Zod schema for the `repurpose` tool input. */
export const repurposeSchema = z.object({
  content: z.string().describe("The full markdown article to repurpose"),
  title: z.string().describe("The article title"),
  url: z.string().optional().describe("The published article URL for links and CTAs"),
  platforms: z
    .array(z.string())
    .describe("Target platforms: twitter, linkedin, reddit, hackernews, bluesky, newsletter"),
});

/**
 * Repurpose a long-form article into platform-specific content.
 *
 * Parses markdown structure and generates tailored output for each requested
 * platform (Twitter thread, LinkedIn post, Reddit post, etc.). Requires credits.
 */
export async function handleRepurpose(
  input: z.infer<typeof repurposeSchema>
) {
  if (!hasCredits()) {
    return makeError("PUBLISH_LIMIT", "Purchase credits at pipepost.dev to use this tool");
  }

  const contentErr = validateRequired(input.content, "content");
  if (contentErr) return makeError("VALIDATION_ERROR", contentErr);

  const titleErr = validateRequired(input.title, "title");
  if (titleErr) return makeError("VALIDATION_ERROR", titleErr);

  if (!input.platforms || input.platforms.length === 0) {
    return makeError("VALIDATION_ERROR", "At least one platform is required");
  }

  const validPlatforms = input.platforms.filter(
    (p): p is RepurposePlatform => VALID_REPURPOSE_PLATFORMS.includes(p as RepurposePlatform)
  );

  if (validPlatforms.length === 0) {
    return makeError("VALIDATION_ERROR", `No valid platforms. Valid: ${VALID_REPURPOSE_PLATFORMS.join(", ")}`);
  }

  const results = repurposeContent({
    content: input.content,
    title: input.title,
    url: input.url,
    platforms: validPlatforms,
  });

  return makeSuccess({
    platforms_generated: results.length,
    results,
  });
}

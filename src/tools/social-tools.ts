import { z } from "zod";
import { generateSocialPosts } from "../social/templates.js";
import { repurposeContent } from "../repurpose/index.js";
import type { RepurposePlatform } from "../repurpose/types.js";
import { hasCredits } from "../credits.js";
import { makeError, makeSuccess } from "../errors.js";

/** Zod schema for the `generate_social_posts` tool input. */
export const generateSocialPostsSchema = z.object({
  content: z.string().optional().describe("Full article markdown content for rich generation"),
  title: z.string().optional().describe("Article title (used if content not provided)"),
  summary: z.string().optional().describe("Article summary (used if content not provided)"),
  url: z.string().optional().describe("Article URL for links and CTAs"),
  platforms: z.array(z.string()).describe("Platforms: twitter, linkedin, reddit, bluesky"),
});

const SOCIAL_TO_REPURPOSE: Record<string, RepurposePlatform> = {
  twitter: "twitter",
  linkedin: "linkedin",
  reddit: "reddit",
  bluesky: "bluesky",
};

/** Generate platform-optimized social media posts for an article. Requires credits. */
export async function handleGenerateSocialPosts(
  input: z.infer<typeof generateSocialPostsSchema>
) {
  if (!hasCredits()) {
    return makeError("PUBLISH_LIMIT", "Purchase credits at pipepost.dev to use this tool");
  }

  if (!input.content && !input.title) {
    return makeError("VALIDATION_ERROR", "Either content or title is required");
  }

  if (!input.platforms || input.platforms.length === 0) {
    return makeError("VALIDATION_ERROR", "At least one platform is required");
  }

  // Rich path: full markdown content provided — use repurpose generators
  if (input.content) {
    const title = input.title || input.content.split("\n")[0].replace(/^#+\s*/, "") || "Untitled";

    const validPlatforms = input.platforms
      .filter((p) => p in SOCIAL_TO_REPURPOSE)
      .map((p) => SOCIAL_TO_REPURPOSE[p]);

    if (validPlatforms.length === 0) {
      return makeError("VALIDATION_ERROR", "No valid platforms. Valid: twitter, linkedin, reddit, bluesky");
    }

    const results = repurposeContent({
      content: input.content,
      title,
      url: input.url,
      platforms: validPlatforms,
    });

    // Normalize output to match SocialPost shape for consistency
    const posts = results.map((r) => {
      let content: string;
      if ("tweets" in r.content) {
        content = r.content.tweets.join("\n\n---\n\n");
      } else if ("body" in r.content) {
        content = `# ${r.content.title}\n\n${r.content.body}`;
      } else if ("content" in r.content) {
        content = (r.content as { content: string }).content;
      } else {
        // HackerNewsPost or other title-only formats
        content = (r.content as { title: string }).title;
      }
      return {
        platform: r.platform,
        content,
        char_count: content.length,
        ...(("tweets" in r.content) && { thread: r.content.tweets }),
        ...(("suggestedSubreddits" in r.content) && { suggested_subreddits: r.content.suggestedSubreddits }),
      };
    });

    return makeSuccess({ posts });
  }

  // Legacy path: title + summary (no full content)
  const posts = generateSocialPosts(
    { title: input.title!, summary: input.summary ?? "", url: input.url ?? "" },
    input.platforms
  );

  return makeSuccess({ posts });
}

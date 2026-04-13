import type { SocialPost, SocialArticleInput } from "./types.js";
import { generateLinkedInPost } from "./linkedin.js";

type SocialPlatform = "twitter" | "reddit" | "bluesky" | "linkedin";

const GENERATORS: Record<SocialPlatform, (input: SocialArticleInput) => string> = {
  twitter(input) {
    // Create a punchy tweet with the title and a hook from the summary
    const hook = input.summary.length > 120
      ? input.summary.slice(0, 117) + "..."
      : input.summary;
    const body = `${input.title}\n\n${hook}\n\n${input.url}`;
    // Trim to 280 if needed
    if (body.length <= 280) return body;
    const maxHook = 280 - input.title.length - input.url.length - 6; // 6 for \n\n x3
    const trimmedHook = maxHook > 20
      ? input.summary.slice(0, maxHook - 3) + "..."
      : "";
    return trimmedHook
      ? `${input.title}\n\n${trimmedHook}\n\n${input.url}`
      : `${input.title.length > 280 - input.url.length - 4 ? input.title.slice(0, 280 - input.url.length - 7) + "..." : input.title}\n\n${input.url}`;
  },

  reddit(input) {
    // Reddit-style: conversational, longer, encourages discussion
    return [
      `# ${input.title}`,
      "",
      input.summary,
      "",
      `Read the full post: ${input.url}`,
      "",
      "---",
      "",
      "Happy to answer questions or hear your thoughts.",
    ].join("\n");
  },

  bluesky(input) {
    // Bluesky: clean, concise, 300 char limit
    const hook = input.summary.length > 140
      ? input.summary.slice(0, 137) + "..."
      : input.summary;
    const body = `${input.title}\n\n${hook}\n\n${input.url}`;
    if (body.length <= 300) return body;
    const maxHook = 300 - input.title.length - input.url.length - 6;
    const trimmedHook = maxHook > 20
      ? input.summary.slice(0, maxHook - 3) + "..."
      : "";
    return trimmedHook
      ? `${input.title}\n\n${trimmedHook}\n\n${input.url}`
      : `${input.title.length > 300 - input.url.length - 4 ? input.title.slice(0, 300 - input.url.length - 7) + "..." : input.title}\n\n${input.url}`;
  },

  linkedin(input) {
    return generateLinkedInPost(input);
  },
};

const VALID_PLATFORMS = new Set<string>(["twitter", "reddit", "bluesky", "linkedin"]);

/**
 * Generate platform-optimized social media posts for an article.
 *
 * Ignores unrecognized platform names. Each returned post includes a
 * character count for easy limit checking.
 */
export function generateSocialPosts(
  input: SocialArticleInput,
  platforms: string[]
): SocialPost[] {
  return platforms
    .filter((p) => VALID_PLATFORMS.has(p))
    .map((platform) => {
      const generator = GENERATORS[platform as SocialPlatform];
      const content = generator(input);
      return {
        platform,
        content,
        char_count: content.length,
      };
    });
}

import { parseMarkdown } from "./parse.js";
import {
  generateTwitterThread,
  generateLinkedInPost,
  generateRedditPost,
  generateHackerNewsPost,
  generateBlueskyPost,
  generateNewsletter,
} from "./generators.js";
import type { RepurposePlatform, RepurposeInput, RepurposeResult } from "./types.js";

const VALID_PLATFORMS = new Set<RepurposePlatform>([
  "twitter",
  "linkedin",
  "reddit",
  "hackernews",
  "bluesky",
  "newsletter",
]);

/**
 * Repurpose an article into multiple platform-specific content pieces.
 *
 * Parses the markdown, then dispatches to per-platform generators.
 * Unrecognized platform names are silently skipped.
 */
export function repurposeContent(input: RepurposeInput): RepurposeResult[] {
  const parsed = parseMarkdown(input.content);
  const results: RepurposeResult[] = [];

  for (const platform of input.platforms) {
    if (!VALID_PLATFORMS.has(platform)) continue;

    switch (platform) {
      case "twitter":
        results.push({ platform, content: generateTwitterThread(input.title, parsed, input.url) });
        break;
      case "linkedin":
        results.push({ platform, content: generateLinkedInPost(input.title, parsed, input.url) });
        break;
      case "reddit":
        results.push({ platform, content: generateRedditPost(input.title, parsed, input.url) });
        break;
      case "hackernews":
        results.push({ platform, content: generateHackerNewsPost(input.title, parsed) });
        break;
      case "bluesky":
        results.push({ platform, content: generateBlueskyPost(input.title, parsed, input.url) });
        break;
      case "newsletter":
        results.push({ platform, content: generateNewsletter(input.title, parsed, input.url) });
        break;
    }
  }

  return results;
}

export { parseMarkdown } from "./parse.js";
export type { RepurposePlatform, RepurposeInput, RepurposeResult, ParsedContent } from "./types.js";

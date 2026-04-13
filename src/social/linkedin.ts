import type { SocialArticleInput } from "./types.js";

/**
 * Extract keywords from summary to generate hashtags.
 */
function extractHashtags(summary: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "and", "but", "or",
    "not", "no", "so", "if", "than", "that", "this", "it", "its", "my",
    "your", "our", "their", "his", "her", "what", "which", "who", "how",
    "when", "where", "why", "all", "each", "every", "both", "few", "more",
    "most", "some", "any", "about", "up", "out", "just", "also", "very",
  ]);

  const words = summary
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  // Count frequency
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([w]) => `#${w.charAt(0).toUpperCase()}${w.slice(1)}`);
}

/**
 * Generate a LinkedIn post from article input.
 *
 * Format rules:
 * - Hook line under 210 chars (LinkedIn "...see more" threshold)
 * - Aggressive line breaks after 1-2 sentences
 * - Professional but conversational tone
 * - 3-5 key takeaways
 * - Engagement question at the end
 * - 3-5 hashtags
 * - Total max 1,300 chars
 */
export function generateLinkedInPost(input: SocialArticleInput): string {
  const { title, summary, url } = input;

  // Build hook line — must be under 210 chars
  let hook = title;
  if (hook.length > 207) {
    hook = hook.slice(0, 204) + "...";
  }

  // Build takeaways from summary sentences
  const sentences = summary
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  const takeaways = sentences.slice(0, 4).map((s) => {
    const trimmed = s.trim();
    return `- ${trimmed}`;
  });

  // If we have fewer than 2 takeaways, just use the summary directly
  const body = takeaways.length >= 2
    ? takeaways.join("\n\n")
    : summary;

  const question = "What's your experience with this? I'd love to hear your thoughts.";

  const hashtags = extractHashtags(summary);
  const hashtagLine = hashtags.join(" ");

  // Assemble the post
  const parts = [
    hook,
    "",
    body,
    "",
    `Read more: ${url}`,
    "",
    question,
    "",
    hashtagLine,
  ];

  let post = parts.join("\n");

  // Enforce 1,300 char max
  if (post.length > 1300) {
    // Trim takeaways first
    const shortTakeaways = takeaways.slice(0, 2).join("\n\n");
    const shortParts = [
      hook,
      "",
      shortTakeaways,
      "",
      `Read more: ${url}`,
      "",
      question,
      "",
      hashtagLine,
    ];
    post = shortParts.join("\n");
  }

  // Final hard trim if still over
  if (post.length > 1300) {
    post = post.slice(0, 1297) + "...";
  }

  return post;
}

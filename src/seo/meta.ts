/** Generated HTML meta tags for SEO and social sharing. */
export interface MetaTags {
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  twitter_card: string;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const truncated = text.slice(0, max - 3).replace(/\s+\S*$/, "");
  return truncated + "...";
}

function extractFirstSentences(content: string, maxLen: number): string {
  // Strip markdown formatting
  const cleaned = content
    .replace(/^#+\s+.*$/gm, "")
    .replace(/[*_`\[\]()]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  let result = "";
  for (const sentence of sentences) {
    const candidate = result + sentence.trim();
    if (candidate.length > maxLen) break;
    result = candidate + " ";
  }
  return truncate(result.trim() || cleaned.slice(0, maxLen), maxLen);
}

/**
 * Generate meta tags from article title and content.
 *
 * Extracts the first sentences for the description. If `keyword` is
 * provided and not already in the title, it is prepended to the meta title.
 */
export function generateMeta(
  title: string,
  content: string,
  keyword?: string
): MetaTags {
  let metaTitle = truncate(title, 60);

  // If keyword provided and not in title, prepend it
  if (keyword && !metaTitle.toLowerCase().includes(keyword.toLowerCase())) {
    const candidate = `${keyword} — ${title}`;
    metaTitle = truncate(candidate, 60);
  }

  const metaDescription = extractFirstSentences(content, 155);

  return {
    meta_title: metaTitle,
    meta_description: metaDescription,
    og_title: truncate(title, 70),
    og_description: truncate(metaDescription, 200),
    twitter_card: "summary_large_image",
  };
}

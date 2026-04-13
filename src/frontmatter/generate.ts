/** Input parameters for frontmatter generation. */
export interface FrontmatterInput {
  title: string;
  content: string;
  format: "hugo" | "jekyll" | "astro" | "nextjs" | "devto" | "hashnode" | "ghost";
  tags?: string[];
  canonical_url?: string;
  featured_image?: string;
  author?: string;
  draft?: boolean;
}

/** Generated frontmatter string plus extracted metadata. */
export interface FrontmatterResult {
  frontmatter: string;
  meta: {
    description: string;
    reading_time_minutes: number;
    slug: string;
    tags: string[];
    word_count: number;
  };
}

/**
 * Strip markdown formatting from text.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")          // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")    // bold
    .replace(/\*(.+?)\*/g, "$1")        // italic
    .replace(/__(.+?)__/g, "$1")        // bold alt
    .replace(/_(.+?)_/g, "$1")          // italic alt
    .replace(/`(.+?)`/g, "$1")          // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/!\[.*?\]\(.+?\)/g, "")    // images
    .replace(/>\s+/g, "")               // blockquotes
    .replace(/[-*+]\s+/g, "")           // list markers
    .replace(/\d+\.\s+/g, "")           // numbered lists
    .replace(/```[\s\S]*?```/g, "")     // code blocks
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * Extract a description from the first paragraph of content.
 * Returns first 155 chars of first non-empty paragraph.
 */
export function extractDescription(content: string): string {
  const stripped = stripMarkdown(content);
  const paragraphs = stripped.split(/\n/).filter((p) => p.trim().length > 0);
  // Skip very short lines (likely headings) — prefer first paragraph with 40+ chars
  const meaningful = paragraphs.find((p) => p.trim().length >= 40) ?? paragraphs[0] ?? "";
  if (meaningful.length <= 155) return meaningful;
  return meaningful.slice(0, 152) + "...";
}

/**
 * Calculate reading time based on word count at 200 wpm.
 */
export function calculateReadingTime(content: string): number {
  const words = content.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Generate a URL-friendly slug from a title.
 */
export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Auto-extract tags from content based on common keywords.
 */
function autoExtractTags(content: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "have",
    "has", "had", "do", "does", "did", "will", "would", "could", "should",
    "may", "might", "can", "to", "of", "in", "for", "on", "with", "at",
    "by", "from", "as", "into", "through", "and", "but", "or", "not",
    "this", "that", "it", "its", "my", "your", "our", "their", "what",
    "which", "who", "how", "when", "where", "why", "all", "each", "both",
    "few", "more", "most", "some", "any", "about", "just", "also", "very",
    "than", "then", "so", "if", "no", "up", "out", "new", "one", "two",
  ]);

  const words = stripMarkdown(content)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

/**
 * Generate frontmatter for the given format.
 */
export function generateFrontmatter(input: FrontmatterInput): FrontmatterResult {
  const description = extractDescription(input.content);
  const wordCount = input.content.split(/\s+/).filter((w) => w.length > 0).length;
  const readingTime = calculateReadingTime(input.content);
  const slug = toSlug(input.title);
  const tags = input.tags && input.tags.length > 0 ? input.tags : autoExtractTags(input.content);
  const draft = input.draft ?? true;
  const today = new Date().toISOString().slice(0, 10);

  const meta = {
    description,
    reading_time_minutes: readingTime,
    slug,
    tags,
    word_count: wordCount,
  };

  let frontmatter: string;

  switch (input.format) {
    case "hugo":
      frontmatter = buildHugo(input, description, tags, today, draft);
      break;
    case "jekyll":
      frontmatter = buildJekyll(input, description, tags, today);
      break;
    case "astro":
      frontmatter = buildAstro(input, description, tags, today, draft);
      break;
    case "nextjs":
      frontmatter = buildNextjs(input, description);
      break;
    case "devto":
      frontmatter = buildDevto(input, description, tags, draft);
      break;
    case "hashnode":
      frontmatter = buildHashnode(input, description, tags, slug);
      break;
    case "ghost":
      frontmatter = buildGhost(input, description, tags);
      break;
  }

  return { frontmatter, meta };
}

function buildHugo(
  input: FrontmatterInput,
  description: string,
  tags: string[],
  today: string,
  draft: boolean
): string {
  const lines: string[] = ["---"];
  lines.push(`title: "${escYaml(input.title)}"`);
  lines.push(`date: ${today}T00:00:00Z`);
  lines.push(`draft: ${draft}`);
  lines.push(`tags: [${tags.map((t) => `"${escYaml(t)}"`).join(", ")}]`);
  lines.push(`description: "${escYaml(description)}"`);
  if (input.featured_image) {
    lines.push("cover:");
    lines.push(`  image: "${escYaml(input.featured_image)}"`);
    lines.push(`  alt: "${escYaml(input.title)}"`);
  }
  if (input.canonical_url) {
    lines.push(`canonicalURL: "${escYaml(input.canonical_url)}"`);
  }
  if (input.author) {
    lines.push(`author: "${escYaml(input.author)}"`);
  }
  lines.push("---");
  return lines.join("\n");
}

function buildJekyll(
  input: FrontmatterInput,
  description: string,
  tags: string[],
  today: string
): string {
  const lines: string[] = ["---"];
  lines.push("layout: post");
  lines.push(`title: "${escYaml(input.title)}"`);
  lines.push(`date: ${today}`);
  lines.push(`categories: [${tags.slice(0, 2).map((t) => `"${escYaml(t)}"`).join(", ")}]`);
  lines.push(`tags: [${tags.map((t) => `"${escYaml(t)}"`).join(", ")}]`);
  lines.push(`description: "${escYaml(description)}"`);
  if (input.featured_image) {
    lines.push(`image: "${escYaml(input.featured_image)}"`);
  }
  if (input.canonical_url) {
    lines.push(`canonical_url: "${escYaml(input.canonical_url)}"`);
  }
  if (input.author) {
    lines.push(`author: "${escYaml(input.author)}"`);
  }
  lines.push("---");
  return lines.join("\n");
}

function buildAstro(
  input: FrontmatterInput,
  description: string,
  tags: string[],
  today: string,
  draft: boolean
): string {
  const lines: string[] = ["---"];
  lines.push(`title: "${escYaml(input.title)}"`);
  lines.push(`pubDate: ${today}`);
  lines.push(`description: "${escYaml(description)}"`);
  lines.push(`tags: [${tags.map((t) => `"${escYaml(t)}"`).join(", ")}]`);
  if (input.featured_image) {
    lines.push(`heroImage: "${escYaml(input.featured_image)}"`);
  }
  lines.push(`draft: ${draft}`);
  if (input.canonical_url) {
    lines.push(`canonicalURL: "${escYaml(input.canonical_url)}"`);
  }
  if (input.author) {
    lines.push(`author: "${escYaml(input.author)}"`);
  }
  lines.push("---");
  return lines.join("\n");
}

function buildNextjs(
  input: FrontmatterInput,
  description: string
): string {
  const meta: Record<string, unknown> = {
    title: input.title,
    description,
  };
  if (input.featured_image) {
    meta.openGraph = { images: [input.featured_image] };
  }
  if (input.canonical_url) {
    meta.alternates = { canonical: input.canonical_url };
  }
  return `export const metadata = ${JSON.stringify(meta, null, 2)};`;
}

function buildDevto(
  input: FrontmatterInput,
  description: string,
  tags: string[],
  draft: boolean
): string {
  const lines: string[] = ["---"];
  lines.push(`title: "${escYaml(input.title)}"`);
  lines.push(`published: ${!draft}`);
  // Dev.to allows max 4 tags, comma-separated
  lines.push(`description: "${escYaml(description)}"`);
  lines.push(`tags: ${tags.slice(0, 4).join(", ")}`);
  if (input.canonical_url) {
    lines.push(`canonical_url: "${escYaml(input.canonical_url)}"`);
  }
  if (input.featured_image) {
    lines.push(`cover_image: "${escYaml(input.featured_image)}"`);
  }
  lines.push("---");
  return lines.join("\n");
}

function buildHashnode(
  input: FrontmatterInput,
  description: string,
  tags: string[],
  slug: string
): string {
  const lines: string[] = ["---"];
  lines.push(`title: "${escYaml(input.title)}"`);
  lines.push(`subtitle: "${escYaml(description)}"`);
  lines.push(`slug: "${slug}"`);
  lines.push(`tags: [${tags.map((t) => `"${escYaml(t)}"`).join(", ")}]`);
  if (input.featured_image) {
    lines.push(`cover: "${escYaml(input.featured_image)}"`);
  }
  if (input.canonical_url) {
    lines.push(`canonical: "${escYaml(input.canonical_url)}"`);
  }
  lines.push("---");
  return lines.join("\n");
}

function buildGhost(
  input: FrontmatterInput,
  description: string,
  tags: string[]
): string {
  const obj: Record<string, unknown> = {
    title: input.title,
    custom_excerpt: description,
    tags: tags.map((t) => ({ name: t })),
  };
  if (input.featured_image) {
    obj.feature_image = input.featured_image;
  }
  if (input.canonical_url) {
    obj.canonical_url = input.canonical_url;
  }
  return JSON.stringify(obj, null, 2);
}

/** Escape a string for safe inclusion in double-quoted YAML values. */
function escYaml(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

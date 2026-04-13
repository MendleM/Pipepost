import { z } from "zod";
import { generateFrontmatter } from "../frontmatter/generate.js";
import { makeError, makeSuccess } from "../errors.js";
import { validateRequired } from "../validate.js";

/** Zod schema for the `frontmatter` tool input. */
export const frontmatterSchema = z.object({
  title: z.string().describe("The article title"),
  content: z.string().describe("The article content — used to auto-extract description, reading time, tags"),
  format: z.enum(["hugo", "jekyll", "astro", "nextjs", "devto", "hashnode", "ghost"])
    .describe("Target frontmatter format"),
  tags: z.array(z.string()).optional().describe("Optional tags — auto-extracted from content if omitted"),
  canonical_url: z.string().optional().describe("Canonical URL for the article"),
  featured_image: z.string().optional().describe("Featured/cover image URL"),
  author: z.string().optional().describe("Author name"),
  draft: z.boolean().optional().default(true).describe("Whether the post is a draft (default: true)"),
});

/**
 * Generate frontmatter for a given static-site or CMS format.
 *
 * Auto-extracts description, reading time, slug, and tags from the article
 * content when not explicitly provided. Supports Hugo, Jekyll, Astro,
 * Next.js, Dev.to, Hashnode, and Ghost output formats.
 */
export async function handleFrontmatter(
  input: z.infer<typeof frontmatterSchema>
) {
  const titleErr = validateRequired(input.title, "title");
  if (titleErr) return makeError("VALIDATION_ERROR", titleErr);

  const contentErr = validateRequired(input.content, "content");
  if (contentErr) return makeError("VALIDATION_ERROR", contentErr);

  const result = generateFrontmatter(input);

  return makeSuccess(result);
}

/** Markdown badge appended to published content. */
export const BADGE_MARKDOWN = `\n\n---\n*Published with [Pipepost](https://pipepost.dev) — publish from your terminal.*`;

/**
 * Append the Pipepost badge to content. Idempotent: skips if the content
 * already contains a pipepost.dev link.
 */
export function appendBadge(content: string): string {
  if (content.toLowerCase().includes("pipepost.dev")) {
    return content;
  }
  return content + BADGE_MARKDOWN;
}

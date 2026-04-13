export const BADGE_MARKDOWN = `\n\n---\n*Published with [Pipepost](https://pipepost.dev) — publish from your terminal.*`;

export function appendBadge(content: string): string {
  if (content.toLowerCase().includes("pipepost.dev")) {
    return content;
  }
  return content + BADGE_MARKDOWN;
}

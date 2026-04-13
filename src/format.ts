/** Shared Markdown formatting utilities for MCP tool responses. */

/** Format a success header with status icon. */
export function successHeader(title: string): string {
  return `# \u2714 ${title}`;
}

/** Format an error header with status icon. */
export function errorHeader(title: string): string {
  return `# \u2718 ${title}`;
}

/** Format a key-value pair. */
export function field(label: string, value: string | number): string {
  return `**${label}:** ${value}`;
}

/** Format a markdown table from headers and rows. */
export function table(headers: string[], rows: (string | number)[][]): string {
  const headerRow = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const dataRows = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  return `${headerRow}\n${separator}\n${dataRows}`;
}

/** Format a section with a heading. */
export function section(title: string, content: string): string {
  return `## ${title}\n${content}`;
}

/** Format a stat with visual bar. */
export function statBar(value: number, max: number, width = 20): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return `${"\u2588".repeat(filled)}${"\u2591".repeat(empty)} ${value}/${max}`;
}

/** Format a horizontal rule. */
export function divider(): string {
  return "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";
}

/** Format a note/tip box. */
export function note(text: string): string {
  return `> ${text}`;
}

/** Format a list of items with check/cross icons. */
export function checklist(items: { label: string; ok: boolean }[]): string {
  return items.map((i) => `${i.ok ? "\u2714" : "\u2718"} ${i.label}`).join("\n");
}

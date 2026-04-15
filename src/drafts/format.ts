/**
 * Markdown response formatters for draft MCP tools.
 */

import {
  successHeader,
  field,
  table,
  divider,
  note,
} from "../format.js";

import type { Draft } from "./types.js";

// ── Helpers ─────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function statusLabel(status: string): string {
  const icons: Record<string, string> = {
    draft: "\u270f\ufe0f Draft",
    ready: "\u2705 Ready",
    published: "\u{1f680} Published",
  };
  return icons[status] ?? status;
}

// ── Save Draft ──────────────────────────────────────────────────────

export function formatSaveDraft(data: unknown): string {
  const d = data as Draft;
  return [
    successHeader("Draft Saved"),
    "",
    field("ID", `\`${d.id}\``),
    field("Title", d.title),
    field("Status", statusLabel(d.status)),
    field("Platforms", d.platforms.length > 0 ? d.platforms.join(", ") : "none"),
    field("Tags", d.tags.length > 0 ? d.tags.join(", ") : "none"),
    field("Updated", formatDate(d.updated_at)),
    "",
    note('Use `get_draft` with this ID to retrieve the full content later.'),
  ].join("\n");
}

// ── List Drafts ─────────────────────────────────────────────────────

export function formatListDrafts(data: unknown): string {
  const d = data as { drafts: Draft[]; total: number };

  if (d.drafts.length === 0) {
    return [
      successHeader("Drafts"),
      "",
      "No drafts found.",
      "",
      note('Use `save_draft` to create your first draft.'),
    ].join("\n");
  }

  const rows = d.drafts.map((draft) => [
    `\`${draft.id}\``,
    draft.title,
    statusLabel(draft.status),
    draft.platforms.length > 0 ? draft.platforms.join(", ") : "\u2014",
    formatDate(draft.updated_at),
  ]);

  return [
    successHeader(`${d.total} Draft${d.total !== 1 ? "s" : ""}`),
    "",
    table(["ID", "Title", "Status", "Platforms", "Updated"], rows),
    "",
    note('Use `get_draft` with an ID to retrieve full content.'),
  ].join("\n");
}

// ── Get Draft ───────────────────────────────────────────────────────

export function formatGetDraft(data: unknown): string {
  const d = data as Draft;

  return [
    successHeader(d.title),
    "",
    field("ID", `\`${d.id}\``),
    field("Status", statusLabel(d.status)),
    field("Platforms", d.platforms.length > 0 ? d.platforms.join(", ") : "none"),
    field("Tags", d.tags.length > 0 ? d.tags.join(", ") : "none"),
    field("Created", formatDate(d.created_at)),
    field("Updated", formatDate(d.updated_at)),
    "",
    divider(),
    "",
    d.content,
  ].join("\n");
}

// ── Delete Draft ────────────────────────────────────────────────────

export function formatDeleteDraft(data: unknown): string {
  const d = data as { id: string; deleted: boolean };
  return [
    successHeader("Draft Deleted"),
    "",
    field("ID", `\`${d.id}\``),
    "",
    note("This action cannot be undone."),
  ].join("\n");
}

/** Rich Markdown formatters for audit tool responses. */

import {
  successHeader,
  field,
  table,
  section,
  divider,
  note,
  checklist,
} from "../format.js";
import type { AuditResult } from "./checker.js";
import type { LinkCheckResult } from "./links.js";

// ── Content Audit formatter ─────────────────────────────────────────

export function formatContentAudit(data: unknown): string {
  const d = data as AuditResult & { note?: string };

  const errors = d.issues.filter((i) => i.severity === "error");
  const warnings = d.issues.filter((i) => i.severity === "warning");
  const infos = d.issues.filter((i) => i.severity === "info");

  const hasIssues = d.issues.length > 0;
  const title = hasIssues
    ? `Content Audit: ${d.issues.length} issue${d.issues.length !== 1 ? "s" : ""} found`
    : "Content Audit: All clear";

  const lines = [
    successHeader(title),
    "",
    field("Word count", d.word_count.toLocaleString()),
    field("Reading time", `${d.reading_time_minutes} min`),
  ];

  // Issues checklist
  if (errors.length > 0) {
    lines.push(
      "",
      section("Errors", errors.map((i) => `\u2718 ${i.message}`).join("\n"))
    );
  }

  if (warnings.length > 0) {
    lines.push(
      "",
      section("Warnings", warnings.map((i) => `\u26A0 ${i.message}`).join("\n"))
    );
  }

  if (infos.length > 0) {
    lines.push(
      "",
      section("Suggestions", infos.map((i) => `\u2192 ${i.message}`).join("\n"))
    );
  }

  if (!hasIssues) {
    lines.push("", "No issues found. Your content looks good!");
  }

  // Full analysis sections
  if (d.readability) {
    lines.push(
      "",
      divider(),
      "",
      section(
        "Readability",
        [
          field("Avg sentence length", `${d.readability.avg_sentence_length} words`),
          field("Avg word length", `${d.readability.avg_word_length} chars`),
          field("Passive voice", `${Math.round(d.readability.passive_voice_ratio * 100)}%`),
        ].join("\n")
      )
    );
  }

  if (d.structure_score !== null) {
    lines.push(
      "",
      section("Structure", field("Score", `${d.structure_score}/100`))
    );
  }

  if (d.heading_hierarchy_ok !== null) {
    lines.push(
      "",
      field("Heading hierarchy", d.heading_hierarchy_ok ? "\u2714 Correct" : "\u2718 Has gaps")
    );
  }

  if (d.tag_suggestions.length > 0) {
    lines.push(
      "",
      section("Suggested Tags", d.tag_suggestions.map((t) => `\`${t}\``).join(", "))
    );
  }

  if (d.note) {
    lines.push("", note(d.note));
  }

  return lines.join("\n");
}

// ── Link Check formatter ────────────────────────────────────────────

export function formatLinkCheck(data: unknown): string {
  const d = data as LinkCheckResult;

  if (d.total === 0) {
    return [
      successHeader("Link Check"),
      "",
      "No URLs found in the content.",
    ].join("\n");
  }

  const allOk = d.broken === 0 && d.timeout === 0 && d.error === 0;
  const title = allOk
    ? `Link Check: All ${d.total} links OK`
    : `Link Check: ${d.broken + d.timeout + d.error} problem${d.broken + d.timeout + d.error !== 1 ? "s" : ""} found`;

  const lines = [
    successHeader(title),
    "",
    section(
      "Summary",
      checklist([
        { label: `${d.ok} working (2xx)`, ok: true },
        ...(d.redirected > 0 ? [{ label: `${d.redirected} redirected (3xx)`, ok: true }] : []),
        ...(d.broken > 0 ? [{ label: `${d.broken} broken (4xx/5xx)`, ok: false }] : []),
        ...(d.timeout > 0 ? [{ label: `${d.timeout} timed out`, ok: false }] : []),
        ...(d.error > 0 ? [{ label: `${d.error} errors`, ok: false }] : []),
      ])
    ),
  ];

  // Detailed table for non-OK links
  const problemLinks = d.links.filter((l) => l.status !== "ok");
  if (problemLinks.length > 0) {
    lines.push(
      "",
      section(
        "Details",
        table(
          ["Status", "URL", "Info"],
          problemLinks.map((l) => {
            const statusIcon =
              l.status === "redirected" ? "\u2192" :
              l.status === "broken" ? "\u2718" :
              l.status === "timeout" ? "\u231B" : "\u26A0";
            return [
              `${statusIcon} ${l.status}`,
              l.url.length > 60 ? l.url.slice(0, 57) + "..." : l.url,
              l.message,
            ];
          })
        )
      )
    );
  }

  return lines.join("\n");
}

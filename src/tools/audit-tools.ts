import { z } from "zod";
import { auditContent } from "../audit/checker.js";
import { hasCredits } from "../credits.js";
import { makeError, makeSuccess } from "../errors.js";
import { validateRequired } from "../validate.js";

/** Zod schema for the `content_audit` tool input. */
export const contentAuditSchema = z.object({
  content: z.string().describe("The markdown content to audit"),
  full: z
    .boolean()
    .optional()
    .default(false)
    .describe("Run full analysis (requires credits). Includes readability, structure, tags, and heading hierarchy."),
});

/**
 * Audit markdown content for quality issues before publishing.
 * Basic checks are FREE. Full analysis requires credits.
 */
export async function handleContentAudit(input: z.infer<typeof contentAuditSchema>) {
  const contentErr = validateRequired(input.content, "content");
  if (contentErr) return makeError("VALIDATION_ERROR", contentErr);

  const wantFull = input.full ?? false;

  if (wantFull && !hasCredits()) {
    // Run basic only, with a note about credits
    const result = auditContent(input.content, false);
    return makeSuccess({
      ...result,
      note: "Purchase credits at pipepost.dev to unlock full analysis with readability, structure scoring, tag suggestions, and heading hierarchy checks",
    });
  }

  const result = auditContent(input.content, wantFull);
  return makeSuccess(result);
}

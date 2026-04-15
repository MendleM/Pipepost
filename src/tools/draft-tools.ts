import { z } from "zod";
import { saveDraft, listDrafts, getDraft, deleteDraft } from "../drafts/store.js";
import { makeError } from "../errors.js";
import { validateRequired, validateStringLength } from "../validate.js";

/** Zod schema for the `save_draft` tool input. */
export const saveDraftSchema = z.object({
  title: z.string().describe("Draft title"),
  content: z.string().describe("Draft content in markdown"),
  platforms: z.array(z.string()).optional().describe("Target platforms: devto, ghost, hashnode, wordpress, medium"),
  tags: z.array(z.string()).optional().describe("Tags for the draft"),
  status: z.enum(["draft", "ready", "published"]).optional().default("draft").describe("Draft status"),
});

/** Save content as a local draft. Free — no credit check. */
export async function handleSaveDraft(input: z.infer<typeof saveDraftSchema>) {
  const errors = [
    validateRequired(input.title, "title"),
    validateRequired(input.content, "content"),
    validateStringLength(input.title, "title", 300),
  ].filter(Boolean);

  if (errors.length > 0) {
    return makeError("VALIDATION_ERROR", errors.join("; "));
  }

  return saveDraft({
    title: input.title,
    content: input.content,
    platforms: input.platforms,
    tags: input.tags,
    status: input.status,
  });
}

/** Zod schema for the `list_drafts` tool input. */
export const listDraftsSchema = z.object({
  status: z.enum(["draft", "ready", "published"]).optional().describe("Filter by status"),
});

/** List all local drafts. Free — no credit check. */
export async function handleListDrafts(input: z.infer<typeof listDraftsSchema>) {
  return listDrafts(input.status ? { status: input.status } : undefined);
}

/** Zod schema for the `get_draft` tool input. */
export const getDraftSchema = z.object({
  id: z.string().describe("Draft ID to retrieve"),
});

/** Retrieve a single draft by ID. Free — no credit check. */
export async function handleGetDraft(input: z.infer<typeof getDraftSchema>) {
  const idErr = validateRequired(input.id, "id");
  if (idErr) return makeError("VALIDATION_ERROR", idErr);

  return getDraft(input.id);
}

/** Zod schema for the `delete_draft` tool input. */
export const deleteDraftSchema = z.object({
  id: z.string().describe("Draft ID to delete"),
});

/** Delete a draft by ID. Free — no credit check. */
export async function handleDeleteDraft(input: z.infer<typeof deleteDraftSchema>) {
  const idErr = validateRequired(input.id, "id");
  if (idErr) return makeError("VALIDATION_ERROR", idErr);

  return deleteDraft(input.id);
}

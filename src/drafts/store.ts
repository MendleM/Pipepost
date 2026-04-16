import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import { makeError, makeSuccess } from "../errors.js";
import type { Draft, DraftStatus } from "./types.js";

/** Returns the absolute path to the drafts directory (~/.pipepost/drafts/). */
export function getDraftsDir(): string {
  return path.join(os.homedir(), ".pipepost", "drafts");
}

/** Ensure the drafts directory exists. */
function ensureDir(): void {
  fs.mkdirSync(getDraftsDir(), { recursive: true });
}

/** Generate a short unique ID using crypto.randomUUID(). */
function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

// Module-level monotonic clock — ensures two saves in the same millisecond
// get strictly increasing timestamps so listDrafts sort order is deterministic.
let lastTimestampMs = 0;
function nowIsoMonotonic(): string {
  const t = Math.max(Date.now(), lastTimestampMs + 1);
  lastTimestampMs = t;
  return new Date(t).toISOString();
}

/** Save a new draft or update an existing one. */
export function saveDraft(input: {
  title: string;
  content: string;
  platforms?: string[];
  tags?: string[];
  status?: DraftStatus;
  id?: string;
}) {
  ensureDir();

  const now = nowIsoMonotonic();
  const id = input.id ?? generateId();
  const filePath = path.join(getDraftsDir(), `${id}.json`);

  // If updating, load existing draft to preserve created_at
  let created_at = now;
  if (input.id && fs.existsSync(filePath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Draft;
      created_at = existing.created_at;
    } catch {
      // Corrupted file — treat as new
    }
  }

  const draft: Draft = {
    id,
    title: input.title,
    content: input.content,
    platforms: input.platforms ?? [],
    tags: input.tags ?? [],
    status: input.status ?? "draft",
    created_at,
    updated_at: now,
  };

  fs.writeFileSync(filePath, JSON.stringify(draft, null, 2), "utf-8");
  return makeSuccess(draft);
}

/** List all drafts, sorted by updated_at descending. */
export function listDrafts(filter?: { status?: DraftStatus }) {
  ensureDir();

  const dir = getDraftsDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const drafts: Draft[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const draft = JSON.parse(raw) as Draft;
      if (filter?.status && draft.status !== filter.status) continue;
      drafts.push(draft);
    } catch {
      // Skip corrupted files
    }
  }

  drafts.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return makeSuccess({ drafts, total: drafts.length });
}

/** Retrieve a single draft by ID. */
export function getDraft(id: string) {
  ensureDir();

  const filePath = path.join(getDraftsDir(), `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return makeError("NOT_FOUND", `Draft "${id}" not found`);
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const draft = JSON.parse(raw) as Draft;
    return makeSuccess(draft);
  } catch {
    return makeError("PLATFORM_ERROR", `Failed to read draft "${id}"`);
  }
}

/** Delete a draft by ID. */
export function deleteDraft(id: string) {
  ensureDir();

  const filePath = path.join(getDraftsDir(), `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return makeError("NOT_FOUND", `Draft "${id}" not found`);
  }

  fs.unlinkSync(filePath);
  return makeSuccess({ id, deleted: true });
}

/** Update specific fields of an existing draft. */
export function updateDraft(
  id: string,
  updates: Partial<Pick<Draft, "title" | "content" | "platforms" | "tags" | "status">>
) {
  const existing = getDraft(id);
  if (!existing.success) return existing;

  const draft = existing.data as Draft;
  return saveDraft({
    id,
    title: updates.title ?? draft.title,
    content: updates.content ?? draft.content,
    platforms: updates.platforms ?? draft.platforms,
    tags: updates.tags ?? draft.tags,
    status: updates.status ?? draft.status,
  });
}

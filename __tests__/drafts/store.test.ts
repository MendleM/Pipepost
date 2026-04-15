import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Mock os.homedir to point to a temp directory
vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return { ...actual, homedir: vi.fn() };
});

const mockHomedir = vi.mocked(os.homedir);

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pipepost-test-"));
  mockHomedir.mockReturnValue(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

// Import after mock setup
import { saveDraft, listDrafts, getDraft, deleteDraft, updateDraft, getDraftsDir } from "../../src/drafts/store.js";

describe("saveDraft", () => {
  it("creates a new draft with generated ID", () => {
    const result = saveDraft({ title: "Test Post", content: "# Hello\n\nWorld" });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.id).toHaveLength(12);
    expect(result.data.title).toBe("Test Post");
    expect(result.data.content).toBe("# Hello\n\nWorld");
    expect(result.data.status).toBe("draft");
    expect(result.data.platforms).toEqual([]);
    expect(result.data.tags).toEqual([]);
    expect(result.data.created_at).toBeTruthy();
    expect(result.data.updated_at).toBeTruthy();
  });

  it("saves with platforms and tags", () => {
    const result = saveDraft({
      title: "Multi-platform",
      content: "Content here",
      platforms: ["devto", "hashnode"],
      tags: ["typescript", "mcp"],
      status: "ready",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.platforms).toEqual(["devto", "hashnode"]);
    expect(result.data.tags).toEqual(["typescript", "mcp"]);
    expect(result.data.status).toBe("ready");
  });

  it("writes JSON file to drafts directory", () => {
    const result = saveDraft({ title: "File Test", content: "body" });
    if (!result.success) return;

    const filePath = path.join(getDraftsDir(), `${result.data.id}.json`);
    expect(fs.existsSync(filePath)).toBe(true);

    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(raw.title).toBe("File Test");
  });

  it("preserves created_at when updating an existing draft", () => {
    const first = saveDraft({ title: "Original", content: "v1" });
    if (!first.success) return;

    const second = saveDraft({ id: first.data.id, title: "Updated", content: "v2" });
    if (!second.success) return;

    expect(second.data.id).toBe(first.data.id);
    expect(second.data.title).toBe("Updated");
    expect(second.data.created_at).toBe(first.data.created_at);
  });
});

describe("listDrafts", () => {
  it("returns empty list when no drafts exist", () => {
    const result = listDrafts();
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.drafts).toEqual([]);
    expect(result.data.total).toBe(0);
  });

  it("lists all drafts sorted by updated_at descending", () => {
    saveDraft({ title: "Older", content: "a" });
    saveDraft({ title: "Newer", content: "b" });

    const result = listDrafts();
    if (!result.success) return;

    expect(result.data.total).toBe(2);
    // Newer should come first (sorted by updated_at desc)
    expect(result.data.drafts[0].title).toBe("Newer");
    expect(result.data.drafts[1].title).toBe("Older");
  });

  it("filters by status", () => {
    saveDraft({ title: "Draft One", content: "a", status: "draft" });
    saveDraft({ title: "Ready One", content: "b", status: "ready" });

    const result = listDrafts({ status: "ready" });
    if (!result.success) return;

    expect(result.data.total).toBe(1);
    expect(result.data.drafts[0].title).toBe("Ready One");
  });
});

describe("getDraft", () => {
  it("retrieves an existing draft by ID", () => {
    const saved = saveDraft({ title: "Fetch Me", content: "body" });
    if (!saved.success) return;

    const result = getDraft(saved.data.id);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.title).toBe("Fetch Me");
    expect(result.data.id).toBe(saved.data.id);
  });

  it("returns NOT_FOUND for missing ID", () => {
    const result = getDraft("nonexistent");
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.code).toBe("NOT_FOUND");
  });
});

describe("deleteDraft", () => {
  it("deletes an existing draft", () => {
    const saved = saveDraft({ title: "Delete Me", content: "body" });
    if (!saved.success) return;

    const result = deleteDraft(saved.data.id);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.deleted).toBe(true);

    // Verify file is gone
    const filePath = path.join(getDraftsDir(), `${saved.data.id}.json`);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it("returns NOT_FOUND for missing ID", () => {
    const result = deleteDraft("nonexistent");
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.code).toBe("NOT_FOUND");
  });
});

describe("updateDraft", () => {
  it("updates specific fields of an existing draft", () => {
    const saved = saveDraft({ title: "Original", content: "v1", tags: ["old"] });
    if (!saved.success) return;

    const result = updateDraft(saved.data.id, { title: "Revised", tags: ["new"] });
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.title).toBe("Revised");
    expect(result.data.content).toBe("v1"); // unchanged
    expect(result.data.tags).toEqual(["new"]);
  });

  it("returns NOT_FOUND for missing ID", () => {
    const result = updateDraft("nonexistent", { title: "Nope" });
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.code).toBe("NOT_FOUND");
  });
});

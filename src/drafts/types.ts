/** Status lifecycle for a draft. */
export type DraftStatus = "draft" | "ready" | "published";

/** A locally-stored content draft. */
export interface Draft {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  tags: string[];
  status: DraftStatus;
  created_at: string;
  updated_at: string;
}

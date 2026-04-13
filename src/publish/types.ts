/** Common input shape for all platform publishers. */
export interface PublishInput {
  platform: string;
  title: string;
  content: string;
  tags?: string[];
  status?: "draft" | "published";
  featured_image_url?: string;
  canonical_url?: string;
}

/** Data returned on a successful publish: the new post's URL and ID. */
export interface PublishResult {
  url: string;
  post_id: string;
  platform: string;
}

/** Abbreviated post info returned by list operations. */
export interface PostSummary {
  id: string;
  title: string;
  url: string;
  status: string;
  published_at: string;
}

export interface PublishInput {
  platform: string;
  title: string;
  content: string;
  tags?: string[];
  status?: "draft" | "published";
  featured_image_url?: string;
  canonical_url?: string;
}

export interface PublishResult {
  url: string;
  post_id: string;
  platform: string;
}

export interface PostSummary {
  id: string;
  title: string;
  url: string;
  status: string;
  published_at: string;
}

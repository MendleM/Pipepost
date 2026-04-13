import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";
import type { PublishResult, PostSummary } from "./types.js";

const DEVTO_API = "https://dev.to/api";

interface DevtoPublishInput {
  title: string;
  content: string;
  tags?: string[];
  status?: "draft" | "published";
  canonical_url?: string;
  featured_image_url?: string;
  series?: string;
}

/** Publish an article to Dev.to via its REST API. Maps `featured_image_url` to `main_image`. */
export async function publishToDevto(
  input: DevtoPublishInput,
  apiKey: string
): Promise<ToolResult<PublishResult>> {
  const result = await httpRequest(`${DEVTO_API}/articles`, {
    method: "POST",
    headers: { "api-key": apiKey },
    body: {
      article: {
        title: input.title,
        body_markdown: input.content,
        published: input.status === "published",
        tags: input.tags || [],
        ...(input.canonical_url && { canonical_url: input.canonical_url }),
        ...(input.featured_image_url && { main_image: input.featured_image_url }),
        ...(input.series && { series: input.series }),
      },
    },
  });

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "devto",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { id: number; url: string };
  return makeSuccess({
    post_id: String(data.id),
    url: data.url,
    platform: "devto",
  });
}

/** Fetch the authenticated user's articles from Dev.to. */
export async function listDevtoPosts(
  apiKey: string,
  page = 1,
  perPage = 30
): Promise<ToolResult<{ posts: PostSummary[] }>> {
  const result = await httpRequest(
    `${DEVTO_API}/articles/me/all?page=${page}&per_page=${perPage}`,
    { method: "GET", headers: { "api-key": apiKey } }
  );

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "devto",
    });
  }

  const articles = result.data as Array<{
    id: number;
    title: string;
    url: string;
    published: boolean;
    published_at: string | null;
  }>;

  return makeSuccess({
    posts: articles.map((a) => ({
      id: String(a.id),
      title: a.title,
      url: a.url,
      status: a.published ? "published" : "draft",
      published_at: a.published_at || "",
    })),
  });
}

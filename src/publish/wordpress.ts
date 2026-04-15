import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";
import type { PublishResult, PostSummary } from "./types.js";

interface WordpressCreds {
  url: string;
  username: string;
  app_password: string;
}

interface WordpressPublishInput {
  title: string;
  content: string;
  tags?: string[];
  status?: "draft" | "published";
  canonical_url?: string;
}

function basicAuth(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

/**
 * Publish a post to WordPress via the WP REST API using Basic Auth.
 *
 * Note: WordPress does not natively support canonical_url in the REST API.
 * If a canonical_url is provided, it is stored in the `pipepost_canonical_url`
 * post meta field. SEO plugins (Yoast, RankMath) can pick this up, or a theme
 * can render it. The canonical_url is also returned in the response for reference.
 */
export async function publishToWordpress(
  input: WordpressPublishInput,
  creds: WordpressCreds
): Promise<ToolResult<PublishResult>> {
  const result = await httpRequest(
    `${creds.url}/wp-json/wp/v2/posts`,
    {
      method: "POST",
      headers: { Authorization: basicAuth(creds.username, creds.app_password) },
      body: {
        title: input.title,
        content: input.content,
        status: input.status === "published" ? "publish" : "draft",
        ...(input.tags && { tags_input: input.tags.join(",") }),
        ...(input.canonical_url && { meta: { pipepost_canonical_url: input.canonical_url } }),
      },
    }
  );

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "wordpress",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { id: number; link: string };
  return makeSuccess({
    post_id: String(data.id),
    url: data.link,
    platform: "wordpress",
  });
}

/** Fetch posts from a WordPress site via the WP REST API. */
export async function listWordpressPosts(
  creds: WordpressCreds,
  page = 1,
  perPage = 10
): Promise<ToolResult<{ posts: PostSummary[] }>> {
  const result = await httpRequest(
    `${creds.url}/wp-json/wp/v2/posts?page=${page}&per_page=${perPage}&status=any`,
    {
      method: "GET",
      headers: { Authorization: basicAuth(creds.username, creds.app_password) },
    }
  );

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "wordpress",
      retryable: result.error.retryable,
    });
  }

  const articles = result.data as Array<{
    id: number;
    title: { rendered: string };
    link: string;
    status: string;
    date: string;
  }>;

  return makeSuccess({
    posts: articles.map((a) => ({
      id: String(a.id),
      title: a.title.rendered,
      url: a.link,
      status: a.status === "publish" ? "published" : a.status,
      published_at: a.date || "",
    })),
  });
}

import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";
import type { PublishResult, PostSummary } from "./types.js";
import { createGhostJwt } from "./ghost-jwt.js";

interface GhostCreds {
  url: string;
  admin_key: string;
}

interface GhostPublishInput {
  title: string;
  content: string;
  tags?: string[];
  status?: "draft" | "published";
  canonical_url?: string;
  featured_image_url?: string;
}

/** Publish a post to Ghost via the Admin API. Creates a JWT from the admin key for auth. */
export async function publishToGhost(
  input: GhostPublishInput,
  creds: GhostCreds
): Promise<ToolResult<PublishResult>> {
  const baseUrl = creds.url.replace(/\/+$/, "");
  const token = createGhostJwt(creds.admin_key);

  const result = await httpRequest(
    `${baseUrl}/ghost/api/admin/posts/`,
    {
      method: "POST",
      headers: { Authorization: `Ghost ${token}` },
      body: {
        posts: [
          {
            title: input.title,
            html: input.content,
            status: input.status || "draft",
            tags: (input.tags || []).map((name) => ({ name })),
            ...(input.canonical_url && { canonical_url: input.canonical_url }),
            ...(input.featured_image_url && { feature_image: input.featured_image_url }),
          },
        ],
      },
    }
  );

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "ghost",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { posts: Array<{ id: string; url: string; slug: string }> };
  return makeSuccess({
    post_id: data.posts[0].id,
    url: data.posts[0].url,
    platform: "ghost",
  });
}

/** Fetch posts from a Ghost blog via the Admin API. */
export async function listGhostPosts(
  creds: GhostCreds,
  page = 1,
  limit = 15
): Promise<ToolResult<{ posts: PostSummary[] }>> {
  const baseUrl = creds.url.replace(/\/+$/, "");
  const token = createGhostJwt(creds.admin_key);

  const result = await httpRequest(
    `${baseUrl}/ghost/api/admin/posts/?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: { Authorization: `Ghost ${token}` },
    }
  );

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "ghost",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as {
    posts: Array<{
      id: string;
      title: string;
      url: string;
      status: string;
      published_at: string | null;
    }>;
  };

  return makeSuccess({
    posts: data.posts.map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      status: p.status,
      published_at: p.published_at || "",
    })),
  });
}

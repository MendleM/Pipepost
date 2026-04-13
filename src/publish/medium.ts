import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";
import type { PublishResult } from "./types.js";

const MEDIUM_API = "https://api.medium.com/v1";

interface MediumPublishInput {
  title: string;
  content: string;
  tags?: string[];
  status?: "draft" | "published";
  canonical_url?: string;
  featured_image_url?: string;
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function getMediumUserId(
  token: string
): Promise<ToolResult<string>> {
  const result = await httpRequest(`${MEDIUM_API}/me`, {
    method: "GET",
    headers: authHeader(token),
  });

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "medium",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { data: { id: string } };
  return makeSuccess(data.data.id);
}

/**
 * Publish an article to Medium. Requires fetching the user ID first via /me,
 * then posting to /users/{id}/posts. Medium does not support listing posts.
 */
export async function publishToMedium(
  input: MediumPublishInput,
  token: string
): Promise<ToolResult<PublishResult>> {
  const userResult = await getMediumUserId(token);
  if (!userResult.success) return userResult;

  const userId = userResult.data;

  const result = await httpRequest(`${MEDIUM_API}/users/${userId}/posts`, {
    method: "POST",
    headers: authHeader(token),
    body: {
      title: input.title,
      contentFormat: "markdown",
      content: input.content,
      tags: input.tags || [],
      publishStatus: input.status === "published" ? "public" : "draft",
      ...(input.canonical_url && { canonicalUrl: input.canonical_url }),
      ...(input.featured_image_url && { thumbnail: input.featured_image_url }),
    },
  });

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "medium",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { data: { id: string; url: string } };
  return makeSuccess({
    post_id: data.data.id,
    url: data.data.url,
    platform: "medium",
  });
}

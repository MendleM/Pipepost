import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";

/**
 * Maximum length of a LinkedIn post. The platform itself allows 3000 chars
 * for member posts; we enforce the full 3000 and leave shorter-form style
 * concerns to the caller.
 */
const MAX_LENGTH = 3000;

export interface LinkedInCredentials {
  access_token: string;
  /**
   * The user's person URN (e.g. `urn:li:person:ABC123`). Required by the
   * `ugcPosts` endpoint to identify the author. If omitted at setup time
   * we derive it from `/v2/userinfo` on first post and persist it.
   */
  person_urn?: string;
}

export interface LinkedInPost {
  id: string;
  url: string;
}

/**
 * Fetch the authenticated member's person URN from OpenID Connect userinfo.
 *
 * Called when the caller didn't supply `person_urn` at setup time. The
 * token must carry the `openid profile` scope. The `sub` claim is the
 * LinkedIn member id; the canonical URN prefixes it with `urn:li:person:`.
 */
export async function fetchPersonUrn(
  accessToken: string
): Promise<ToolResult<string>> {
  const result = await httpRequest("https://api.linkedin.com/v2/userinfo", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "linkedin",
      retryable: result.error.retryable,
    });
  }
  const data = result.data as { sub?: string };
  if (!data.sub) {
    return makeError(
      "PLATFORM_ERROR",
      "LinkedIn /v2/userinfo response missing `sub` field",
      { platform: "linkedin" }
    );
  }
  return makeSuccess(`urn:li:person:${data.sub}`);
}

/**
 * Publish a single post to LinkedIn via the `ugcPosts` endpoint.
 *
 * LinkedIn has no threading primitive for feed posts, so we only expose
 * single-post publishing. The endpoint returns the created share URN in
 * the response body; we derive a viewable feed URL from it.
 */
export async function postToLinkedIn(
  text: string,
  credentials: LinkedInCredentials
): Promise<ToolResult<LinkedInPost>> {
  if (!text.trim()) {
    return makeError("VALIDATION_ERROR", "Post text cannot be empty");
  }
  if ([...text].length > MAX_LENGTH) {
    return makeError(
      "VALIDATION_ERROR",
      `LinkedIn posts must be <= ${MAX_LENGTH} characters (got ${[...text].length})`
    );
  }

  let personUrn = credentials.person_urn;
  if (!personUrn) {
    const urnResult = await fetchPersonUrn(credentials.access_token);
    if (!urnResult.success) return urnResult;
    personUrn = urnResult.data;
  }

  const body = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const result = await httpRequest("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.access_token}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body,
  });

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "linkedin",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { id?: string };
  if (!data.id) {
    return makeError(
      "PLATFORM_ERROR",
      "LinkedIn ugcPosts response missing `id`",
      { platform: "linkedin" }
    );
  }

  return makeSuccess({
    id: data.id,
    url: `https://www.linkedin.com/feed/update/${encodeURIComponent(data.id)}/`,
  });
}

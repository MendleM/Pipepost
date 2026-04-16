import { z } from "zod";
import { readConfig } from "../config.js";
import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";
import { createGhostJwt } from "../publish/ghost-jwt.js";

/** Zod schema for the `analytics` tool input. */
export const analyticsSchema = z.object({
  platform: z
    .string()
    .optional()
    .describe("Specific platform to fetch analytics for, or omit for all configured platforms"),
  limit: z
    .number()
    .optional()
    .default(10)
    .describe("Max posts to fetch per platform (default: 10)"),
});

interface AnalyticsPost {
  title: string;
  url: string;
  views?: number;
  reactions?: number;
  comments?: number;
  published_at?: string;
  status?: string;
}

interface PlatformAnalytics {
  platform: string;
  posts: AnalyticsPost[];
  note?: string;
}

interface AnalyticsResult {
  platforms: PlatformAnalytics[];
  summary: {
    total_posts: number;
    total_views: number;
    total_reactions: number;
  };
}

// ── Dev.to ──

async function fetchDevtoAnalytics(apiKey: string, limit: number): Promise<PlatformAnalytics> {
  const result = await httpRequest(`https://dev.to/api/articles/me?per_page=${limit}`, {
    method: "GET",
    headers: { "api-key": apiKey },
  });

  if (!result.success) {
    return { platform: "devto", posts: [], note: `Error: ${result.error.message}` };
  }

  const articles = result.data as Array<{
    title: string;
    url: string;
    page_views_count: number;
    positive_reactions_count: number;
    comments_count: number;
    published_at: string | null;
  }>;

  return {
    platform: "devto",
    posts: articles.map((a) => ({
      title: a.title,
      url: a.url,
      views: a.page_views_count,
      reactions: a.positive_reactions_count,
      comments: a.comments_count,
      published_at: a.published_at || undefined,
      status: "published",
    })),
  };
}

// ── Ghost ──

async function fetchGhostAnalytics(
  creds: { url: string; admin_key: string },
  limit: number
): Promise<PlatformAnalytics> {
  const baseUrl = creds.url.replace(/\/+$/, "");
  const token = createGhostJwt(creds.admin_key);

  const result = await httpRequest(
    `${baseUrl}/ghost/api/admin/posts/?limit=${limit}&fields=title,slug,status,published_at,updated_at,url`,
    {
      method: "GET",
      headers: { Authorization: `Ghost ${token}` },
    }
  );

  if (!result.success) {
    return { platform: "ghost", posts: [], note: `Error: ${result.error.message}` };
  }

  const data = result.data as {
    posts: Array<{
      title: string;
      slug: string;
      status: string;
      published_at: string | null;
      updated_at: string | null;
      url: string;
    }>;
  };

  return {
    platform: "ghost",
    posts: data.posts.map((p) => ({
      title: p.title,
      url: p.url,
      published_at: p.published_at || undefined,
      status: p.status,
    })),
  };
}

// ── Hashnode ──

const HASHNODE_ANALYTICS_QUERY = `
  query AnalyticsPosts($id: ObjectId!, $first: Int!) {
    publication(id: $id) {
      posts(first: $first) {
        edges {
          node {
            id
            title
            url
            publishedAt
            views
            reactionCount
          }
        }
      }
    }
  }
`;

async function fetchHashnodeAnalytics(
  creds: { token: string; publication_id: string },
  limit: number
): Promise<PlatformAnalytics> {
  const result = await httpRequest("https://gql.hashnode.com", {
    method: "POST",
    headers: { Authorization: creds.token },
    body: {
      query: HASHNODE_ANALYTICS_QUERY,
      variables: { id: creds.publication_id, first: limit },
    },
  });

  if (!result.success) {
    return { platform: "hashnode", posts: [], note: `Error: ${result.error.message}` };
  }

  const data = result.data as {
    data?: {
      publication: {
        posts: {
          edges: Array<{
            node: {
              id: string;
              title: string;
              url: string;
              publishedAt: string | null;
              views: number;
              reactionCount: number;
            };
          }>;
        };
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (data.errors?.length) {
    return {
      platform: "hashnode",
      posts: [],
      note: `Error: ${data.errors.map((e) => e.message).join("; ")}`,
    };
  }

  if (!data.data?.publication?.posts?.edges) {
    return { platform: "hashnode", posts: [], note: "Unexpected response from Hashnode" };
  }

  const edges = data.data.publication.posts.edges;
  return {
    platform: "hashnode",
    posts: edges.map((e) => ({
      title: e.node.title,
      url: e.node.url,
      views: e.node.views,
      reactions: e.node.reactionCount,
      published_at: e.node.publishedAt || undefined,
      status: e.node.publishedAt ? "published" : "draft",
    })),
  };
}

// ── WordPress ──

async function fetchWordpressAnalytics(
  creds: { url: string; username: string; app_password: string },
  limit: number
): Promise<PlatformAnalytics> {
  const auth = `Basic ${Buffer.from(`${creds.username}:${creds.app_password}`).toString("base64")}`;

  const result = await httpRequest(
    `${creds.url}/wp-json/wp/v2/posts?per_page=${limit}&_fields=id,title,status,date,link`,
    {
      method: "GET",
      headers: { Authorization: auth },
    }
  );

  if (!result.success) {
    return { platform: "wordpress", posts: [], note: `Error: ${result.error.message}` };
  }

  const articles = result.data as Array<{
    id: number;
    title: { rendered: string };
    status: string;
    date: string;
    link: string;
  }>;

  return {
    platform: "wordpress",
    posts: articles.map((a) => ({
      title: a.title.rendered,
      url: a.link,
      published_at: a.date || undefined,
      status: a.status === "publish" ? "published" : a.status,
    })),
  };
}

// ── Main handler ──

/**
 * Fetch post analytics (views, reactions, comments) from all configured platforms.
 *
 * Medium is included in the output but notes that its API does not support analytics.
 * Returns per-platform post lists and an aggregate summary.
 */
export async function handleAnalytics(
  input: z.infer<typeof analyticsSchema>
): Promise<ToolResult<AnalyticsResult>> {
  const config = readConfig();
  const platforms = config.platforms;

  if (!platforms || Object.keys(platforms).length === 0) {
    return makeError(
      "VALIDATION_ERROR",
      "No platforms configured. Run the \"setup\" tool to add platform credentials first."
    );
  }

  const targetPlatforms = input.platform ? [input.platform] : Object.keys(platforms);
  const limit = input.limit ?? 10;
  const results: PlatformAnalytics[] = [];

  for (const platform of targetPlatforms) {
    if (input.platform && !platforms[platform as keyof typeof platforms]) {
      return makeError(
        "VALIDATION_ERROR",
        `Platform "${platform}" is not configured. Run the "setup" tool first.`
      );
    }

    if (platform === "devto" && platforms.devto?.api_key) {
      results.push(await fetchDevtoAnalytics(platforms.devto.api_key, limit));
    } else if (platform === "ghost" && platforms.ghost?.url && platforms.ghost?.admin_key) {
      results.push(await fetchGhostAnalytics(platforms.ghost, limit));
    } else if (
      platform === "hashnode" &&
      platforms.hashnode?.token &&
      platforms.hashnode?.publication_id
    ) {
      results.push(await fetchHashnodeAnalytics(platforms.hashnode, limit));
    } else if (
      platform === "wordpress" &&
      platforms.wordpress?.url &&
      platforms.wordpress?.username &&
      platforms.wordpress?.app_password
    ) {
      results.push(await fetchWordpressAnalytics(platforms.wordpress, limit));
    } else if (platform === "medium") {
      results.push({
        platform: "medium",
        posts: [],
        note: "Medium API does not support analytics",
      });
    } else if (platform === "substack") {
      results.push({
        platform: "substack",
        posts: [],
        note: "Substack post analytics are not yet wired into the unified analytics view. Use list_posts on the substack platform to see drafts + published posts.",
      });
    }
  }

  // Compute summary
  let total_posts = 0;
  let total_views = 0;
  let total_reactions = 0;

  for (const r of results) {
    total_posts += r.posts.length;
    for (const p of r.posts) {
      total_views += p.views ?? 0;
      total_reactions += p.reactions ?? 0;
    }
  }

  return makeSuccess({
    platforms: results,
    summary: { total_posts, total_views, total_reactions },
  });
}

import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";
import type { PublishResult, PostSummary } from "./types.js";

const HASHNODE_API = "https://gql.hashnode.com";

interface HashnodeCreds {
  token: string;
  publication_id: string;
}

interface HashnodePublishInput {
  title: string;
  content: string;
  tags?: string[];
  canonical_url?: string;
  featured_image_url?: string;
  series?: string;
}

const PUBLISH_MUTATION = `
  mutation PublishPost($input: PublishPostInput!) {
    publishPost(input: $input) {
      post {
        id
        url
        slug
      }
    }
  }
`;

const LIST_POSTS_QUERY = `
  query ListPosts($id: ObjectId!, $first: Int!) {
    publication(id: $id) {
      posts(first: $first) {
        edges {
          node {
            id
            title
            url
            publishedAt
          }
        }
      }
    }
  }
`;

/** Publish an article to Hashnode via its GraphQL API. */
export async function publishToHashnode(
  input: HashnodePublishInput,
  creds: HashnodeCreds
): Promise<ToolResult<PublishResult>> {
  const result = await httpRequest(HASHNODE_API, {
    method: "POST",
    headers: { Authorization: creds.token },
    body: {
      query: PUBLISH_MUTATION,
      variables: {
        input: {
          title: input.title,
          contentMarkdown: input.content,
          publicationId: creds.publication_id,
          tags: (input.tags || []).map((slug) => ({ slug, name: slug })),
          ...(input.canonical_url && { originalArticleURL: input.canonical_url }),
          ...(input.featured_image_url && { coverImageOptions: { coverImageURL: input.featured_image_url } }),
          ...(input.series && { seriesId: input.series }),
        },
      },
    },
  });

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "hashnode",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as {
    data?: { publishPost: { post: { id: string; url: string; slug: string } } };
    errors?: Array<{ message: string }>;
  };

  if (data.errors?.length) {
    return makeError("PLATFORM_ERROR", data.errors.map((e) => e.message).join("; "), {
      platform: "hashnode",
    });
  }

  if (!data.data?.publishPost?.post) {
    return makeError("PLATFORM_ERROR", "Unexpected response from Hashnode", {
      platform: "hashnode",
    });
  }

  const post = data.data.publishPost.post;
  return makeSuccess({
    post_id: post.id,
    url: post.url,
    platform: "hashnode",
  });
}

/** Fetch posts from a Hashnode publication via its GraphQL API. */
export async function listHashnodePosts(
  creds: HashnodeCreds,
  first = 20
): Promise<ToolResult<{ posts: PostSummary[] }>> {
  const result = await httpRequest(HASHNODE_API, {
    method: "POST",
    headers: { Authorization: creds.token },
    body: {
      query: LIST_POSTS_QUERY,
      variables: { id: creds.publication_id, first },
    },
  });

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "hashnode",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as {
    data?: {
      publication: {
        posts: {
          edges: Array<{
            node: { id: string; title: string; url: string; publishedAt: string | null };
          }>;
        };
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (data.errors?.length) {
    return makeError("PLATFORM_ERROR", data.errors.map((e) => e.message).join("; "), {
      platform: "hashnode",
    });
  }

  if (!data.data?.publication?.posts?.edges) {
    return makeError("PLATFORM_ERROR", "Unexpected response from Hashnode", {
      platform: "hashnode",
    });
  }

  const edges = data.data.publication.posts.edges;
  return makeSuccess({
    posts: edges.map((e) => ({
      id: e.node.id,
      title: e.node.title,
      url: e.node.url,
      status: e.node.publishedAt ? "published" : "draft",
      published_at: e.node.publishedAt || "",
    })),
  });
}

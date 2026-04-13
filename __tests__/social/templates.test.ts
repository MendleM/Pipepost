import { describe, it, expect } from "vitest";
import { generateSocialPosts } from "../../src/social/templates.js";
import { handleGenerateSocialPosts } from "../../src/tools/social-tools.js";

const ARTICLE = {
  title: "How to Build an MCP Server in 10 Minutes",
  summary: "A step-by-step guide to creating your first MCP server using TypeScript and the official SDK.",
  url: "https://dev.to/user/mcp-server-guide",
};

const MARKDOWN_CONTENT = `# How to Build an MCP Server in 10 Minutes

Building an MCP server is easier than you think. In this guide we walk through everything step by step.

## Prerequisites

You need Node.js 18+ and the official MCP SDK installed. TypeScript is recommended but not required.

## Setting Up the Project

Create a new directory and initialize it:

\`\`\`typescript
import { Server } from "@modelcontextprotocol/sdk";
const server = new Server({ name: "my-server" });
\`\`\`

## Defining Tools

Tools are the core of any MCP server. Each tool has a name, description, and input schema.

- Define clear tool names
- Add Zod validation for inputs
- Return structured JSON responses
- Handle errors gracefully

## Connecting to Claude Code

Once your tools are defined, register the server and connect it to Claude Code via stdio transport.

## Testing and Deployment

Write unit tests for each tool handler. Deploy to npm with a bin entry for easy installation.
`;

// ─── Legacy path (title + summary, no content) ───

describe("generateSocialPosts (legacy)", () => {
  it("generates posts for all requested platforms", () => {
    const result = generateSocialPosts(ARTICLE, ["twitter", "reddit", "bluesky"]);
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.platform)).toEqual(["twitter", "reddit", "bluesky"]);
  });

  it("generates twitter post under 280 characters", () => {
    const [post] = generateSocialPosts(ARTICLE, ["twitter"]);
    expect(post.char_count).toBeLessThanOrEqual(280);
    expect(post.content).toContain(ARTICLE.url);
    expect(post.platform).toBe("twitter");
  });

  it("generates reddit post with title and body", () => {
    const [post] = generateSocialPosts(ARTICLE, ["reddit"]);
    expect(post.content).toContain(ARTICLE.title);
    expect(post.content).toContain(ARTICLE.url);
    expect(post.platform).toBe("reddit");
  });

  it("generates bluesky post under 300 characters", () => {
    const [post] = generateSocialPosts(ARTICLE, ["bluesky"]);
    expect(post.char_count).toBeLessThanOrEqual(300);
    expect(post.content).toContain(ARTICLE.url);
    expect(post.platform).toBe("bluesky");
  });

  it("truncates long titles for twitter", () => {
    const longTitle = "A".repeat(250);
    const [post] = generateSocialPosts(
      { ...ARTICLE, title: longTitle },
      ["twitter"]
    );
    expect(post.char_count).toBeLessThanOrEqual(280);
  });

  it("returns empty array for empty platforms", () => {
    const result = generateSocialPosts(ARTICLE, []);
    expect(result).toEqual([]);
  });

  it("skips unknown platforms", () => {
    const result = generateSocialPosts(ARTICLE, ["twitter", "tiktok" as never]);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe("twitter");
  });
});

// ─── Unified handler tests ───

describe("handleGenerateSocialPosts", () => {
  it("returns validation error when neither content nor title provided", async () => {
    const result = await handleGenerateSocialPosts({
      platforms: ["twitter"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("legacy path: title + summary still works", async () => {
    const result = await handleGenerateSocialPosts({
      title: ARTICLE.title,
      summary: ARTICLE.summary,
      url: ARTICLE.url,
      platforms: ["twitter", "reddit"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.posts[0].platform).toBe("twitter");
      expect(result.data.posts[1].platform).toBe("reddit");
    }
  });

  it("content-based generation produces richer output than title-only", async () => {
    const legacyResult = await handleGenerateSocialPosts({
      title: ARTICLE.title,
      summary: ARTICLE.summary,
      url: ARTICLE.url,
      platforms: ["twitter"],
    });

    const richResult = await handleGenerateSocialPosts({
      content: MARKDOWN_CONTENT,
      title: ARTICLE.title,
      url: ARTICLE.url,
      platforms: ["twitter"],
    });

    expect(legacyResult.success).toBe(true);
    expect(richResult.success).toBe(true);

    if (legacyResult.success && richResult.success) {
      // Rich content path should produce longer output (thread vs single tweet)
      const legacyLen = legacyResult.data.posts[0].content.length;
      const richLen = richResult.data.posts[0].content.length;
      expect(richLen).toBeGreaterThan(legacyLen);
    }
  });

  it("linkedin is included in generated platforms", async () => {
    const result = await handleGenerateSocialPosts({
      content: MARKDOWN_CONTENT,
      title: ARTICLE.title,
      url: ARTICLE.url,
      platforms: ["linkedin"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(1);
      expect(result.data.posts[0].platform).toBe("linkedin");
      expect(result.data.posts[0].content.length).toBeGreaterThan(100);
    }
  });

  it("twitter generates thread (with separators) when content is provided", async () => {
    const result = await handleGenerateSocialPosts({
      content: MARKDOWN_CONTENT,
      title: ARTICLE.title,
      url: ARTICLE.url,
      platforms: ["twitter"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const post = result.data.posts[0];
      // Thread tweets are joined with ---
      expect(post.content).toContain("---");
      // Should also have the thread array
      expect(post.thread).toBeDefined();
      expect(Array.isArray(post.thread)).toBe(true);
      expect(post.thread.length).toBeGreaterThan(2);
    }
  });

  it("generates all 4 social platforms at once", async () => {
    const result = await handleGenerateSocialPosts({
      content: MARKDOWN_CONTENT,
      title: ARTICLE.title,
      url: ARTICLE.url,
      platforms: ["twitter", "linkedin", "reddit", "bluesky"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(4);
      const platforms = result.data.posts.map((p: { platform: string }) => p.platform);
      expect(platforms).toContain("twitter");
      expect(platforms).toContain("linkedin");
      expect(platforms).toContain("reddit");
      expect(platforms).toContain("bluesky");
    }
  });

  it("reddit includes suggested subreddits when content is provided", async () => {
    const result = await handleGenerateSocialPosts({
      content: MARKDOWN_CONTENT,
      title: ARTICLE.title,
      url: ARTICLE.url,
      platforms: ["reddit"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const post = result.data.posts[0];
      expect(post.suggested_subreddits).toBeDefined();
      expect(Array.isArray(post.suggested_subreddits)).toBe(true);
      expect(post.suggested_subreddits.length).toBeGreaterThan(0);
    }
  });

  it("infers title from content when title not provided", async () => {
    const result = await handleGenerateSocialPosts({
      content: MARKDOWN_CONTENT,
      platforms: ["bluesky"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(1);
    }
  });
});

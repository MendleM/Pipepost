import { describe, it, expect } from "vitest";
import { generateLinkedInPost } from "../../src/social/linkedin.js";

const ARTICLE = {
  title: "How to Build an MCP Server in 10 Minutes",
  summary:
    "A step-by-step guide to creating your first MCP server using TypeScript and the official SDK. You will learn how to define tools, validate input with Zod, and connect to Claude Code. The server pattern is simple and extensible.",
  url: "https://dev.to/user/mcp-server-guide",
};

describe("generateLinkedInPost", () => {
  it("generates a post with the title as hook", () => {
    const post = generateLinkedInPost(ARTICLE);
    const firstLine = post.split("\n")[0];
    expect(firstLine).toContain(ARTICLE.title);
  });

  it("hook line is under 210 characters", () => {
    const post = generateLinkedInPost(ARTICLE);
    const firstLine = post.split("\n")[0];
    expect(firstLine.length).toBeLessThanOrEqual(210);
  });

  it("hook stays under 210 chars even with a very long title", () => {
    const longTitle = "A".repeat(250);
    const post = generateLinkedInPost({ ...ARTICLE, title: longTitle });
    const firstLine = post.split("\n")[0];
    expect(firstLine.length).toBeLessThanOrEqual(210);
  });

  it("total length is under 1300 characters", () => {
    const post = generateLinkedInPost(ARTICLE);
    expect(post.length).toBeLessThanOrEqual(1300);
  });

  it("includes the article URL", () => {
    const post = generateLinkedInPost(ARTICLE);
    expect(post).toContain(ARTICLE.url);
  });

  it("includes hashtags", () => {
    const post = generateLinkedInPost(ARTICLE);
    expect(post).toMatch(/#\w+/);
  });

  it("includes an engagement question", () => {
    const post = generateLinkedInPost(ARTICLE);
    expect(post).toContain("?");
  });

  it("handles long summaries without exceeding 1300 chars", () => {
    const longSummary = "This is an important point about building servers. ".repeat(30);
    const post = generateLinkedInPost({ ...ARTICLE, summary: longSummary });
    expect(post.length).toBeLessThanOrEqual(1300);
  });
});

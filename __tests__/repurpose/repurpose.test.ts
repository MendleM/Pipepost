import { describe, it, expect } from "vitest";
import { repurposeContent } from "../../src/repurpose/index.js";

const SAMPLE_ARTICLE = `# Building an MCP Server

This guide covers creating an MCP server.

## Setup

Install dependencies:

\`\`\`bash
npm install @modelcontextprotocol/sdk
\`\`\`

## Features

- Auto-reconnection
- Type-safe tools
- Built-in validation
`;

describe("repurposeContent", () => {
  it("generates content for all requested platforms", () => {
    const results = repurposeContent({
      content: SAMPLE_ARTICLE,
      title: "Building an MCP Server",
      url: "https://example.com/post",
      platforms: ["twitter", "linkedin", "reddit", "hackernews", "bluesky", "newsletter"],
    });
    expect(results).toHaveLength(6);
    expect(results.map((r) => r.platform)).toEqual([
      "twitter", "linkedin", "reddit", "hackernews", "bluesky", "newsletter",
    ]);
  });

  it("skips unknown platforms", () => {
    const results = repurposeContent({
      content: SAMPLE_ARTICLE,
      title: "Test",
      platforms: ["twitter", "tiktok" as never, "linkedin"],
    });
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.platform)).toEqual(["twitter", "linkedin"]);
  });

  it("returns empty array for empty platforms", () => {
    const results = repurposeContent({
      content: SAMPLE_ARTICLE,
      title: "Test",
      platforms: [],
    });
    expect(results).toEqual([]);
  });

  it("works without a URL", () => {
    const results = repurposeContent({
      content: SAMPLE_ARTICLE,
      title: "Test",
      platforms: ["twitter", "bluesky"],
    });
    expect(results).toHaveLength(2);
  });

  it("generates a single platform correctly", () => {
    const results = repurposeContent({
      content: SAMPLE_ARTICLE,
      title: "Building an MCP Server",
      url: "https://example.com",
      platforms: ["hackernews"],
    });
    expect(results).toHaveLength(1);
    expect(results[0].platform).toBe("hackernews");
    expect(results[0].content).toHaveProperty("title");
  });
});

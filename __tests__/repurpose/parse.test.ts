import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../../src/repurpose/parse.js";

const SAMPLE_ARTICLE = `# Building an MCP Server in TypeScript

This guide walks you through creating a production-ready MCP server that connects Claude to your tools.

## Why MCP Matters

The Model Context Protocol lets AI assistants interact with external systems. It's the bridge between language models and real-world APIs.

## Getting Started

First, install the SDK:

\`\`\`typescript
npm install @modelcontextprotocol/sdk
\`\`\`

Then create your server entry point:

\`\`\`typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name: "my-server", version: "1.0.0" });
\`\`\`

## Key Concepts

- Tools are functions that the AI can call
- Resources provide data to the AI
- Prompts are reusable templates

## Advanced Patterns

You can compose multiple tools together for complex workflows. Error handling is critical for production use.

## Conclusion

MCP servers unlock powerful integrations between AI and your existing infrastructure.
`;

const SHORT_ARTICLE = `# Quick Tip

Use TypeScript for type safety.
`;

describe("parseMarkdown", () => {
  it("extracts headings with correct levels", () => {
    const result = parseMarkdown(SAMPLE_ARTICLE);
    expect(result.headings.length).toBeGreaterThanOrEqual(4);
    expect(result.headings[0]).toEqual({ level: 1, text: "Building an MCP Server in TypeScript" });
    expect(result.headings[1]).toEqual({ level: 2, text: "Why MCP Matters" });
  });

  it("extracts paragraphs", () => {
    const result = parseMarkdown(SAMPLE_ARTICLE);
    expect(result.paragraphs.length).toBeGreaterThan(0);
    expect(result.paragraphs[0]).toContain("production-ready MCP server");
  });

  it("extracts code blocks", () => {
    const result = parseMarkdown(SAMPLE_ARTICLE);
    expect(result.codeBlocks.length).toBe(2);
    expect(result.codeBlocks[0]).toContain("npm install");
    expect(result.codeBlocks[1]).toContain("McpServer");
  });

  it("extracts key points from list items", () => {
    const result = parseMarkdown(SAMPLE_ARTICLE);
    expect(result.keyPoints.length).toBe(3);
    expect(result.keyPoints[0]).toContain("Tools are functions");
  });

  it("calculates word count and reading time", () => {
    const result = parseMarkdown(SAMPLE_ARTICLE);
    expect(result.wordCount).toBeGreaterThan(50);
    expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });

  it("handles short content gracefully", () => {
    const result = parseMarkdown(SHORT_ARTICLE);
    expect(result.headings.length).toBe(1);
    expect(result.paragraphs.length).toBeGreaterThanOrEqual(1);
    expect(result.readingTimeMinutes).toBe(1);
  });

  it("handles empty content", () => {
    const result = parseMarkdown("");
    expect(result.headings).toEqual([]);
    expect(result.paragraphs).toEqual([]);
    expect(result.codeBlocks).toEqual([]);
    expect(result.wordCount).toBe(0);
    expect(result.readingTimeMinutes).toBe(1);
  });

  it("falls back to headings for key points when no lists exist", () => {
    const noLists = "# Title\n\n## Point One\n\nSome text.\n\n## Point Two\n\nMore text.";
    const result = parseMarkdown(noLists);
    expect(result.keyPoints).toContain("Point One");
    expect(result.keyPoints).toContain("Point Two");
  });
});

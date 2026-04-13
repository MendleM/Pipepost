import { describe, it, expect } from "vitest";
import { scoreContent } from "../../src/seo/score.js";

const sampleContent = `
# How to Build an MCP Server

Building an MCP server is easier than you think. In this guide, we'll walk through creating your first MCP server using TypeScript and the official SDK.

## Prerequisites

You'll need Node.js 20 or later and a basic understanding of TypeScript. The MCP protocol uses JSON-RPC over stdio, which means your server runs as a local process.

## Getting Started

First, install the MCP SDK. This package provides the server framework, tool registration, and type definitions you need.

The MCP server pattern is straightforward: you define tools, register them with the server, and the server handles the JSON-RPC communication with the client.

## Writing Your First Tool

A tool is a function that the AI agent can call. Each tool has a name, description, input schema, and handler function. The handler receives validated input and returns a result.

## Testing Your Server

Testing MCP servers requires simulating the client-server communication. You can use the MCP inspector tool or write integration tests that send JSON-RPC messages directly.

## Conclusion

MCP servers are a powerful way to extend AI coding assistants. Start simple, test thoroughly, and iterate based on user feedback.
`.trim();

describe("scoreContent", () => {
  it("calculates word count", () => {
    const result = scoreContent(sampleContent, "mcp server");
    expect(result.word_count).toBeGreaterThan(150);
    expect(result.word_count).toBeLessThan(250);
  });

  it("calculates keyword density", () => {
    const result = scoreContent(sampleContent, "mcp server");
    expect(result.keyword_density).toBeGreaterThan(0);
    expect(result.keyword_density).toBeLessThan(10);
  });

  it("analyzes heading structure", () => {
    const result = scoreContent(sampleContent, "mcp server");
    expect(result.heading_structure.h1).toBe(1);
    expect(result.heading_structure.h2).toBe(5);
    expect(result.heading_structure.h3).toBe(0);
  });

  it("calculates Flesch-Kincaid readability", () => {
    const result = scoreContent(sampleContent, "mcp server");
    expect(result.readability.flesch_kincaid).toBeGreaterThan(0);
    expect(result.readability.flesch_kincaid).toBeLessThan(100);
    expect(result.readability.grade_level).toBeTruthy();
  });

  it("generates a numeric score 0-100", () => {
    const result = scoreContent(sampleContent, "mcp server");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("identifies issues with short content", () => {
    const result = scoreContent("Short post.", "keyword");
    expect(result.issues).toContain("Content is under 300 words (got 2)");
  });

  it("flags missing keyword in headings", () => {
    const result = scoreContent("# Hello World\n\nSome content about nothing.", "mcp server");
    expect(result.issues.some((i) => i.includes("keyword"))).toBe(true);
  });

  it("flags multiple H1 tags", () => {
    const content = "# First H1\n\n# Second H1\n\nSome text.";
    const result = scoreContent(content, "test");
    expect(result.issues.some((i) => i.includes("H1"))).toBe(true);
  });

  it("handles empty content gracefully", () => {
    const result = scoreContent("", "keyword");
    expect(result.word_count).toBe(0);
    expect(result.score).toBe(0);
  });
});

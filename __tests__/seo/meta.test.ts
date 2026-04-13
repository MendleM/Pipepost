import { describe, it, expect } from "vitest";
import { generateMeta } from "../../src/seo/meta.js";

describe("generateMeta", () => {
  it("generates meta title under 60 chars", () => {
    const result = generateMeta(
      "How to Build an MCP Server with TypeScript and the Official SDK",
      "Some long content about building MCP servers..."
    );
    expect(result.meta_title.length).toBeLessThanOrEqual(60);
  });

  it("generates meta description under 160 chars", () => {
    const result = generateMeta(
      "How to Build an MCP Server",
      "Building an MCP server is easier than you think. In this comprehensive guide, we walk through creating your first server using TypeScript. You will learn about tool registration, JSON-RPC communication, and testing strategies that ensure reliability."
    );
    expect(result.meta_description.length).toBeLessThanOrEqual(160);
    expect(result.meta_description.length).toBeGreaterThan(50);
  });

  it("includes keyword in meta title when provided", () => {
    const result = generateMeta("A Guide to Servers", "Content here", "MCP server");
    expect(result.meta_title.toLowerCase()).toContain("mcp server");
  });

  it("generates OG tags", () => {
    const result = generateMeta("Title", "Content");
    expect(result.og_title).toBeTruthy();
    expect(result.og_description).toBeTruthy();
    expect(result.twitter_card).toBe("summary_large_image");
  });
});

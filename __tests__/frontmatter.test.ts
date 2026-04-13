import { describe, it, expect } from "vitest";
import {
  generateFrontmatter,
  extractDescription,
  calculateReadingTime,
  toSlug,
} from "../src/frontmatter/generate.js";

const SAMPLE_CONTENT = `# How to Build an MCP Server

Building an MCP server is easier than you think. This guide walks you through creating a TypeScript server that integrates with Claude Code for content publishing workflows.

## Prerequisites

You need Node.js 18+ and a basic understanding of TypeScript. The MCP SDK provides all the primitives you need to get started quickly.

## Step 1: Initialize Your Project

Start by creating a new directory and initializing it with npm. Install the MCP SDK and TypeScript as dev dependencies. Configure your tsconfig for ES2022 modules.

## Step 2: Define Your Tools

Each tool in an MCP server has a schema (using Zod) and a handler function. The schema validates input from the AI model, and the handler executes the actual logic.

## Conclusion

MCP servers are powerful building blocks for AI-native developer tools. With just a few hundred lines of TypeScript, you can create tools that integrate seamlessly with Claude Code.`;

const BASE_INPUT = {
  title: "How to Build an MCP Server",
  content: SAMPLE_CONTENT,
  draft: true as const,
};

describe("extractDescription", () => {
  it("extracts first paragraph stripped of markdown, max 155 chars", () => {
    const desc = extractDescription(SAMPLE_CONTENT);
    expect(desc.length).toBeLessThanOrEqual(155);
    expect(desc).toContain("MCP server");
  });

  it("does not exceed 155 characters", () => {
    const longParagraph = "A".repeat(300);
    const desc = extractDescription(longParagraph);
    expect(desc.length).toBeLessThanOrEqual(155);
    expect(desc).toMatch(/\.\.\.$/);
  });
});

describe("calculateReadingTime", () => {
  it("returns at least 1 minute", () => {
    expect(calculateReadingTime("short")).toBe(1);
  });

  it("calculates based on 200 wpm", () => {
    const words = Array(400).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(2);
  });

  it("rounds up", () => {
    const words = Array(201).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(2);
  });
});

describe("toSlug", () => {
  it("converts title to kebab-case", () => {
    expect(toSlug("How to Build an MCP Server")).toBe("how-to-build-an-mcp-server");
  });

  it("strips special characters", () => {
    expect(toSlug("Hello, World! (2026)")).toBe("hello-world-2026");
  });
});

describe("generateFrontmatter", () => {
  describe("hugo", () => {
    it("generates valid Hugo frontmatter", () => {
      const result = generateFrontmatter({ ...BASE_INPUT, format: "hugo" });
      expect(result.frontmatter).toMatch(/^---\n/);
      expect(result.frontmatter).toMatch(/\n---$/);
      expect(result.frontmatter).toContain('title: "How to Build an MCP Server"');
      expect(result.frontmatter).toContain("draft: true");
      expect(result.frontmatter).toContain("tags:");
      expect(result.frontmatter).toContain("description:");
    });

    it("includes cover image when provided", () => {
      const result = generateFrontmatter({
        ...BASE_INPUT,
        format: "hugo",
        featured_image: "https://example.com/img.png",
      });
      expect(result.frontmatter).toContain("cover:");
      expect(result.frontmatter).toContain("image: \"https://example.com/img.png\"");
    });

    it("includes canonicalURL when provided", () => {
      const result = generateFrontmatter({
        ...BASE_INPUT,
        format: "hugo",
        canonical_url: "https://example.com/post",
      });
      expect(result.frontmatter).toContain("canonicalURL:");
    });
  });

  describe("jekyll", () => {
    it("generates valid Jekyll frontmatter", () => {
      const result = generateFrontmatter({ ...BASE_INPUT, format: "jekyll" });
      expect(result.frontmatter).toContain("layout: post");
      expect(result.frontmatter).toContain('title: "How to Build an MCP Server"');
      expect(result.frontmatter).toContain("categories:");
      expect(result.frontmatter).toContain("tags:");
    });
  });

  describe("astro", () => {
    it("generates valid Astro frontmatter", () => {
      const result = generateFrontmatter({ ...BASE_INPUT, format: "astro" });
      expect(result.frontmatter).toContain("pubDate:");
      expect(result.frontmatter).toContain("draft: true");
      expect(result.frontmatter).toContain("description:");
    });

    it("includes heroImage when provided", () => {
      const result = generateFrontmatter({
        ...BASE_INPUT,
        format: "astro",
        featured_image: "https://example.com/hero.jpg",
      });
      expect(result.frontmatter).toContain("heroImage:");
    });
  });

  describe("nextjs", () => {
    it("generates a JS metadata export", () => {
      const result = generateFrontmatter({ ...BASE_INPUT, format: "nextjs" });
      expect(result.frontmatter).toContain("export const metadata =");
      expect(result.frontmatter).toContain('"title"');
      expect(result.frontmatter).toContain('"description"');
    });

    it("includes openGraph when featured_image provided", () => {
      const result = generateFrontmatter({
        ...BASE_INPUT,
        format: "nextjs",
        featured_image: "https://example.com/og.png",
      });
      expect(result.frontmatter).toContain("openGraph");
      expect(result.frontmatter).toContain("https://example.com/og.png");
    });

    it("includes alternates.canonical when canonical_url provided", () => {
      const result = generateFrontmatter({
        ...BASE_INPUT,
        format: "nextjs",
        canonical_url: "https://example.com/canonical",
      });
      expect(result.frontmatter).toContain("alternates");
      expect(result.frontmatter).toContain("canonical");
    });
  });

  describe("devto", () => {
    it("generates valid Dev.to frontmatter", () => {
      const result = generateFrontmatter({ ...BASE_INPUT, format: "devto" });
      expect(result.frontmatter).toContain("published: false");
      expect(result.frontmatter).toContain("tags:");
      expect(result.frontmatter).toContain("description:");
    });

    it("limits tags to 4", () => {
      const result = generateFrontmatter({
        ...BASE_INPUT,
        format: "devto",
        tags: ["a", "b", "c", "d", "e"],
      });
      const tagLine = result.frontmatter.split("\n").find((l) => l.startsWith("tags:"));
      const tagCount = tagLine!.replace("tags: ", "").split(", ").length;
      expect(tagCount).toBeLessThanOrEqual(4);
    });
  });

  describe("hashnode", () => {
    it("generates valid Hashnode frontmatter", () => {
      const result = generateFrontmatter({ ...BASE_INPUT, format: "hashnode" });
      expect(result.frontmatter).toContain("subtitle:");
      expect(result.frontmatter).toContain("slug:");
      expect(result.frontmatter).toContain("tags:");
    });
  });

  describe("ghost", () => {
    it("generates valid Ghost JSON metadata", () => {
      const result = generateFrontmatter({ ...BASE_INPUT, format: "ghost" });
      const parsed = JSON.parse(result.frontmatter);
      expect(parsed.title).toBe("How to Build an MCP Server");
      expect(parsed.custom_excerpt).toBeTruthy();
      expect(Array.isArray(parsed.tags)).toBe(true);
    });

    it("includes feature_image when provided", () => {
      const result = generateFrontmatter({
        ...BASE_INPUT,
        format: "ghost",
        featured_image: "https://example.com/ghost.png",
      });
      const parsed = JSON.parse(result.frontmatter);
      expect(parsed.feature_image).toBe("https://example.com/ghost.png");
    });
  });

  describe("meta extraction", () => {
    it("returns meta with description, reading_time, slug, tags, word_count", () => {
      const result = generateFrontmatter({ ...BASE_INPUT, format: "hugo" });
      expect(result.meta.description).toBeTruthy();
      expect(result.meta.description.length).toBeLessThanOrEqual(155);
      expect(result.meta.reading_time_minutes).toBeGreaterThanOrEqual(1);
      expect(result.meta.slug).toBe("how-to-build-an-mcp-server");
      expect(result.meta.tags.length).toBeGreaterThan(0);
      expect(result.meta.word_count).toBeGreaterThan(0);
    });

    it("uses provided tags instead of auto-extracting", () => {
      const result = generateFrontmatter({
        ...BASE_INPUT,
        format: "hugo",
        tags: ["mcp", "typescript"],
      });
      expect(result.meta.tags).toEqual(["mcp", "typescript"]);
    });
  });
});

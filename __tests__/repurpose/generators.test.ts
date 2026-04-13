import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../../src/repurpose/parse.js";
import {
  generateTwitterThread,
  generateLinkedInPost,
  generateRedditPost,
  generateHackerNewsPost,
  generateBlueskyPost,
  generateNewsletter,
} from "../../src/repurpose/generators.js";

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

## Conclusion

MCP servers unlock powerful integrations between AI and your existing infrastructure.
`;

const SHORT_ARTICLE = `# Quick Tip

Use TypeScript for better developer experience.
`;

const TITLE = "Building an MCP Server in TypeScript";
const URL = "https://dev.to/user/mcp-server-guide";
const parsed = parseMarkdown(SAMPLE_ARTICLE);
const shortParsed = parseMarkdown(SHORT_ARTICLE);

// --- Twitter ---

describe("generateTwitterThread", () => {
  it("generates a thread with hook, body, and CTA tweets", () => {
    const result = generateTwitterThread(TITLE, parsed, URL);
    expect(result.tweets.length).toBeGreaterThanOrEqual(3);
    // Hook tweet
    expect(result.tweets[0].length).toBeLessThanOrEqual(280);
    // CTA tweet has the URL
    expect(result.tweets[result.tweets.length - 1]).toContain(URL);
  });

  it("keeps all tweets under 280 characters", () => {
    const result = generateTwitterThread(TITLE, parsed, URL);
    for (const tweet of result.tweets) {
      expect(tweet.length).toBeLessThanOrEqual(280);
    }
  });

  it("handles short content without crashing", () => {
    const result = generateTwitterThread("Quick Tip", shortParsed);
    expect(result.tweets.length).toBeGreaterThanOrEqual(2);
    for (const tweet of result.tweets) {
      expect(tweet.length).toBeLessThanOrEqual(280);
    }
  });

  it("works without a URL", () => {
    const result = generateTwitterThread(TITLE, parsed);
    expect(result.tweets.length).toBeGreaterThanOrEqual(2);
  });
});

// --- LinkedIn ---

describe("generateLinkedInPost", () => {
  it("generates a post with hook under 210 characters", () => {
    const result = generateLinkedInPost(TITLE, parsed, URL);
    // First line (hook) should be under 210
    const hookLine = result.content.split("\n")[0];
    expect(hookLine.length).toBeLessThanOrEqual(210);
  });

  it("includes key takeaways and engagement question", () => {
    const result = generateLinkedInPost(TITLE, parsed, URL);
    expect(result.content).toContain("->");
    // Engagement question rotates between templates, all contain "?"
    expect(result.content).toMatch(/\?/);
    expect(result.content).toContain(URL);
  });

  it("handles short content gracefully", () => {
    const result = generateLinkedInPost("Quick Tip", shortParsed);
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content).toContain("experience");
  });
});

// --- Reddit ---

describe("generateRedditPost", () => {
  it("generates a post with title and body", () => {
    const result = generateRedditPost(TITLE, parsed, URL);
    expect(result.title).toBe(TITLE);
    expect(result.body).toContain("Key takeaways");
    expect(result.body).toContain(URL);
  });

  it("includes code snippets when available", () => {
    const result = generateRedditPost(TITLE, parsed, URL);
    expect(result.body).toContain("```");
    expect(result.body).toContain("npm install");
  });

  it("suggests relevant subreddits", () => {
    const result = generateRedditPost(TITLE, parsed, URL);
    expect(result.suggestedSubreddits.length).toBeGreaterThan(0);
    expect(result.suggestedSubreddits).toContain("r/programming");
  });

  it("strips trailing exclamation marks from title", () => {
    const result = generateRedditPost("Amazing Discovery!!!", parsed);
    expect(result.title).toBe("Amazing Discovery");
  });

  it("handles content with no code blocks", () => {
    const result = generateRedditPost("Quick Tip", shortParsed);
    expect(result.body).not.toContain("```");
    expect(result.suggestedSubreddits.length).toBeGreaterThan(0);
  });
});

// --- Hacker News ---

describe("generateHackerNewsPost", () => {
  it("generates a factual title under 80 characters", () => {
    const result = generateHackerNewsPost(TITLE, parsed);
    expect(result.title.length).toBeLessThanOrEqual(80);
  });

  it("suggests Show HN for project launches", () => {
    const launchParsed = parseMarkdown("# Introducing MyTool\n\nI built a CLI tool that automates deployments.");
    const result = generateHackerNewsPost("Introducing MyTool", launchParsed);
    expect(result.suggestShowHN).toBe(true);
    expect(result.title).toMatch(/^Show HN:/);
  });

  it("does not suggest Show HN for regular articles", () => {
    const result = generateHackerNewsPost("Understanding TCP/IP", parseMarkdown("# Understanding TCP/IP\n\nTCP is a protocol."));
    expect(result.suggestShowHN).toBe(false);
  });

  it("includes posting time advice", () => {
    const result = generateHackerNewsPost(TITLE, parsed);
    expect(result.bestTimeToPost).toContain("Weekday");
  });

  it("truncates very long titles", () => {
    const longTitle = "A".repeat(100);
    const result = generateHackerNewsPost(longTitle, parsed);
    expect(result.title.length).toBeLessThanOrEqual(80);
  });
});

// --- Bluesky ---

describe("generateBlueskyPost", () => {
  it("generates a post under 300 characters", () => {
    const result = generateBlueskyPost(TITLE, parsed, URL);
    expect(result.content.length).toBeLessThanOrEqual(300);
    expect(result.content).toContain(URL);
  });

  it("works without URL", () => {
    const result = generateBlueskyPost(TITLE, parsed);
    expect(result.content.length).toBeLessThanOrEqual(300);
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("handles short content", () => {
    const result = generateBlueskyPost("Quick Tip", shortParsed, URL);
    expect(result.content.length).toBeLessThanOrEqual(300);
    expect(result.content).toContain(URL);
  });
});

// --- Newsletter ---

describe("generateNewsletter", () => {
  it("generates a newsletter with personal intro and CTA", () => {
    const result = generateNewsletter(TITLE, parsed, URL);
    expect(result.content).toContain(TITLE);
    expect(result.content).toContain(URL);
    expect(result.content).toContain("P.S.");
  });

  it("includes key takeaways", () => {
    const result = generateNewsletter(TITLE, parsed, URL);
    expect(result.content).toContain("Key takeaways");
    expect(result.content).toContain("- ");
  });

  it("works without URL", () => {
    const result = generateNewsletter(TITLE, parsed);
    expect(result.content).toContain(TITLE);
    expect(result.content).toContain("P.S.");
    expect(result.content).not.toContain("Read the full post here:");
  });

  it("handles short content", () => {
    const result = generateNewsletter("Quick Tip", shortParsed, URL);
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content).toContain("Quick Tip");
  });
});

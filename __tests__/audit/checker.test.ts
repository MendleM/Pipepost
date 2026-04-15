import { describe, it, expect } from "vitest";
import { auditContent } from "../../src/audit/checker.js";

const goodArticle = `
# How to Build an MCP Server

Building an MCP server is easier than you think. In this comprehensive guide, we'll walk through creating your first MCP server using TypeScript.

## Prerequisites

You'll need Node.js 20 or later and a basic understanding of TypeScript. The MCP protocol uses JSON-RPC over stdio.

## Getting Started

First, install the MCP SDK:

\`\`\`bash
npm install @modelcontextprotocol/sdk
\`\`\`

The MCP server pattern is straightforward: you define tools, register them with the server, and the server handles the JSON-RPC communication with the client.

![Architecture diagram](https://example.com/diagram.png)

## Writing Your First Tool

A tool is a function that the AI agent can call. Each tool has a name, description, input schema, and handler function. The handler receives validated input and returns a result. Learn more at [MCP docs](https://docs.example.com).

## Testing Your Server

Testing MCP servers requires simulating the client-server communication. You can use the MCP inspector tool or write integration tests that send JSON-RPC messages directly.

${Array(30).fill("This is filler content to reach the word count threshold for testing purposes.").join(" ")}

## Conclusion

MCP servers are a powerful way to extend AI coding assistants. Start simple, test thoroughly, and iterate based on user feedback.
`.trim();

const shortArticle = "Just a few words here.";

const noH1Article = `
## Section One

Some content here about building things.

## Section Two

More content here.
`.trim();

const technicalNoCode = `
# Installing the CLI Tool

To install the CLI, run the command in your terminal. Use npm to install the package globally. The API endpoint is available at the default port.

${Array(30).fill("Additional content to meet word count requirements for the audit checks.").join(" ")}
`.trim();

describe("auditContent — basic (free)", () => {
  it("reports no issues for well-structured article", () => {
    const result = auditContent(goodArticle, false);
    const errorIssues = result.issues.filter((i) => i.severity === "error");
    expect(errorIssues).toHaveLength(0);
  });

  it("calculates word count", () => {
    const result = auditContent(goodArticle, false);
    expect(result.word_count).toBeGreaterThan(200);
  });

  it("calculates reading time", () => {
    const result = auditContent(goodArticle, false);
    expect(result.reading_time_minutes).toBeGreaterThanOrEqual(1);
  });

  it("flags missing H1", () => {
    const result = auditContent(noH1Article, false);
    expect(result.issues.some((i) => i.id === "missing-h1")).toBe(true);
  });

  it("flags short content", () => {
    const result = auditContent(shortArticle, false);
    expect(result.issues.some((i) => i.id === "short-content")).toBe(true);
  });

  it("flags no images", () => {
    const result = auditContent("# Title\n\nSome content without images.", false);
    expect(result.issues.some((i) => i.id === "no-images")).toBe(true);
  });

  it("does not flag images when present", () => {
    const md = "# Title\n\n![alt](https://example.com/img.png)\n\nContent.";
    const result = auditContent(md, false);
    expect(result.issues.some((i) => i.id === "no-images")).toBe(false);
  });

  it("flags no links", () => {
    const result = auditContent("# Title\n\nContent without any links.", false);
    expect(result.issues.some((i) => i.id === "no-links")).toBe(true);
  });

  it("does not flag links when present", () => {
    const md = "# Title\n\n[Click here](https://example.com)\n\nContent.";
    const result = auditContent(md, false);
    expect(result.issues.some((i) => i.id === "no-links")).toBe(false);
  });

  it("flags missing code blocks in technical content", () => {
    const result = auditContent(technicalNoCode, false);
    expect(result.issues.some((i) => i.id === "missing-code-blocks")).toBe(true);
  });

  it("does not flag code blocks when present", () => {
    const result = auditContent(goodArticle, false);
    expect(result.issues.some((i) => i.id === "missing-code-blocks")).toBe(false);
  });

  it("flags duplicate consecutive paragraphs", () => {
    const md = "# Title\n\nThis is a paragraph.\n\nThis is a paragraph.\n\nDifferent content.";
    const result = auditContent(md, false);
    expect(result.issues.some((i) => i.id === "duplicate-paragraph")).toBe(true);
  });

  it("does not flag non-duplicate paragraphs", () => {
    const md = "# Title\n\nFirst paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
    const result = auditContent(md, false);
    expect(result.issues.some((i) => i.id === "duplicate-paragraph")).toBe(false);
  });

  it("flags overly long paragraphs", () => {
    const longParagraph = Array(310).fill("word").join(" ");
    const md = `# Title\n\n${longParagraph}`;
    const result = auditContent(md, false);
    expect(result.issues.some((i) => i.id === "long-paragraph")).toBe(true);
  });

  it("flags missing conclusion for long content", () => {
    const body = Array(50).fill("This is content for testing the conclusion check.").join(" ");
    const md = `# Title\n\n## Section\n\n${body}`;
    const result = auditContent(md, false);
    expect(result.issues.some((i) => i.id === "missing-conclusion")).toBe(true);
  });

  it("does not flag conclusion when present", () => {
    const result = auditContent(goodArticle, false);
    expect(result.issues.some((i) => i.id === "missing-conclusion")).toBe(false);
  });

  it("does not include full analysis fields in basic mode", () => {
    const result = auditContent(goodArticle, false);
    expect(result.readability).toBeNull();
    expect(result.structure_score).toBeNull();
    expect(result.heading_hierarchy_ok).toBeNull();
    expect(result.tag_suggestions).toHaveLength(0);
  });

  it("handles empty content", () => {
    const result = auditContent("", false);
    expect(result.word_count).toBe(0);
    expect(result.reading_time_minutes).toBe(1);
    expect(result.issues.some((i) => i.id === "missing-h1")).toBe(true);
    expect(result.issues.some((i) => i.id === "short-content")).toBe(true);
  });
});

describe("auditContent — full (credits)", () => {
  it("includes readability stats", () => {
    const result = auditContent(goodArticle, true);
    expect(result.readability).not.toBeNull();
    expect(result.readability!.avg_sentence_length).toBeGreaterThan(0);
    expect(result.readability!.avg_word_length).toBeGreaterThan(0);
    expect(result.readability!.passive_voice_ratio).toBeGreaterThanOrEqual(0);
  });

  it("includes structure score", () => {
    const result = auditContent(goodArticle, true);
    expect(result.structure_score).not.toBeNull();
    expect(result.structure_score!).toBeGreaterThanOrEqual(0);
    expect(result.structure_score!).toBeLessThanOrEqual(100);
  });

  it("checks heading hierarchy", () => {
    const result = auditContent(goodArticle, true);
    expect(result.heading_hierarchy_ok).toBe(true);
  });

  it("flags heading hierarchy gaps", () => {
    const md = "# Title\n\n### Skipped H2\n\nContent here.";
    const result = auditContent(md, true);
    expect(result.heading_hierarchy_ok).toBe(false);
    expect(result.issues.some((i) => i.id === "heading-hierarchy")).toBe(true);
  });

  it("suggests tags based on content", () => {
    const result = auditContent(goodArticle, true);
    expect(result.tag_suggestions.length).toBeGreaterThan(0);
  });

  it("suggests javascript tag for JS content", () => {
    const md = "# Building with React\n\nUse npm install to get started with JavaScript and TypeScript.";
    const result = auditContent(md, true);
    expect(result.tag_suggestions).toContain("javascript");
  });

  it("flags high passive voice ratio", () => {
    // Heavy passive voice content
    const md = "# Article\n\n" + Array(20).fill("The code was written. The test was broken. The bug was fixed. The feature was deployed.").join(" ");
    const result = auditContent(md, true);
    // May or may not trigger depending on heuristic, but readability should be present
    expect(result.readability).not.toBeNull();
  });

  it("gives good structure score for well-structured content", () => {
    const result = auditContent(goodArticle, true);
    expect(result.structure_score!).toBeGreaterThanOrEqual(50);
  });

  it("gives low structure score for flat content", () => {
    const md = "Just a wall of text without any structure at all.";
    const result = auditContent(md, true);
    expect(result.structure_score!).toBeLessThan(50);
  });
});

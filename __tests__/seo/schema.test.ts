import { describe, it, expect } from "vitest";
import { generateSchema } from "../../src/seo/schema.js";

describe("generateSchema", () => {
  it("generates valid Article JSON-LD", () => {
    const result = generateSchema("article", {
      title: "How to Build an MCP Server",
      description: "A guide to building MCP servers",
      url: "https://example.com/post",
      date_published: "2026-04-13",
      author_name: "Jane Dev",
    });
    const parsed = JSON.parse(result.json_ld);
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("Article");
    expect(parsed.headline).toBe("How to Build an MCP Server");
    expect(parsed.author["@type"]).toBe("Person");
  });

  it("generates valid FAQ JSON-LD", () => {
    const result = generateSchema("faq", {
      questions: [
        { question: "What is MCP?", answer: "Model Context Protocol" },
        { question: "Is it free?", answer: "Yes" },
      ],
    });
    const parsed = JSON.parse(result.json_ld);
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(2);
  });

  it("generates valid HowTo JSON-LD", () => {
    const result = generateSchema("howto", {
      name: "How to Install Pipepost",
      steps: [
        { name: "Install", text: "Run npx pipepost-mcp setup" },
        { name: "Configure", text: "Add your API key" },
      ],
    });
    const parsed = JSON.parse(result.json_ld);
    expect(parsed["@type"]).toBe("HowTo");
    expect(parsed.step).toHaveLength(2);
  });
});

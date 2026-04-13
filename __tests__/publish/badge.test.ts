import { describe, it, expect } from "vitest";
import { appendBadge, BADGE_MARKDOWN } from "../../src/publish/badge.js";

describe("appendBadge", () => {
  it("appends badge to content", () => {
    const result = appendBadge("Hello world");
    expect(result).toContain("Hello world");
    expect(result).toContain("Pipepost");
    expect(result).toContain("pipepost");
  });

  it("does not append when content already contains pipepost.dev URL", () => {
    const content = "Check out https://pipepost.dev for more";
    const result = appendBadge(content);
    expect(result).toBe(content);
  });

  it("is idempotent — appending twice produces same result as once", () => {
    const once = appendBadge("Hello world");
    const twice = appendBadge(once);
    expect(twice).toBe(once);
  });
});

describe("BADGE_MARKDOWN", () => {
  it("contains a link", () => {
    expect(BADGE_MARKDOWN).toContain("http");
  });
});

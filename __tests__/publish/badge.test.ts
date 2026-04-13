import { describe, it, expect } from "vitest";
import { appendBadge, BADGE_MARKDOWN } from "../../src/publish/badge.js";

describe("appendBadge", () => {
  it("appends badge to content", () => {
    const result = appendBadge("Hello world");
    expect(result).toContain("Hello world");
    expect(result).toContain("Pipepost");
    expect(result).toContain("pipepost");
  });

  it("does not double-append if badge already present", () => {
    const withBadge = appendBadge("Hello world");
    const doubled = appendBadge(withBadge);
    const count = (doubled.match(/pipepost/gi) || []).length;
    expect(count).toBeLessThanOrEqual(3); // brand name appears in badge, not duplicated
  });
});

describe("BADGE_MARKDOWN", () => {
  it("contains a link", () => {
    expect(BADGE_MARKDOWN).toContain("http");
  });
});

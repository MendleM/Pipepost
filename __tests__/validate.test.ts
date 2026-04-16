import { describe, it, expect } from "vitest";
import {
  validateRequired,
  validateUrl,
  validatePlatform,
  validateStringLength,
  validateTags,
} from "../src/validate.js";

describe("validateRequired", () => {
  it("returns null for non-empty string", () => {
    expect(validateRequired("hello", "title")).toBeNull();
  });

  it("returns error for empty string", () => {
    expect(validateRequired("", "title")).toBe("title is required");
  });

  it("returns error for whitespace-only string", () => {
    expect(validateRequired("   ", "title")).toBe("title is required");
  });
});

describe("validateUrl", () => {
  it("returns null for valid URL", () => {
    expect(validateUrl("https://example.com")).toBeNull();
  });

  it("returns error for invalid URL", () => {
    expect(validateUrl("not-a-url")).toBe("Invalid URL: not-a-url");
  });

  it("returns error for empty string", () => {
    expect(validateUrl("")).toBe("URL is required");
  });
});

describe("validatePlatform", () => {
  it("returns null for known platform", () => {
    expect(validatePlatform("devto")).toBeNull();
    expect(validatePlatform("ghost")).toBeNull();
    expect(validatePlatform("hashnode")).toBeNull();
    expect(validatePlatform("wordpress")).toBeNull();
    expect(validatePlatform("medium")).toBeNull();
    expect(validatePlatform("substack")).toBeNull();
  });

  it("returns error for unknown platform", () => {
    expect(validatePlatform("blogger")).toBe(
      'Unknown platform: blogger. Valid: devto, ghost, hashnode, wordpress, medium, substack'
    );
  });
});

describe("validateStringLength", () => {
  it("returns null when within limit", () => {
    expect(validateStringLength("hello", "title", 300)).toBeNull();
  });

  it("returns error when exceeding limit", () => {
    const long = "a".repeat(301);
    expect(validateStringLength(long, "title", 300)).toBe(
      "title must be under 300 characters (got 301)"
    );
  });
});

describe("validateTags", () => {
  it("returns null for valid tags", () => {
    expect(validateTags(["javascript", "tutorial"])).toBeNull();
  });

  it("returns error for empty strings in tags", () => {
    expect(validateTags(["good", ""])).toBe("Tags must not contain empty strings");
  });

  it("returns null for undefined (optional)", () => {
    expect(validateTags(undefined)).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import {
  makeError,
  isToolError,
  ErrorCode,
  type ToolError,
} from "../src/errors.js";

describe("makeError", () => {
  it("creates a structured error with required fields", () => {
    const err = makeError("AUTH_FAILED", "Invalid API key");
    expect(err).toEqual({
      success: false,
      error: {
        code: "AUTH_FAILED",
        message: "Invalid API key",
        retryable: false,
      },
    });
  });

  it("includes optional platform field", () => {
    const err = makeError("RATE_LIMITED", "Too many requests", {
      platform: "devto",
      retryable: true,
    });
    expect(err.error.platform).toBe("devto");
    expect(err.error.retryable).toBe(true);
  });

  it("defaults retryable based on error code", () => {
    expect(makeError("NETWORK_ERROR", "timeout").error.retryable).toBe(true);
    expect(makeError("RATE_LIMITED", "slow down").error.retryable).toBe(true);
    expect(makeError("AUTH_FAILED", "bad key").error.retryable).toBe(false);
    expect(makeError("VALIDATION_ERROR", "bad input").error.retryable).toBe(false);
    expect(makeError("TIER_REQUIRED", "need pro").error.retryable).toBe(false);
    expect(makeError("PUBLISH_LIMIT", "3/3 used").error.retryable).toBe(false);
    expect(makeError("NOT_FOUND", "gone").error.retryable).toBe(false);
    expect(makeError("PLATFORM_ERROR", "500").error.retryable).toBe(true);
  });
});

describe("isToolError", () => {
  it("returns true for tool error objects", () => {
    const err = makeError("AUTH_FAILED", "bad");
    expect(isToolError(err)).toBe(true);
  });

  it("returns false for success objects", () => {
    expect(isToolError({ success: true, data: {} })).toBe(false);
  });

  it("returns false for non-objects", () => {
    expect(isToolError(null)).toBe(false);
    expect(isToolError("string")).toBe(false);
  });
});

/** Canonical error codes returned by all tool handlers. */
export const ErrorCode = {
  AUTH_FAILED: "AUTH_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  NOT_FOUND: "NOT_FOUND",
  TIER_REQUIRED: "TIER_REQUIRED",
  PUBLISH_LIMIT: "PUBLISH_LIMIT",
  NETWORK_ERROR: "NETWORK_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PLATFORM_ERROR: "PLATFORM_ERROR",
} as const;

/** Union type of all valid error code strings. */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Standardized error envelope returned when a tool call fails. */
export interface ToolError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    platform?: string;
    retryable: boolean;
  };
}

/** Standardized success envelope returned when a tool call succeeds. */
export interface ToolSuccess<T = unknown> {
  success: true;
  data: T;
}

/** Discriminated union — check `.success` to narrow to ToolSuccess or ToolError. */
export type ToolResult<T = unknown> = ToolSuccess<T> | ToolError;

const RETRYABLE_CODES: Set<ErrorCode> = new Set([
  ErrorCode.NETWORK_ERROR,
  ErrorCode.RATE_LIMITED,
  ErrorCode.PLATFORM_ERROR,
]);

/**
 * Create a standardized ToolError. Retryability is inferred from the error
 * code (NETWORK_ERROR, RATE_LIMITED, PLATFORM_ERROR) unless overridden.
 */
export function makeError(
  code: ErrorCode,
  message: string,
  opts?: { platform?: string; retryable?: boolean }
): ToolError {
  return {
    success: false,
    error: {
      code,
      message,
      ...(opts?.platform && { platform: opts.platform }),
      retryable: opts?.retryable ?? RETRYABLE_CODES.has(code),
    },
  };
}

/** Wrap data in a ToolSuccess envelope. */
export function makeSuccess<T>(data: T): ToolSuccess<T> {
  return { success: true, data };
}

/** Type guard that narrows an unknown value to ToolError. */
export function isToolError(value: unknown): value is ToolError {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as ToolError).success === false &&
    "error" in value
  );
}

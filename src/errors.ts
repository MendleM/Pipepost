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

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ToolError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    platform?: string;
    retryable: boolean;
  };
}

export interface ToolSuccess<T = unknown> {
  success: true;
  data: T;
}

export type ToolResult<T = unknown> = ToolSuccess<T> | ToolError;

const RETRYABLE_CODES: Set<ErrorCode> = new Set([
  ErrorCode.NETWORK_ERROR,
  ErrorCode.RATE_LIMITED,
  ErrorCode.PLATFORM_ERROR,
]);

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

export function makeSuccess<T>(data: T): ToolSuccess<T> {
  return { success: true, data };
}

export function isToolError(value: unknown): value is ToolError {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as ToolError).success === false &&
    "error" in value
  );
}

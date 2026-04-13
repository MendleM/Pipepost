import { makeError, makeSuccess, type ToolResult } from "./errors.js";

interface HttpRequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT = 10_000;
const RETRY_DELAY = 2_000;

function statusToErrorCode(status: number) {
  if (status === 401 || status === 403) return "AUTH_FAILED" as const;
  if (status === 404) return "NOT_FOUND" as const;
  if (status === 429) return "RATE_LIMITED" as const;
  return "PLATFORM_ERROR" as const;
}

async function singleRequest(
  url: string,
  opts: HttpRequestOptions
): Promise<ToolResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? DEFAULT_TIMEOUT
  );

  try {
    const isStringBody = typeof opts.body === "string";

    const fetchOpts: RequestInit = {
      method: opts.method,
      signal: controller.signal,
      headers: {
        ...(opts.body !== undefined && !isStringBody && { "Content-Type": "application/json" }),
        ...opts.headers,
      },
    };

    if (opts.body !== undefined) {
      fetchOpts.body = isStringBody
        ? (opts.body as string)
        : JSON.stringify(opts.body);
    }

    const res = await fetch(url, fetchOpts);

    if (res.ok) {
      const data = await res.json();
      return makeSuccess(data);
    }

    const text = await res.text();
    const code = statusToErrorCode(res.status);
    return makeError(code, `HTTP ${res.status}: ${text}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return makeError("NETWORK_ERROR", message);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Make an HTTP request with automatic retry on 5xx errors.
 *
 * Retries once after a 2-second delay for server errors. Non-5xx failures
 * and timeouts are returned immediately as ToolError. Defaults to a
 * 10-second timeout per attempt.
 *
 * @param url  - Fully-qualified URL to call.
 * @param opts - Method, headers, body, and optional timeout override.
 * @returns ToolResult wrapping the parsed JSON response or an error.
 */
export async function httpRequest(
  url: string,
  opts: HttpRequestOptions
): Promise<ToolResult> {
  const result = await singleRequest(url, opts);

  if (result.success) return result;

  // Only retry on 5xx (PLATFORM_ERROR from server errors)
  if (
    result.error.code === "PLATFORM_ERROR" &&
    result.error.message.match(/^HTTP 5\d\d/)
  ) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY));
    return singleRequest(url, opts);
  }

  return result;
}

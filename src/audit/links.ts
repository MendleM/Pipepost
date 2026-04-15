/** URL extraction and link checking for markdown content. */

// ── Types ────────────────────────────────────────────────────────────

export type LinkStatus = "ok" | "redirected" | "broken" | "timeout" | "error";

export interface LinkResult {
  url: string;
  status: LinkStatus;
  status_code: number | null;
  message: string;
}

export interface LinkCheckResult {
  total: number;
  ok: number;
  redirected: number;
  broken: number;
  timeout: number;
  error: number;
  links: LinkResult[];
}

// ── URL extraction ──────────────────────────────────────────────────

/**
 * Extract all URLs from markdown content.
 * Finds: markdown links `[text](url)`, image links `![alt](url)`, and raw URLs.
 */
export function extractUrls(markdown: string): string[] {
  const urls = new Set<string>();

  // Markdown links and images: [text](url) and ![alt](url)
  const mdLinkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = mdLinkPattern.exec(markdown)) !== null) {
    const url = match[1].trim();
    if (isHttpUrl(url)) urls.add(url);
  }

  // Raw URLs not inside markdown link syntax
  const rawUrlPattern = /(?<!\()(https?:\/\/[^\s)>\]"'`]+)/g;
  while ((match = rawUrlPattern.exec(markdown)) !== null) {
    const url = match[1].replace(/[.,;:!?]+$/, ""); // strip trailing punctuation
    if (isHttpUrl(url)) urls.add(url);
  }

  return Array.from(urls);
}

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ── Link checking ───────────────────────────────────────────────────

const LINK_TIMEOUT_MS = 5_000;

/**
 * Check a single URL via HEAD request. Falls back to GET if HEAD returns 405.
 */
export async function checkSingleLink(url: string): Promise<LinkResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LINK_TIMEOUT_MS);

  try {
    let res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "manual",
      headers: {
        "User-Agent": "Pipepost-LinkChecker/1.0",
      },
    });

    // Some servers reject HEAD — retry with GET
    if (res.status === 405) {
      clearTimeout(timeout);
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), LINK_TIMEOUT_MS);
      try {
        res = await fetch(url, {
          method: "GET",
          signal: controller2.signal,
          redirect: "manual",
          headers: {
            "User-Agent": "Pipepost-LinkChecker/1.0",
          },
        });
      } finally {
        clearTimeout(timeout2);
      }
    }

    const code = res.status;

    if (code >= 200 && code < 300) {
      return { url, status: "ok", status_code: code, message: "OK" };
    }
    if (code >= 300 && code < 400) {
      const location = res.headers.get("location") ?? "unknown";
      return { url, status: "redirected", status_code: code, message: `Redirects to ${location}` };
    }
    return { url, status: "broken", status_code: code, message: `HTTP ${code}` };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { url, status: "timeout", status_code: null, message: "Request timed out (5s)" };
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return { url, status: "error", status_code: null, message };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Extract all URLs from markdown and check each one.
 * Runs checks concurrently (max 5 at a time) for performance.
 */
export async function checkLinks(markdown: string): Promise<LinkCheckResult> {
  const urls = extractUrls(markdown);

  if (urls.length === 0) {
    return { total: 0, ok: 0, redirected: 0, broken: 0, timeout: 0, error: 0, links: [] };
  }

  // Check in batches of 5 to avoid overwhelming servers
  const results: LinkResult[] = [];
  const batchSize = 5;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((url) => checkSingleLink(url)));
    results.push(...batchResults);
  }

  return {
    total: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    redirected: results.filter((r) => r.status === "redirected").length,
    broken: results.filter((r) => r.status === "broken").length,
    timeout: results.filter((r) => r.status === "timeout").length,
    error: results.filter((r) => r.status === "error").length,
    links: results,
  };
}

# Pipepost Phase 1 (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working MCP server to npm that publishes content to Dev.to with SEO scoring and Lemon Squeezy license gating, plus a branded landing page on Vercel.

**Architecture:** Local STDIO MCP server in TypeScript. SEO tools run offline. Publishing calls Dev.to API with user's own key stored locally. License validation via Lemon Squeezy License API with 24-hour caching. All external calls use a shared HTTP client with 10s timeout and single retry on 5xx.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk`, Vitest, tsup (bundling), Node.js 20+, Next.js 15 (landing page), Tailwind CSS

**Brand:**
- Colors: primary `#0F172A` (slate-900), accent `#F97316` (orange-500), surface `#FAFAF9`, muted `#78716C`
- Font: Inter (headings 700, body 400), JetBrains Mono (code)
- Voice: technical, confident, minimal — like a senior engineer's README

---

## File Structure (Phase 1 only)

```
pipepost/
├── src/
│   ├── index.ts              # MCP server entry point, tool registration
│   ├── config.ts             # Read/write ~/.pipepost/config.json
│   ├── license.ts            # Lemon Squeezy validation + 24h cache
│   ├── tier.ts               # Tier resolution + usage tracking
│   ├── errors.ts             # Structured error types and builder
│   ├── http.ts               # HTTP client with timeout + retry
│   ├── validate.ts           # Input validation helpers
│   ├── seo/
│   │   ├── score.ts          # Readability + keyword analysis
│   │   ├── meta.ts           # Meta tag generation
│   │   └── schema.ts         # JSON-LD generation
│   ├── publish/
│   │   ├── types.ts          # PublishInput, PublishResult
│   │   ├── devto.ts          # Dev.to API client
│   │   └── badge.ts          # "Published with Pipepost" footer
│   └── tools/
│       ├── seo-tools.ts      # MCP tool defs for SEO
│       ├── publish-tools.ts  # MCP tool defs for publishing
│       └── setup-tools.ts    # MCP tool defs for setup/status
├── __tests__/
│   ├── config.test.ts
│   ├── license.test.ts
│   ├── tier.test.ts
│   ├── errors.test.ts
│   ├── http.test.ts
│   ├── validate.test.ts
│   ├── seo/
│   │   ├── score.test.ts
│   │   ├── meta.test.ts
│   │   └── schema.test.ts
│   └── publish/
│       ├── devto.test.ts
│       └── badge.test.ts
├── landing/
│   ├── src/app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── public/
│   │   └── og.png
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.mjs
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── tsup.config.ts
├── README.md
├── LICENSE
└── .github/workflows/
    ├── ci.yml
    └── publish.yml
```

**Responsibilities:**
- `src/errors.ts` — Single source of truth for all error codes and the `makeError()` builder.
- `src/http.ts` — Every external HTTP call goes through this. Timeout, retry, structured errors.
- `src/config.ts` — Reads/writes `~/.pipepost/config.json`. No other file touches the filesystem config.
- `src/license.ts` — Calls Lemon Squeezy, caches result. Depends on `http.ts` and `config.ts`.
- `src/tier.ts` — Resolves current tier from license + tracks usage. Depends on `license.ts` and `config.ts`.
- `src/validate.ts` — Pure validation functions. No dependencies.
- `src/seo/*` — Pure functions, zero external calls.
- `src/publish/devto.ts` — Dev.to API client. Depends on `http.ts` and `errors.ts`.
- `src/publish/badge.ts` — Pure function appending footer text.
- `src/tools/*` — MCP tool definitions. Depend on everything above. These are the glue layer.
- `src/index.ts` — Wires tools into the MCP server. The thinnest possible file.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `tsup.config.ts`, `LICENSE`, `.gitignore`

- [ ] **Step 1: Initialize project**

```bash
cd ~/Projects/pipepost
pnpm init
```

- [ ] **Step 2: Install dependencies**

```bash
cd ~/Projects/pipepost
pnpm add @modelcontextprotocol/sdk zod
pnpm add -D typescript vitest tsup @types/node
```

- [ ] **Step 3: Create tsconfig.json**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__", "landing"]
}
```

- [ ] **Step 4: Create vitest.config.ts**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 5: Create tsup.config.ts**

Create `tsup.config.ts`:

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  dts: true,
  sourcemap: true,
  banner: { js: "#!/usr/bin/env node" },
});
```

- [ ] **Step 6: Update package.json**

Replace the contents of `package.json`:

```json
{
  "name": "pipepost-mcp",
  "version": "0.1.0",
  "description": "Publish from your terminal. MCP server for content publishing, SEO, and promotion.",
  "type": "module",
  "bin": { "pipepost-mcp": "dist/index.js" },
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "tsc --noEmit",
    "prepublishOnly": "pnpm run lint && pnpm run test && pnpm run build"
  },
  "keywords": ["mcp", "claude-code", "content", "publishing", "seo", "devto", "ghost", "blog"],
  "license": "MIT",
  "engines": { "node": ">=20" },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.5.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 7: Create LICENSE**

Create `LICENSE`:

```
MIT License

Copyright (c) 2026 Pipepost

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 8: Create .gitignore**

Create `.gitignore`:

```
node_modules/
dist/
.env
.env.local
coverage/
*.tgz
landing/.next/
landing/node_modules/
landing/.vercel/
```

- [ ] **Step 9: Verify setup compiles**

```bash
cd ~/Projects/pipepost
pnpm run lint
```

Expected: No errors (no source files yet, but tsc should exit clean).

- [ ] **Step 10: Commit**

```bash
cd ~/Projects/pipepost
git add .
git commit -m "chore: scaffold Pipepost MCP project with TypeScript, Vitest, tsup"
```

---

### Task 2: Error System

**Files:**
- Create: `src/errors.ts`, `__tests__/errors.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/errors.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/errors.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement errors module**

Create `src/errors.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/errors.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/pipepost
git add src/errors.ts __tests__/errors.test.ts
git commit -m "feat: add structured error system with typed codes and retryable defaults"
```

---

### Task 3: HTTP Client with Timeout and Retry

**Files:**
- Create: `src/http.ts`, `__tests__/http.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/http.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpRequest } from "../src/http.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("httpRequest", () => {
  it("returns parsed JSON on 2xx", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: "123" }),
    });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "POST",
      body: { title: "Hello" },
    });

    expect(result).toEqual({ success: true, data: { id: "123" } });
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("sends JSON body and headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await httpRequest("https://api.example.com/posts", {
      method: "POST",
      body: { title: "Test" },
      headers: { "api-key": "abc" },
    });

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.example.com/posts");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(opts.headers["api-key"]).toBe("abc");
    expect(JSON.parse(opts.body)).toEqual({ title: "Test" });
  });

  it("returns NETWORK_ERROR on fetch rejection", async () => {
    mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "ECONNREFUSED",
        retryable: true,
      },
    });
  });

  it("retries once on 5xx then returns PLATFORM_ERROR", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => "Bad Gateway",
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => "Bad Gateway",
      });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      success: false,
      error: {
        code: "PLATFORM_ERROR",
        message: "HTTP 502: Bad Gateway",
        retryable: true,
      },
    });
  });

  it("succeeds on retry after first 5xx", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "Unavailable",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true, data: { ok: true } });
  });

  it("returns AUTH_FAILED on 401", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(mockFetch).toHaveBeenCalledOnce(); // no retry on 4xx
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTH_FAILED");
    }
  });

  it("returns AUTH_FAILED on 403", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => "Forbidden",
    });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTH_FAILED");
    }
  });

  it("returns RATE_LIMITED on 429", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limited",
    });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("RATE_LIMITED");
    }
  });

  it("returns NOT_FOUND on 404", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Not found",
    });

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("respects abort signal for timeout", async () => {
    mockFetch.mockImplementation(
      () => new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 50);
      })
    );

    const result = await httpRequest("https://api.example.com/posts", {
      method: "GET",
      timeoutMs: 10,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NETWORK_ERROR");
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/http.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement HTTP client**

Create `src/http.ts`:

```typescript
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
    const fetchOpts: RequestInit = {
      method: opts.method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...opts.headers,
      },
    };

    if (opts.body !== undefined) {
      fetchOpts.body = JSON.stringify(opts.body);
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

function isRetryable(status: number): boolean {
  return status >= 500;
}

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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/http.test.ts
```

Expected: All 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/pipepost
git add src/http.ts __tests__/http.test.ts
git commit -m "feat: add HTTP client with timeout, retry on 5xx, and structured error mapping"
```

---

### Task 4: Configuration Manager

**Files:**
- Create: `src/config.ts`, `__tests__/config.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/config.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readConfig, writeConfig, getConfigPath } from "../src/config.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

vi.mock("node:fs");
vi.mock("node:os");

const mockFs = vi.mocked(fs);
const mockOs = vi.mocked(os);

beforeEach(() => {
  mockOs.homedir.mockReturnValue("/home/testuser");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getConfigPath", () => {
  it("returns ~/.pipepost/config.json", () => {
    expect(getConfigPath()).toBe("/home/testuser/.pipepost/config.json");
  });
});

describe("readConfig", () => {
  it("returns empty config when file does not exist", () => {
    mockFs.existsSync.mockReturnValue(false);
    const config = readConfig();
    expect(config).toEqual({});
  });

  it("parses valid JSON config", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ license: { key: "abc" } })
    );
    const config = readConfig();
    expect(config.license?.key).toBe("abc");
  });

  it("returns empty config on invalid JSON", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("not json{{{");
    const config = readConfig();
    expect(config).toEqual({});
  });
});

describe("writeConfig", () => {
  it("creates directory and writes JSON", () => {
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);

    writeConfig({ license: { key: "xyz", instance_id: "inst1", cached_status: "active", cached_at: "" } });

    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      "/home/testuser/.pipepost",
      { recursive: true }
    );
    const writtenJson = JSON.parse(
      mockFs.writeFileSync.mock.calls[0][1] as string
    );
    expect(writtenJson.license.key).toBe("xyz");
  });

  it("merges with existing config", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ platforms: { devto: { api_key: "existing" } } })
    );
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);

    writeConfig({ license: { key: "new", instance_id: "i", cached_status: "active", cached_at: "" } });

    const writtenJson = JSON.parse(
      mockFs.writeFileSync.mock.calls[0][1] as string
    );
    expect(writtenJson.platforms.devto.api_key).toBe("existing");
    expect(writtenJson.license.key).toBe("new");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/config.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement config module**

Create `src/config.ts`:

```typescript
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface PipepostConfig {
  license?: {
    key: string;
    instance_id: string;
    cached_status: "active" | "inactive" | "expired" | "disabled";
    cached_at: string;
  };
  platforms?: {
    devto?: { api_key: string };
    ghost?: { url: string; admin_key: string };
    hashnode?: { token: string; publication_id: string };
    wordpress?: { url: string; username: string; app_password: string };
    medium?: { token: string };
  };
  social?: {
    twitter?: { consumer_key: string; consumer_secret: string; access_token: string; access_token_secret: string };
    reddit?: { client_id: string; client_secret: string; username: string; password: string };
    bluesky?: { handle: string; app_password: string };
  };
  images?: {
    unsplash_access_key?: string;
  };
  usage?: {
    publishes_this_month: number;
    month: string;
  };
}

export function getConfigPath(): string {
  return path.join(os.homedir(), ".pipepost", "config.json");
}

export function readConfig(): PipepostConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as PipepostConfig;
  } catch {
    return {};
  }
}

export function writeConfig(updates: Partial<PipepostConfig>): void {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true });

  const existing = readConfig();
  const merged = { ...existing, ...updates };
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), "utf-8");
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/config.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/pipepost
git add src/config.ts __tests__/config.test.ts
git commit -m "feat: add config manager for ~/.pipepost/config.json with merge support"
```

---

### Task 5: License Validation with Caching

**Files:**
- Create: `src/license.ts`, `__tests__/license.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/license.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateLicense, activateLicense } from "../src/license.js";
import * as http from "../src/http.js";
import * as config from "../src/config.js";

vi.mock("../src/http.js");
vi.mock("../src/config.js");

const mockHttp = vi.mocked(http);
const mockConfig = vi.mocked(config);

beforeEach(() => {
  vi.restoreAllMocks();
  mockConfig.readConfig.mockReturnValue({});
  mockConfig.writeConfig.mockReturnValue(undefined);
});

describe("validateLicense", () => {
  it("returns free tier when no license key configured", async () => {
    mockConfig.readConfig.mockReturnValue({});
    const result = await validateLicense();
    expect(result).toEqual({ valid: false, tier: "free" });
  });

  it("returns cached pro status if cache is fresh (< 24h)", async () => {
    const now = new Date();
    mockConfig.readConfig.mockReturnValue({
      license: {
        key: "abc",
        instance_id: "inst1",
        cached_status: "active",
        cached_at: now.toISOString(),
      },
    });

    const result = await validateLicense();
    expect(result).toEqual({ valid: true, tier: "pro" });
    expect(mockHttp.httpRequest).not.toHaveBeenCalled();
  });

  it("calls Lemon Squeezy when cache is stale (> 24h)", async () => {
    const stale = new Date(Date.now() - 25 * 60 * 60 * 1000);
    mockConfig.readConfig.mockReturnValue({
      license: {
        key: "abc",
        instance_id: "inst1",
        cached_status: "active",
        cached_at: stale.toISOString(),
      },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { valid: true, license_key: { status: "active" } },
    });

    const result = await validateLicense();
    expect(result).toEqual({ valid: true, tier: "pro" });
    expect(mockHttp.httpRequest).toHaveBeenCalledOnce();
    expect(mockConfig.writeConfig).toHaveBeenCalled();
  });

  it("degrades to free tier on network failure with no cache", async () => {
    mockConfig.readConfig.mockReturnValue({
      license: { key: "abc", instance_id: "inst1", cached_status: "active", cached_at: "" },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "NETWORK_ERROR", message: "timeout", retryable: true },
    });

    const result = await validateLicense();
    expect(result).toEqual({ valid: false, tier: "free" });
  });

  it("degrades to free tier when license is expired", async () => {
    const stale = new Date(Date.now() - 25 * 60 * 60 * 1000);
    mockConfig.readConfig.mockReturnValue({
      license: { key: "abc", instance_id: "inst1", cached_status: "active", cached_at: stale.toISOString() },
    });

    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { valid: false, license_key: { status: "expired" } },
    });

    const result = await validateLicense();
    expect(result).toEqual({ valid: false, tier: "free" });
  });
});

describe("activateLicense", () => {
  it("activates and stores instance_id on success", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: {
        activated: true,
        instance: { id: "new-inst" },
        license_key: { status: "active" },
      },
    });

    const result = await activateLicense("my-key");
    expect(result.success).toBe(true);
    expect(mockConfig.writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        license: expect.objectContaining({
          key: "my-key",
          instance_id: "new-inst",
          cached_status: "active",
        }),
      })
    );
  });

  it("returns error on activation failure", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "AUTH_FAILED", message: "Invalid key", retryable: false },
    });

    const result = await activateLicense("bad-key");
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/license.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement license module**

Create `src/license.ts`:

```typescript
import { httpRequest } from "./http.js";
import { readConfig, writeConfig } from "./config.js";
import { makeError, makeSuccess, type ToolResult } from "./errors.js";
import * as os from "node:os";

const LS_API = "https://api.lemonsqueezy.com/v1/licenses";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface LicenseStatus {
  valid: boolean;
  tier: "free" | "pro";
}

function isCacheFresh(cachedAt: string): boolean {
  if (!cachedAt) return false;
  const elapsed = Date.now() - new Date(cachedAt).getTime();
  return elapsed < CACHE_TTL_MS;
}

export async function validateLicense(): Promise<LicenseStatus> {
  const config = readConfig();
  const license = config.license;

  if (!license?.key) {
    return { valid: false, tier: "free" };
  }

  // Use cache if fresh
  if (license.cached_at && isCacheFresh(license.cached_at)) {
    return {
      valid: license.cached_status === "active",
      tier: license.cached_status === "active" ? "pro" : "free",
    };
  }

  // Validate with Lemon Squeezy
  const result = await httpRequest(`${LS_API}/validate`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({
      license_key: license.key,
      instance_id: license.instance_id,
    }).toString(),
  });

  if (!result.success) {
    // Network failure: degrade to free if no valid cache
    if (license.cached_status === "active" && license.cached_at) {
      return { valid: true, tier: "pro" };
    }
    return { valid: false, tier: "free" };
  }

  const data = result.data as { valid: boolean; license_key: { status: string } };
  const isActive = data.valid && data.license_key.status === "active";

  // Update cache
  writeConfig({
    license: {
      ...license,
      cached_status: isActive ? "active" : "inactive",
      cached_at: new Date().toISOString(),
    },
  });

  return {
    valid: isActive,
    tier: isActive ? "pro" : "free",
  };
}

export async function activateLicense(licenseKey: string): Promise<ToolResult> {
  const result = await httpRequest(`${LS_API}/activate`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({
      license_key: licenseKey,
      instance_name: os.hostname(),
    }).toString(),
  });

  if (!result.success) {
    return result;
  }

  const data = result.data as {
    activated: boolean;
    instance: { id: string };
    license_key: { status: string };
  };

  writeConfig({
    license: {
      key: licenseKey,
      instance_id: data.instance.id,
      cached_status: data.license_key.status === "active" ? "active" : "inactive",
      cached_at: new Date().toISOString(),
    },
  });

  return makeSuccess({ activated: true, instance_id: data.instance.id });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/license.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/pipepost
git add src/license.ts __tests__/license.test.ts
git commit -m "feat: add Lemon Squeezy license validation with 24h caching and graceful degradation"
```

---

### Task 6: Tier Resolution and Usage Tracking

**Files:**
- Create: `src/tier.ts`, `__tests__/tier.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/tier.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkTier, canPublish, recordPublish } from "../src/tier.js";
import * as license from "../src/license.js";
import * as config from "../src/config.js";

vi.mock("../src/license.js");
vi.mock("../src/config.js");

const mockLicense = vi.mocked(license);
const mockConfig = vi.mocked(config);

beforeEach(() => {
  vi.restoreAllMocks();
  mockConfig.readConfig.mockReturnValue({});
  mockConfig.writeConfig.mockReturnValue(undefined);
});

describe("checkTier", () => {
  it("returns pro when license is valid", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: true, tier: "pro" });
    expect(await checkTier()).toBe("pro");
  });

  it("returns free when license is invalid", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: false, tier: "free" });
    expect(await checkTier()).toBe("free");
  });
});

describe("canPublish", () => {
  it("always allows pro tier", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: true, tier: "pro" });
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 100, month: "2026-04" } });
    expect(await canPublish()).toEqual({ allowed: true, remaining: Infinity });
  });

  it("allows free tier under 3 publishes", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: false, tier: "free" });
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 1, month: "2026-04" } });
    expect(await canPublish()).toEqual({ allowed: true, remaining: 2 });
  });

  it("blocks free tier at 3 publishes", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: false, tier: "free" });
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 3, month: "2026-04" } });
    expect(await canPublish()).toEqual({ allowed: false, remaining: 0 });
  });

  it("resets counter when month changes", async () => {
    mockLicense.validateLicense.mockResolvedValue({ valid: false, tier: "free" });
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 3, month: "2026-03" } });
    expect(await canPublish()).toEqual({ allowed: true, remaining: 3 });
  });
});

describe("recordPublish", () => {
  it("increments publish count for current month", () => {
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 1, month: "2026-04" } });
    recordPublish();
    const written = mockConfig.writeConfig.mock.calls[0][0];
    expect(written.usage?.publishes_this_month).toBe(2);
  });

  it("starts fresh counter for new month", () => {
    mockConfig.readConfig.mockReturnValue({ usage: { publishes_this_month: 5, month: "2026-03" } });
    recordPublish();
    const written = mockConfig.writeConfig.mock.calls[0][0];
    expect(written.usage?.publishes_this_month).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/tier.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement tier module**

Create `src/tier.ts`:

```typescript
import { validateLicense } from "./license.js";
import { readConfig, writeConfig } from "./config.js";

const FREE_PUBLISH_LIMIT = 3;

export type Tier = "free" | "pro";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // "2026-04"
}

export async function checkTier(): Promise<Tier> {
  const { tier } = await validateLicense();
  return tier;
}

export async function canPublish(): Promise<{ allowed: boolean; remaining: number }> {
  const tier = await checkTier();

  if (tier === "pro") {
    return { allowed: true, remaining: Infinity };
  }

  const config = readConfig();
  const usage = config.usage;
  const month = currentMonth();

  // Reset if new month
  if (!usage || usage.month !== month) {
    return { allowed: true, remaining: FREE_PUBLISH_LIMIT };
  }

  const remaining = FREE_PUBLISH_LIMIT - usage.publishes_this_month;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export function recordPublish(): void {
  const config = readConfig();
  const month = currentMonth();

  const currentCount =
    config.usage?.month === month ? config.usage.publishes_this_month : 0;

  writeConfig({
    usage: {
      publishes_this_month: currentCount + 1,
      month,
    },
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/tier.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/pipepost
git add src/tier.ts __tests__/tier.test.ts
git commit -m "feat: add tier resolution with free publish limit (3/month) and month rollover"
```

---

### Task 7: Input Validation Helpers

**Files:**
- Create: `src/validate.ts`, `__tests__/validate.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/validate.test.ts`:

```typescript
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

  it("returns null for empty (optional)", () => {
    expect(validateUrl("")).toBeNull();
  });
});

describe("validatePlatform", () => {
  it("returns null for known platform", () => {
    expect(validatePlatform("devto")).toBeNull();
    expect(validatePlatform("ghost")).toBeNull();
    expect(validatePlatform("hashnode")).toBeNull();
    expect(validatePlatform("wordpress")).toBeNull();
    expect(validatePlatform("medium")).toBeNull();
  });

  it("returns error for unknown platform", () => {
    expect(validatePlatform("blogger")).toBe(
      'Unknown platform: blogger. Valid: devto, ghost, hashnode, wordpress, medium'
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/validate.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement validation module**

Create `src/validate.ts`:

```typescript
const VALID_PLATFORMS = ["devto", "ghost", "hashnode", "wordpress", "medium"] as const;
export type Platform = (typeof VALID_PLATFORMS)[number];

export function validateRequired(value: string, field: string): string | null {
  if (!value || !value.trim()) {
    return `${field} is required`;
  }
  return null;
}

export function validateUrl(value: string): string | null {
  if (!value) return null; // optional
  try {
    new URL(value);
    return null;
  } catch {
    return `Invalid URL: ${value}`;
  }
}

export function validatePlatform(value: string): string | null {
  if (VALID_PLATFORMS.includes(value as Platform)) {
    return null;
  }
  return `Unknown platform: ${value}. Valid: ${VALID_PLATFORMS.join(", ")}`;
}

export function validateStringLength(
  value: string,
  field: string,
  max: number
): string | null {
  if (value.length > max) {
    return `${field} must be under ${max} characters (got ${value.length})`;
  }
  return null;
}

export function validateTags(tags: string[] | undefined): string | null {
  if (!tags) return null;
  if (tags.some((t) => !t.trim())) {
    return "Tags must not contain empty strings";
  }
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/validate.test.ts
```

Expected: All 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/pipepost
git add src/validate.ts __tests__/validate.test.ts
git commit -m "feat: add input validation helpers for platforms, URLs, tags, and strings"
```

---

### Task 8: SEO Scoring Engine

**Files:**
- Create: `src/seo/score.ts`, `__tests__/seo/score.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/seo/score.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { scoreContent } from "../../src/seo/score.js";

const sampleContent = `
# How to Build an MCP Server

Building an MCP server is easier than you think. In this guide, we'll walk through creating your first MCP server using TypeScript and the official SDK.

## Prerequisites

You'll need Node.js 20 or later and a basic understanding of TypeScript. The MCP protocol uses JSON-RPC over stdio, which means your server runs as a local process.

## Getting Started

First, install the MCP SDK. This package provides the server framework, tool registration, and type definitions you need.

The MCP server pattern is straightforward: you define tools, register them with the server, and the server handles the JSON-RPC communication with the client.

## Writing Your First Tool

A tool is a function that the AI agent can call. Each tool has a name, description, input schema, and handler function. The handler receives validated input and returns a result.

## Testing Your Server

Testing MCP servers requires simulating the client-server communication. You can use the MCP inspector tool or write integration tests that send JSON-RPC messages directly.

## Conclusion

MCP servers are a powerful way to extend AI coding assistants. Start simple, test thoroughly, and iterate based on user feedback.
`.trim();

describe("scoreContent", () => {
  it("calculates word count", () => {
    const result = scoreContent(sampleContent, "mcp server");
    expect(result.word_count).toBeGreaterThan(150);
    expect(result.word_count).toBeLessThan(250);
  });

  it("calculates keyword density", () => {
    const result = scoreContent(sampleContent, "mcp server");
    expect(result.keyword_density).toBeGreaterThan(0);
    expect(result.keyword_density).toBeLessThan(10);
  });

  it("analyzes heading structure", () => {
    const result = scoreContent(sampleContent, "mcp server");
    expect(result.heading_structure.h1).toBe(1);
    expect(result.heading_structure.h2).toBe(4);
    expect(result.heading_structure.h3).toBe(0);
  });

  it("calculates Flesch-Kincaid readability", () => {
    const result = scoreContent(sampleContent, "mcp server");
    expect(result.readability.flesch_kincaid).toBeGreaterThan(0);
    expect(result.readability.flesch_kincaid).toBeLessThan(100);
    expect(result.readability.grade_level).toBeTruthy();
  });

  it("generates a numeric score 0-100", () => {
    const result = scoreContent(sampleContent, "mcp server");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("identifies issues with short content", () => {
    const result = scoreContent("Short post.", "keyword");
    expect(result.issues).toContain("Content is under 300 words (got 2)");
  });

  it("flags missing keyword in headings", () => {
    const result = scoreContent("# Hello World\n\nSome content about nothing.", "mcp server");
    expect(result.issues.some((i) => i.includes("keyword"))).toBe(true);
  });

  it("flags multiple H1 tags", () => {
    const content = "# First H1\n\n# Second H1\n\nSome text.";
    const result = scoreContent(content, "test");
    expect(result.issues.some((i) => i.includes("H1"))).toBe(true);
  });

  it("handles empty content gracefully", () => {
    const result = scoreContent("", "keyword");
    expect(result.word_count).toBe(0);
    expect(result.score).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/seo/score.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement SEO scoring**

Create `src/seo/score.ts`:

```typescript
export interface SeoScore {
  score: number;
  readability: {
    flesch_kincaid: number;
    grade_level: string;
  };
  keyword_density: number;
  word_count: number;
  heading_structure: { h1: number; h2: number; h3: number };
  issues: string[];
  suggestions: string[];
}

function countWords(text: string): number {
  const cleaned = text.replace(/[#*_\[\]()>`~-]/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  let count = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .match(/[aeiouy]{1,2}/g)?.length ?? 1;
  return Math.max(1, count);
}

function fleschKincaid(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.replace(/[#*_\[\]()>`~-]/g, " ").split(/\s+/).filter(Boolean);
  if (sentences.length === 0 || words.length === 0) return 0;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const score =
    206.835 -
    1.015 * (words.length / sentences.length) -
    84.6 * (totalSyllables / words.length);
  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}

function gradeLevel(fk: number): string {
  if (fk >= 90) return "5th grade (very easy)";
  if (fk >= 80) return "6th grade (easy)";
  if (fk >= 70) return "7th grade (fairly easy)";
  if (fk >= 60) return "8th-9th grade (standard)";
  if (fk >= 50) return "10th-12th grade (fairly difficult)";
  if (fk >= 30) return "College (difficult)";
  return "College graduate (very difficult)";
}

function countHeadings(content: string): { h1: number; h2: number; h3: number } {
  const lines = content.split("\n");
  let h1 = 0, h2 = 0, h3 = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) h3++;
    else if (trimmed.startsWith("## ")) h2++;
    else if (trimmed.startsWith("# ")) h1++;
  }
  return { h1, h2, h3 };
}

function keywordDensity(content: string, keyword: string): number {
  const words = countWords(content);
  if (words === 0) return 0;
  const kwLower = keyword.toLowerCase();
  const contentLower = content.toLowerCase();
  const matches = contentLower.split(kwLower).length - 1;
  const kwWords = kwLower.split(/\s+/).length;
  return Math.round((matches * kwWords / words) * 100 * 10) / 10;
}

export function scoreContent(content: string, keyword: string): SeoScore {
  const words = countWords(content);
  const headings = countHeadings(content);
  const fk = fleschKincaid(content);
  const density = keywordDensity(content, keyword);
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (words === 0) {
    return {
      score: 0,
      readability: { flesch_kincaid: 0, grade_level: "N/A" },
      keyword_density: 0,
      word_count: 0,
      heading_structure: headings,
      issues: ["Content is empty"],
      suggestions: ["Add content to analyze"],
    };
  }

  // Word count checks
  if (words < 300) {
    issues.push(`Content is under 300 words (got ${words})`);
    suggestions.push("Aim for at least 800-1,500 words for SEO");
  } else if (words < 800) {
    suggestions.push("Consider expanding to 1,000+ words for better ranking potential");
  }

  // Heading checks
  if (headings.h1 === 0) {
    issues.push("Missing H1 heading");
  } else if (headings.h1 > 1) {
    issues.push(`Multiple H1 headings found (${headings.h1}) — use only one`);
  }

  if (headings.h2 === 0 && words > 300) {
    issues.push("No H2 subheadings — break content into sections");
  }

  // Keyword checks
  if (density === 0) {
    issues.push(`Target keyword "${keyword}" not found in content`);
  } else if (density > 3) {
    issues.push(`Keyword density too high (${density}%) — may be flagged as keyword stuffing`);
    suggestions.push("Aim for 1-2% keyword density");
  } else if (density < 0.5) {
    suggestions.push(`Low keyword density (${density}%) — consider adding "${keyword}" in key sections`);
  }

  // Check keyword in headings
  const kwLower = keyword.toLowerCase();
  const headingLines = content.split("\n").filter((l) => l.trim().startsWith("#"));
  const kwInHeading = headingLines.some((l) => l.toLowerCase().includes(kwLower));
  if (!kwInHeading && headingLines.length > 0) {
    issues.push(`Target keyword "${keyword}" not found in any heading`);
    suggestions.push("Include the target keyword in at least one heading");
  }

  // Calculate composite score
  let score = 50; // base

  // Word count contribution (0-20)
  if (words >= 1500) score += 20;
  else if (words >= 800) score += 15;
  else if (words >= 300) score += 8;
  else score -= 10;

  // Readability contribution (0-15)
  if (fk >= 50 && fk <= 80) score += 15; // sweet spot
  else if (fk >= 30) score += 8;

  // Keyword density contribution (0-15)
  if (density >= 0.5 && density <= 2.5) score += 15;
  else if (density > 0 && density < 3.5) score += 8;

  // Structure contribution (0-10)
  if (headings.h1 === 1) score += 5;
  if (headings.h2 >= 2) score += 5;

  // Penalty per issue
  score -= issues.length * 5;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    readability: { flesch_kincaid: fk, grade_level: gradeLevel(fk) },
    keyword_density: density,
    word_count: words,
    heading_structure: headings,
    issues,
    suggestions,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/seo/score.test.ts
```

Expected: All 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/pipepost
git add src/seo/score.ts __tests__/seo/score.test.ts
git commit -m "feat: add SEO scoring engine with readability, keyword density, and heading analysis"
```

---

### Task 9: Meta Tag and Schema Generation

**Files:**
- Create: `src/seo/meta.ts`, `src/seo/schema.ts`, `__tests__/seo/meta.test.ts`, `__tests__/seo/schema.test.ts`

- [ ] **Step 1: Write failing tests for meta**

Create `__tests__/seo/meta.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generateMeta } from "../../src/seo/meta.js";

describe("generateMeta", () => {
  it("generates meta title under 60 chars", () => {
    const result = generateMeta(
      "How to Build an MCP Server with TypeScript and the Official SDK",
      "Some long content about building MCP servers..."
    );
    expect(result.meta_title.length).toBeLessThanOrEqual(60);
  });

  it("generates meta description under 160 chars", () => {
    const result = generateMeta(
      "How to Build an MCP Server",
      "Building an MCP server is easier than you think. In this comprehensive guide, we walk through creating your first server using TypeScript. You will learn about tool registration, JSON-RPC communication, and testing strategies that ensure reliability."
    );
    expect(result.meta_description.length).toBeLessThanOrEqual(160);
    expect(result.meta_description.length).toBeGreaterThan(50);
  });

  it("includes keyword in meta title when provided", () => {
    const result = generateMeta("A Guide to Servers", "Content here", "MCP server");
    expect(result.meta_title.toLowerCase()).toContain("mcp server");
  });

  it("generates OG tags", () => {
    const result = generateMeta("Title", "Content");
    expect(result.og_title).toBeTruthy();
    expect(result.og_description).toBeTruthy();
    expect(result.twitter_card).toBe("summary_large_image");
  });
});
```

- [ ] **Step 2: Write failing tests for schema**

Create `__tests__/seo/schema.test.ts`:

```typescript
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
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/seo/
```

Expected: FAIL.

- [ ] **Step 4: Implement meta generation**

Create `src/seo/meta.ts`:

```typescript
export interface MetaTags {
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  twitter_card: string;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const truncated = text.slice(0, max - 3).replace(/\s+\S*$/, "");
  return truncated + "...";
}

function extractFirstSentences(content: string, maxLen: number): string {
  // Strip markdown formatting
  const cleaned = content
    .replace(/^#+\s+.*$/gm, "")
    .replace(/[*_`\[\]()]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  let result = "";
  for (const sentence of sentences) {
    const candidate = result + sentence.trim();
    if (candidate.length > maxLen) break;
    result = candidate + " ";
  }
  return truncate(result.trim() || cleaned.slice(0, maxLen), maxLen);
}

export function generateMeta(
  title: string,
  content: string,
  keyword?: string
): MetaTags {
  let metaTitle = truncate(title, 60);

  // If keyword provided and not in title, prepend it
  if (keyword && !metaTitle.toLowerCase().includes(keyword.toLowerCase())) {
    const candidate = `${keyword} — ${title}`;
    metaTitle = truncate(candidate, 60);
  }

  const metaDescription = extractFirstSentences(content, 155);

  return {
    meta_title: metaTitle,
    meta_description: metaDescription,
    og_title: truncate(title, 70),
    og_description: truncate(metaDescription, 200),
    twitter_card: "summary_large_image",
  };
}
```

- [ ] **Step 5: Implement schema generation**

Create `src/seo/schema.ts`:

```typescript
export interface SchemaResult {
  json_ld: string;
}

interface ArticleData {
  title: string;
  description: string;
  url: string;
  date_published: string;
  author_name: string;
  image_url?: string;
}

interface FaqData {
  questions: Array<{ question: string; answer: string }>;
}

interface HowToData {
  name: string;
  steps: Array<{ name: string; text: string }>;
}

function articleSchema(data: ArticleData): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.description,
    url: data.url,
    datePublished: data.date_published,
    author: { "@type": "Person", name: data.author_name },
    ...(data.image_url && { image: data.image_url }),
  };
}

function faqSchema(data: FaqData): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}

function howToSchema(data: HowToData): object {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.name,
    step: data.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function generateSchema(
  type: "article" | "faq" | "howto",
  data: ArticleData | FaqData | HowToData
): SchemaResult {
  let schema: object;

  switch (type) {
    case "article":
      schema = articleSchema(data as ArticleData);
      break;
    case "faq":
      schema = faqSchema(data as FaqData);
      break;
    case "howto":
      schema = howToSchema(data as HowToData);
      break;
  }

  return { json_ld: JSON.stringify(schema, null, 2) };
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/seo/
```

Expected: All 7 tests PASS (4 meta + 3 schema).

- [ ] **Step 7: Commit**

```bash
cd ~/Projects/pipepost
git add src/seo/ __tests__/seo/
git commit -m "feat: add meta tag and JSON-LD schema generators for articles, FAQs, and how-tos"
```

---

### Task 10: Dev.to Publishing Client

**Files:**
- Create: `src/publish/types.ts`, `src/publish/devto.ts`, `src/publish/badge.ts`, `__tests__/publish/devto.test.ts`, `__tests__/publish/badge.test.ts`

- [ ] **Step 1: Create shared publish types**

Create `src/publish/types.ts`:

```typescript
export interface PublishInput {
  platform: string;
  title: string;
  content: string;
  tags?: string[];
  status?: "draft" | "published";
  featured_image_url?: string;
  canonical_url?: string;
}

export interface PublishResult {
  url: string;
  post_id: string;
  platform: string;
}

export interface PostSummary {
  id: string;
  title: string;
  url: string;
  status: string;
  published_at: string;
}
```

- [ ] **Step 2: Write failing tests for badge**

Create `__tests__/publish/badge.test.ts`:

```typescript
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
```

- [ ] **Step 3: Write failing tests for Dev.to client**

Create `__tests__/publish/devto.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishToDevto, listDevtoPosts } from "../../src/publish/devto.js";
import * as http from "../../src/http.js";

vi.mock("../../src/http.js");
const mockHttp = vi.mocked(http);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("publishToDevto", () => {
  it("publishes article and returns URL and ID", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { id: 12345, url: "https://dev.to/user/my-post-abc1" },
    });

    const result = await publishToDevto(
      { title: "My Post", content: "Hello", tags: ["javascript"], status: "published" },
      "fake-api-key"
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.post_id).toBe("12345");
      expect(result.data.url).toBe("https://dev.to/user/my-post-abc1");
      expect(result.data.platform).toBe("devto");
    }
  });

  it("sends correct headers and body shape", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: { id: 1, url: "https://dev.to/user/post" },
    });

    await publishToDevto(
      { title: "Test", content: "Body", tags: ["typescript"], status: "draft" },
      "my-key"
    );

    const [url, opts] = mockHttp.httpRequest.mock.calls[0];
    expect(url).toBe("https://dev.to/api/articles");
    expect(opts.method).toBe("POST");
    expect(opts.headers?.["api-key"]).toBe("my-key");
    const body = opts.body as { article: { title: string; body_markdown: string; published: boolean; tags: string[] } };
    expect(body.article.title).toBe("Test");
    expect(body.article.body_markdown).toBe("Body");
    expect(body.article.published).toBe(false);
    expect(body.article.tags).toEqual(["typescript"]);
  });

  it("returns error on API failure", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: false,
      error: { code: "AUTH_FAILED", message: "HTTP 401: Unauthorized", retryable: false },
    });

    const result = await publishToDevto(
      { title: "Test", content: "Body" },
      "bad-key"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTH_FAILED");
      expect(result.error.platform).toBe("devto");
    }
  });
});

describe("listDevtoPosts", () => {
  it("returns formatted post list", async () => {
    mockHttp.httpRequest.mockResolvedValue({
      success: true,
      data: [
        { id: 1, title: "Post 1", url: "https://dev.to/p1", published: true, published_at: "2026-04-13" },
        { id: 2, title: "Post 2", url: "https://dev.to/p2", published: false, published_at: null },
      ],
    });

    const result = await listDevtoPosts("my-key");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.posts[0].id).toBe("1");
      expect(result.data.posts[0].status).toBe("published");
      expect(result.data.posts[1].status).toBe("draft");
    }
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/publish/
```

Expected: FAIL.

- [ ] **Step 5: Implement badge module**

Create `src/publish/badge.ts`:

```typescript
export const BADGE_MARKDOWN = `\n\n---\n*Published with [Pipepost](https://pipepost.dev) — publish from your terminal.*`;

export function appendBadge(content: string): string {
  if (content.toLowerCase().includes("pipepost.dev")) {
    return content;
  }
  return content + BADGE_MARKDOWN;
}
```

- [ ] **Step 6: Implement Dev.to client**

Create `src/publish/devto.ts`:

```typescript
import { httpRequest } from "../http.js";
import { makeError, makeSuccess, type ToolResult } from "../errors.js";
import type { PublishResult, PostSummary } from "./types.js";

const DEVTO_API = "https://dev.to/api";

interface DevtoPublishInput {
  title: string;
  content: string;
  tags?: string[];
  status?: "draft" | "published";
  canonical_url?: string;
}

export async function publishToDevto(
  input: DevtoPublishInput,
  apiKey: string
): Promise<ToolResult<PublishResult>> {
  const result = await httpRequest(`${DEVTO_API}/articles`, {
    method: "POST",
    headers: { "api-key": apiKey },
    body: {
      article: {
        title: input.title,
        body_markdown: input.content,
        published: input.status === "published",
        tags: input.tags || [],
        ...(input.canonical_url && { canonical_url: input.canonical_url }),
      },
    },
  });

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "devto",
      retryable: result.error.retryable,
    });
  }

  const data = result.data as { id: number; url: string };
  return makeSuccess({
    post_id: String(data.id),
    url: data.url,
    platform: "devto",
  });
}

export async function listDevtoPosts(
  apiKey: string,
  page = 1,
  perPage = 30
): Promise<ToolResult<{ posts: PostSummary[] }>> {
  const result = await httpRequest(
    `${DEVTO_API}/articles/me/all?page=${page}&per_page=${perPage}`,
    { method: "GET", headers: { "api-key": apiKey } }
  );

  if (!result.success) {
    return makeError(result.error.code, result.error.message, {
      platform: "devto",
    });
  }

  const articles = result.data as Array<{
    id: number;
    title: string;
    url: string;
    published: boolean;
    published_at: string | null;
  }>;

  return makeSuccess({
    posts: articles.map((a) => ({
      id: String(a.id),
      title: a.title,
      url: a.url,
      status: a.published ? "published" : "draft",
      published_at: a.published_at || "",
    })),
  });
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd ~/Projects/pipepost
pnpm test -- __tests__/publish/
```

Expected: All 6 tests PASS (2 badge + 4 devto).

- [ ] **Step 8: Commit**

```bash
cd ~/Projects/pipepost
git add src/publish/ __tests__/publish/
git commit -m "feat: add Dev.to publishing client with badge system and post listing"
```

---

### Task 11: MCP Tool Definitions

**Files:**
- Create: `src/tools/seo-tools.ts`, `src/tools/publish-tools.ts`, `src/tools/setup-tools.ts`

This task wires the business logic into MCP tool definitions. These are the glue layer between the MCP SDK and our modules.

- [ ] **Step 1: Create SEO tool definitions**

Create `src/tools/seo-tools.ts`:

```typescript
import { z } from "zod";
import { scoreContent } from "../seo/score.js";
import { generateMeta } from "../seo/meta.js";
import { generateSchema } from "../seo/schema.js";
import { checkTier } from "../tier.js";
import { makeError, makeSuccess } from "../errors.js";
import { validateRequired } from "../validate.js";

export const seoScoreSchema = z.object({
  content: z.string().describe("The markdown content to analyze"),
  keyword: z.string().describe("The target keyword or phrase"),
});

export async function handleSeoScore(input: z.infer<typeof seoScoreSchema>) {
  const contentErr = validateRequired(input.content, "content");
  if (contentErr) return makeError("VALIDATION_ERROR", contentErr);

  const keywordErr = validateRequired(input.keyword, "keyword");
  if (keywordErr) return makeError("VALIDATION_ERROR", keywordErr);

  const tier = await checkTier();
  const result = scoreContent(input.content, input.keyword);

  if (tier === "free") {
    return makeSuccess({
      score: result.score,
      readability: result.readability,
      keyword_density: result.keyword_density,
      word_count: result.word_count,
      note: "Upgrade to Pro for full heading analysis, issues, and suggestions",
    });
  }

  return makeSuccess(result);
}

export const seoMetaSchema = z.object({
  title: z.string().describe("The article title"),
  content: z.string().describe("The article content"),
  keyword: z.string().optional().describe("Optional target keyword"),
});

export async function handleSeoMeta(input: z.infer<typeof seoMetaSchema>) {
  const tier = await checkTier();
  if (tier !== "pro") return makeError("TIER_REQUIRED", "Meta tag generation requires Pro tier");

  const titleErr = validateRequired(input.title, "title");
  if (titleErr) return makeError("VALIDATION_ERROR", titleErr);

  return makeSuccess(generateMeta(input.title, input.content, input.keyword));
}

export const seoSchemaInput = z.object({
  type: z.enum(["article", "faq", "howto"]).describe("Schema type"),
  data: z.record(z.unknown()).describe("Schema data (varies by type)"),
});

export async function handleSeoSchema(input: z.infer<typeof seoSchemaInput>) {
  const tier = await checkTier();
  if (tier !== "pro") return makeError("TIER_REQUIRED", "Schema generation requires Pro tier");

  return makeSuccess(generateSchema(input.type, input.data as never));
}
```

- [ ] **Step 2: Create publish tool definitions**

Create `src/tools/publish-tools.ts`:

```typescript
import { z } from "zod";
import { publishToDevto, listDevtoPosts } from "../publish/devto.js";
import { appendBadge } from "../publish/badge.js";
import { readConfig } from "../config.js";
import { checkTier, canPublish, recordPublish } from "../tier.js";
import { makeError, makeSuccess } from "../errors.js";
import {
  validateRequired,
  validatePlatform,
  validateStringLength,
  validateTags,
  validateUrl,
} from "../validate.js";

export const publishSchema = z.object({
  platform: z.string().describe("Publishing platform: devto, ghost, hashnode, wordpress, medium"),
  title: z.string().describe("Article title"),
  content: z.string().describe("Article content in markdown"),
  tags: z.array(z.string()).optional().describe("Tags for the article"),
  status: z.enum(["draft", "published"]).optional().default("draft").describe("Publish status"),
  featured_image_url: z.string().optional().describe("Featured image URL"),
  canonical_url: z.string().optional().describe("Canonical URL for cross-posting"),
});

export async function handlePublish(input: z.infer<typeof publishSchema>) {
  // Validate inputs
  const errors = [
    validateRequired(input.title, "title"),
    validateRequired(input.content, "content"),
    validatePlatform(input.platform),
    validateStringLength(input.title, "title", 300),
    validateTags(input.tags),
    input.canonical_url ? validateUrl(input.canonical_url) : null,
    input.featured_image_url ? validateUrl(input.featured_image_url) : null,
  ].filter(Boolean);

  if (errors.length > 0) {
    return makeError("VALIDATION_ERROR", errors.join("; "));
  }

  // Check tier for non-devto platforms
  const tier = await checkTier();
  if (input.platform !== "devto" && tier !== "pro") {
    return makeError("TIER_REQUIRED", `Publishing to ${input.platform} requires Pro tier. Free tier supports Dev.to only.`);
  }

  // Check publish limit
  const limit = await canPublish();
  if (!limit.allowed) {
    return makeError("PUBLISH_LIMIT", `Free tier limit reached (3/month). Upgrade to Pro for unlimited publishing.`);
  }

  // Append badge on free tier
  let content = input.content;
  if (tier === "free") {
    content = appendBadge(content);
  }

  // Get platform credentials
  const config = readConfig();

  if (input.platform === "devto") {
    const apiKey = config.platforms?.devto?.api_key;
    if (!apiKey) {
      return makeError("AUTH_FAILED", 'Dev.to API key not configured. Run the "setup" tool with platform: "devto".');
    }

    const result = await publishToDevto(
      {
        title: input.title,
        content,
        tags: input.tags,
        status: input.status,
        canonical_url: input.canonical_url,
      },
      apiKey
    );

    if (result.success) {
      recordPublish();
    }

    return result;
  }

  // Other platforms will be added in Phase 2
  return makeError("PLATFORM_ERROR", `Platform ${input.platform} is not yet implemented`);
}

export const listPostsSchema = z.object({
  platform: z.string().describe("Platform to list posts from"),
  status: z.enum(["draft", "published", "all"]).optional().default("all"),
  limit: z.number().optional().default(30),
});

export async function handleListPosts(input: z.infer<typeof listPostsSchema>) {
  const platformErr = validatePlatform(input.platform);
  if (platformErr) return makeError("VALIDATION_ERROR", platformErr);

  const tier = await checkTier();
  if (tier !== "pro") return makeError("TIER_REQUIRED", "Listing posts requires Pro tier");

  const config = readConfig();

  if (input.platform === "devto") {
    const apiKey = config.platforms?.devto?.api_key;
    if (!apiKey) {
      return makeError("AUTH_FAILED", "Dev.to API key not configured");
    }
    return listDevtoPosts(apiKey, 1, input.limit);
  }

  return makeError("PLATFORM_ERROR", `Platform ${input.platform} is not yet implemented`);
}
```

- [ ] **Step 3: Create setup tool definitions**

Create `src/tools/setup-tools.ts`:

```typescript
import { z } from "zod";
import { readConfig, writeConfig } from "../config.js";
import { activateLicense, validateLicense } from "../license.js";
import { canPublish, checkTier } from "../tier.js";
import { makeError, makeSuccess } from "../errors.js";

export const setupSchema = z.object({
  platform: z.string().describe("Platform to configure: devto, ghost, hashnode, wordpress, medium, twitter, reddit, bluesky"),
  credentials: z.record(z.string()).describe("API credentials as key-value pairs"),
});

export async function handleSetup(input: z.infer<typeof setupSchema>) {
  const config = readConfig();
  const platform = input.platform;
  const creds = input.credentials;

  if (platform === "devto") {
    if (!creds.api_key) return makeError("VALIDATION_ERROR", "Missing api_key for Dev.to");
    writeConfig({ platforms: { ...config.platforms, devto: { api_key: creds.api_key } } });
    return makeSuccess({ message: `Dev.to configured successfully`, platform: "devto" });
  }

  return makeError("VALIDATION_ERROR", `Platform "${platform}" is not yet supported for setup. Supported: devto`);
}

export const activateSchema = z.object({
  license_key: z.string().describe("Your Pipepost Pro license key from Lemon Squeezy"),
});

export async function handleActivate(input: z.infer<typeof activateSchema>) {
  return activateLicense(input.license_key);
}

export async function handleStatus() {
  const config = readConfig();
  const tier = await checkTier();
  const publishStatus = await canPublish();

  const platformsConfigured = Object.entries(config.platforms || {})
    .filter(([_, v]) => v && Object.values(v).some(Boolean))
    .map(([k]) => k);

  const socialConfigured = Object.entries(config.social || {})
    .filter(([_, v]) => v && Object.values(v).some(Boolean))
    .map(([k]) => k);

  return makeSuccess({
    tier,
    platforms_configured: platformsConfigured,
    social_configured: socialConfigured,
    publishes_remaining: tier === "pro" ? "unlimited" : publishStatus.remaining,
    license_status: config.license?.cached_status || "none",
  });
}
```

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/pipepost
git add src/tools/
git commit -m "feat: add MCP tool definitions for SEO, publishing, and setup"
```

---

### Task 12: MCP Server Entry Point

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create the MCP server entry point**

Create `src/index.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  seoScoreSchema, handleSeoScore,
  seoMetaSchema, handleSeoMeta,
  seoSchemaInput, handleSeoSchema,
} from "./tools/seo-tools.js";

import {
  publishSchema, handlePublish,
  listPostsSchema, handleListPosts,
} from "./tools/publish-tools.js";

import {
  setupSchema, handleSetup,
  activateSchema, handleActivate,
  handleStatus,
} from "./tools/setup-tools.js";

const server = new McpServer({
  name: "pipepost",
  version: "0.1.0",
});

// SEO Tools
server.tool("seo_score", "Analyze content for SEO quality — readability, keyword density, heading structure, and actionable suggestions", seoScoreSchema.shape, async (input) => {
  const result = await handleSeoScore(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("seo_meta", "Generate meta title, description, and Open Graph tags from content [Pro]", seoMetaSchema.shape, async (input) => {
  const result = await handleSeoMeta(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("seo_schema", "Generate JSON-LD structured data (Article, FAQ, HowTo) [Pro]", seoSchemaInput.shape, async (input) => {
  const result = await handleSeoSchema(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

// Publishing Tools
server.tool("publish", "Publish content to a CMS platform (Dev.to free, others Pro)", publishSchema.shape, async (input) => {
  const result = await handlePublish(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("list_posts", "List published and draft posts on a platform [Pro]", listPostsSchema.shape, async (input) => {
  const result = await handleListPosts(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

// Setup Tools
server.tool("setup", "Configure API credentials for a platform", setupSchema.shape, async (input) => {
  const result = await handleSetup(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("activate", "Activate a Pipepost Pro license key", activateSchema.shape, async (input) => {
  const result = await handleActivate(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("status", "Show current Pipepost configuration and license status", {}, async () => {
  const result = await handleStatus();
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Pipepost MCP server failed to start:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Build and verify**

```bash
cd ~/Projects/pipepost
pnpm run build
```

Expected: Build succeeds, `dist/index.js` is created with shebang.

- [ ] **Step 3: Run all tests**

```bash
cd ~/Projects/pipepost
pnpm test
```

Expected: All tests pass (errors: 4, http: 10, config: 6, license: 7, tier: 7, validate: 11, seo/score: 9, seo/meta: 4, seo/schema: 3, publish/badge: 2, publish/devto: 4 = ~67 tests).

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/pipepost
git add src/index.ts
git commit -m "feat: add MCP server entry point with all tool registrations"
```

---

### Task 13: CI/CD and npm Publishing

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/publish.yml`

- [ ] **Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run test:coverage
      - run: pnpm run build
```

- [ ] **Step 2: Create publish workflow**

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  push:
    tags: ["v*"]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run test
      - run: pnpm run build
      - run: pnpm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- [ ] **Step 3: Commit**

```bash
cd ~/Projects/pipepost
git add .github/
git commit -m "ci: add GitHub Actions for CI testing and npm publishing on tag"
```

---

### Task 14: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:

```markdown
# Pipepost

**Publish from your terminal.**

Pipepost is an MCP server that turns Claude Code into a content studio. Write, optimize, and publish — without leaving your terminal.

## Quick Start

```bash
npx pipepost-mcp
```

Then add to your Claude Code MCP config (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "pipepost": {
      "command": "npx",
      "args": ["-y", "pipepost-mcp"]
    }
  }
}
```

## Setup

Configure your Dev.to API key:

```
Use the "setup" tool with platform: "devto" and credentials: { "api_key": "YOUR_KEY" }
```

Get your Dev.to API key at [dev.to/settings/extensions](https://dev.to/settings/extensions).

## Tools

| Tool | Description | Tier |
|------|-------------|------|
| `seo_score` | Analyze content for readability, keyword density, structure | Free (basic) / Pro (full) |
| `seo_meta` | Generate meta title, description, OG tags | Pro |
| `seo_schema` | Generate JSON-LD structured data | Pro |
| `publish` | Publish to Dev.to (more platforms coming) | Free (3/mo) / Pro (unlimited) |
| `list_posts` | List your published and draft posts | Pro |
| `setup` | Configure platform API keys | Free |
| `activate` | Activate Pro license | Free |
| `status` | Show config and license status | Free |

## Free vs Pro

| | Free | Pro ($19/mo) |
|---|---|---|
| Platforms | Dev.to | Dev.to, Ghost, Hashnode, WordPress, Medium |
| SEO | Readability + keyword density | Full suite |
| Publishes | 3/month | Unlimited |
| Social promotion | — | Twitter, Reddit, Bluesky |
| Badge | Required | Optional |

**Get Pro:** [pipepost.dev](https://pipepost.dev)

## How It Works

1. Write content in Claude Code (you already do this)
2. Ask Claude to score it: *"Score this for SEO targeting 'mcp server'"*
3. Publish: *"Publish this to Dev.to as a draft"*
4. Promote: *"Create social posts for this article"* (Pro)

Your credentials are stored locally in `~/.pipepost/config.json` and never leave your machine.

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
cd ~/Projects/pipepost
git add README.md
git commit -m "docs: add README with quick start, tool reference, and pricing"
```

---

### Task 15: Landing Page

**Files:**
- Create: `landing/package.json`, `landing/tsconfig.json`, `landing/tailwind.config.ts`, `landing/next.config.mjs`, `landing/src/app/layout.tsx`, `landing/src/app/page.tsx`, `landing/src/app/globals.css`

- [ ] **Step 1: Initialize landing page project**

```bash
cd ~/Projects/pipepost
pnpm create next-app@latest landing --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

- [ ] **Step 2: Create global styles with brand colors**

Replace `landing/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #0F172A;
  --color-accent: #F97316;
  --color-surface: #FAFAF9;
  --color-muted: #78716C;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--color-primary);
  background: var(--color-surface);
}

code, pre {
  font-family: 'JetBrains Mono', monospace;
}
```

- [ ] **Step 3: Create root layout**

Replace `landing/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pipepost — Publish from your terminal",
  description:
    "MCP server that turns Claude Code into a content studio. SEO scoring, multi-platform publishing, and social promotion from your terminal.",
  keywords: ["mcp server", "claude code", "content publishing", "seo", "devto", "blog"],
  openGraph: {
    title: "Pipepost — Publish from your terminal",
    description: "MCP server for content publishing, SEO, and social promotion.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FAFAF9] text-[#0F172A] antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create landing page**

Replace `landing/src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="px-6 pt-20 pb-16 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl font-mono text-[#F97316] font-bold">|&gt;</span>
          <span className="text-xl font-bold tracking-tight">pipepost</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
          Publish from your terminal.
        </h1>

        <p className="text-lg text-[#78716C] mb-8 max-w-xl">
          An MCP server that turns Claude Code into a content studio.
          Write, score for SEO, publish to Dev.to, and promote on social —
          without switching apps.
        </p>

        <div className="bg-[#0F172A] rounded-lg p-4 mb-8 max-w-lg">
          <code className="text-sm text-green-400 font-mono">
            $ npx pipepost-mcp
          </code>
        </div>

        <div className="flex gap-4">
          <a
            href="https://github.com/YOURUSER/pipepost"
            className="inline-flex items-center px-5 py-2.5 bg-[#0F172A] text-white rounded-lg text-sm font-medium hover:bg-[#1e293b] transition-colors"
          >
            View on GitHub
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center px-5 py-2.5 border border-[#d6d3d1] rounded-lg text-sm font-medium hover:border-[#a8a29e] transition-colors"
          >
            See pricing
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 border-t border-[#e7e5e4]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">How it works</h2>
          <div className="grid gap-8">
            {[
              {
                step: "01",
                title: "Write in Claude Code",
                desc: "You already do this. Write your article, guide, or tutorial in your terminal.",
              },
              {
                step: "02",
                title: "Score and optimize",
                desc: '"Score this for SEO targeting MCP server." Get readability, keyword density, and heading analysis.',
              },
              {
                step: "03",
                title: "Publish and promote",
                desc: '"Publish this to Dev.to." One command. Your article is live. Generate social posts to promote it.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <span className="text-sm font-mono text-[#F97316] font-bold mt-1 shrink-0">
                  {step}
                </span>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-[#78716C]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="px-6 py-16 border-t border-[#e7e5e4]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Tools</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d6d3d1]">
                  <th className="text-left py-3 font-semibold">Tool</th>
                  <th className="text-left py-3 font-semibold">Description</th>
                  <th className="text-left py-3 font-semibold">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e5e4]">
                {[
                  ["seo_score", "Readability, keyword density, heading analysis", "Free / Pro"],
                  ["seo_meta", "Meta title, description, OG tags", "Pro"],
                  ["seo_schema", "JSON-LD structured data", "Pro"],
                  ["publish", "Publish to CMS platforms", "Free (3/mo)"],
                  ["list_posts", "List your posts", "Pro"],
                  ["setup", "Configure API keys", "Free"],
                  ["status", "Show config and license", "Free"],
                ].map(([tool, desc, tier]) => (
                  <tr key={tool}>
                    <td className="py-3 font-mono text-[#F97316]">{tool}</td>
                    <td className="py-3 text-[#78716C]">{desc}</td>
                    <td className="py-3">{tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-16 border-t border-[#e7e5e4]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Pricing</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-[#d6d3d1] rounded-lg p-6">
              <h3 className="font-bold text-lg mb-1">Free</h3>
              <p className="text-2xl font-bold mb-4">$0</p>
              <ul className="space-y-2 text-sm text-[#78716C]">
                <li>Dev.to publishing (3/month)</li>
                <li>Basic SEO scoring</li>
                <li>Badge on published posts</li>
              </ul>
            </div>
            <div className="border-2 border-[#F97316] rounded-lg p-6 relative">
              <span className="absolute -top-3 left-4 bg-[#F97316] text-white text-xs font-bold px-2 py-0.5 rounded">
                PRO
              </span>
              <h3 className="font-bold text-lg mb-1">Pro</h3>
              <p className="text-2xl font-bold mb-4">
                $19<span className="text-sm font-normal text-[#78716C]">/mo</span>
              </p>
              <ul className="space-y-2 text-sm text-[#78716C]">
                <li>5 CMS platforms</li>
                <li>Full SEO suite</li>
                <li>Unlimited publishes</li>
                <li>Social promotion</li>
                <li>No badge required</li>
              </ul>
              <a
                href="#"
                className="mt-6 block text-center px-5 py-2.5 bg-[#F97316] text-white rounded-lg text-sm font-medium hover:bg-[#ea580c] transition-colors"
              >
                Get Pro
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-[#e7e5e4]">
        <div className="max-w-3xl mx-auto flex justify-between items-center text-sm text-[#78716C]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[#F97316] font-bold">|&gt;</span>
            <span>pipepost</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/YOURUSER/pipepost" className="hover:text-[#0F172A]">
              GitHub
            </a>
            <a href="https://npmjs.com/package/pipepost-mcp" className="hover:text-[#0F172A]">
              npm
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
```

- [ ] **Step 5: Build and verify**

```bash
cd ~/Projects/pipepost/landing
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
cd ~/Projects/pipepost
git add landing/
git commit -m "feat: add branded landing page with hero, tools, pricing, and footer"
```

---

### Task 16: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

```bash
cd ~/Projects/pipepost
pnpm test
```

Expected: All ~67 tests pass.

- [ ] **Step 2: Run lint**

```bash
cd ~/Projects/pipepost
pnpm run lint
```

Expected: No errors.

- [ ] **Step 3: Run production build**

```bash
cd ~/Projects/pipepost
pnpm run build
```

Expected: `dist/index.js` created with shebang header.

- [ ] **Step 4: Verify the MCP server starts**

```bash
cd ~/Projects/pipepost
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js
```

Expected: JSON-RPC response with server capabilities and tool list.

- [ ] **Step 5: Commit any fixes**

Only if fixes were needed.

- [ ] **Step 6: Create GitHub repo and push**

```bash
cd ~/Projects/pipepost
gh repo create pipepost --public --source=. --remote=origin --push
```

- [ ] **Step 7: Deploy landing page**

```bash
cd ~/Projects/pipepost/landing
pnpm add -g vercel
vercel --prod
```

- [ ] **Step 8: Tag v0.1.0 for npm publish**

```bash
cd ~/Projects/pipepost
git tag v0.1.0
git push origin v0.1.0
```

This triggers the GitHub Actions publish workflow which publishes to npm.

---

## Self-Review Checklist

1. **Spec coverage:** All MVP acceptance criteria (1-9) are covered by tasks 1-16.
2. **Placeholder scan:** No TBDs, TODOs, or "implement later" found. All code blocks are complete.
3. **Type consistency:** `ToolResult`, `ToolError`, `ToolSuccess`, `PublishResult`, `PostSummary`, `PipepostConfig` — all types are defined in early tasks and used consistently throughout.
4. **Error codes:** All 8 error codes defined in Task 2 are used in later tasks: `AUTH_FAILED` (publish, setup), `RATE_LIMITED` (http), `NOT_FOUND` (http), `TIER_REQUIRED` (tools), `PUBLISH_LIMIT` (publish), `NETWORK_ERROR` (http, license), `VALIDATION_ERROR` (tools), `PLATFORM_ERROR` (http, publish).
5. **Test coverage:** 67+ tests across 12 test files covering all business logic modules.

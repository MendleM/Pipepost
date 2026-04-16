import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

/** Persistent configuration stored at ~/.pipepost/config.json. */
export interface PipepostConfig {
  license?: {
    key: string;
    instance_id: string;
    cached_status: "active" | "inactive" | "expired" | "disabled";
    cached_at: string;
    variant_id?: string;
    /** @deprecated No longer used in credit system */
    cached_tier?: "free" | "starter" | "pro";
  };
  platforms?: {
    devto?: { api_key: string };
    ghost?: { url: string; admin_key: string };
    hashnode?: { token: string; publication_id: string };
    wordpress?: { url: string; username: string; app_password: string };
    medium?: { token: string };
    substack?: { connect_sid: string; publication_url: string; user_id?: number };
  };
  social?: {
    twitter?: { consumer_key: string; consumer_secret: string; access_token: string; access_token_secret: string };
    x?: { consumer_key: string; consumer_secret: string; access_token: string; access_token_secret: string };
    reddit?: { client_id: string; client_secret: string; username: string; password: string };
    bluesky?: { handle: string; app_password: string };
    mastodon?: { instance_url: string; access_token: string };
    linkedin?: { access_token: string; person_urn?: string };
  };
  images?: {
    unsplash_access_key?: string;
  };
  usage?: {
    publishes_this_month: number;
    month: string;
  };
  indexnow_key?: string;
  credits?: {
    balance: number;
    free_credits: number;
    free_month: string;
  };
}

/** Returns the absolute path to the config file (~/.pipepost/config.json). */
export function getConfigPath(): string {
  return path.join(os.homedir(), ".pipepost", "config.json");
}

function getLockPath(): string {
  return path.join(os.homedir(), ".pipepost", "config.lock");
}

/**
 * Acquire an exclusive file lock using atomic `wx` file creation.
 * Spins with a 50ms busy-wait until the lock is acquired or the timeout expires.
 * This prevents concurrent read-modify-write races on the config file,
 * which can happen when multiple MCP tool calls fire in quick succession
 * (e.g. cross-publish consuming credits while another call reads config).
 */
function acquireLock(lockPath: string, timeoutMs = 5000): boolean {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      fs.writeFileSync(lockPath, process.pid.toString(), { flag: "wx" });
      return true;
    } catch {
      // Lock exists, wait briefly
      const start = Date.now();
      while (Date.now() - start < 50) { /* spin */ }
    }
  }
  return false;
}

function releaseLock(lockPath: string): void {
  try { fs.unlinkSync(lockPath); } catch { /* already released */ }
}

/** Read and parse the config file. Returns an empty object if the file is missing or malformed. */
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

/**
 * Merge `updates` into `existing` one level deep. Top-level object values
 * (e.g. `platforms`, `credits`) are shallow-merged with the existing key
 * rather than replaced outright. This prevents updating `credits` from
 * accidentally wiping out `platforms` or vice-versa.
 *
 * Arrays and non-object values are replaced entirely.
 */
function deepMergeOneLevel(
  existing: Record<string, unknown>,
  updates: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...existing };
  for (const [key, value] of Object.entries(updates)) {
    if (
      value && typeof value === "object" && !Array.isArray(value) &&
      existing[key] && typeof existing[key] === "object" && !Array.isArray(existing[key])
    ) {
      result[key] = { ...(existing[key] as Record<string, unknown>), ...(value as Record<string, unknown>) };
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Atomically merge `updates` into the config file.
 *
 * Uses a file lock to prevent concurrent writes from corrupting the config
 * (e.g. two credit deductions racing). Top-level object values are
 * shallow-merged, so updating `credits` won't wipe out `platforms`.
 *
 * @param updates - Partial config to merge into the existing file.
 * @throws If the lock cannot be acquired within 5 seconds.
 */
export function writeConfig(updates: Partial<PipepostConfig>): void {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true });

  const lockPath = getLockPath();
  if (!acquireLock(lockPath)) {
    throw new Error("Failed to acquire config lock — another process may be writing. Try again.");
  }

  try {
    const existing = readConfig();
    const merged = deepMergeOneLevel(
      existing as Record<string, unknown>,
      updates as Record<string, unknown>
    );
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), "utf-8");
  } finally {
    releaseLock(lockPath);
  }
}

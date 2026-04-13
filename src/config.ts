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

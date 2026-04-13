import { httpRequest } from "./http.js";
import { readConfig, writeConfig } from "./config.js";
import { makeSuccess, type ToolResult } from "./errors.js";
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

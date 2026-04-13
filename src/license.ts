import { httpRequest } from "./http.js";
import { readConfig, writeConfig } from "./config.js";
import { makeSuccess, type ToolResult } from "./errors.js";
import { addCredits } from "./credits.js";
import * as os from "node:os";

const LS_API = "https://api.lemonsqueezy.com/v1/licenses";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Lemon Squeezy variant IDs — set these after creating products
// Can also be overridden via environment variables
const STARTER_VARIANT_IDS = new Set(
  (process.env.PIPEPOST_STARTER_VARIANTS ?? "").split(",").filter(Boolean)
);
const PRO_VARIANT_IDS = new Set(
  (process.env.PIPEPOST_PRO_VARIANTS ?? "").split(",").filter(Boolean)
);
const POWER_VARIANT_IDS = new Set(
  (process.env.PIPEPOST_POWER_VARIANTS ?? "").split(",").filter(Boolean)
);

/** Result of a license validation check. */
export interface LicenseStatus {
  /** Whether the license is currently active. */
  valid: boolean;
  /** Number of credits the license variant grants. 0 if invalid. */
  credits: number;
}

function variantToCredits(variantId?: string): number {
  if (!variantId) return 30; // Legacy: no variant means pre-tiering license → treat as pro
  if (POWER_VARIANT_IDS.has(variantId)) return 100;
  if (PRO_VARIANT_IDS.has(variantId)) return 30;
  if (STARTER_VARIANT_IDS.has(variantId)) return 10;
  return 30; // Unknown variant defaults to pro (safest for paying customers)
}

function isCacheFresh(cachedAt: string): boolean {
  if (!cachedAt) return false;
  const elapsed = Date.now() - new Date(cachedAt).getTime();
  return elapsed < CACHE_TTL_MS;
}

/**
 * Validate the stored license key against Lemon Squeezy.
 *
 * Uses a 24-hour cache to avoid hitting the API on every call. Falls back
 * to the cached status on network failure if the cache was previously active.
 */
export async function validateLicense(): Promise<LicenseStatus> {
  const config = readConfig();
  const license = config.license;

  if (!license?.key) {
    return { valid: false, credits: 0 };
  }

  // Use cache if fresh
  if (license.cached_at && isCacheFresh(license.cached_at)) {
    return {
      valid: license.cached_status === "active",
      credits: license.cached_status === "active" ? variantToCredits(license.variant_id) : 0,
    };
  }

  // Validate with Lemon Squeezy
  const result = await httpRequest(`${LS_API}/validate`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      license_key: license.key,
      instance_id: license.instance_id,
    }).toString(),
  });

  if (!result.success) {
    // Network failure: degrade if no valid cache
    if (license.cached_status === "active" && license.cached_at) {
      return { valid: true, credits: variantToCredits(license.variant_id) };
    }
    return { valid: false, credits: 0 };
  }

  const data = result.data as {
    valid: boolean;
    license_key: { status: string };
    meta?: { variant_id?: number };
  };
  const isActive = data.valid && data.license_key.status === "active";
  const variantId = data.meta?.variant_id?.toString() ?? license.variant_id;

  // Update cache
  writeConfig({
    license: {
      ...license,
      variant_id: variantId,
      cached_status: isActive ? "active" : "inactive",
      cached_at: new Date().toISOString(),
    },
  });

  return { valid: isActive, credits: isActive ? variantToCredits(variantId) : 0 };
}

/**
 * Activate a license key with Lemon Squeezy and add the corresponding credits.
 *
 * Stores the instance ID and variant in the config for future validation.
 * @param licenseKey - The license key purchased by the user.
 */
export async function activateLicense(licenseKey: string): Promise<ToolResult> {
  const result = await httpRequest(`${LS_API}/activate`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
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
    meta?: { variant_id?: number };
  };

  const variantId = data.meta?.variant_id?.toString();
  const creditsToAdd = variantToCredits(variantId);

  writeConfig({
    license: {
      key: licenseKey,
      instance_id: data.instance.id,
      variant_id: variantId,
      cached_status: data.license_key.status === "active" ? "active" : "inactive",
      cached_at: new Date().toISOString(),
    },
  });

  // Add credits from the purchased pack
  addCredits(creditsToAdd);

  return makeSuccess({ activated: true, instance_id: data.instance.id, credits_added: creditsToAdd });
}

import { z } from "zod";
import { readConfig, writeConfig } from "../config.js";
import { activateLicense } from "../license.js";
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

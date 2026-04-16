import { z } from "zod";
import { readConfig, writeConfig } from "../config.js";
import { activateLicense } from "../license.js";
import { getCredits } from "../credits.js";
import { makeError, makeSuccess } from "../errors.js";

/** Zod schema for the `setup` tool input. */
export const setupSchema = z.object({
  platform: z.string().describe("Platform to configure: devto, ghost, hashnode, wordpress, medium, substack, x, linkedin, reddit, bluesky, mastodon, unsplash"),
  credentials: z.record(z.string()).describe("API credentials as key-value pairs"),
});

/**
 * Store platform credentials in the config file.
 *
 * Validates that the required credential fields are present for the given
 * platform, then writes them to ~/.pipepost/config.json.
 */
export async function handleSetup(input: z.infer<typeof setupSchema>) {
  const config = readConfig();
  const platform = input.platform;
  const creds = input.credentials;

  if (platform === "devto") {
    if (!creds.api_key) return makeError("VALIDATION_ERROR", "Missing api_key for Dev.to");
    writeConfig({ platforms: { ...config.platforms, devto: { api_key: creds.api_key } } });
    return makeSuccess({ message: "Dev.to configured successfully", platform: "devto" });
  }

  if (platform === "ghost") {
    if (!creds.url || !creds.admin_key) return makeError("VALIDATION_ERROR", "Missing url or admin_key for Ghost");
    writeConfig({ platforms: { ...config.platforms, ghost: { url: creds.url, admin_key: creds.admin_key } } });
    return makeSuccess({ message: "Ghost configured successfully", platform: "ghost" });
  }

  if (platform === "hashnode") {
    if (!creds.token || !creds.publication_id) return makeError("VALIDATION_ERROR", "Missing token or publication_id for Hashnode");
    writeConfig({ platforms: { ...config.platforms, hashnode: { token: creds.token, publication_id: creds.publication_id } } });
    return makeSuccess({ message: "Hashnode configured successfully", platform: "hashnode" });
  }

  if (platform === "wordpress") {
    if (!creds.url || !creds.username || !creds.app_password) return makeError("VALIDATION_ERROR", "Missing url, username, or app_password for WordPress");
    writeConfig({ platforms: { ...config.platforms, wordpress: { url: creds.url, username: creds.username, app_password: creds.app_password } } });
    return makeSuccess({ message: "WordPress configured successfully", platform: "wordpress" });
  }

  if (platform === "medium") {
    if (!creds.token) return makeError("VALIDATION_ERROR", "Missing token for Medium");
    writeConfig({ platforms: { ...config.platforms, medium: { token: creds.token } } });
    return makeSuccess({ message: "Medium configured successfully", platform: "medium" });
  }

  if (platform === "substack") {
    if (!creds.connect_sid || !creds.publication_url) {
      return makeError(
        "VALIDATION_ERROR",
        "Missing connect_sid or publication_url for Substack. Sign in to Substack in your browser, copy the value of the `connect.sid` cookie (DevTools → Application → Cookies → substack.com), and pass your publication URL like https://you.substack.com. Optionally include user_id (numeric) to skip the profile lookup."
      );
    }
    const substack: { connect_sid: string; publication_url: string; user_id?: number } = {
      connect_sid: creds.connect_sid,
      publication_url: creds.publication_url.replace(/\/+$/, ""),
    };
    if (creds.user_id) {
      const parsed = Number(creds.user_id);
      if (Number.isFinite(parsed)) substack.user_id = parsed;
    }
    writeConfig({ platforms: { ...config.platforms, substack } });
    return makeSuccess({ message: "Substack configured successfully", platform: "substack" });
  }

  if (platform === "unsplash") {
    if (!creds.access_key) return makeError("VALIDATION_ERROR", "Missing access_key for Unsplash. Get one at https://unsplash.com/developers");
    writeConfig({ images: { ...config.images, unsplash_access_key: creds.access_key } });
    return makeSuccess({ message: "Unsplash configured successfully", platform: "unsplash" });
  }

  if (platform === "bluesky") {
    if (!creds.handle || !creds.app_password) {
      return makeError(
        "VALIDATION_ERROR",
        "Missing handle or app_password for Bluesky. Generate an app password at https://bsky.app/settings/app-passwords"
      );
    }
    writeConfig({ social: { ...config.social, bluesky: { handle: creds.handle, app_password: creds.app_password } } });
    return makeSuccess({ message: "Bluesky configured successfully", platform: "bluesky" });
  }

  if (platform === "mastodon") {
    if (!creds.instance_url || !creds.access_token) {
      return makeError(
        "VALIDATION_ERROR",
        "Missing instance_url or access_token for Mastodon. Create an application at https://<your-instance>/settings/applications with the write:statuses scope."
      );
    }
    writeConfig({ social: { ...config.social, mastodon: { instance_url: creds.instance_url, access_token: creds.access_token } } });
    return makeSuccess({ message: "Mastodon configured successfully", platform: "mastodon" });
  }

  if (platform === "linkedin") {
    if (!creds.access_token) {
      return makeError(
        "VALIDATION_ERROR",
        "Missing access_token for LinkedIn. Create an app at https://linkedin.com/developers, approve the 'Share on LinkedIn' product, and generate a member access token with the 'w_member_social' scope. Optionally supply person_urn to skip the /v2/userinfo lookup."
      );
    }
    const linkedin: { access_token: string; person_urn?: string } = { access_token: creds.access_token };
    if (creds.person_urn) linkedin.person_urn = creds.person_urn;
    writeConfig({ social: { ...config.social, linkedin } });
    return makeSuccess({ message: "LinkedIn configured successfully", platform: "linkedin" });
  }

  if (platform === "x" || platform === "twitter") {
    if (
      !creds.consumer_key ||
      !creds.consumer_secret ||
      !creds.access_token ||
      !creds.access_token_secret
    ) {
      return makeError(
        "VALIDATION_ERROR",
        "Missing OAuth 1.0a credentials for X. Create an app at https://developer.twitter.com with read+write permissions, then generate a user access token. Required: consumer_key, consumer_secret, access_token, access_token_secret."
      );
    }
    writeConfig({
      social: {
        ...config.social,
        x: {
          consumer_key: creds.consumer_key,
          consumer_secret: creds.consumer_secret,
          access_token: creds.access_token,
          access_token_secret: creds.access_token_secret,
        },
      },
    });
    return makeSuccess({ message: "X configured successfully", platform: "x" });
  }

  return makeError("VALIDATION_ERROR", `Platform "${platform}" is not supported. Supported: devto, ghost, hashnode, wordpress, medium, substack, unsplash, bluesky, mastodon, linkedin, x`);
}

/** Zod schema for the `activate` tool input. */
export const activateSchema = z.object({
  license_key: z.string().describe("Your Pipepost license key from Lemon Squeezy"),
});

/** Activate a purchased license key and add credits to the account. */
export async function handleActivate(input: z.infer<typeof activateSchema>) {
  return activateLicense(input.license_key);
}

/** Return current credit balances, configured platforms, and license status. */
export async function handleStatus() {
  const config = readConfig();
  const credits = getCredits();

  const platformsConfigured = Object.entries(config.platforms || {})
    .filter(([_, v]) => v && Object.values(v).some(Boolean))
    .map(([k]) => k);

  const socialConfigured = Object.entries(config.social || {})
    .filter(([_, v]) => v && Object.values(v).some(Boolean))
    .map(([k]) => k);

  return makeSuccess({
    credits: {
      purchased: credits.balance,
      free_remaining: credits.freeRemaining,
      total: credits.total,
    },
    platforms_configured: platformsConfigured,
    social_configured: socialConfigured,
    license_status: config.license?.cached_status || "none",
  });
}

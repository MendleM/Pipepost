#!/usr/bin/env node
/**
 * One-shot LinkedIn OAuth helper for Pipepost.
 *
 * Runs the 3-legged OAuth 2.0 flow end to end:
 *   1. Spins up a local HTTP server on 127.0.0.1:8765
 *   2. Opens the browser to LinkedIn's consent page
 *   3. Captures the redirect with the authorization code
 *   4. Exchanges the code for a member access token
 *   5. Prints the access_token + the exact Pipepost `setup` command to paste
 *      into Claude Code
 *
 * The client_secret is used only during the token exchange and is never
 * persisted or transmitted anywhere except to LinkedIn.
 *
 * Usage:
 *   LINKEDIN_CLIENT_ID=xxx LINKEDIN_CLIENT_SECRET=yyy node scripts/linkedin-auth.mjs
 *
 * If the env vars aren't set, you'll be prompted. Before running, make sure
 * http://localhost:8765/callback is listed in your LinkedIn app's
 * "Authorized redirect URLs" (app settings → Auth tab).
 */
import * as http from "node:http";
import * as crypto from "node:crypto";
import * as readline from "node:readline";
import { spawn } from "node:child_process";

const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = "w_member_social openid profile";
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ── Input collection ────────────────────────────────────────────────────────

async function promptHidden(question) {
  // We can't hide stdin input in a pure-Node portable way without a TTY trick.
  // LinkedIn client secrets aren't long-lived so echoing is an acceptable
  // trade-off for zero dependencies — and we recommend rotating after use.
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function getCredentials() {
  let clientId = process.env.LINKEDIN_CLIENT_ID;
  let clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId) {
    clientId = await promptHidden("LinkedIn Client ID: ");
  }
  if (!clientSecret) {
    console.log(
      "\nNote: the client secret will be echoed as you type. Rotate it after this flow completes."
    );
    clientSecret = await promptHidden("LinkedIn Client Secret: ");
  }
  if (!clientId || !clientSecret) {
    console.error("Client ID and secret are required. Aborting.");
    process.exit(1);
  }
  return { clientId, clientSecret };
}

// ── Browser launcher ────────────────────────────────────────────────────────

function openBrowser(url) {
  const platform = process.platform;
  const cmd =
    platform === "darwin"
      ? "open"
      : platform === "win32"
        ? "start"
        : "xdg-open";
  try {
    spawn(cmd, [url], { detached: true, stdio: "ignore" }).unref();
  } catch {
    // Non-fatal: we print the URL below either way.
  }
}

// ── Token exchange ──────────────────────────────────────────────────────────

async function exchangeCodeForToken({ code, clientId, clientSecret }) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `Token exchange failed (HTTP ${res.status}): ${JSON.stringify(data)}`
    );
  }
  if (!data.access_token) {
    throw new Error(`Token exchange response missing access_token: ${JSON.stringify(data)}`);
  }
  return data;
}

// ── /v2/userinfo lookup so we can print the person URN too ──────────────────

async function fetchPersonUrn(accessToken) {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return null; // Non-fatal: Pipepost will fetch it on first post.
  }
  const data = await res.json();
  return data.sub ? `urn:li:person:${data.sub}` : null;
}

// ── Main flow ───────────────────────────────────────────────────────────────

async function main() {
  const { clientId, clientSecret } = await getCredentials();

  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", SCOPE);

  // Capture the first callback and resolve with the code.
  const callbackResult = new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const returnedCode = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(
          `<h1>LinkedIn returned an error</h1><p>${error}: ${errorDescription ?? ""}</p>`
        );
        server.close();
        reject(new Error(`LinkedIn OAuth error: ${error} — ${errorDescription}`));
        return;
      }
      if (!returnedCode) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h1>Missing code</h1>");
        server.close();
        reject(new Error("Callback was missing the `code` parameter"));
        return;
      }
      if (returnedState !== state) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h1>State mismatch</h1><p>CSRF check failed.</p>");
        server.close();
        reject(new Error("Returned state did not match the one we sent (CSRF check failed)"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        `<!doctype html>
<html><head><title>Pipepost — LinkedIn auth complete</title></head>
<body style="font-family:system-ui;padding:2rem;max-width:40rem">
  <h1>Authorization captured.</h1>
  <p>You can close this tab. Return to your terminal to finish setup.</p>
</body></html>`
      );
      server.close();
      resolve(returnedCode);
    });

    server.listen(PORT, "127.0.0.1", () => {
      console.log(`\nListening on ${REDIRECT_URI}`);
      console.log("Opening LinkedIn consent page in your browser...");
      console.log(
        `If it doesn't open automatically, paste this into your browser:\n\n${authUrl.toString()}\n`
      );
      openBrowser(authUrl.toString());
    });

    server.on("error", reject);

    setTimeout(() => {
      server.close();
      reject(new Error(`No callback received within ${TIMEOUT_MS / 1000}s — aborting.`));
    }, TIMEOUT_MS);
  });

  const code = await callbackResult;
  console.log("Code received. Exchanging for access token...");

  const tokenResponse = await exchangeCodeForToken({ code, clientId, clientSecret });
  const personUrn = await fetchPersonUrn(tokenResponse.access_token);

  console.log("\n" + "=".repeat(72));
  console.log("  LinkedIn access token obtained.");
  console.log("=".repeat(72));
  console.log(`  access_token:  ${tokenResponse.access_token}`);
  if (personUrn) {
    console.log(`  person_urn:    ${personUrn}`);
  }
  console.log(`  expires_in:    ${tokenResponse.expires_in}s (~${Math.floor(tokenResponse.expires_in / 86400)} days)`);
  console.log(`  scope granted: ${tokenResponse.scope ?? "(not returned)"}`);
  console.log("=".repeat(72));
  console.log("\nNext: configure Pipepost. In Claude Code, run:\n");
  if (personUrn) {
    console.log(
      `  setup platform="linkedin" credentials={access_token: "${tokenResponse.access_token}", person_urn: "${personUrn}"}`
    );
  } else {
    console.log(
      `  setup platform="linkedin" credentials={access_token: "${tokenResponse.access_token}"}`
    );
  }
  console.log(
    "\nReminder: rotate the Client Secret in your LinkedIn app settings now that this flow is complete.\n"
  );
}

main().catch((err) => {
  console.error("\nFailed:", err.message);
  process.exit(1);
});

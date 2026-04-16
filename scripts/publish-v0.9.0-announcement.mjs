#!/usr/bin/env node
// Publishes content/v0.9.0-announcement.md to Dev.to as a draft from the brand account.
// Uses devto api_key from ~/.pipepost/config.json

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const config = JSON.parse(await readFile(join(homedir(), ".pipepost/config.json"), "utf8"));
const apiKey = config.platforms?.devto?.api_key;
if (!apiKey) {
  console.error("No devto api_key in ~/.pipepost/config.json");
  process.exit(1);
}

const body = await readFile(join(import.meta.dirname, "..", "content/v0.9.0-announcement.md"), "utf8");

const res = await fetch("https://dev.to/api/articles", {
  method: "POST",
  headers: {
    "api-key": apiKey,
    "content-type": "application/json",
    "user-agent": "pipepost-release-script/0.9.0",
  },
  body: JSON.stringify({
    article: {
      title: "Pipepost v0.9.0 — Substack publishing + the agent-loop transcript",
      published: false,
      body_markdown: body,
      tags: ["mcp", "claudecode", "substack", "typescript"],
      canonical_url: "https://pipepost.dev/blog/v0-9-0-substack-agent-loop",
      organization_id: undefined,
    },
  }),
});

const json = await res.json();
if (!res.ok) {
  console.error("Dev.to API error:", res.status, JSON.stringify(json, null, 2));
  process.exit(1);
}

console.log("✓ Draft created on Dev.to");
console.log("  ID:", json.id);
console.log("  URL:", json.url);
console.log("  Edit:", `https://dev.to/dashboard?article_id=${json.id}`);

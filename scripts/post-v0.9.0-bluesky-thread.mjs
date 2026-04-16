#!/usr/bin/env node
// Posts a 3-part Bluesky thread announcing v0.9.0 from @pipepost.bsky.social
// Uses bluesky handle + app_password from ~/.pipepost/config.json

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const config = JSON.parse(await readFile(join(homedir(), ".pipepost/config.json"), "utf8"));
const bsky = config.social?.bluesky;
if (!bsky?.handle || !bsky?.app_password) {
  console.error("Missing Bluesky handle/app_password in config");
  process.exit(1);
}

const PDS = "https://bsky.social";

// 1. Create session
const sessionRes = await fetch(`${PDS}/xrpc/com.atproto.server.createSession`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ identifier: bsky.handle, password: bsky.app_password }),
});
const session = await sessionRes.json();
if (!sessionRes.ok) {
  console.error("Session create failed:", session);
  process.exit(1);
}
const { accessJwt, did } = session;

// Auto-link bare URLs by detecting them and creating facets.
function buildFacets(text) {
  const facets = [];
  const urlRe = /https?:\/\/[^\s)]+/g;
  let m;
  const encoder = new TextEncoder();
  while ((m = urlRe.exec(text)) !== null) {
    const before = text.slice(0, m.index);
    const byteStart = encoder.encode(before).length;
    const byteEnd = byteStart + encoder.encode(m[0]).length;
    facets.push({
      index: { byteStart, byteEnd },
      features: [{ $type: "app.bsky.richtext.facet#link", uri: m[0] }],
    });
  }
  return facets;
}

const posts = [
  `Pipepost v0.9.0 is out.

Substack is now the 6th CMS publish target — Dev.to, Ghost, Hashnode, WordPress, Medium, and Substack. All 6 from one MCP server in Claude Code.

npx pipepost-mcp init`,

  `The bigger thing in this release is a transcript.

It shows what an agent-loop pipeline actually looks like — one prompt, ~90 seconds: audit, SEO score, fix, cross-publish 5 platforms, social posts, IndexNow.

https://github.com/MendleM/Pipepost/blob/main/docs/demo/agent-loop.md`,

  `Same flow done manually in browser tabs takes 45–90 minutes of context switching.

That gap is why agent-native tooling matters. Not a UI on top of an API — an MCP server that gives Claude the verbs to operate the entire publishing surface from the terminal.

MIT licensed. No telemetry.`,
];

let root = null;
let parent = null;
const results = [];

for (const text of posts) {
  const record = {
    $type: "app.bsky.feed.post",
    text,
    createdAt: new Date().toISOString(),
    facets: buildFacets(text),
  };
  if (root && parent) {
    record.reply = { root, parent };
  }

  const res = await fetch(`${PDS}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessJwt}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      repo: did,
      collection: "app.bsky.feed.post",
      record,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error("Post failed:", json);
    process.exit(1);
  }

  const ref = { uri: json.uri, cid: json.cid };
  if (!root) root = ref;
  parent = ref;
  results.push(ref);

  // Tiny pause between posts to keep ordering clean
  await new Promise((r) => setTimeout(r, 500));
}

const handle = bsky.handle;
const rootRkey = results[0].uri.split("/").pop();
console.log(`✓ Posted 3-part thread to @${handle}`);
console.log(`  https://bsky.app/profile/${handle}/post/${rootRkey}`);

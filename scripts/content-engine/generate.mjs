#!/usr/bin/env node
/**
 * Pipepost content engine.
 *
 * Picks the next pending entry from queue.json, drafts an article with
 * Claude Sonnet, runs a lightweight SEO pass, creates a Dev.to draft,
 * and writes social-promotion copy to scripts/content-engine/output/.
 *
 * Secrets (set as GitHub Action secrets or env vars locally):
 *   ANTHROPIC_API_KEY  — required, used for drafting
 *   DEVTO_API_KEY      — required, used for creating the Dev.to draft
 *
 * Behavior:
 *   - Never auto-publishes. Everything lands as a Dev.to DRAFT so the
 *     human reviews before it goes live.
 *   - Commits the generated markdown and the social copy back to the repo
 *     for audit / manual posting.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = path.join(__dirname, "queue.json");
const OUTPUT_DIR = path.join(__dirname, "output");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DEVTO_API_KEY = process.env.DEVTO_API_KEY;
const MODEL = process.env.CONTENT_MODEL ?? "claude-sonnet-4-5-20250929";

if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is required");
  process.exit(1);
}
if (!DEVTO_API_KEY) {
  console.error("DEVTO_API_KEY is required");
  process.exit(1);
}

/** Load the queue and return the first pending entry plus its index. */
function pickNextEntry() {
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
  const index = queue.findIndex((entry) => entry.status === "pending");
  if (index === -1) {
    console.log("No pending entries in queue. Nothing to do.");
    process.exit(0);
  }
  return { queue, index, entry: queue[index] };
}

/** Call the Anthropic Messages API and return the completed text. */
async function anthropic(systemPrompt, userPrompt, maxTokens = 4096) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  const block = data.content?.find((c) => c.type === "text");
  if (!block) throw new Error("No text content in Anthropic response");
  return block.text;
}

const ARTICLE_SYSTEM = `You are a senior technical writer for Pipepost, an MCP server that turns Claude Code into a complete content publishing pipeline — SEO scoring, multi-platform publishing (Dev.to, Ghost, Hashnode, WordPress, Medium), and social promotion.

Your articles help developers do real work. They are concrete, include code blocks where relevant, and never resort to marketing fluff. Voice: clear, direct, slightly dry. Avoid "in today's fast-paced world", "imagine a world where", "dive into", "unlock the power of", and every other LLM-article cliché.

Every article MUST:
- Target a specific search keyword the reader is likely to Google
- Open with the problem in the first 2 sentences
- Include at least one concrete code example or command
- Mention Pipepost exactly once as a natural solution (not a sales pitch)
- End with a one-line CTA: "Try it: npx pipepost-mcp init — see https://pipepost.dev"
- Use markdown: # title, then intro, then ## sections, then ### subsections
- Be 1200–1700 words`;

function articlePrompt(entry) {
  return `Write a blog post targeting the search keyword: "${entry.keyword}"

Angle: ${entry.angle}

Output ONLY the markdown article. No preamble, no meta-commentary. Start with the # title and go.`;
}

const SOCIAL_SYSTEM = `You generate platform-optimized promotion copy for a published technical article.
Each platform has distinct constraints:
- Twitter/X: a 5-7 tweet thread. First tweet is a hook under 280 chars. No em dashes.
- LinkedIn: one professional post, 800-1500 chars, lead with a concrete insight.
- Reddit: a post suitable for r/programming or r/webdev — title under 300 chars, body 200-500 words, no "check out my blog" energy.
- Bluesky: one post under 300 chars with a key takeaway and the link.
- Hacker News: a submission title under 80 chars that would actually land on /newest.`;

function socialPrompt(article, slug) {
  return `Article slug: ${slug}
Article markdown:

${article}

Generate promotion copy for Twitter, LinkedIn, Reddit, Bluesky, and Hacker News. Output format:

## Twitter thread
(tweets separated by blank lines)

## LinkedIn
(the post)

## Reddit
Title: ...
Body: ...

## Bluesky
(the post)

## Hacker News
Title: ...
`;
}

/**
 * Lightweight SEO check. Returns { score, issues[] } where score is 0-100.
 * Mirrors a subset of src/seo/score.ts so this script stays self-contained.
 */
function seoCheck(markdown, keyword) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = plain.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const keywordLower = keyword.toLowerCase();
  const occurrences = (plain.toLowerCase().match(new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
  const density = wordCount ? occurrences / wordCount : 0;

  const h1 = (markdown.match(/^# .+/m) ?? [null])[0];
  const h2Count = (markdown.match(/^## .+/gm) ?? []).length;

  const issues = [];
  let score = 100;

  if (wordCount < 1000) { score -= 20; issues.push(`word count low (${wordCount}, target 1200+)`); }
  if (wordCount > 2200) { score -= 10; issues.push(`word count high (${wordCount}, target <= 1800)`); }
  if (!h1) { score -= 15; issues.push("missing H1"); }
  if (h1 && !h1.toLowerCase().includes(keywordLower.split(" ")[0])) { score -= 5; issues.push("keyword not in H1"); }
  if (h2Count < 3) { score -= 10; issues.push(`only ${h2Count} H2s (target 3+)`); }
  if (occurrences < 3) { score -= 15; issues.push(`keyword appears only ${occurrences}x`); }
  if (density > 0.03) { score -= 10; issues.push(`keyword density too high (${(density * 100).toFixed(2)}%)`); }
  if (!markdown.includes("npx pipepost-mcp")) { score -= 10; issues.push("missing Pipepost CTA"); }

  return { score: Math.max(0, score), wordCount, issues };
}

/** Create a Dev.to draft via their API. */
async function createDevtoDraft({ title, bodyMarkdown, tags }) {
  const res = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: {
      "api-key": DEVTO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      article: {
        title,
        body_markdown: bodyMarkdown,
        published: false,
        tags: tags.slice(0, 4),
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dev.to API ${res.status}: ${body.slice(0, 500)}`);
  }
  return res.json();
}

function extractTitle(markdown) {
  const m = markdown.match(/^# (.+)$/m);
  return m ? m[1].trim() : "Untitled";
}

function deriveTags(keyword) {
  const stop = new Set(["a", "an", "the", "for", "to", "from", "of", "and", "in", "on", "at", "with", "by"]);
  const tokens = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((t) => t && !stop.has(t))
    .slice(0, 3);
  const base = new Set(tokens);
  base.add("mcp");
  base.add("webdev");
  return [...base].slice(0, 4);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const { queue, index, entry } = pickNextEntry();
  console.log(`▶ Generating: ${entry.slug} — "${entry.keyword}"`);

  let draft = await anthropic(ARTICLE_SYSTEM, articlePrompt(entry), 6000);
  let check = seoCheck(draft, entry.keyword);
  console.log(`  SEO pass 1: score=${check.score} words=${check.wordCount} issues=${check.issues.length}`);

  if (check.score < 80) {
    console.log("  Iterating once with SEO feedback…");
    const revisionPrompt = `Here is your previous draft:

---
${draft}
---

SEO issues to fix: ${check.issues.join("; ") || "tighten prose, add missing sections"}.

Rewrite the ENTIRE article addressing every issue. Keep the # title line.
Output ONLY the revised markdown.`;
    draft = await anthropic(ARTICLE_SYSTEM, revisionPrompt, 6000);
    check = seoCheck(draft, entry.keyword);
    console.log(`  SEO pass 2: score=${check.score} words=${check.wordCount} issues=${check.issues.length}`);
  }

  const title = extractTitle(draft);
  const tags = deriveTags(entry.keyword);

  console.log(`  Creating Dev.to draft — title: "${title}", tags: ${tags.join(", ")}`);
  const devto = await createDevtoDraft({ title, bodyMarkdown: draft, tags });
  console.log(`  Dev.to draft: ${devto.url ?? devto.id}`);

  console.log("  Generating social copy…");
  const social = await anthropic(SOCIAL_SYSTEM, socialPrompt(draft, entry.slug), 2000);

  const today = new Date().toISOString().slice(0, 10);
  const postPath = path.join(OUTPUT_DIR, `${today}-${entry.slug}.md`);
  const socialPath = path.join(OUTPUT_DIR, `${today}-${entry.slug}.social.md`);

  fs.writeFileSync(postPath, draft);
  fs.writeFileSync(
    socialPath,
    `# Social copy — ${title}\n\nDev.to draft: ${devto.url ?? "(see your Dev.to dashboard)"}\nLanding: https://pipepost.dev\n\nSEO score: ${check.score} · Word count: ${check.wordCount}\n\n---\n\n${social}\n`
  );

  // Mark entry done and write back
  queue[index] = {
    ...entry,
    status: "published",
    published_at: new Date().toISOString(),
    devto_id: devto.id,
    devto_url: devto.url ?? null,
    seo_score: check.score,
    word_count: check.wordCount,
  };
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + "\n");

  console.log(`✓ Done. Post -> ${postPath}`);
  console.log(`✓ Social -> ${socialPath}`);
  console.log(`✓ Review the Dev.to draft and click publish when you're happy with it.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

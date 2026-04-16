import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  seoScoreSchema, handleSeoScore,
  seoMetaSchema, handleSeoMeta,
  seoSchemaInput, handleSeoSchema,
  indexNowSchema, handleIndexNow,
} from "./tools/seo-tools.js";

import {
  coverImageSchema, handleCoverImage,
} from "./tools/image-tools.js";

import {
  publishSchema, handlePublish,
  listPostsSchema, handleListPosts,
  crossPublishSchema, handleCrossPublish,
} from "./tools/publish-tools.js";

import {
  setupSchema, handleSetup,
  activateSchema, handleActivate,
  handleStatus,
} from "./tools/setup-tools.js";

import {
  generateSocialPostsSchema, handleGenerateSocialPosts,
} from "./tools/social-tools.js";

import {
  frontmatterSchema, handleFrontmatter,
} from "./tools/frontmatter-tools.js";

import {
  repurposeSchema, handleRepurpose,
} from "./tools/repurpose-tools.js";

import {
  analyticsSchema, handleAnalytics,
} from "./tools/analytics-tools.js";

import {
  saveDraftSchema, handleSaveDraft,
  listDraftsSchema, handleListDrafts,
  getDraftSchema, handleGetDraft,
  deleteDraftSchema, handleDeleteDraft,
} from "./tools/draft-tools.js";

import {
  contentAuditSchema, handleContentAudit,
} from "./tools/audit-tools.js";

import {
  checkLinksSchema, handleCheckLinks,
} from "./tools/link-tools.js";

import {
  blueskyPostSchema, handleBlueskyPost,
  mastodonPostSchema, handleMastodonPost,
  blueskyMentionsSchema, handleBlueskyMentions,
  blueskySearchSchema, handleBlueskySearch,
  blueskyThreadSchema, handleBlueskyThread,
  blueskyReplySchema, handleBlueskyReply,
} from "./tools/broadcast-tools.js";

import { formatToolResponse } from "./format-response.js";
import {
  formatPublish,
  formatCrossPublish,
  formatListPosts,
  formatSeoScore,
  formatSeoMeta,
  formatSeoSchema,
  formatIndexNow,
  formatCoverImage,
  formatAnalytics,
  formatRepurpose,
  formatFrontmatter,
  formatSocialPosts,
  formatSetup,
  formatStatus,
  formatActivate,
} from "./format-response.js";

import {
  formatSaveDraft,
  formatListDrafts,
  formatGetDraft,
  formatDeleteDraft,
} from "./drafts/format.js";

import {
  formatContentAudit,
  formatLinkCheck,
} from "./audit/format.js";

const server = new McpServer({
  name: "pipepost",
  version: "0.7.2",
});

// SEO Tools
server.tool("seo_score", "Analyze content for SEO quality — basic scoring is free, full analysis with issues and suggestions requires credits", seoScoreSchema.shape, async (input) => {
  const parsed = seoScoreSchema.parse(input);
  const result = await handleSeoScore(parsed);
  return { content: [{ type: "text", text: formatToolResponse("seo_score", result, formatSeoScore) }] };
});

server.tool("seo_meta", "Generate meta title, description, and Open Graph tags from content [requires credits]", seoMetaSchema.shape, async (input) => {
  const parsed = seoMetaSchema.parse(input);
  const result = await handleSeoMeta(parsed);
  return { content: [{ type: "text", text: formatToolResponse("seo_meta", result, formatSeoMeta) }] };
});

server.tool("seo_schema", "Generate JSON-LD structured data (Article, FAQ, HowTo) [requires credits]", seoSchemaInput.shape, async (input) => {
  const parsed = seoSchemaInput.parse(input);
  const result = await handleSeoSchema(parsed);
  return { content: [{ type: "text", text: formatToolResponse("seo_schema", result, formatSeoSchema) }] };
});

server.tool("index_now", "Submit URLs to search engines for fast indexing via IndexNow protocol — FREE", indexNowSchema.shape, async (input) => {
  const parsed = indexNowSchema.parse(input);
  const result = await handleIndexNow(parsed);
  return { content: [{ type: "text", text: formatToolResponse("index_now", result, formatIndexNow) }] };
});

// Image Tools
server.tool("cover_image", "Search Unsplash for cover images with proper attribution — FREE", coverImageSchema.shape, async (input) => {
  const parsed = coverImageSchema.parse(input);
  const result = await handleCoverImage(parsed);
  return { content: [{ type: "text", text: formatToolResponse("cover_image", result, formatCoverImage) }] };
});

// Publishing Tools
server.tool("publish", "Publish content to a CMS platform (devto, ghost, hashnode, wordpress, medium) — costs 1 credit per publish", publishSchema.shape, async (input) => {
  const parsed = publishSchema.parse(input);
  const result = await handlePublish(parsed);
  return { content: [{ type: "text", text: formatToolResponse("publish", result, formatPublish) }] };
});

server.tool("list_posts", "List published and draft posts on a platform", listPostsSchema.shape, async (input) => {
  const parsed = listPostsSchema.parse(input);
  const result = await handleListPosts(parsed);
  return { content: [{ type: "text", text: formatToolResponse("list_posts", result, formatListPosts) }] };
});

server.tool("cross_publish", "Publish to multiple CMS platforms in one call — costs 1 credit", crossPublishSchema.shape, async (input) => {
  const parsed = crossPublishSchema.parse(input);
  const result = await handleCrossPublish(parsed);
  return { content: [{ type: "text", text: formatToolResponse("cross_publish", result, formatCrossPublish) }] };
});

// Frontmatter Tool (free)
server.tool("frontmatter", "Generate correctly-formatted frontmatter for any SSG or publishing platform (Hugo, Jekyll, Astro, Next.js, Dev.to, Hashnode, Ghost) — FREE", frontmatterSchema.shape, async (input) => {
  const parsed = frontmatterSchema.parse(input);
  const result = await handleFrontmatter(parsed);
  return { content: [{ type: "text", text: formatToolResponse("frontmatter", result, formatFrontmatter) }] };
});

// Social Tools
server.tool("generate_social_posts", "Generate platform-optimized social posts from an article (Twitter, Reddit, Bluesky, LinkedIn) [requires credits]", generateSocialPostsSchema.shape, async (input) => {
  const parsed = generateSocialPostsSchema.parse(input);
  const result = await handleGenerateSocialPosts(parsed);
  return { content: [{ type: "text", text: formatToolResponse("generate_social_posts", result, formatSocialPosts) }] };
});

// Repurpose Tools
server.tool("repurpose", "Transform a full blog post into platform-native content for Twitter threads, LinkedIn, Reddit, Hacker News, Bluesky, and newsletters [requires credits]", repurposeSchema.shape, async (input) => {
  const parsed = repurposeSchema.parse(input);
  const result = await handleRepurpose(parsed);
  return { content: [{ type: "text", text: formatToolResponse("repurpose", result, formatRepurpose) }] };
});

// Analytics Tools
server.tool("analytics", "Fetch post analytics and stats across all configured platforms — FREE", analyticsSchema.shape, async (input) => {
  const parsed = analyticsSchema.parse(input);
  const result = await handleAnalytics(parsed);
  return { content: [{ type: "text", text: formatToolResponse("analytics", result, formatAnalytics) }] };
});

// Setup Tools
server.tool("setup", "Configure API credentials for a platform (devto, ghost, hashnode, wordpress, medium)", setupSchema.shape, async (input) => {
  const parsed = setupSchema.parse(input);
  const result = await handleSetup(parsed);
  return { content: [{ type: "text", text: formatToolResponse("setup", result, formatSetup) }] };
});

server.tool("activate", "Activate a Pipepost credit pack license key", activateSchema.shape, async (input) => {
  const parsed = activateSchema.parse(input);
  const result = await handleActivate(parsed);
  return { content: [{ type: "text", text: formatToolResponse("activate", result, formatActivate) }] };
});

server.tool("status", "Show current Pipepost configuration and credit balance", {}, async () => {
  const result = await handleStatus();
  return { content: [{ type: "text", text: formatToolResponse("status", result, formatStatus) }] };
});

// Draft Tools (free)
server.tool("save_draft", "Save content as a local draft for later publishing — FREE", saveDraftSchema.shape, async (input) => {
  const parsed = saveDraftSchema.parse(input);
  const result = await handleSaveDraft(parsed);
  return { content: [{ type: "text", text: formatToolResponse("save_draft", result, formatSaveDraft) }] };
});

server.tool("list_drafts", "List all saved drafts with status, platforms, and dates — FREE", listDraftsSchema.shape, async (input) => {
  const parsed = listDraftsSchema.parse(input);
  const result = await handleListDrafts(parsed);
  return { content: [{ type: "text", text: formatToolResponse("list_drafts", result, formatListDrafts) }] };
});

server.tool("get_draft", "Retrieve a saved draft by ID — FREE", getDraftSchema.shape, async (input) => {
  const parsed = getDraftSchema.parse(input);
  const result = await handleGetDraft(parsed);
  return { content: [{ type: "text", text: formatToolResponse("get_draft", result, formatGetDraft) }] };
});

server.tool("delete_draft", "Delete a saved draft by ID — FREE", deleteDraftSchema.shape, async (input) => {
  const parsed = deleteDraftSchema.parse(input);
  const result = await handleDeleteDraft(parsed);
  return { content: [{ type: "text", text: formatToolResponse("delete_draft", result, formatDeleteDraft) }] };
});

// Content Quality Tools
server.tool("content_audit", "Audit markdown for quality issues before publishing — basic FREE, full analysis requires credits", contentAuditSchema.shape, async (input) => {
  const parsed = contentAuditSchema.parse(input);
  const result = await handleContentAudit(parsed);
  return { content: [{ type: "text", text: formatToolResponse("content_audit", result, formatContentAudit) }] };
});

server.tool("check_links", "Validate all URLs in markdown content — reports broken, redirected, and timed-out links — FREE", checkLinksSchema.shape, async (input) => {
  const parsed = checkLinksSchema.parse(input);
  const result = await handleCheckLinks(parsed);
  return { content: [{ type: "text", text: formatToolResponse("check_links", result, formatLinkCheck) }] };
});

// Broadcast Tools (direct social posting — FREE)
server.tool("bluesky_post", "Post directly to Bluesky as a single post or a threaded series. Requires handle + app password via setup. FREE — no credit cost.", blueskyPostSchema.shape, async (input) => {
  const parsed = blueskyPostSchema.parse(input);
  const result = await handleBlueskyPost(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("mastodon_post", "Post directly to any Mastodon instance as a single post or a threaded series. Requires instance_url + access_token via setup. FREE — no credit cost.", mastodonPostSchema.shape, async (input) => {
  const parsed = mastodonPostSchema.parse(input);
  const result = await handleMastodonPost(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

// Bluesky Listening + Reply Tools (FREE)
server.tool("bluesky_mentions", "List notifications for the configured Bluesky account — mentions and replies by default. FREE — no credit cost.", blueskyMentionsSchema.shape, async (input) => {
  const parsed = blueskyMentionsSchema.parse(input);
  const result = await handleBlueskyMentions(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("bluesky_search", "Search public Bluesky posts. No Bluesky credentials required. FREE — no credit cost.", blueskySearchSchema.shape, async (input) => {
  const parsed = blueskySearchSchema.parse(input);
  const result = await handleBlueskySearch(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("bluesky_thread", "Fetch the full conversation around a Bluesky post — parents above, replies below. No credentials required. FREE — no credit cost.", blueskyThreadSchema.shape, async (input) => {
  const parsed = blueskyThreadSchema.parse(input);
  const result = await handleBlueskyThread(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("bluesky_reply", "Reply to a Bluesky post (single reply or chained thread). Root + parent references are computed automatically. FREE — no credit cost.", blueskyReplySchema.shape, async (input) => {
  const parsed = blueskyReplySchema.parse(input);
  const result = await handleBlueskyReply(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Pipepost MCP server failed to start:", err);
  process.exit(1);
});

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
  linkedinPostSchema, handleLinkedInPost,
  xPostSchema, handleXPost,
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
  version: "0.9.1",
});

// SEO Tools
server.tool("seo_score", "Analyze markdown content for SEO quality and return a 0-100 score with grade. Basic scoring (heading structure, word count, keyword density, readability) requires no credentials and is FREE. Full analysis (issue list, prioritized suggestions, related-keyword gaps) costs 1 credit. Returns: { score, grade, breakdown, issues?, suggestions? }. Common errors: missing 'content' (VALIDATION_ERROR), insufficient credits for full analysis (PAYMENT_REQUIRED).", seoScoreSchema.shape, async (input) => {
  const parsed = seoScoreSchema.parse(input);
  const result = await handleSeoScore(parsed);
  return { content: [{ type: "text", text: formatToolResponse("seo_score", result, formatSeoScore) }] };
});

server.tool("seo_meta", "Generate SEO-optimized meta title (<60 chars), meta description (<160 chars), and Open Graph tags from article content. No external API calls; runs locally. Costs 1 credit per call. Returns: { title, description, og: { title, description, image_alt }, twitter: { card, title, description } }. Common errors: insufficient credits (PAYMENT_REQUIRED).", seoMetaSchema.shape, async (input) => {
  const parsed = seoMetaSchema.parse(input);
  const result = await handleSeoMeta(parsed);
  return { content: [{ type: "text", text: formatToolResponse("seo_meta", result, formatSeoMeta) }] };
});

server.tool("seo_schema", "Generate valid JSON-LD structured data for Schema.org Article, FAQPage, or HowTo types. Output is ready to paste into a <script type=\"application/ld+json\"> tag. Costs 1 credit per call. Returns: { jsonld: string, type: 'Article'|'FAQPage'|'HowTo' }. Common errors: invalid type for the supplied content shape (VALIDATION_ERROR), insufficient credits (PAYMENT_REQUIRED).", seoSchemaInput.shape, async (input) => {
  const parsed = seoSchemaInput.parse(input);
  const result = await handleSeoSchema(parsed);
  return { content: [{ type: "text", text: formatToolResponse("seo_schema", result, formatSeoSchema) }] };
});

server.tool("index_now", "Submit one or more URLs to the IndexNow API for instant search-engine indexing across Bing, Yandex, Naver, and Seznam (Google does not participate in IndexNow). FREE. No platform credentials required; uses the Pipepost shared key. Returns: { submitted: number, key, accepted: string[], rejected: string[] }. Common errors: malformed URL or non-https scheme (VALIDATION_ERROR), upstream 4xx from IndexNow (PLATFORM_ERROR).", indexNowSchema.shape, async (input) => {
  const parsed = indexNowSchema.parse(input);
  const result = await handleIndexNow(parsed);
  return { content: [{ type: "text", text: formatToolResponse("index_now", result, formatIndexNow) }] };
});

// Image Tools
server.tool("cover_image", "Search Unsplash for cover images. FREE. Requires Unsplash access_key via setup. Subject to Unsplash's 50 req/h demo or 5000 req/h production rate limit. Returns: { results: [{ url_full, url_regular, url_small, photographer, photographer_url, attribution_html, alt }] }. Common errors: missing Unsplash key (VALIDATION_ERROR), rate-limit exceeded (PLATFORM_ERROR).", coverImageSchema.shape, async (input) => {
  const parsed = coverImageSchema.parse(input);
  const result = await handleCoverImage(parsed);
  return { content: [{ type: "text", text: formatToolResponse("cover_image", result, formatCoverImage) }] };
});

// Publishing Tools
server.tool("publish", "Publish a markdown article to one CMS platform: devto, ghost, hashnode, wordpress, medium, or substack. Costs 1 credit per call. Requires platform credentials configured via the 'setup' tool. Supports draft|published status, tags, canonical_url, series, and cover image. Substack is published via reverse-engineered cookie auth. Returns: { url, id, platform, status }. Common errors: platform not configured (VALIDATION_ERROR), credit exhaustion (PAYMENT_REQUIRED), upstream 4xx/5xx (PLATFORM_ERROR), network timeout (NETWORK_ERROR).", publishSchema.shape, async (input) => {
  const parsed = publishSchema.parse(input);
  const result = await handlePublish(parsed);
  return { content: [{ type: "text", text: formatToolResponse("publish", result, formatPublish) }] };
});

server.tool("list_posts", "List your published and draft posts on a configured platform (devto, ghost, hashnode, wordpress, medium, substack). FREE. Requires platform credentials. Returns: { posts: [{ id, title, status, url, published_at }] }. Common errors: platform not configured (VALIDATION_ERROR), upstream auth failure (PLATFORM_ERROR).", listPostsSchema.shape, async (input) => {
  const parsed = listPostsSchema.parse(input);
  const result = await handleListPosts(parsed);
  return { content: [{ type: "text", text: formatToolResponse("list_posts", result, formatListPosts) }] };
});

server.tool("cross_publish", "Publish one article to multiple CMS platforms in a single call. Costs 1 credit total regardless of how many platforms (typical use: 5 platforms). The first successful platform's URL is wired as the canonical for the rest. Requires credentials for every target platform. Returns: { results: [{ platform, status: 'success'|'error', url?, error? }], canonical_url, summary: { ok, failed } }. Common errors: zero platforms configured (VALIDATION_ERROR), credit exhaustion (PAYMENT_REQUIRED). Per-platform failures are reported in results without aborting the whole call.", crossPublishSchema.shape, async (input) => {
  const parsed = crossPublishSchema.parse(input);
  const result = await handleCrossPublish(parsed);
  return { content: [{ type: "text", text: formatToolResponse("cross_publish", result, formatCrossPublish) }] };
});

// Frontmatter Tool (free)
server.tool("frontmatter", "Generate correctly-formatted frontmatter for SSGs and publishing platforms: hugo, jekyll, astro, nextjs, devto, hashnode, ghost. FREE. Auto-extracts description, reading_time, slug, and suggests tags from content. No external calls. Returns: { frontmatter: string, format, extracted: { slug, reading_time_min, description } }. Common errors: unknown format (VALIDATION_ERROR).", frontmatterSchema.shape, async (input) => {
  const parsed = frontmatterSchema.parse(input);
  const result = await handleFrontmatter(parsed);
  return { content: [{ type: "text", text: formatToolResponse("frontmatter", result, formatFrontmatter) }] };
});

// Social Tools
server.tool("generate_social_posts", "Generate platform-optimized social copy from an article: twitter (thread), linkedin (long form), reddit (post + suggested subreddits), bluesky (single post within 300 graphemes). Costs 1 credit per call regardless of platform count. No platform credentials required (this generates copy; use bluesky_post / linkedin_post / x_post / mastodon_post to actually post). Returns: { posts: { twitter?, linkedin?, reddit?, bluesky? } }. Common errors: insufficient credits (PAYMENT_REQUIRED).", generateSocialPostsSchema.shape, async (input) => {
  const parsed = generateSocialPostsSchema.parse(input);
  const result = await handleGenerateSocialPosts(parsed);
  return { content: [{ type: "text", text: formatToolResponse("generate_social_posts", result, formatSocialPosts) }] };
});

// Repurpose Tools
server.tool("repurpose", "Transform a full blog post into platform-native content for twitter, linkedin, reddit, hackernews (title only), bluesky, newsletter (intro paragraph). Costs 1 credit per call. Output preserves URLs and respects each platform's character limits. Returns: { outputs: { twitter?: string[], linkedin?: string, reddit?: { title, body, subreddits }, hackernews?: string, bluesky?: string, newsletter?: string } }. Common errors: insufficient credits (PAYMENT_REQUIRED).", repurposeSchema.shape, async (input) => {
  const parsed = repurposeSchema.parse(input);
  const result = await handleRepurpose(parsed);
  return { content: [{ type: "text", text: formatToolResponse("repurpose", result, formatRepurpose) }] };
});

// Analytics Tools
server.tool("analytics", "Fetch post views, reactions, and comments from every configured CMS platform (devto, ghost, hashnode, wordpress) and aggregate the totals. FREE. Requires platform credentials. Medium and Substack are listed but their APIs do not expose post-level analytics. Returns: { platforms: [{ platform, posts: [{ title, url, views?, reactions?, comments?, published_at? }], note? }], summary: { total_posts, total_views, total_reactions } }. Common errors: no platforms configured (VALIDATION_ERROR), upstream auth failure surfaces per-platform in 'note'.", analyticsSchema.shape, async (input) => {
  const parsed = analyticsSchema.parse(input);
  const result = await handleAnalytics(parsed);
  return { content: [{ type: "text", text: formatToolResponse("analytics", result, formatAnalytics) }] };
});

// Setup Tools
server.tool("setup", "Configure and persist platform credentials to ~/.pipepost/config.json (local file, never transmitted). Supports devto, ghost, hashnode, wordpress, medium, substack, unsplash. Replaces any existing credentials for the same platform. FREE. Returns: { platform, status: 'configured', validated: boolean }. Common errors: missing required fields for the chosen platform (VALIDATION_ERROR).", setupSchema.shape, async (input) => {
  const parsed = setupSchema.parse(input);
  const result = await handleSetup(parsed);
  return { content: [{ type: "text", text: formatToolResponse("setup", result, formatSetup) }] };
});

server.tool("activate", "Activate a Pipepost credit-pack license key purchased from pipepost.dev. Validates the key against the license server and adds credits to the local balance. FREE. Returns: { activated: true, plan: 'starter'|'pro'|'power', credits_added, total_credits }. Common errors: invalid or already-redeemed key (VALIDATION_ERROR), license server unreachable (NETWORK_ERROR).", activateSchema.shape, async (input) => {
  const parsed = activateSchema.parse(input);
  const result = await handleActivate(parsed);
  return { content: [{ type: "text", text: formatToolResponse("activate", result, formatActivate) }] };
});

server.tool("status", "Show the current Pipepost configuration: configured platforms, credit balance, monthly free-credit reset date, and active license plan. FREE. No arguments. Returns: { version, credits: { remaining, free_remaining, next_reset }, platforms: string[], plan }. No errors.", {}, async () => {
  const result = await handleStatus();
  return { content: [{ type: "text", text: formatToolResponse("status", result, formatStatus) }] };
});

// Draft Tools (free)
server.tool("save_draft", "Save markdown content as a local draft in ~/.pipepost/drafts/ (machine-local, never transmitted). FREE. Drafts can target one or more platforms for later publishing via 'publish' or 'cross_publish'. Returns: { id, title, created_at, platforms?: string[] }. Common errors: missing 'content' (VALIDATION_ERROR), filesystem write failure (PLATFORM_ERROR).", saveDraftSchema.shape, async (input) => {
  const parsed = saveDraftSchema.parse(input);
  const result = await handleSaveDraft(parsed);
  return { content: [{ type: "text", text: formatToolResponse("save_draft", result, formatSaveDraft) }] };
});

server.tool("list_drafts", "List every saved local draft with id, title, created_at, target platforms, and short preview. FREE. Reads from ~/.pipepost/drafts/. Returns: { drafts: [{ id, title, created_at, platforms?: string[], preview }] }. No errors.", listDraftsSchema.shape, async (input) => {
  const parsed = listDraftsSchema.parse(input);
  const result = await handleListDrafts(parsed);
  return { content: [{ type: "text", text: formatToolResponse("list_drafts", result, formatListDrafts) }] };
});

server.tool("get_draft", "Retrieve the full content of a saved draft by id. FREE. Returns: { id, title, content, created_at, platforms?: string[] }. Common errors: draft id not found (VALIDATION_ERROR).", getDraftSchema.shape, async (input) => {
  const parsed = getDraftSchema.parse(input);
  const result = await handleGetDraft(parsed);
  return { content: [{ type: "text", text: formatToolResponse("get_draft", result, formatGetDraft) }] };
});

server.tool("delete_draft", "Permanently delete a saved draft by id. FREE. Operation is irreversible. Returns: { deleted: true, id }. Common errors: draft id not found (VALIDATION_ERROR).", deleteDraftSchema.shape, async (input) => {
  const parsed = deleteDraftSchema.parse(input);
  const result = await handleDeleteDraft(parsed);
  return { content: [{ type: "text", text: formatToolResponse("delete_draft", result, formatDeleteDraft) }] };
});

// Content Quality Tools
server.tool("content_audit", "Audit a markdown article for pre-publish quality issues: heading hierarchy, paragraph length, sentence complexity, passive voice, missing alt text, broken header order. Basic audit (counts, summary) is FREE. Full audit (per-issue line numbers, severity, fix suggestions) costs 1 credit. Returns: { score, word_count, reading_time_min, issues: [{ severity, line?, message, fix? }] }. Common errors: insufficient credits for full audit (PAYMENT_REQUIRED).", contentAuditSchema.shape, async (input) => {
  const parsed = contentAuditSchema.parse(input);
  const result = await handleContentAudit(parsed);
  return { content: [{ type: "text", text: formatToolResponse("content_audit", result, formatContentAudit) }] };
});

server.tool("check_links", "Validate every URL in a markdown document by issuing HEAD (then GET fallback) requests. FREE. Concurrency-limited to 10 in-flight requests; per-URL timeout 8s. Reports broken (4xx/5xx), redirected (3xx), and timed-out links. Returns: { total, ok, broken: [{ url, status }], redirects: [{ url, to }], timeouts: string[] }. Common errors: malformed markdown produces zero results without throwing.", checkLinksSchema.shape, async (input) => {
  const parsed = checkLinksSchema.parse(input);
  const result = await handleCheckLinks(parsed);
  return { content: [{ type: "text", text: formatToolResponse("check_links", result, formatLinkCheck) }] };
});

// Broadcast Tools (direct social posting — FREE)
server.tool("bluesky_post", "Post directly to Bluesky as a single post or a reply-chained thread. FREE. Requires social.bluesky.handle and social.bluesky.app_password configured via setup (app password from bsky.app/settings/app-passwords). 300 grapheme limit per post; bare URLs are auto-linkified into facets. Returns: { uri, cid, posts?: [{ uri, cid }] }. Common errors: missing credentials (VALIDATION_ERROR), grapheme overflow (VALIDATION_ERROR), Bluesky API 4xx (PLATFORM_ERROR).", blueskyPostSchema.shape, async (input) => {
  const parsed = blueskyPostSchema.parse(input);
  const result = await handleBlueskyPost(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("mastodon_post", "Post directly to any Mastodon instance as a single status or a threaded series. FREE. Requires social.mastodon.instance_url and social.mastodon.access_token (scope: write:statuses) via setup. Per-instance character limit usually 500. Returns: { id, url, posts?: [{ id, url }] }. Common errors: missing credentials (VALIDATION_ERROR), instance API 4xx (PLATFORM_ERROR).", mastodonPostSchema.shape, async (input) => {
  const parsed = mastodonPostSchema.parse(input);
  const result = await handleMastodonPost(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("linkedin_post", "Post directly to LinkedIn as a single feed post (max 3000 chars). FREE. Requires social.linkedin.access_token (w_member_social scope). Person URN is auto-resolved from /v2/userinfo on first use and cached. LinkedIn has no public threading API, so only single posts are supported. Returns: { urn, url }. Common errors: missing or expired access_token (VALIDATION_ERROR), LinkedIn 401 (PLATFORM_ERROR), 3000-char overflow (VALIDATION_ERROR).", linkedinPostSchema.shape, async (input) => {
  const parsed = linkedinPostSchema.parse(input);
  const result = await handleLinkedInPost(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("x_post", "Post directly to X (Twitter) as a single tweet (max 280 graphemes) or a reply-chained thread via X v2 /tweets. OAuth 1.0a HMAC-SHA1 signing built in. FREE in this server, but X's free API tier caps writes at 17 tweets per 24h. Requires social.x.api_key, api_secret, access_token, access_token_secret via setup. Returns: { id, url, tweets?: [{ id, url }] }. Common errors: missing credentials (VALIDATION_ERROR), 280-grapheme overflow (VALIDATION_ERROR), 429 rate-limit (PLATFORM_ERROR).", xPostSchema.shape, async (input) => {
  const parsed = xPostSchema.parse(input);
  const result = await handleXPost(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

// Bluesky Listening + Reply Tools (FREE)
server.tool("bluesky_mentions", "List notifications addressed to the configured Bluesky account: mentions and replies by default, optionally include reposts/likes/follows. FREE. Requires social.bluesky.handle and app_password. Returns: { notifications: [{ uri, cid, reason, author, record, indexed_at, is_read }] }. Common errors: missing credentials (VALIDATION_ERROR), AppView temporarily unavailable (PLATFORM_ERROR; the client falls back to bsky.social).", blueskyMentionsSchema.shape, async (input) => {
  const parsed = blueskyMentionsSchema.parse(input);
  const result = await handleBlueskyMentions(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("bluesky_search", "Search public Bluesky posts by keyword, author, mentions, tag, or language via app.bsky.feed.searchPosts. FREE. Now requires Bluesky auth (handle + app password) because the AppView gates this endpoint. Returns: { posts: [{ uri, cid, author, text, created_at, like_count, repost_count }], cursor? }. Common errors: missing credentials (VALIDATION_ERROR), AppView 5xx (PLATFORM_ERROR).", blueskySearchSchema.shape, async (input) => {
  const parsed = blueskySearchSchema.parse(input);
  const result = await handleBlueskySearch(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("bluesky_thread", "Fetch the full conversation around a Bluesky post: parent posts above, reply tree below. Use this before bluesky_reply to understand the conversation. FREE. No credentials required for public threads. Returns: { thread: { post, parent?, replies?: thread[] } }. Common errors: post URI not found (VALIDATION_ERROR), AppView 5xx (PLATFORM_ERROR).", blueskyThreadSchema.shape, async (input) => {
  const parsed = blueskyThreadSchema.parse(input);
  const result = await handleBlueskyThread(parsed);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("bluesky_reply", "Reply to a Bluesky post as a single reply or a chained thread. The root and parent strong-references required by the AT Protocol are computed automatically from the parent_uri. FREE. Requires social.bluesky.handle + app_password. 300 grapheme limit per post. Returns: { uri, cid, posts?: [{ uri, cid }] }. Common errors: missing credentials (VALIDATION_ERROR), parent post not found (VALIDATION_ERROR), grapheme overflow (VALIDATION_ERROR).", blueskyReplySchema.shape, async (input) => {
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

<div align="center">

# |> Pipepost

**Publish from your terminal.**

MCP server that turns Claude Code into a complete content publishing pipeline — SEO, multi-platform publishing, social promotion, and analytics.

[![npm version](https://img.shields.io/npm/v/pipepost-mcp)](https://www.npmjs.com/package/pipepost-mcp)
[![npm downloads](https://img.shields.io/npm/dm/pipepost-mcp)](https://www.npmjs.com/package/pipepost-mcp)
[![CI](https://img.shields.io/github/actions/workflow/status/MendleM/Pipepost/ci.yml?branch=main&label=CI)](https://github.com/MendleM/Pipepost/actions)
[![Glama MCP server](https://glama.ai/mcp/servers/MendleM/pipepost/badges/score.svg)](https://glama.ai/mcp/servers/MendleM/pipepost)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Website](https://pipepost.dev) · [Docs](https://pipepost.dev/tools) · [npm](https://www.npmjs.com/package/pipepost-mcp)

</div>

---

## See it in one chat turn

[**→ Real agent-loop transcript**](docs/demo/agent-loop.md) — Claude Code takes a draft, audits it, scores SEO, fixes issues, cross-publishes to 5 CMS platforms with canonical URL wiring, generates social promo posts for Twitter/LinkedIn/Bluesky, and submits to IndexNow. One prompt. ~90 seconds. 2 credits.

## Why Pipepost?

| Task | Without Pipepost | With Pipepost |
|------|-----------------|---------------|
| Publish to Dev.to | Copy-paste into browser, format, add tags, submit | *"Publish this to Dev.to as a draft"* |
| Cross-post to 5 platforms | Repeat the above five times | *"Cross-publish to all platforms"* |
| SEO optimization | Switch between 3 tools, copy results back | *"Score this for SEO targeting 'mcp servers'"* |
| Social promotion | Write separate posts for each network | *"Generate social posts for Twitter, LinkedIn, and Reddit"* |
| Cover images | Browse Unsplash, download, upload, add attribution | *"Find a cover image for this article"* |
| Search indexing | Wait days for crawlers to find your content | *"Submit this URL to IndexNow"* |
| Content analytics | Log into 5 dashboards, compare manually | *"Show my analytics across all platforms"* |
| Pre-publish QA | Manually check links, readability, structure | *"Audit this article and check all links"* |
| Draft management | Copy between editors, lose track of versions | *"Save this as a draft targeting Dev.to and Ghost"* |
| Canonical URLs | Manually set on each platform after cross-posting | Automatic — first platform URL wired to all others |

## Quick Start

```bash
npx pipepost-mcp init
```

Add Pipepost to your Claude Code config (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "pipepost": {
      "command": "npx",
      "args": ["-y", "pipepost-mcp"]
    }
  }
}
```

That's it. Try asking Claude:

> *Score this article for SEO targeting 'mcp servers'*

## Tools

### SEO (4 tools)

| Tool | Description | Cost |
|------|-------------|------|
| `seo_score` | Analyze content for readability, keyword density, and heading structure | Free (basic) / Credits (full) |
| `seo_meta` | Generate meta title, description, and Open Graph tags | Credits |
| `seo_schema` | Generate JSON-LD structured data (Article, FAQ, HowTo) | Credits |
| `index_now` | Submit URLs to search engines for instant indexing via IndexNow | Free |

### Publishing (3 tools)

| Tool | Description | Cost |
|------|-------------|------|
| `publish` | Publish to Dev.to, Ghost, Hashnode, WordPress, Medium, or Substack | 1 credit |
| `cross_publish` | Publish to multiple platforms with automatic canonical URL wiring | 1 credit |
| `list_posts` | List published and draft posts from any platform | Free |

### Drafts (4 tools)

| Tool | Description | Cost |
|------|-------------|------|
| `save_draft` | Save content as a local draft for later publishing | Free |
| `list_drafts` | List all saved drafts with status, platforms, and dates | Free |
| `get_draft` | Retrieve a saved draft by ID | Free |
| `delete_draft` | Delete a saved draft by ID | Free |

### Content Quality (2 tools)

| Tool | Description | Cost |
|------|-------------|------|
| `content_audit` | Audit markdown for quality issues — readability, structure, heading hierarchy | Free (basic) / Credits (full) |
| `check_links` | Validate all URLs in markdown — reports broken, redirected, and timed-out links | Free |

### Content Repurposing (2 tools)

| Tool | Description | Cost |
|------|-------------|------|
| `generate_social_posts` | Generate platform-optimized posts for Twitter, LinkedIn, Reddit, Bluesky | Credits |
| `repurpose` | Transform a blog post into Twitter threads, LinkedIn posts, Reddit posts, HN titles, Bluesky posts, newsletter intros | Credits |

### Broadcast (4 tools)

| Tool | Description | Cost |
|------|-------------|------|
| `bluesky_post` | Post directly to Bluesky as a single post or a threaded series. Bare URLs auto-linkified | Free |
| `mastodon_post` | Post directly to any Mastodon instance as a single post or a threaded series | Free |
| `linkedin_post` | Post to LinkedIn (personal). Person URN resolved automatically on first use and cached | Free |
| `x_post` | Post to X as a single tweet or reply-chained thread. OAuth 1.0a HMAC-SHA1 signing built in | Free |

### Listening & Reply (4 tools)

| Tool | Description | Cost |
|------|-------------|------|
| `bluesky_mentions` | List notifications addressed to the configured account — mentions and replies by default | Free |
| `bluesky_search` | Search public Bluesky posts by keyword, author, mentions, tag, or language. No auth needed | Free |
| `bluesky_thread` | Fetch the full conversation around a post — parents above, replies below, for reply context | Free |
| `bluesky_reply` | Reply to a Bluesky post (single reply or chained thread) — root + parent refs computed automatically | Free |

### Images (1 tool)

| Tool | Description | Cost |
|------|-------------|------|
| `cover_image` | Search Unsplash for cover images with proper attribution | Free |

### Content (1 tool)

| Tool | Description | Cost |
|------|-------------|------|
| `frontmatter` | Generate frontmatter for Hugo, Jekyll, Astro, Next.js, Dev.to, Hashnode, Ghost | Free |

### Analytics (1 tool)

| Tool | Description | Cost |
|------|-------------|------|
| `analytics` | Fetch post views, reactions, and comments across all configured platforms | Free |

### Account (3 tools)

| Tool | Description | Cost |
|------|-------------|------|
| `setup` | Configure API credentials for any platform | Free |
| `activate` | Activate a credit pack license key | Free |
| `status` | Show current configuration and credit balance | Free |

## How It Works

1. **Install** -- add the MCP server to Claude Code with `npx pipepost-mcp init`
2. **Configure** -- use the `setup` tool to store your platform API keys locally
3. **Create** -- write content in Claude Code, then use SEO tools to optimize it
4. **Publish** -- publish to any platform with natural language, then promote with generated social posts

## Pricing

| | Free | Starter ($8) | Pro ($19) | Power ($49) |
|---|---|---|---|---|
| **Credits** | 3/month | 10 | 30 | 100 |
| **SEO scoring** | Basic | Full analysis | Full analysis | Full analysis |
| **SEO meta + schema** | -- | ✔ | ✔ | ✔ |
| **Publish** | ✔ | ✔ | ✔ | ✔ |
| **Cross-publish** | ✔ | ✔ | ✔ | ✔ |
| **Social generation** | -- | ✔ | ✔ | ✔ |
| **Repurpose** | -- | ✔ | ✔ | ✔ |

3 free credits every month. Purchased credits never expire.

> [!TIP]
> Cross-publishing to 5 platforms costs just 1 credit. Publishing + social generation for a single article costs 2 credits total.

## Platform Support

### CMS Platforms

| Platform | Publish | List Posts | Analytics | Featured Images |
|----------|---------|------------|-----------|-----------------|
| Dev.to | ✔ | ✔ | ✔ | ✔ |
| Ghost | ✔ | ✔ | ✔ | ✔ |
| Hashnode | ✔ | ✔ | ✔ | ✔ |
| WordPress | ✔ | ✔ | ✔ | ✘ |
| Medium | ✔ | ✘ | ✘ | ✔ |
| Substack | ✔ | ✔ | ✘ | ✘ |

### Social Platforms (Generation)

| Platform | Format |
|----------|--------|
| Twitter/X | Threads with hook, key points, and CTA |
| LinkedIn | Professional long-form posts |
| Reddit | Post with title, body, and suggested subreddits |
| Bluesky | Short-form posts within character limits |
| Hacker News | Optimized submission titles |
| Newsletter | Intro paragraphs for email digests |

### Frontmatter Formats

Hugo, Jekyll, Astro, Next.js, Dev.to, Hashnode, Ghost -- auto-extracts description, reading time, slug, and tags from your content.

## Privacy & Security

> [!NOTE]
> Pipepost runs as a **local stdio process**. Your API keys are stored in `~/.pipepost/config.json` and never leave your machine. No cloud server, no telemetry, no data collection.

## Architecture

```
Claude Code
    |
    | stdio
    v
Pipepost MCP Server
    |
    |--- SEO Engine (local scoring, meta generation, JSON-LD)
    |--- IndexNow API (Bing, Yandex, search engines)
    |--- Unsplash API (cover images)
    |--- Dev.to / Ghost / Hashnode / WordPress / Medium / Substack APIs
    |--- Bluesky AT Protocol (post, search, reply)
    |--- Mastodon API (any instance)
    |--- LinkedIn /v2/ugcPosts
    |--- X v2 /tweets (OAuth 1.0a)
```

All processing happens locally. Platform APIs are only called when you explicitly publish, fetch analytics, or search for images.

## API Key Setup

| Platform | Where to get your key |
|----------|----------------------|
| Dev.to | [dev.to/settings/extensions](https://dev.to/settings/extensions) |
| Ghost | Ghost Admin > Settings > Integrations > Custom |
| Hashnode | [hashnode.com/settings/developer](https://hashnode.com/settings/developer) |
| WordPress | Users > Application Passwords |
| Medium | [medium.com/me/settings/security](https://medium.com/me/settings/security) |
| Substack | DevTools → Application → Cookies → `substack.com` → copy `connect.sid`. Pass with your publication URL (e.g. `https://you.substack.com`). |
| Unsplash | [unsplash.com/developers](https://unsplash.com/developers) |
| Bluesky | [bsky.app/settings/app-passwords](https://bsky.app/settings/app-passwords) |
| Mastodon | `https://<your-instance>/settings/applications` (scope: `write:statuses`) |
| LinkedIn | [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps) (scopes: `openid`, `profile`, `w_member_social`). Run `pnpm linkedin:auth` for the 3-legged flow. |
| X | [developer.x.com](https://developer.x.com) — OAuth 1.0a app with read+write |

## Contributing

```bash
git clone https://github.com/MendleM/Pipepost.git
cd Pipepost
pnpm install
pnpm test
pnpm build
```

Run in development mode with file watching:

```bash
pnpm dev
```

## License

MIT

# Pipepost MCP — Design Spec

## Overview

Pipepost is a local MCP server that turns Claude Code into a full content operations studio. It provides tools for SEO analysis, multi-platform CMS publishing, image sourcing, and social media promotion — the "last mile" that Claude Code can't do natively.

**Target user:** Indie hackers, developer-founders, and technical content creators who already use Claude Code daily and want to publish content without leaving their terminal.

**Revenue model:** Freemium. Free tier publishes to Dev.to with basic SEO. Pro ($19/mo) unlocks all 5 CMS platforms, full SEO suite, social promotion, and image tools. License gating via Lemon Squeezy.

**Distribution:** npm package, open-source core (MIT), listed on Anthropic plugin marketplace + MCP directories.

---

## Brand Identity

**Name:** Pipepost
**Tagline:** "Publish from your terminal."
**Voice:** Technical, confident, minimal. No exclamation marks. No emojis in docs. Speaks like a senior engineer writing a README, not a marketer writing a landing page.

**Color palette:**
- Primary: `#0F172A` (slate-900) — authority, technical depth
- Accent: `#F97316` (orange-500) — energy, stands out in dark terminals and light web pages
- Surface: `#FAFAF9` (stone-50) — clean, readable
- Muted: `#78716C` (stone-500) — secondary text

**Typography:**
- Headings: Inter (weight 700) — clean, geometric, professional
- Body: Inter (weight 400)
- Code/Terminal: JetBrains Mono

**Logo concept:** A minimal pipe symbol `|` with an arrow `>` — representing pipeline flow. Rendered in the accent orange against dark background. Looks native in a terminal context.

**Design principles:**
- Everything looks like it belongs in a developer's workflow
- No gradients, no illustrations, no stock photos
- Monochrome with a single accent color
- Dense information, generous whitespace
- The landing page should feel like the best README you've ever read

---

## Architecture

### Transport & Runtime

- **STDIO transport** — local process, started by Claude Code
- **Node.js** (TypeScript) — matches the MCP SDK ecosystem
- **No remote backend** — all processing is local except Lemon Squeezy license validation (3 lightweight API calls)
- **User credentials stored locally** in `~/.pipepost/config.json` — never transmitted

### License Gating

```
Startup:
  1. Read ~/.pipepost/config.json
  2. If license_key exists, call Lemon Squeezy /validate
  3. Cache result for 24 hours (avoid repeated API calls)
  4. Set tier = "pro" | "free" based on validation
  5. Each tool checks tier before executing premium features
```

License validation is **non-blocking on failure** — if Lemon Squeezy is unreachable, use cached validation. If no cache exists, degrade to free tier. Never crash, never block the user.

### Configuration

```json
// ~/.pipepost/config.json
{
  "license": {
    "key": "38b1460a-...",
    "instance_id": "f90ec370-...",
    "cached_status": "active",
    "cached_at": "2026-04-13T12:00:00Z"
  },
  "platforms": {
    "devto": { "api_key": "..." },
    "ghost": { "url": "https://myblog.com", "admin_key": "..." },
    "hashnode": { "token": "...", "publication_id": "..." },
    "wordpress": { "url": "https://mysite.com", "username": "...", "app_password": "..." },
    "medium": { "token": "..." }
  },
  "social": {
    "twitter": { "consumer_key": "...", "consumer_secret": "...", "access_token": "...", "access_token_secret": "..." },
    "reddit": { "client_id": "...", "client_secret": "...", "username": "...", "password": "..." },
    "bluesky": { "handle": "...", "app_password": "..." }
  },
  "images": {
    "unsplash_access_key": "..."
  },
  "usage": {
    "publishes_this_month": 0,
    "month": "2026-04"
  }
}
```

---

## MCP Tools

### SEO Tools (local, no API)

**`seo_score`** — Analyze content for SEO quality
- Input: `{ content: string, keyword: string }`
- Output: `{ score: number, readability: { flesch_kincaid: number, grade_level: string }, keyword_density: number, word_count: number, heading_structure: { h1: number, h2: number, h3: number }, issues: string[], suggestions: string[] }`
- Tier: Free (readability + keyword density only), Pro (full analysis)

**`seo_meta`** — Generate meta tags from content
- Input: `{ title: string, content: string, keyword?: string }`
- Output: `{ meta_title: string, meta_description: string, og_title: string, og_description: string, twitter_card: string }`
- Tier: Pro

**`seo_schema`** — Generate JSON-LD structured data
- Input: `{ type: "article" | "faq" | "howto", data: object }`
- Output: `{ json_ld: string }`
- Tier: Pro

### Publishing Tools (need CMS API keys)

**`publish`** — Publish content to a CMS platform
- Input: `{ platform: "devto" | "ghost" | "hashnode" | "wordpress" | "medium", title: string, content: string, tags?: string[], status?: "draft" | "published", featured_image_url?: string, canonical_url?: string }`
- Output: `{ success: boolean, url: string, post_id: string, platform: string }`
- Tier: Free (Dev.to only, 3/month), Pro (all platforms, unlimited)
- The tool appends a "Published with Pipepost" footer on free tier

**`list_posts`** — List posts on a platform
- Input: `{ platform: string, status?: "draft" | "published", limit?: number }`
- Output: `{ posts: Array<{ id: string, title: string, url: string, status: string, published_at: string }> }`
- Tier: Pro

**`update_post`** — Update an existing post
- Input: `{ platform: string, post_id: string, title?: string, content?: string, tags?: string[], status?: string }`
- Output: `{ success: boolean, url: string }`
- Tier: Pro

### Image Tools (free external APIs)

**`search_images`** — Search for stock photos
- Input: `{ query: string, orientation?: "landscape" | "portrait" | "squarish", count?: number }`
- Output: `{ images: Array<{ url: string, thumb_url: string, photographer: string, source: "unsplash" | "pexels", download_url: string }> }`
- Tier: Pro

**`generate_og_image`** — Generate an Open Graph image
- Input: `{ title: string, subtitle?: string, theme?: "dark" | "light" }`
- Output: `{ image_path: string, width: number, height: number }`
- Uses `@vercel/og` or `satori` + `sharp` for local SVG-to-PNG rendering. No external API.
- Tier: Pro

### Social Promotion Tools (need social API keys)

**`post_social`** — Post to a social platform
- Input: `{ platform: "twitter" | "reddit" | "bluesky", content: string, title?: string, subreddit?: string, url?: string }`
- Output: `{ success: boolean, post_url: string, post_id: string }`
- Tier: Pro

**`generate_social_posts`** — Generate platform-optimized social content from an article
- Input: `{ title: string, summary: string, url: string, platforms: string[] }`
- Output: `{ posts: Array<{ platform: string, content: string, char_count: number }> }`
- Uses heuristic templates (not AI — keeps it fast and deterministic). Twitter: hook + link under 280 chars. Reddit: title + body format. Bluesky: shorter format with link.
- Tier: Pro

### Setup & Config Tools

**`setup`** — Interactive platform configuration
- Input: `{ platform: string }`
- Output: Guides the user through API key setup, validates the key works, saves to config
- Tier: Free

**`status`** — Show current configuration and license status
- Input: `{}`
- Output: `{ tier: string, platforms_configured: string[], social_configured: string[], publishes_remaining: number | "unlimited" }`
- Tier: Free

---

## Reliability Requirements

### Error Handling Strategy

Every external call (CMS API, social API, Lemon Squeezy) must:
1. **Timeout** after 10 seconds (configurable)
2. **Retry** once on 5xx or network errors, with 2-second backoff
3. **Return structured errors** — never throw unhandled exceptions from a tool
4. **Degrade gracefully** — license validation failure = free tier, not crash

### Error Response Format

Every tool returns either success or a structured error:
```typescript
type ToolResult =
  | { success: true; data: unknown }
  | { success: false; error: { code: string; message: string; platform?: string; retryable: boolean } };
```

Error codes:
- `AUTH_FAILED` — invalid or expired API key for a platform
- `RATE_LIMITED` — platform rate limit hit
- `NOT_FOUND` — post/resource not found
- `TIER_REQUIRED` — feature requires Pro tier
- `PUBLISH_LIMIT` — free tier monthly limit reached
- `NETWORK_ERROR` — could not reach external service
- `VALIDATION_ERROR` — invalid input
- `PLATFORM_ERROR` — CMS/social API returned unexpected error

### Input Validation

Every tool validates inputs before making external calls:
- Required fields checked with clear error messages
- String lengths validated (title < 300 chars, content > 0 chars)
- Platform names validated against known set
- URLs validated with URL constructor
- Tags validated (array of strings, no empties)

### Testing Strategy

- **Unit tests** for all pure functions (SEO scoring, meta generation, schema generation, social post templates, input validation, config management)
- **Integration tests** with mocked HTTP for each CMS platform client and social platform client (test success, auth failure, rate limit, network error, malformed response)
- **Contract tests** — validate our API call shapes against known good requests for each platform
- **E2E test** — one test that publishes to Dev.to (using real API key from env, skipped in CI unless `PIPEPOST_E2E=true`)
- **Coverage target:** 90%+ on `src/` (excluding the MCP server entry point)

---

## Marketing Flywheel

### Self-Marketing Loop

1. I write articles about Claude Code, content marketing, and MCP servers
2. Articles are published using Pipepost to Dev.to/Hashnode
3. Pipepost generates social posts from each article
4. Social posts are published to Twitter/Reddit/Bluesky using Pipepost
5. Free tier articles carry "Published with Pipepost" footer
6. Footer drives new users who publish their own articles with the badge
7. Repeat

### Launch Channels

- **GitHub** — public repo, MIT core, stars as social proof
- **npm** — `npx pipepost-mcp setup` for instant trial
- **MCP directories** — Smithery, MCP.so, PulseMCP, MCPMarket
- **Anthropic plugin marketplace** — official listing
- **Product Hunt** — "Publish from your terminal"
- **Reddit** — r/ClaudeAI, r/SideProject, r/IndieHackers, r/webdev
- **Dev.to / Hashnode** — articles published using the tool

### Landing Page

Single-page site on Vercel:
- Hero: terminal screenshot showing a publish workflow
- "How it works" in 3 steps
- Feature grid (free vs pro)
- Pricing (single card, $19/mo)
- "Get started" → `npx pipepost-mcp setup`
- Footer: GitHub link, docs link

No signup form. No email capture. The npm install IS the onboarding.

---

## File Structure

```
pipepost/
├── src/
│   ├── index.ts                    # MCP server entry point, tool registration
│   ├── config.ts                   # Read/write ~/.pipepost/config.json
│   ├── license.ts                  # Lemon Squeezy license validation + caching
│   ├── tier.ts                     # Tier checking (free vs pro) + usage tracking
│   ├── errors.ts                   # Error types, structured error builder
│   ├── http.ts                     # Shared HTTP client with timeout + retry
│   ├── seo/
│   │   ├── score.ts                # Content SEO scoring
│   │   ├── meta.ts                 # Meta tag generation
│   │   └── schema.ts               # JSON-LD schema generation
│   ├── publish/
│   │   ├── types.ts                # Shared publish types (PublishInput, PublishResult)
│   │   ├── devto.ts                # Dev.to API client
│   │   ├── ghost.ts                # Ghost Admin API client
│   │   ├── hashnode.ts             # Hashnode GraphQL client
│   │   ├── wordpress.ts            # WordPress REST API client
│   │   ├── medium.ts               # Medium API client
│   │   └── badge.ts                # "Published with Pipepost" footer logic
│   ├── social/
│   │   ├── types.ts                # Shared social types
│   │   ├── twitter.ts              # Twitter/X API v2 client (OAuth 1.0a)
│   │   ├── reddit.ts               # Reddit API client
│   │   ├── bluesky.ts              # Bluesky AT Protocol client
│   │   └── templates.ts            # Social post templates/generators
│   ├── images/
│   │   ├── unsplash.ts             # Unsplash API client
│   │   └── og.ts                   # OG image generation (satori + sharp)
│   └── tools/
│       ├── seo-tools.ts            # MCP tool definitions for SEO
│       ├── publish-tools.ts        # MCP tool definitions for publishing
│       ├── social-tools.ts         # MCP tool definitions for social
│       ├── image-tools.ts          # MCP tool definitions for images
│       └── setup-tools.ts          # MCP tool definitions for setup/status
├── __tests__/
│   ├── seo/
│   │   ├── score.test.ts
│   │   ├── meta.test.ts
│   │   └── schema.test.ts
│   ├── publish/
│   │   ├── devto.test.ts
│   │   ├── ghost.test.ts
│   │   ├── hashnode.test.ts
│   │   ├── wordpress.test.ts
│   │   ├── medium.test.ts
│   │   └── badge.test.ts
│   ├── social/
│   │   ├── twitter.test.ts
│   │   ├── reddit.test.ts
│   │   ├── bluesky.test.ts
│   │   └── templates.test.ts
│   ├── images/
│   │   ├── unsplash.test.ts
│   │   └── og.test.ts
│   ├── config.test.ts
│   ├── license.test.ts
│   ├── tier.test.ts
│   ├── http.test.ts
│   └── errors.test.ts
├── landing/                        # Next.js landing page (Vercel)
│   ├── src/app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.mjs
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── tsup.config.ts                  # Bundle config for npm publish
├── README.md
├── LICENSE                         # MIT
└── .github/
    └── workflows/
        ├── ci.yml                  # Test + lint on PR
        └── publish.yml             # Publish to npm on tag
```

---

## Acceptance Criteria

### MVP (Phase 1) is complete when:
1. `npx pipepost-mcp setup` walks through Dev.to API key configuration
2. `seo_score` returns accurate readability and keyword metrics
3. `publish` successfully publishes to Dev.to with correct frontmatter
4. Free tier enforces 3 publishes/month and appends badge footer
5. Lemon Squeezy license activation and validation work
6. Pro tier unlocks full SEO tools after valid license
7. All tests pass with 90%+ coverage on src/
8. npm package published and installable
9. Landing page live on Vercel

### Phase 2 is complete when:
10. Ghost, Hashnode publishing work
11. Image search and OG generation work
12. Social posting to Twitter, Reddit, Bluesky works
13. "Published with Pipepost" badge appears on free tier posts
14. All new features have integration tests with mocked HTTP

### Phase 3 is complete when:
15. WordPress, Medium publishing work
16. Content calendar tool works
17. Hub site with docs is live
18. First 3 articles published using Pipepost itself

# Pipepost launch playbook

Everything you need to execute a coordinated launch day. Every block below is ready to copy-paste. Do not edit without a reason — they were tuned to the phrasing that actually lands on each platform.

---

## Order of operations (the one you're posting)

The goal of launch day is 6–12 hours of peak traffic landing at the checkout. Sequence things so each channel feeds the next.

1. **T–0:00** — post to Show HN. See below.
2. **T+0:30** — drop the X thread. Quote-tweet your own Show HN link.
3. **T+1:00** — post to r/ClaudeAI.
4. **T+2:00** — post to r/selfhosted.
5. **T+3:00** — LinkedIn post.
6. **T+4:00** — post to r/SideProject (if Show HN is ranking well).
7. **T+6:00** — short Bluesky post linking everything together.
8. **EOD** — Product Hunt scheduled for the NEXT morning 12:01am PT.

Do not cross-post to all subs simultaneously. Mods flag that. Space them out.

---

## Show HN

**Title (under 80 chars, lowercase style that performs on HN):**

> Show HN: Pipepost – publish to Dev.to, Ghost, Hashnode from Claude Code

**Body:**

```
I got tired of writing a post in my editor, then copy-pasting it into Dev.to, then reformatting it for Hashnode, then doing the SEO meta dance, then writing promotion posts for X and Reddit.

Pipepost is an MCP server that adds 22 tools to Claude Code — SEO scoring, multi-platform publishing (Dev.to, Ghost, Hashnode, WordPress, Medium), canonical URL wiring, IndexNow submission, cover image search, social post generation, and a local draft store.

The whole flow looks like:

  you: "Publish this to Dev.to and Hashnode, then generate Twitter and Reddit posts."

and Claude Code actually does it.

Everything runs as a local stdio process. API keys are stored in ~/.pipepost/config.json and never leave your machine. 3 free credits a month, paid packs are a one-time purchase — credits never expire.

npx pipepost-mcp init

Source: https://github.com/MendleM/Pipepost
Site:   https://pipepost.dev
npm:    https://www.npmjs.com/package/pipepost-mcp

Happy to answer questions about design decisions — particularly the credit model vs subscription, why five CMS platforms instead of one deeply integrated one, and how the canonical URL wiring works across Dev.to / Hashnode / WordPress.
```

**Timing:** Weekday, 8:30–9:30am ET. Tuesday/Wednesday best. Avoid Friday.

**In-thread replies to prep for:**
- "Why not just write a Zapier?" — because Claude Code is already where you're drafting. The MCP transport means zero context-switch.
- "What about subscription fatigue?" — that's exactly why it's credit-based. Credits never expire.
- "Open-source?" — yes, MIT. License unlocks the paid tools (SEO meta, schema, social gen, repurpose).
- "Why Medium? It's a walled garden." — because a lot of readers are still there, and the Medium API still works for publishing even if it's limited.

---

## Reddit: r/ClaudeAI

**Title (must not sound promotional or it gets filtered):**

> I built an MCP server that lets Claude Code publish blog posts to Dev.to, Ghost, Hashnode, WordPress, and Medium

**Body:**

```
I've been using Claude Code for writing technical posts and kept running into the same wall: the writing is great, the publishing is a chore. Five platforms, five dashboards, five flavors of frontmatter, five rounds of "wait, which tags does Dev.to use again?"

So I built Pipepost — an MCP server that lives inside Claude Code and handles the publishing side.

The 22 tools break down into:

- SEO: score, meta tag generation, JSON-LD schema, IndexNow submission
- Publishing: Dev.to, Ghost, Hashnode, WordPress, Medium (with auto canonical URL wiring)
- Drafts: save/list/get/delete, so you can write and come back later
- Content audit: readability, heading hierarchy, link validation
- Social: generate Twitter threads, LinkedIn posts, Reddit posts, Bluesky posts, HN titles
- Cover images: search Unsplash with proper attribution
- Analytics: fetch views/reactions across platforms

Example session after setup:

  you: "Score this for SEO targeting 'mcp servers'"
  you: "Cross-publish to Dev.to and Hashnode, make Dev.to canonical"
  you: "Generate social posts for Twitter, Reddit, and Bluesky"

All three requests use different tools, but from Claude Code it's just conversation.

API keys are stored locally in ~/.pipepost/config.json. No cloud relay, no telemetry. Three free credits a month; paid packs are one-time purchase and never expire.

Open-source (MIT): https://github.com/MendleM/Pipepost
Install: npx pipepost-mcp init
Site: https://pipepost.dev

Would love feedback from anyone else using Claude Code for content work — particularly on which tools you'd expect in a "publishing MCP" that I haven't built yet.
```

---

## Reddit: r/selfhosted

**Title:**

> Pipepost — local-first MCP server for publishing blog posts from the terminal

**Body:**

```
Built this because I wanted my publishing workflow to run locally, not through yet another SaaS.

Pipepost is an MCP server. It runs as a local stdio process with no cloud relay and no telemetry. Your API keys for Dev.to, Ghost, Hashnode, WordPress, Medium, and Unsplash sit in ~/.pipepost/config.json and never leave the machine.

What it does:
- Publishes markdown to any of the 5 platforms above (or all of them at once with canonical URL wiring)
- Scores your content for SEO locally (readability, keyword density, heading structure)
- Generates Open Graph tags and JSON-LD schema
- Submits your URLs to IndexNow so Bing crawls them instantly
- Validates every link in a post before publishing
- Generates social promotion copy (Twitter, LinkedIn, Reddit, Bluesky)

MIT licensed, works with any MCP-compatible client (Claude Code, Cursor, Zed, etc.).

  npx pipepost-mcp init

Source: https://github.com/MendleM/Pipepost
Docs:   https://pipepost.dev

Curious what else the self-hosted crowd would want in a publishing layer — I'm thinking RSS generation and static site deploy hooks next.
```

---

## Reddit: r/SideProject (if Show HN is ranking top 30)

**Title:**

> Launched Pipepost — made $X in the first 24 hours. An MCP server for publishing.

(Fill in $X post-launch. Don't post here if the number is <$100 — nobody cares.)

---

## X / Twitter (build-in-public thread)

**Tweet 1 (the hook — under 260 chars, no em dash, no "Today I launched"):**

```
writing a blog post in claude code feels great

then you open dev.to, hashnode, wordpress, and cry

pipepost fixes this. one command and the article is on all five platforms with canonical URLs wired correctly

live now → pipepost.dev
```

**Tweet 2:**

```
here's what "publish everywhere" actually looks like inside claude code:

  you: "cross-publish this to dev.to and hashnode, mark dev.to canonical"
  claude: ✓ dev.to draft created
  claude: ✓ hashnode draft created with canonical URL set

22 tools. MCP protocol. all local.
```

**Tweet 3:**

```
the SEO suite is where it surprised me:

- seo_score: readability, keyword density, heading structure — 0-100
- seo_meta: title + description + OG tags
- seo_schema: JSON-LD for Article, FAQ, HowTo
- index_now: submits URLs to Bing/Yandex for instant indexing

all from one prompt
```

**Tweet 4:**

```
cross-posting without the SEO penalty

canonical URLs get wired automatically when you publish to multiple platforms. google treats dev.to as the source, hashnode and medium credit back. no duplicate-content rankings damage.

nobody does this right manually
```

**Tweet 5:**

```
pricing is a credit pack, not a subscription

3 free credits every month. paid packs are one-time purchase:
- starter: $8 / 10 credits
- pro: $19 / 30 credits
- power: $49 / 100 credits

credits never expire. cross-publishing to all 5 platforms = 1 credit.
```

**Tweet 6 (CTA):**

```
open source, MIT licensed

npx pipepost-mcp init

→ https://pipepost.dev
→ https://github.com/MendleM/Pipepost
→ https://www.npmjs.com/package/pipepost-mcp

built on the model context protocol
```

---

## LinkedIn

**Post (single block, 800-1500 chars):**

```
I just shipped Pipepost — an MCP server that turns Claude Code into a full content publishing pipeline.

The problem: writing a technical blog post is enjoyable. Publishing it to five platforms, optimizing for SEO, generating promotional posts for each social network, and submitting to search engines is a 90-minute slog that kills momentum.

Pipepost adds 22 tools to Claude Code that handle all of that through natural language. Publish to Dev.to, Ghost, Hashnode, WordPress, or Medium — with correct canonical URLs wired between them so Google doesn't penalize cross-posts. Score the content for SEO before publishing. Generate social posts optimized for Twitter, LinkedIn, Reddit, and Bluesky. Submit to IndexNow so Bing crawls in minutes.

Everything runs locally. API keys never leave your machine.

For the pricing, I went credit-based instead of subscription. Three free credits every month; paid packs are one-time purchases with no expiration. A full cross-publish + social generation for one article is two credits.

Open-source, MIT licensed, available on npm:

npx pipepost-mcp init

Site: https://pipepost.dev

Built on the Model Context Protocol — works with Claude Code, Cursor, Zed, and any other MCP-compatible client.
```

---

## Bluesky

**Post (under 300 chars):**

```
shipped pipepost — mcp server for claude code

publishes to dev.to, ghost, hashnode, wordpress, medium. generates social posts. scores SEO locally. canonical URLs wired automatically across platforms.

3 free credits/mo, paid packs never expire

npx pipepost-mcp init
→ https://pipepost.dev
```

---

## Product Hunt (schedule for day 2)

**Tagline (60 char max):**

```
Publish to 5 blog platforms from Claude Code
```

**Description (260 char max):**

```
MCP server that adds publishing, SEO scoring, and social promotion to Claude Code. One prompt, five platforms, canonical URLs handled. Credits never expire.
```

**First comment on the PH listing:**

```
Hey PH 👋

I built Pipepost because I was losing 90 minutes per article to the mechanical part of publishing — five dashboards, frontmatter reformatting, SEO meta, Twitter/Reddit/LinkedIn variants.

Pipepost is an MCP server. That means it runs inside Claude Code (or Cursor, Zed, any MCP client) as a local stdio process. Your API keys stay on your machine.

Today it does:
• Publishes to Dev.to, Ghost, Hashnode, WordPress, Medium — with canonical URLs wired automatically
• SEO scoring, meta tag generation, JSON-LD structured data, IndexNow submission
• Pre-publish content audit (readability, headings, broken links)
• Social post generation for Twitter, LinkedIn, Reddit, Bluesky, HN, newsletter
• Unsplash cover image search with proper attribution
• Cross-platform analytics pulling views, reactions, comments

Three free credits every month. Paid packs are one-time purchase, credits never expire, no subscription lock-in.

Open-source under MIT: https://github.com/MendleM/Pipepost

Happy to answer anything.
```

---

## Hacker News ranking tips (learned the hard way)

- Your first 3 comments set the tone of the thread. Seed intelligent questions via a friend or two if you can, otherwise reply quickly and substantively to the first real comment.
- Don't be defensive if someone says "this is just X with more steps." The correct answer is always "here's exactly the step X doesn't remove."
- If HN mods ask for a URL change or a title change, do it immediately. They are kingmakers.
- Don't edit the post to add "EDIT:" blocks. Reply in the comments.
- If you dip below #30, don't despair — frontpage ranking is partially randomized. Stay responsive in comments.

---

## What to do AFTER the launch spike

Within 48h of launch:
1. Post a follow-up on X quoting the biggest piece of feedback you got.
2. Update the landing page with any testimonial quotes (reply screenshots from HN/Reddit).
3. DM every person who upvoted / starred the repo to ask what tool they'd add next.
4. Write a "launch recap" post for Dev.to: numbers, lessons, next features.
5. If sales > $500, scale paid ads on X targeted at "claude code" interest graph. If < $500, don't. ROI isn't there at this AOV.

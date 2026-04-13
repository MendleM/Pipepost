# Product Hunt Launch Copy

**Product Name:** Pipepost

**Tagline:** Publish blog posts from your terminal with Claude Code

**Description:**

Pipepost is an MCP server that turns Claude Code into a content publishing studio.

Write an article with Claude, score it for SEO, publish to Dev.to, and generate social promotion — all without opening a browser.

**How it works:**
1. Install with `npx pipepost-mcp`
2. Add to your Claude Code config
3. Say "score and publish my article"

**What you get:**

FREE:
- Dev.to publishing (3/month)
- SEO scoring (readability, keywords, structure)
- Setup and config tools

PRO ($19/mo):
- All 5 CMS platforms
- Unlimited publishes
- Full SEO suite (meta tags, JSON-LD)
- Social post generation
- No "Published with Pipepost" badge

**Built for developers who write.** If you use Claude Code to create content, Pipepost eliminates the 25-minute browser shuffle between your terminal and publishing platforms.

Open source. MIT licensed. Free tier forever.

---

**Maker comment:**

I built Pipepost because I was wasting 25 minutes every time I wanted to publish an article I'd written with Claude Code.

The workflow was always: copy markdown, open browser, paste into Dev.to, fix formatting that broke, check SEO in another tab, go back and fix headings, paste again, finally publish, then manually write tweets about it.

With Pipepost, you just say "publish this to Dev.to" and it happens. The whole flow — finished markdown to published draft — takes about 10 seconds.

It's an MCP server, which means it plugs directly into Claude Code as a set of tools. No new app to learn, no new interface. You just talk to Claude like you normally do and it has 8 new capabilities.

I'm starting with Dev.to and expanding to Ghost, Hashnode, WordPress, and Medium. The architecture is designed for it — each platform gets its own module and the publish tool routes by platform parameter.

Would love to hear what you think and what platforms you'd want to see next.

---

**First Comment (for engagement):**

Hey PH! Quick question for content creators: what's your biggest pain point when publishing technical content? For me it was always the context-switching between writing tools and publishing platforms. Curious if others have the same problem or different ones.

---

**Categories:** Developer Tools, Productivity, Open Source, AI, Writing
**Topics:** MCP, Claude Code, Content Publishing, SEO, Terminal Tools

# Show HN Submission

**Title:**
Show HN: Pipepost – MCP server that publishes blog posts from Claude Code

**URL:**
https://pipepost.dev

**Comment (post immediately after submission):**

Hi HN, I built Pipepost because I was spending 20-25 minutes every time I wanted to publish an article I'd written with Claude Code.

The workflow was always: write in terminal → copy markdown → open browser → paste into Dev.to → fix formatting → check SEO in another tab → fix headings → paste again → publish → manually write social posts.

Pipepost is an MCP server (Model Context Protocol — Anthropic's plugin system for Claude) that adds publishing tools directly to Claude Code. You write your article, then say "score this for SEO and publish to Dev.to" and it just works.

It currently exposes 8 tools:

- seo_score: Flesch-Kincaid readability, keyword density, heading structure analysis
- seo_meta: generates meta titles, descriptions, OG tags
- seo_schema: generates JSON-LD structured data
- publish: publishes to Dev.to (Ghost, Hashnode, WordPress, Medium planned)
- list_posts, setup, activate, status

The stack is intentionally minimal: @modelcontextprotocol/sdk + zod + tsup. No Express, no database, no runtime deps beyond those three. Credentials stay local in ~/.pipepost/config.json — nothing phones home.

Free tier: 3 publishes/month + basic SEO scoring, forever.
Pro ($19/mo): unlimited publishing, full SEO suite, social post generation.

Source: https://github.com/MendleM/Pipepost
npm: https://npmjs.com/package/pipepost-mcp

Happy to answer questions about MCP server development — the SDK is surprisingly clean to work with once you get the patterns down.

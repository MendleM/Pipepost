# Pipepost Launch Thread — Twitter/X

Post as a thread. Each section below = one tweet.

---

**Tweet 1 (Hook)**

I got tired of copy-pasting articles between Claude Code and Dev.to.

So I built an MCP server that lets you score SEO, publish, and promote content — without leaving your terminal.

It's called Pipepost. Here's how it works:

---

**Tweet 2 (Problem)**

The workflow before Pipepost:

1. Write article with Claude Code
2. Open browser, log into Dev.to
3. Paste markdown, fix formatting
4. Open SEO checker in another tab
5. Go back, fix headings
6. Paste again, finally publish
7. Write a tweet about it manually

7 steps. 4 apps. 25 minutes. Every time.

---

**Tweet 3 (Solution)**

The workflow with Pipepost:

> "Score this article for SEO and publish to Dev.to"

SEO Score: 84/100
Published to dev.to/you/article-slug
Tweet thread generated

1 terminal. 2 commands. 30 seconds.

---

**Tweet 4 (How it works)**

Pipepost is an MCP server — it gives Claude Code 8 new tools:

- seo_score — readability, keywords, headings
- seo_meta — meta tags + Open Graph
- seo_schema — JSON-LD structured data
- publish — push to Dev.to (more platforms soon)

You just talk to Claude like normal.

---

**Tweet 5 (Install)**

Installation takes 30 seconds:

```json
// ~/.claude/settings.json
"mcpServers": {
  "pipepost": {
    "command": "npx",
    "args": ["pipepost-mcp"]
  }
}
```

Free tier: 3 publishes/month + SEO scoring
Pro ($19/mo): unlimited everything

---

**Tweet 6 (CTA)**

It's open source (MIT), published on npm, and the free tier has no time limit.

Try it: npx pipepost-mcp

GitHub: github.com/MendleM/Pipepost
Site: pipepost.dev

Coming next: Ghost, Hashnode, WordPress, Medium, and social post generation.

If you write content with Claude Code, this will save you hours every week.

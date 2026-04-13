---
title: I Built an MCP Server That Lets You Publish Blog Posts from Your Terminal
published: false
description: I got tired of context-switching between Claude Code and Dev.to. So I built Pipepost — an open-source MCP server that lets you score SEO, publish articles, and manage content without leaving your terminal.
tags: mcp, claudecode, terminal, webdev
---

# I Built an MCP Server That Lets You Publish Blog Posts from Your Terminal

I write a lot of technical content. And for the last few months, most of that writing happens inside Claude Code. I describe what I want, iterate on the structure, refine the wording — all from a terminal session. It works great.

Then comes the part I dread: publishing.

I copy the markdown. I open Dev.to. I paste it in. I fiddle with the frontmatter. I add tags. I preview it. I fix formatting that broke in the paste. I go back to my terminal to check something. I go back to the browser. I finally hit publish.

Every single time, I lose 15-20 minutes to this ritual. And every single time, I think: *why am I leaving my terminal for this?*

So I built a tool that means I don't have to.

## What I built

[Pipepost](https://pipepost.dev) is an MCP server that lets you publish content directly from Claude Code. Write an article, score it for SEO, and publish it to Dev.to — all without opening a browser.

If you're not familiar with MCP (Model Context Protocol), here's the short version: it's an open standard from Anthropic that lets AI assistants use external tools. Think of it as a plugin system for Claude. You register an MCP server, and Claude gets access to whatever tools that server exposes — in this case, tools for content publishing and SEO analysis.

Pipepost currently exposes eight tools:

| Tool | What it does |
|------|-------------|
| `seo_score` | Analyzes readability, keyword density, heading structure |
| `seo_meta` | Generates meta titles, descriptions, OG tags |
| `seo_schema` | Generates JSON-LD structured data |
| `publish` | Publishes to Dev.to (more platforms coming) |
| `list_posts` | Lists your published and draft posts |
| `setup` | Configures platform API keys |
| `activate` | Activates a Pro license |
| `status` | Shows your current config and usage |

The `seo_score` and `publish` tools are available on the free tier. That covers the core workflow: write, check, publish.

## How it works in practice

### Installation

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

That's it. Next time you start Claude Code, the Pipepost tools are available.

### Set up your Dev.to API key

Just ask Claude:

```
> Set up my Dev.to API key: dv1_abc123...
```

Claude calls the `setup` tool, and your key gets saved locally to `~/.pipepost/config.json`. It never leaves your machine.

### Score your content for SEO

Say you've just written an article about building CLI tools in Node. Before publishing, you want to know if it's optimized:

```
> Score this article for SEO targeting "node cli tools"
```

Pipepost runs a Flesch-Kincaid readability analysis, checks your keyword density, validates your heading structure, and returns a composite score:

```json
{
  "score": 82,
  "readability": {
    "flesch_kincaid": 62.3,
    "grade_level": "8th-9th grade (standard)"
  },
  "keyword_density": 1.4,
  "word_count": 1247,
  "heading_structure": { "h1": 1, "h2": 4, "h3": 2 },
  "issues": [],
  "suggestions": [
    "Consider expanding to 1,000+ words for better ranking potential"
  ]
}
```

The score factors in word count, readability sweet spot (50-80 Flesch-Kincaid is ideal), keyword density (targeting 0.5-2.5%), and heading structure. It's not trying to replace Ahrefs — it's a quick sanity check before you hit publish.

### Publish

```
> Publish this article to Dev.to as a draft with tags: node, cli, javascript
```

Claude calls the `publish` tool and you get back:

```json
{
  "success": true,
  "data": {
    "post_id": "1842567",
    "url": "https://dev.to/yourusername/building-cli-tools-in-node-draft-1a2b",
    "platform": "devto"
  }
}
```

Your article is now a draft on Dev.to. Open the URL, do a final review, and publish when you're ready. Or pass `status: "published"` if you're feeling bold.

The whole flow — from finished markdown to draft on Dev.to — takes about 10 seconds.

## Under the hood

For anyone curious about the architecture, here's what's going on.

Pipepost is a Node.js process that communicates with Claude Code over **STDIO transport**. When Claude Code starts, it spawns the MCP server as a child process. They talk back and forth over stdin/stdout using the MCP protocol — Claude sends tool calls, Pipepost sends results.

The stack is intentionally minimal:

- **`@modelcontextprotocol/sdk`** — Anthropic's official TypeScript SDK for building MCP servers. Handles the protocol layer, tool registration, and transport.
- **`zod`** — Schema validation for every tool input. Each tool defines a Zod schema that gets automatically exposed to Claude as the tool's parameter spec.
- **`tsup`** — Bundles everything into a single distributable file.

That's the entire dependency list. No Express, no database, no runtime dependencies beyond those three.

Licensing uses **Lemon Squeezy's API** for activation and validation. When you activate a Pro key, Pipepost caches the license status locally and re-validates every 24 hours. If the network is down, it gracefully degrades — active cached licenses keep working, and free-tier features never require a network call.

Credentials are stored in `~/.pipepost/config.json` on your local filesystem. The server reads this file at runtime. Nothing gets sent anywhere except the specific API calls you trigger (like publishing to Dev.to).

Here's what a tool registration looks like in the codebase:

```typescript
server.tool(
  "seo_score",
  "Analyze content for SEO quality — readability, keyword density, heading structure",
  seoScoreSchema.shape,
  async (input) => {
    const result = await handleSeoScore(input);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);
```

The `McpServer` class from the SDK handles all the protocol negotiation. You register tools with a name, description, Zod schema, and handler. The SDK advertises the tools to Claude, and Claude calls them when it decides they're relevant to what you asked.

## Free vs Pro

I wanted this to be genuinely useful without paying anything. The free tier gives you:

- **SEO scoring** — readability, keyword density, and word count analysis
- **Publishing to Dev.to** — 3 articles per month
- **Setup and config tools** — full access

The Pro tier ($19/month) adds full SEO analysis with issues and suggestions, unlimited publishing, meta tag generation, JSON-LD schemas, post listing, and — once they ship — additional platforms.

The free tier does append a small "Published with Pipepost" badge to articles. Pro makes that optional.

## What's next

This is v0.1, and the roadmap is pretty clear:

**More platforms.** Ghost, Hashnode, WordPress, and Medium support are planned. The publishing layer is already designed for this — each platform gets its own module under `src/publish/`, and the `publish` tool routes based on the `platform` parameter.

**Social promotion.** After you publish an article, you shouldn't have to manually write tweets and Reddit posts about it. The plan is to add tools that generate and post platform-appropriate promotion — a thread for Twitter/X, a discussion post for Reddit, a short post for Bluesky.

**The bigger picture.** If you're already using Claude Code for writing, the workflow should be: write, optimize, publish, promote — without ever switching context. That's what Pipepost is moving toward.

## Try it

If you use Claude Code and publish content, give it a shot:

```bash
npx pipepost-mcp
```

The source is on GitHub: [github.com/MendleM/Pipepost](https://github.com/MendleM/Pipepost)

The project site: [pipepost.dev](https://pipepost.dev)

It's MIT licensed and open source. If you run into issues or have ideas, open an issue. And if you build something similar with MCP — I'd genuinely love to hear about it. We're still in the early days of figuring out what these tool-using AI workflows look like, and the more people experimenting, the better.

---

*If you found this useful, I write about developer tools, MCP, and building things with Claude Code. Follow along for more.*

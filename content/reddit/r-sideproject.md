# Pipepost — publish blog posts from your terminal using Claude Code

Hey everyone. Sharing a side project I've been working on: **Pipepost**, an MCP server that lets you publish content to Dev.to directly from Claude Code.

## The problem

I use Claude Code daily for writing technical blog posts. The writing part is great. The publishing part is not — copy the output, open the CMS, paste it in, fiddle with formatting, add metadata, publish. Every. Single. Time.

I wanted "write it and ship it" without leaving the terminal.

## What I built

Pipepost is an MCP (Model Context Protocol) server. You add it to Claude Code, and it gives Claude new tools: publish content, score it for SEO, generate meta tags. The whole write-to-publish workflow happens in one terminal session.

Quick install:

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

## Tech stack

- TypeScript
- MCP SDK (`@modelcontextprotocol/sdk`) for the server protocol
- Zod for input validation
- tsup for bundling
- vitest for testing
- Deployed as an npm package (`npx pipepost-mcp`)
- Landing page is Next.js on Vercel

## Business model (being transparent)

- **Free tier:** Publish to Dev.to (3 posts/month), basic SEO scoring. No account needed.
- **Pro:** $19/month. Unlimited publishes, more platforms (Ghost, WordPress, Hashnode, Medium), full SEO suite (meta tags, JSON-LD structured data), social promotion tools.

I went with a generous free tier because I want people to actually try it before deciding if they need more. The free tools are genuinely useful — not crippled versions.

## Where it's at

Just hit v0.1.2. Published on npm as `pipepost-mcp`. It's early — the core publish-to-Dev.to flow works well, and the SEO scoring is solid. Still building out the additional platform integrations and social features.

## Links

- GitHub: https://github.com/MendleM/Pipepost
- Site: https://pipepost.dev

Looking for early users and honest feedback. What platforms would you want supported? Is the pricing reasonable? Anything about the workflow that seems off? Happy to answer questions about the MCP side of things too — it's a interesting protocol to build on.

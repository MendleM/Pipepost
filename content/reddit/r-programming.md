# Pipepost: MCP server for publishing blog posts from your terminal

I built an MCP (Model Context Protocol) server that adds content publishing and SEO analysis tools to Claude Code. Wanted to share it since MCP tooling is still pretty new and there aren't many examples out there.

## What's MCP?

Model Context Protocol is Anthropic's open standard for connecting AI assistants to external tools. Instead of the assistant just generating text, MCP lets it call structured tools — think of it like giving a language model a typed API to work with. The server communicates over stdio using JSON-RPC.

## What Pipepost does

It exposes 8 tools through MCP:

- **`seo_score`** — Analyzes content for readability (Flesch-Kincaid style), keyword density, heading structure. Returns a numeric score and specific suggestions.
- **`seo_meta`** / **`seo_schema`** — Generates meta tags and JSON-LD structured data.
- **`publish`** — Posts to Dev.to via their API. Takes markdown content, title, tags. Returns the published URL.
- **`list_posts`** — Lists your published/draft posts from a platform.
- **`setup`** / **`activate`** / **`status`** — Configuration management.

## Architecture

- TypeScript, built with the `@modelcontextprotocol/sdk`
- Stdio transport (Claude Code spawns it as a child process)
- Input validation with Zod schemas
- Credentials stored locally in `~/.pipepost/config.json` — nothing leaves your machine
- Tiered feature gating (free vs. pro) handled server-side
- Bundled with tsup, tested with vitest

The whole thing is ~10 source files. Kept it minimal on purpose.

## Install

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

Or just run `npx pipepost-mcp` to test it.

## Free tier limitations

3 publishes/month to Dev.to, basic SEO scoring. Pro ($19/mo) unlocks unlimited publishes, more platforms (Ghost, WordPress, Hashnode, Medium), full SEO suite, and social promotion tools.

## Links

- Source: https://github.com/MendleM/Pipepost
- Site: https://pipepost.dev
- MIT licensed

This is v0.1.2 — still early. If you've been building with MCP or have thoughts on the architecture, I'd appreciate the feedback. Particularly interested in hearing if anyone has opinions on stdio vs. SSE transport for this kind of tool.

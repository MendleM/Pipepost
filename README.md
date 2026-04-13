# Pipepost

**Publish from your terminal.**

Pipepost is an MCP server that turns Claude Code into a content studio. Write, optimize, and publish — without leaving your terminal.

## Quick Start

```bash
npx pipepost-mcp
```

Then add to your Claude Code MCP config (`~/.claude/settings.json`):

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

## Setup

Configure your Dev.to API key:

```
Use the "setup" tool with platform: "devto" and credentials: { "api_key": "YOUR_KEY" }
```

Get your Dev.to API key at [dev.to/settings/extensions](https://dev.to/settings/extensions).

## Tools

| Tool | Description | Tier |
|------|-------------|------|
| `seo_score` | Analyze content for readability, keyword density, structure | Free (basic) / Pro (full) |
| `seo_meta` | Generate meta title, description, OG tags | Pro |
| `seo_schema` | Generate JSON-LD structured data | Pro |
| `publish` | Publish to Dev.to (more platforms coming) | Free (3/mo) / Pro (unlimited) |
| `list_posts` | List your published and draft posts | Pro |
| `setup` | Configure platform API keys | Free |
| `activate` | Activate Pro license | Free |
| `status` | Show config and license status | Free |

## Free vs Pro

| | Free | Pro ($19/mo) |
|---|---|---|
| Platforms | Dev.to | Dev.to, Ghost, Hashnode, WordPress, Medium |
| SEO | Readability + keyword density | Full suite |
| Publishes | 3/month | Unlimited |
| Social promotion | — | Twitter, Reddit, Bluesky |
| Badge | Required | Optional |

**Get Pro:** [pipepost.dev](https://pipepost.dev)

## How It Works

1. Write content in Claude Code (you already do this)
2. Ask Claude to score it: *"Score this for SEO targeting 'mcp server'"*
3. Publish: *"Publish this to Dev.to as a draft"*
4. Promote: *"Create social posts for this article"* (Pro)

Your credentials are stored locally in `~/.pipepost/config.json` and never leave your machine.

## License

MIT

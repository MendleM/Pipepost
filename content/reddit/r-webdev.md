# Built a tool to publish Dev.to articles without leaving the terminal

If you use Claude Code for writing, you know the workflow: generate content in the terminal, copy it, open the browser, paste into your CMS, format it, add tags, publish. I built a tool to skip all of that.

**Pipepost** is an MCP server that adds publishing and SEO tools directly to Claude Code. You write content, score it, and publish — all from the same terminal session.

## Before / After

**Before:**
1. Write content in Claude Code
2. Copy markdown output
3. Open Dev.to, create new post
4. Paste, fix formatting
5. Manually add tags, cover image
6. Preview, publish

**After:**
1. Write content in Claude Code
2. "Score this for SEO targeting 'react server components'"
3. "Publish this to Dev.to with tags react, webdev, tutorial"
4. Done. Get back a URL.

## The SEO scoring feature

This is the part I actually use the most. Before publishing, you can run `seo_score` on your content and it checks:

- Readability grade (sentence length, word complexity)
- Keyword density for your target keywords
- Heading structure (H1/H2/H3 hierarchy)
- Actionable suggestions to improve the score

It gives you a numeric score so you can iterate before publishing. No more guessing whether your post is readable enough.

## Setup

Add to `~/.claude/settings.json`:

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

Then configure your Dev.to API key (get one at dev.to/settings/extensions) through the `setup` tool.

Free tier gives you 3 publishes/month and basic SEO scoring. Pro ($19/mo) adds unlimited publishes, more platforms (Ghost, WordPress, Hashnode, Medium), full SEO suite with meta tag and JSON-LD generation, and social promotion.

## Links

- GitHub: https://github.com/MendleM/Pipepost
- Site: https://pipepost.dev

Still early days (v0.1.2). Curious what CMS platforms people would want supported next, and whether the SEO features are actually useful for your workflow. What does your current publish process look like?

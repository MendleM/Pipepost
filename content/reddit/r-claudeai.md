# [Project] I made an MCP server that lets Claude Code publish directly to Dev.to

I've been using Claude Code for writing blog posts and technical content, and I got tired of the copy-paste-format-publish loop. So I built **Pipepost** — an MCP server that lets you publish to Dev.to (and score your content for SEO) without leaving the terminal.

## What it does

You write content in Claude Code like you normally would. Then instead of switching to a browser, you just ask Claude to publish it:

> "Publish this to Dev.to as a draft"

That's it. It also has an SEO scoring tool that checks readability, keyword density, and heading structure — gives you a score and actionable suggestions before you hit publish.

## Quick demo of the workflow

```
You: Write a blog post about building MCP servers in TypeScript

Claude: [writes the post]

You: Score this for SEO targeting "mcp server typescript"

Claude: [runs seo_score, shows readability grade, keyword density, suggestions]

You: Publish this to Dev.to as a draft with tags typescript, mcp, tutorial

Claude: [publishes, returns the Dev.to URL]
```

## Install

Add to your Claude Code MCP config (`~/.claude/settings.json`):

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

Then configure your Dev.to API key through the `setup` tool.

## Free tier

- Publish to Dev.to (3 posts/month)
- Basic SEO scoring (readability + keyword density)
- No account needed for the free tier

Pro is $19/mo if you want unlimited publishes, more platforms (Ghost, Hashnode, WordPress, Medium), full SEO suite, and social promotion — but the free tier is genuinely useful on its own.

## Links

- GitHub: https://github.com/MendleM/Pipepost
- Site: https://pipepost.dev

It's still early — just hit v0.1.2. Would genuinely appreciate feedback on what tools or platforms you'd want to see next. What does your content workflow in Claude Code look like?

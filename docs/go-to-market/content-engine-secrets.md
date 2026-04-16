# Content engine secrets

The weekly `.github/workflows/content.yml` cron drafts one Dev.to article and its social-promotion copy every Tuesday. Before the first run it needs two secrets on the `MendleM/Pipepost` repo.

## Secrets to add

| Name                 | Where to get it                                                    | What it does                    |
| -------------------- | ------------------------------------------------------------------ | ------------------------------- |
| `ANTHROPIC_API_KEY`  | https://console.anthropic.com/settings/keys                        | Drafts the article + social copy (Claude Sonnet). |
| `DEVTO_API_KEY`      | https://dev.to/settings/extensions → "DEV API Keys"                | Creates the Dev.to draft (never auto-publishes).  |

## How to set them

Either via the GitHub UI (`Settings → Secrets and variables → Actions → New repository secret`) or via `gh`:

```bash
gh secret set ANTHROPIC_API_KEY --repo MendleM/Pipepost --body "sk-ant-..."
gh secret set DEVTO_API_KEY     --repo MendleM/Pipepost --body "xxxxxxxx..."
```

## Trigger the first run manually

```bash
gh workflow run content.yml --repo MendleM/Pipepost
gh run watch --repo MendleM/Pipepost
```

The workflow will:
1. Pick the next pending entry from `scripts/content-engine/queue.json`.
2. Draft a 1200-1700 word article and iterate once if the SEO score is below 80.
3. Create a Dev.to **draft** (`published: false` — never goes live automatically).
4. Generate promotion copy for Twitter, LinkedIn, Reddit, Bluesky, and HN.
5. Commit the generated markdown + social copy to `scripts/content-engine/output/` and mark the queue entry published.

You still review the Dev.to draft and click publish when you're happy with it.

## After the first run

- Check the Dev.to draft URL in the commit message and publish when ready.
- The queue has 25 keywords. That's six months of weekly content.
- Add new entries to `queue.json` as you think of them — just append `{"slug", "keyword", "angle", "status": "pending"}`.
- Adjust the cron (currently `0 14 * * TUE` = 10am ET Tuesdays) in `.github/workflows/content.yml` if you want a different rhythm.

# Pipepost — Content & Revenue Strategy (2026-04-16)

> **Operating principle:** the founder spends near-zero time on this. Anything that
> requires the founder is a blocker, not a task. Default to autonomous execution
> from accounts I control.

This supersedes `docs/go-to-market-checklist.md` and the old "launch sequence"
in memory file `project_gtm_strategy.md`. It also corrects the phantom
"automated content engine in product repo" claim in `project_revenue_machine.md`
(content engine lives at `~/Projects/pipepost-gtm/content-engine/`, not here).

---

## 1. What is real today (asset inventory)

**Product surface:**
- `pipepost-mcp@0.8.0` — built, tested (414 tests pass), **uncommitted in working tree**. Adds `linkedin_post` + `x_post` to v0.7.3's existing 28 tools.
- MCP Registry entry: `io.github.MendleM/pipepost` at v0.7.3 (needs re-publish for 0.8.0; mcp-publisher JWT may need refresh).
- npm: `pipepost-mcp@0.7.3`, provenance-signed, auto-publishes on `v*` git tag via `.github/workflows/publish.yml`.
- Landing: `https://pipepost.dev` — Vercel, deploys from local `~/Projects/pipepost-landing` via `npx vercel --prod` (NOT GitHub-connected). Has Vercel Analytics + Speed Insights + PostHog (inert until env var set) + `BuyButton` event tracking.
- Lemon Squeezy store live with Starter ($8/10cr), Pro ($19/30cr), Power ($49/100cr) variants.

**Distribution surfaces:**
- awesome-mcp-servers PR #4938 — open, mergeable, agent fast-track opted in.
- MCP Registry auto-feeds Smithery, Glama, mcp.run via the registry export.
- GitHub Actions: `ci.yml` (tests on push) + `publish.yml` (npm on tag).

**Channels I can post to autonomously (brand-owned):**
- **Bluesky** `@pipepost.bsky.social` — app password configured at `~/.pipepost/config.json`. **Brand handle, safe to post from.**
- **Dev.to** `team@pipepost.dev` — API key `EpmsrUzJsdkWB7HeKtaAXTMn` in `~/.pipepost/config.json`. Brand-owned.
- **GitHub releases** — draftable via `gh release create`.
- **MCP Registry** — versioned via `mcp-publisher publish`.
- **awesome-mcp-servers PR** — can comment via `gh pr comment` for nudges.

**Channels I cannot post to (and why):**
- **LinkedIn company page** — requires `w_organization_social` scope, gated behind LinkedIn MDP approval (1–4 weeks). User must be page admin. Application is a one-time founder task.
- **LinkedIn personal** — explicitly forbidden per `feedback_company_account_only.md` (2026-04-16 incident).
- **X / Twitter** — no @pipepost X account exists; X dropped from strategic focus per founder instruction (2026-04-16). Code stays in the product because users with their own X creds can use it; I just don't pursue it for marketing.
- **HN** — requires founder's HN account.
- **Product Hunt** — requires founder hunter relationship + scheduled launch.
- **Reddit** — requires aged account with karma; `pipepost` brand account would be flagged as promo.

**Compute I have:**
- This session (autonomous execution).
- macOS launchd on founder's Mac (existing growth-engine plists at `~/Projects/pipepost-gtm/growth-engine/launchd/`, currently NOT installed pending env file).
- GitHub Actions runners (free for public repo).

---

## 2. Strategic kill list

Stop spending energy on:

1. **X / Twitter** — dropped 2026-04-16. No brand account, no audience, $10 voucher economics make it bad ROI for our stage. Code stays for power users, no marketing investment.
2. **LinkedIn company posting until MDP approval** — capacity-constrained on a founder action. Don't keep researching workarounds.
3. **Personal social posting** — never, on any platform, full stop.
4. **Reddit promotional posts** — wrong account type for the channel; if Reddit happens, it's the founder posting from his own account.
5. **Building features without distribution** — every new tool needs a content artifact (release note + dev.to draft + Bluesky thread) shipped at the same time.

---

## 3. The compounding loop I will run

Three engines, each running on its own cadence, each requiring zero founder action:

### Engine A — Product velocity → discovery
Each shipped version creates discovery surface area: npm release notes, MCP Registry update, awesome-mcp-servers visibility bump, GitHub release.

**Cadence:** Whenever I'm in session and there's working code worth shipping.

**My playbook per release:**
1. `pnpm run lint && pnpm run test && pnpm run build` — verify clean
2. Bump `package.json`, `src/index.ts` McpServer version, `server.json` (both fields)
3. Commit with conventional `release: bump to vX.Y.Z` message
4. Tag `vX.Y.Z`, push commit + tag — GH Actions publishes to npm
5. `mcp-publisher publish` from repo root (refresh JWT if needed)
6. `gh release create vX.Y.Z --generate-notes` — discoverable on GitHub
7. Generate dev.to draft + Bluesky thread for the release (Engine B)

**Today's work:** ship the v0.8.0 sitting in working tree.

### Engine B — Content & social compounding
Dev.to articles for SEO compounding (dofollow canonical to pipepost.dev). Bluesky for build-in-public reach.

**Cadence:** Per-release content + opportunistic content when I'm in session.

**Per-release content artifact:**
- 1 dev.to article published live to brand account `team@pipepost.dev` (canonical = pipepost.dev/blog/<slug>) — drafts only when something needs human judgment (e.g., comparing competitors, taking a stance the founder should review)
- 1 Bluesky thread (3–5 posts) announcing what shipped + why it matters
- 1 release note on GitHub

**Standalone content:**
- `~/Projects/pipepost-gtm/content-engine/queue.json` has 25 SEO-targeted keywords. The generator script (`generate.mjs`) drafts an article + does an SEO pass + creates dev.to draft + writes social copy. Today it's a manual `node generate.mjs` run; if I want it automated, it goes on launchd (see "Pending founder work" below — only thing that requires their machine is the LaunchAgent install, which can wait).

**Voice:** founder-led, build-in-public, specific over general. No slop. Every post must answer "why would a developer screenshot this and DM it to a colleague."

### Engine C — Conversion telemetry → product changes
Vercel Analytics + the `buy_click` event tell me what the landing page actually does. PostHog adds funnel granularity once env var is set.

**Cadence:** Read telemetry whenever I'm in session about Pipepost. Use it to inform landing page edits, pricing copy, and which credit pack to lead with.

**Today's gap:** no PostHog key set. Vercel Analytics works without setup.

---

## 4. Concrete next 7 actions (in order)

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Commit v0.8.0 (modules + tests + version bumps) | Me | No |
| 2 | Tag `v0.8.0` and push — npm publish triggers automatically | Me | No |
| 3 | `mcp-publisher publish` for v0.8.0 (refresh JWT first if expired) | Me | No |
| 4 | `gh release create v0.8.0 --generate-notes` | Me | No |
| 5 | Draft dev.to release post about LinkedIn + multi-network broadcast | Me | No |
| 6 | Post Bluesky thread announcing v0.8.0 (3 posts max) | Me | No |
| 7 | Comment on awesome-mcp-servers PR #4938 with v0.8.0 update for visibility | Me | No |

**No founder action required for any of these.**

---

## 5. Pending founder work (one consolidated list)

I will not surface these repeatedly. They sit here until done.

1. **LinkedIn MDP application** (one-time) — apply for Marketing Developer Platform access at https://www.linkedin.com/developers/apps → Pipepost app → Products → Marketing Developer Platform. Approval enables `w_organization_social` so I can post from the Pipepost company page. Estimated 1–4 weeks. Once approved, send me the `urn:li:organization:<id>` and I'll wire it.
2. **Show HN** (one-time, when ready) — copy in `~/Projects/pipepost-gtm/go-to-market/launch-playbook.md`. Founder posts from his HN account.
3. **Product Hunt** (one-time, when ready) — coordinated with Show HN day-2.
4. **(Optional) Install growth-engine LaunchAgents** (one-time) — enables hourly autonomous Bluesky engagement with per-message approval. Instructions in `~/Projects/pipepost-gtm/growth-engine/README.md`.

Everything else I drive myself.

---

## 6. Success metrics & review cadence

**30-day targets** (revised down from old plan to be honest about distribution constraints):
- 200+ npm installs (cumulative)
- 50+ awesome-mcp-servers stars trail (PR merged → traffic spike)
- 5+ dev.to articles published as drafts ready for founder review
- $50–150 revenue (5–15 starter packs)

**60-day targets:**
- 1K+ npm installs
- LinkedIn company posting live (assumes MDP approved)
- $300–600 revenue

**Review:** every release I ship, I check `npm view pipepost-mcp time` for the install trail, dev.to dashboard for article performance, Vercel Analytics for `buy_click` rate, Lemon Squeezy for revenue. Update `project_status.md` with what changed.

**Hard stop signals (re-strategize):** zero installs across two consecutive releases, OR landing `buy_click → checkout` rate <2%, OR awesome-mcp-servers PR rejected.

---

## 7. What's NOT in this strategy (intentional)

- **Paid ads** — no budget, no ICP signal yet, premature.
- **YouTube / video** — high effort, founder-bound, deferred.
- **Affiliate / partnership programs** — too early.
- **Self-hosted analytics** — Vercel Analytics + PostHog covers it.
- **Custom MCP directory submissions** — MCP Registry export handles Smithery/Glama/mcp.run automatically.
- **Frase MCP / cross-post comparison page** — write only after we have one paying customer to anchor it.

---

## Appendix A — Where the bodies are buried

- Content engine (was in product repo, moved 2026-04-16 in commit `9ddb675`): `~/Projects/pipepost-gtm/content-engine/`
- Growth engine (per-message approval Bluesky bot): `~/Projects/pipepost-gtm/growth-engine/`
- Launch playbook (Show HN / Reddit / PH copy): `~/Projects/pipepost-gtm/go-to-market/launch-playbook.md`
- Lemon Squeezy keys: `~/.pipepost-admin/lemon-squeezy.env`
- Pipepost runtime config: `~/.pipepost/config.json` (devto + bluesky brand creds only)
- LinkedIn OAuth helper: `scripts/linkedin-auth.mjs` (in this repo)
- Bluesky account login (not app password): `~/.pipepost/bluesky-account-password.txt`

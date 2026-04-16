# Show HN Launch Kit — Pipepost

Everything needed to submit. Founder-only step is the actual submit click from your HN account; everything else is here.

---

## 1. Title (max 80 chars, must start with "Show HN:")

**Recommended (76 chars):**
> Show HN: Pipepost – Publish to 6 CMS platforms from Claude Code in one chat turn

**Backup options:**
- (72) `Show HN: An MCP server that turns Claude Code into a publishing pipeline`
- (78) `Show HN: Pipepost – MCP server for SEO, publishing, and social from terminal`
- (75) `Show HN: I built an MCP server that publishes my blog from Claude Code`

The recommended title leads with the *concrete* number ("6 CMS platforms") and the *surprise* ("one chat turn"). HN responds to specifics over abstractions.

---

## 2. URL field

Submit `https://pipepost.dev` — landing has the agent-loop CTA prominently placed and clear pricing. The transcript itself is one click away.

(Do NOT submit the GitHub repo URL. HN auto-detects projects and will prefer the human-facing site. Submitting the GitHub URL also locks the title to the repo description and makes the post less compelling.)

---

## 3. The OP comment (post this immediately after submitting)

The OP first-comment is the single highest-leverage piece of an HN launch. It's what people read before clicking through. Keep it personal, concrete, and honest.

> Hey HN — I built Pipepost to scratch my own itch.
>
> I write a blog post and want it on Dev.to, Ghost, Hashnode, WordPress, Medium, and Substack with proper canonical URLs, plus social promo on Twitter, LinkedIn, and Bluesky. The manual flow takes 45–90 minutes of tab juggling. Every existing tool either does one platform well, or pretends to do many but locks you into a dashboard.
>
> Pipepost is an MCP server that gives Claude Code the verbs to operate the entire publishing surface from the terminal. The whole pipeline — audit, SEO score, fix issues, cross-publish to 5 platforms with canonical wiring, generate platform-specific social posts, submit to IndexNow — runs as one chat turn.
>
> I put a real annotated transcript here so you can see what that actually looks like before installing anything: https://github.com/MendleM/Pipepost/blob/main/docs/demo/agent-loop.md
>
> Architecture is deliberately boring: it's a local stdio MCP server. Your API keys live in `~/.pipepost/config.json` and never leave your machine. There's no Pipepost cloud relay; tool calls go straight from your machine to Dev.to / Ghost / etc. Pricing is credit-based — 3 free per month, 1 credit = 1 full pipeline. Free tier covers cover images, analytics, frontmatter, IndexNow, and direct social posting forever.
>
> 30 tools across SEO, publishing, drafts, content quality, social broadcast, and analytics. MIT licensed. 446 tests.
>
> What I'd specifically like feedback on:
> 1. Is the credit pricing intuitive, or does the line between "free" and "credit-required" feel arbitrary?
> 2. Substack support uses reverse-engineered cookie auth (no public API). Anyone running into reliability issues there?
> 3. Are there CMS platforms you'd want next? I've considered Hugo Cloud, WriteFreely, and Bear Blog.
>
> Install: `npx pipepost-mcp init`. Repo: https://github.com/MendleM/Pipepost. Happy to answer anything.

---

## 4. Prepared answers to likely objections

### "Why not just write a shell script with curl?"
> You can — and for a single-platform workflow, you should. Pipepost earns its keep when (a) you publish to ≥3 platforms, (b) you want canonical URLs wired automatically, (c) you want SEO scoring + meta + schema in the same chain as the publish, or (d) you want Claude to reason about the content (e.g., "audit this and fix the issues before publishing"). The whole point is composability inside the agent loop.

### "Credits for SEO scoring? That's free elsewhere."
> Basic SEO scoring (heading structure, keyword density, readability, word count) is FREE in Pipepost too — no credits required. The credit-gated version adds prioritized issue lists with line numbers and fix suggestions. The pricing exists so I can keep maintaining the server long-term without ads or a SaaS dashboard. 3 free credits/month covers most personal blog cadence.

### "What's stopping me from forking and stripping out the credit check?"
> Nothing — it's MIT. The credit check is a soft gate on a few features; the publish/SEO basics work without it. If forking is what gets the tool used, that's fine. The business model assumes a small percent of users will pay for convenience and ongoing maintenance, not lock-in.

### "Substack cookie auth feels sketchy."
> Agreed — Substack has no public API, so cookie auth is the only option. The cookie sits in your local config file and gets sent only to substack.com endpoints over HTTPS. If Substack ships a real API, we'll switch immediately. I documented the exact cookie origin (DevTools → Application → Cookies → connect.sid) so there's no ambiguity about what's being stored.

### "Why MCP and not a CLI?"
> Two reasons: (1) chaining — Claude Code naturally composes tools into a pipeline, where a CLI requires you to wire stdout to stdin manually. (2) inspection — Claude reads the tool descriptions and reasons about which to call, so "audit this and fix it before publishing" works without you remembering subcommand names. For people who want a CLI, the underlying functions are exported.

### "How does this compare to blurt.sh / mcp-publish-to-medium / [other]?"
> blurt.sh is publish-only, doesn't do SEO, doesn't wire canonicals, isn't agent-native. The single-platform MCPs (medium-mcp, devto-mcp, etc) work great if you only use one platform — Pipepost is the multi-platform + SEO + social-loop bundle in one server.

### "Open-source but credits = paywall?"
> The server, every tool, and every API integration is MIT-licensed and runs locally. Credits gate three things: full SEO analysis, meta+schema generation, and social-post generation. Everything else (publish, cross-publish, analytics, drafts, IndexNow, cover images, direct social posting, content audit basic) is free forever and uses no Pipepost infrastructure at all.

### "Is there telemetry?"
> No. The server is local stdio; there's no analytics endpoint, no error reporting, no usage logs sent anywhere. Credit balance is checked against the license server only when you spend a credit, and that check sends only the license key.

---

## 5. Pre-launch checklist (run 1 hour before submitting)

- [ ] `pipepost.dev` loads in <1.5s (current TTFB: 411ms ✓)
- [ ] `pipepost.dev/tools` loads <2s (current: 1.05s ✓)
- [ ] Agent-loop transcript reachable: https://github.com/MendleM/Pipepost/blob/main/docs/demo/agent-loop.md ✓
- [ ] `npx pipepost-mcp init` works on a fresh clone (smoke test)
- [ ] CI badge green on README ✓
- [ ] npm latest is v0.9.1 ✓
- [ ] Glama PR #4938 either merged OR you can deflect "not on awesome-mcp-servers yet" with "in review, Glama listing here: https://glama.ai/mcp/servers/MendleM/pipepost"
- [ ] Lemon Squeezy checkout works (do a $1 test or just preview the page)
- [ ] You're at a desk with notifications on for the next 4 hours
- [ ] You've got tea/coffee, no meetings, calendar blocked

---

## 6. Optimal timing

- **Day:** Tuesday or Wednesday. Avoid Mondays (HN reorganizes itself after weekend posts) and Fridays (everyone's checked out).
- **Window:** **8:00–10:00 AM ET** (1300–1500 UTC). Catches East Coast morning, West Coast pre-coffee, and Europe end-of-day. Show HN front page is decided in the first 90 minutes; you want maximum eyeball density during that window.
- **Avoid:** US holidays, major Apple/Google/AWS launch days, the day after a CrowdStrike-tier news event.

---

## 7. The 4-hour rule

Every comment posted in the first 4 hours gets a personal reply within 30 minutes. This is the single biggest predictor of staying on the front page. Even hostile comments get a polite, substantive response — never defensive, never dismissive. The community is watching how you handle pushback as much as the product.

For criticism you actually agree with, say so explicitly: "Yeah, that's a fair point — here's what I'm planning to do about it." Concession beats defense every time on HN.

---

## 8. After-launch follow-up

Within 24 hours of the post (regardless of how it ranks):

- Cross-post the dev.to article link to r/ClaudeAI and r/SideProject
- Bluesky thread from `@pipepost.bsky.social` linking back to the HN post (let lurkers see traction)
- If front page: write a "what I learned launching Pipepost on HN" post for dev.to (free SEO hook + community goodwill)
- If not front page: don't relaunch for at least 6 months. Rework the angle and try again with a major version.

---

## 9. What I (Claude) can do for you on launch day

- Pre-staged Bluesky thread that posts ~30 min after submit (drives Bluesky → HN)
- Pre-staged dev.to short post linking to the HN thread
- Real-time monitoring of `bluesky_search` for "pipepost" or "MCP server publishing" mentions, so you can engage with the spillover audience
- Quick-fix any docs typo / broken link the HN crowd surfaces in the first hour

Just say "go" when you're about to submit and I'll fire those off.

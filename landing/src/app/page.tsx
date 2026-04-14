import { CopyInstall } from "./components/CopyInstall";
import { FaqItem } from "./components/FaqItem";
import { PlatformIconGrid } from "./components/PlatformIcon";
import { ScrollReveal } from "./components/ScrollReveal";
import { FloatingCTA } from "./components/FloatingCTA";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Pipepost",
              description:
                "MCP server for Claude Code that lets you score, publish, and promote your content without leaving the terminal.",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Cross-platform",
              url: "https://pipepost.dev",
              offers: [
                { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free", description: "Dev.to publishing, 3 publishes per month, basic SEO scoring" },
                { "@type": "Offer", price: "9", priceCurrency: "USD", name: "Starter", description: "Unlimited publishes, full SEO suite, no badge", priceSpecification: { "@type": "UnitPriceSpecification", price: "9", priceCurrency: "USD", billingDuration: "P1M" } },
                { "@type": "Offer", price: "19", priceCurrency: "USD", name: "Pro", description: "All CMS platforms, social post generation", priceSpecification: { "@type": "UnitPriceSpecification", price: "19", priceCurrency: "USD", billingDuration: "P1M" } },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                { "@type": "Question", name: "What is an MCP server?", acceptedAnswer: { "@type": "Answer", text: "MCP (Model Context Protocol) is the open standard that lets AI assistants connect to external tools. Pipepost is an MCP server that adds SEO scoring, optimization, and publishing tools to your Claude Code session." } },
                { "@type": "Question", name: "How do I set up Pipepost?", acceptedAnswer: { "@type": "Answer", text: "Run npx pipepost-mcp in your terminal. It auto-configures Claude Code's MCP settings and walks you through connecting your first platform in under a minute." } },
                { "@type": "Question", name: "What platforms are supported?", acceptedAnswer: { "@type": "Answer", text: "Dev.to is fully supported today. Ghost, Hashnode, WordPress, Medium, Substack, LinkedIn, X, Reddit, Bluesky, Threads, and Mastodon are on the roadmap." } },
                { "@type": "Question", name: "Is my API key safe?", acceptedAnswer: { "@type": "Answer", text: "Your credentials are stored locally on your machine in ~/.pipepost/config.json. They never leave your device. Pipepost runs as a local stdio process with no cloud relay or telemetry." } },
                { "@type": "Question", name: "What does the SEO scoring check?", acceptedAnswer: { "@type": "Answer", text: "The score analyzes readability, keyword usage, heading structure, and meta completeness. You get a 0-100 composite score with specific improvement tips." } },
                { "@type": "Question", name: "What's the difference between tiers?", acceptedAnswer: { "@type": "Answer", text: "Free gives you Dev.to publishing and basic SEO scoring. Starter adds unlimited publishes and the full SEO suite. Pro unlocks all 12 platforms, social post generation, and analytics." } },
                { "@type": "Question", name: "Can I use this with other AI editors?", acceptedAnswer: { "@type": "Answer", text: "Pipepost uses the Model Context Protocol standard, so it works with any MCP-compatible client, not just Claude Code." } },
                { "@type": "Question", name: "Is Pipepost open source?", acceptedAnswer: { "@type": "Answer", text: "Yes. The MCP server, all tools, and this site are open source under the MIT license on GitHub." } },
              ],
            },
          ]),
        }}
      />
      <div className="grain" />
      <div className="dot-pattern" />
      <FloatingCTA />

      {/* ═══════════ NAV ═══════════ */}
      <nav className="glass-nav fixed top-0 inset-x-0 z-50 px-6">
        <div className="max-w-6xl mx-auto h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <span className="text-xl font-mono text-[var(--accent)] font-bold tracking-tight group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)] transition-all">
              |&gt;
            </span>
            <span className="text-sm font-semibold tracking-tight">pipepost</span>
          </a>
          <div className="hidden sm:flex items-center gap-8 text-sm text-[var(--text-dim)]">
            <a href="#how-it-works" className="nav-link hover:text-white transition-colors">How it works</a>
            <a href="/tools" className="nav-link hover:text-white transition-colors">Docs</a>
            <a href="#pricing" className="nav-link hover:text-white transition-colors">Pricing</a>
            <a href="https://github.com/MendleM/Pipepost" target="_blank" rel="noopener noreferrer" className="nav-link hover:text-white transition-colors">GitHub</a>
          </div>
          <a href="#get-started" className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)] hover:text-white transition-all duration-300">
            Get started
          </a>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 px-6">
        <div className="hero-dots absolute inset-0 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left */}
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.2)] rounded-full text-xs text-[var(--accent)] font-mono mb-8 shadow-[0_0_20px_-5px_rgba(249,115,22,0.15)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
                MCP Server for Claude Code
              </span>

              <h1 className="mb-6">
                <span className="block text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
                  Publish everywhere.
                </span>
                <span className="block text-4xl sm:text-5xl lg:text-6xl font-serif italic text-gradient leading-[1.12] mt-1 drop-shadow-[0_0_40px_rgba(249,115,22,0.15)]">
                  From your terminal.
                </span>
              </h1>

              <p className="text-lg text-[var(--text-muted)] mb-8 max-w-lg leading-relaxed">
                One command gives Claude Code the power to score, optimize, and
                publish your content to 12 platforms.
              </p>

              <div id="get-started" className="flex flex-col sm:flex-row items-start gap-3">
                <CopyInstall />
                <a
                  href="https://github.com/MendleM/Pipepost"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="install-box inline-flex items-center gap-2 text-sm font-medium hover:border-[var(--border-light)] hover:bg-[var(--bg-elevated)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] transition-all duration-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Right: Icons */}
            <div className="relative animate-fade-in-up delay-2">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 50% 50%, rgba(249,115,22,0.1) 0%, rgba(168,85,247,0.06) 25%, rgba(6,182,212,0.04) 45%, transparent 65%)",
                  filter: "blur(80px)",
                }}
              />
              <div className="relative">
                <PlatformIconGrid />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TERMINAL DEMO ═══════════ */}
      <section className="relative px-6 py-20 sm:py-28 border-t border-[var(--border)]">
        <div className="section-glow left-1/2 -translate-x-1/2 top-0" style={{ background: "rgba(34,197,94,0.03)" }} />
        <ScrollReveal>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
                One prompt.{" "}
                <span className="font-serif italic text-gradient">Full pipeline.</span>
              </h2>
              <p className="text-[var(--text-muted)] max-w-xl mx-auto text-lg leading-relaxed">
                Tell Claude what you want. Pipepost handles the rest.
              </p>
            </div>
            <div className="max-w-3xl mx-auto relative">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.06) 0%, rgba(249,115,22,0.03) 40%, transparent 65%)",
                  filter: "blur(80px)",
                }}
              />
              <div className="terminal relative">
                <div className="terminal-chrome relative">
                  <div className="terminal-dots"><span /><span /><span /></div>
                  <span className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" className="text-[var(--accent)]">
                      <rect x="10.5" y="2" width="3" height="20" rx="1.5" fill="currentColor"/>
                      <rect x="10.5" y="2" width="3" height="20" rx="1.5" fill="currentColor" transform="rotate(60 12 12)"/>
                      <rect x="10.5" y="2" width="3" height="20" rx="1.5" fill="currentColor" transform="rotate(120 12 12)"/>
                    </svg>
                    <span className="terminal-title">claude code</span>
                  </span>
                </div>
                <div className="terminal-body text-[13px] leading-[2]">
                  <div>
                    <span className="text-[var(--accent-light)]">you:</span>{" "}
                    <span className="text-[var(--text-muted)]">&quot;Score and optimize my article about building</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;MCP servers, then publish to Dev.to and</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;generate social posts&quot;</span>
                  </div>
                  <div className="h-3" />
                  <div className="text-[#4ADE80]">&#10003; SEO Score: 92/100 &mdash; Excellent</div>
                  <div className="text-[var(--text-dim)] pl-4 text-[12px]">Readability 88 &middot; Keywords 95 &middot; Structure 94</div>
                  <div className="h-1.5" />
                  <div className="text-[var(--text-muted)] pl-2 text-[12px]">Tips for improvement:</div>
                  <div className="text-[var(--text-dim)] pl-4 text-[12px]">[&#10003;] Add a meta description (under 155 chars)</div>
                  <div className="text-[var(--text-dim)] pl-4 text-[12px]">[&#10003;] Include alt text on 2 images</div>
                  <div className="text-[var(--text-dim)] pl-4 text-[12px]">[ ] Add internal links (0 found, aim for 2-3)</div>
                  <div className="text-[var(--text-dim)] pl-4 text-[12px]">[ ] Shorten intro paragraph (currently 94 words)</div>
                  <div className="h-1.5" />
                  <div className="text-[#4ADE80]">&#10003; Generated meta tags + Open Graph + JSON-LD</div>
                  <div className="h-1.5" />
                  <div className="text-[#4ADE80]">&#10003; Published &rarr; dev.to/you/building-mcp-servers</div>
                  <div className="text-[var(--text-dim)] pl-4 text-[12px]">2,847 words &middot; 12 min read &middot; 4 tags</div>
                  <div className="h-1.5" />
                  <div className="text-[#4ADE80]">&#10003; Generated 3 social posts</div>
                  <div className="text-[var(--text-dim)] pl-4 text-[12px]">X thread (5 posts) &middot; Reddit &middot; LinkedIn</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════ TOOLS PIPELINE ═══════════ */}
      <section id="how-it-works" className="relative px-6 py-24 sm:py-32 border-t border-[var(--border)]">
        <div className="section-glow left-1/2 -translate-x-1/2 top-0" style={{ background: "rgba(249,115,22,0.04)" }} />
        <div className="relative max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
                Four tools.{" "}
                <span className="font-serif italic text-gradient">One pipeline.</span>
              </h2>
              <p className="text-[var(--text-muted)] max-w-xl mx-auto text-lg leading-relaxed">
                Each tool does one thing well. Chain them in natural language.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: "01", title: "Score", tool: "seo_score", desc: "Readability, keyword density, heading structure, meta completeness. One composite score from 0\u2013100." },
              { num: "02", title: "Optimize", tool: "seo_meta + seo_schema", desc: "Auto-generate meta tags, Open Graph data, and JSON-LD structured data from your content." },
              { num: "03", title: "Publish", tool: "publish", desc: "Push to any supported CMS with tags, canonical URLs, series, and cover images." },
              { num: "04", title: "Promote", tool: "social posts", desc: "Generate platform-native posts. X threads, Reddit posts, LinkedIn articles, and more." },
            ].map(({ num, title, tool, desc }, i) => (
              <ScrollReveal key={num} delay={i * 100}>
                <div className="card-hover bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-7 h-full">
                  <div className="pipeline-number mb-5">{num}</div>
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <code className="text-xs text-[var(--text-dim)] font-mono">{tool}</code>
                  <p className="text-[15px] text-[var(--text-muted)] leading-relaxed mt-4">{desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="relative px-6 py-24 sm:py-32 border-t border-[var(--border)]">
        <div className="section-glow left-1/2 -translate-x-1/2 top-0" style={{ background: "rgba(168,85,247,0.03)" }} />
        <div className="relative max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">Simple pricing.</h2>
              <p className="text-[var(--text-muted)] max-w-lg mx-auto text-lg leading-relaxed">Start free. Upgrade when you need more.</p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Free */}
            <ScrollReveal delay={0}>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 flex flex-col h-full hover:border-[var(--border-light)] transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">Free</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight">$0</span>
                  </div>
                  <p className="text-sm text-[var(--text-dim)] mt-2">Forever. No credit card.</p>
                </div>
                <ul className="space-y-4 text-[15px] text-[var(--text-muted)] mb-8 flex-1">
                  {["Dev.to publishing", "3 publishes per month", "Basic SEO scoring", "Setup & status tools", '"Published with Pipepost" badge'].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-[var(--text-dim)] mt-0.5 flex-shrink-0">&#10003;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a href="#get-started" className="block text-center px-5 py-3.5 rounded-xl text-sm font-semibold border border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--bg-elevated)] transition-all duration-300">
                  Get started free
                </a>
              </div>
            </ScrollReveal>

            {/* Starter */}
            <ScrollReveal delay={100}>
              <div className="pricing-highlight bg-[var(--bg-elevated)] rounded-2xl p-8 flex flex-col h-full hover:shadow-[0_8px_40px_-8px_rgba(249,115,22,0.15)] transition-all duration-300 relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-[var(--accent)] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-[0_4px_16px_-2px_rgba(249,115,22,0.5)]">Popular</span>
                </div>
                <div className="relative z-[1] mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3">Starter</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight text-white">$9</span>
                    <span className="text-base text-[var(--text-muted)]">/mo</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-2">Cancel anytime.</p>
                </div>
                <ul className="relative z-[1] space-y-4 text-[15px] text-white mb-8 flex-1">
                  {["Everything in Free", "Unlimited publishes", "Full SEO suite (score + meta + schema)", "No badge on your articles"].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-[var(--accent)] mt-0.5 flex-shrink-0">&#10003;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a href="https://pipepost.lemonsqueezy.com/checkout/buy/starter" className="relative z-[1] btn-accent block text-center px-5 py-3.5 rounded-xl text-sm font-bold">
                  Get Starter
                </a>
              </div>
            </ScrollReveal>

            {/* Pro */}
            <ScrollReveal delay={200}>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 flex flex-col h-full hover:border-[var(--border-light)] transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight">$19</span>
                    <span className="text-base text-[var(--text-dim)]">/mo</span>
                  </div>
                  <p className="text-sm text-[var(--text-dim)] mt-2">Cancel anytime.</p>
                </div>
                <ul className="space-y-4 text-[15px] text-[var(--text-muted)] mb-8 flex-1">
                  {["Everything in Starter", "All 12 platforms", "Social post generation", "Post history & analytics", "Priority support"].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-[var(--accent)] mt-0.5 flex-shrink-0">&#10003;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a href="https://pipepost.lemonsqueezy.com/checkout/buy/c9bcb420-ea9d-4ba7-b9c2-2305b6e3e06d" className="block text-center px-5 py-3.5 rounded-xl text-sm font-bold border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.2)] transition-all duration-300">
                  Get Pro
                </a>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal>
            <div className="flex items-center justify-center gap-6 mt-12 text-sm text-[var(--text-dim)]">
              <span>No contracts</span>
              <span className="text-[var(--border)]">&middot;</span>
              <span>Cancel anytime</span>
              <span className="text-[var(--border)]">&middot;</span>
              <span>Free tier forever</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="px-6 py-24 sm:py-32 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">Common questions</h2>
              <p className="text-[var(--text-muted)] max-w-xl mx-auto text-lg leading-relaxed">
                Everything you need to know about Pipepost, from setup to publishing.
              </p>
            </div>
          </ScrollReveal>

          {(() => {
            const faqs = [
              { q: "What is an MCP server?", a: "MCP (Model Context Protocol) is the open standard that lets AI assistants connect to external tools. When you run npx pipepost-mcp, it registers new tools inside Claude Code \u2014 seo_score, seo_meta, seo_schema, and publish. You use them through natural language: just tell Claude to score or publish your article, and it calls the right tool automatically." },
              { q: "How do I set it up?", a: "Run npx pipepost-mcp in your terminal. It auto-configures Claude Code\u2019s MCP settings and walks you through connecting your first platform. The whole process takes under a minute. No global installs, no config files to edit manually." },
              { q: "What platforms are supported?", a: "Dev.to is fully supported today with complete article publishing, tags, series, and cover images. Ghost, Hashnode, WordPress, Medium, and Substack are coming next. Social post generation for LinkedIn, X, Reddit, Bluesky, Threads, and Mastodon is on the roadmap." },
              { q: "Is my API key safe?", a: "Your credentials are stored locally in ~/.pipepost/config.json on your machine. Pipepost runs as a local stdio process \u2014 your keys never leave your device. No cloud relay, no external server, no telemetry. You can verify this in the source code." },
              { q: "What does the SEO scoring check?", a: "The score analyzes readability (sentence length, passive voice, paragraph density), keyword usage (density, placement in headings and first paragraph), structure (heading hierarchy, internal links, image alt text), and meta completeness (title length, description, Open Graph tags). You get a 0\u2013100 composite score with specific tips to improve." },
              { q: "What\u2019s the difference between tiers?", a: "Free gives you Dev.to publishing, basic SEO scoring, and 3 publishes per month. Starter ($9/mo) removes limits and unlocks the full SEO suite with meta tag and JSON-LD generation. Pro ($19/mo) adds all 12 platforms, social post generation, analytics, and priority support." },
              { q: "Can I use this with other AI editors?", a: "Pipepost uses the Model Context Protocol standard, so any MCP-compatible client can use it \u2014 not just Claude Code. If your AI editor supports MCP tool servers, Pipepost will work." },
              { q: "Is it open source?", a: "Yes. The MCP server, all tools, and this site are open source under the MIT license on GitHub. Paid tiers unlock features in the hosted scoring pipeline, but the core publishing and local SEO tools are free forever." },
            ];
            const left = faqs.filter((_, i) => i % 2 === 0);
            const right = faqs.filter((_, i) => i % 2 === 1);
            return (
              <div className="grid sm:grid-cols-2 gap-4 items-start">
                <div className="flex flex-col gap-4">
                  {left.map(({ q, a }, i) => (
                    <ScrollReveal key={q} delay={i * 100}>
                      <FaqItem q={q} a={a} />
                    </ScrollReveal>
                  ))}
                </div>
                <div className="flex flex-col gap-4">
                  {right.map(({ q, a }, i) => (
                    <ScrollReveal key={q} delay={i * 100 + 50}>
                      <FaqItem q={q} a={a} />
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="px-6 py-10 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[var(--text-dim)]">
            <a href="/" className="flex items-center gap-2.5 group">
              <span className="font-mono text-[var(--accent)] font-bold text-lg group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)] transition-all">|&gt;</span>
              <span className="font-semibold text-white text-sm">pipepost</span>
            </a>
            <div className="flex items-center gap-8">
              <a href="https://github.com/MendleM/Pipepost" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://npmjs.com/package/pipepost-mcp" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">npm</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="/tools" className="hover:text-white transition-colors">Docs</a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-dim)]">
            <p>&copy; 2026 Pipepost. Open source under MIT License.</p>
            <p>Built for developers who write. Powered by{" "}<a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors">Model Context Protocol</a>.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

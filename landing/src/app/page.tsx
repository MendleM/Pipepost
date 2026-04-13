import { CopyInstall } from "./components/CopyInstall";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Pipepost',
              description:
                'MCP server for Claude Code that lets you score, publish, and promote your content without leaving the terminal.',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Cross-platform',
              url: 'https://pipepost.dev',
              offers: [
                {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'USD',
                  name: 'Free',
                  description:
                    'Dev.to publishing, 3 publishes per month, basic SEO scoring',
                },
                {
                  '@type': 'Offer',
                  price: '19',
                  priceCurrency: 'USD',
                  name: 'Pro',
                  description:
                    'All CMS platforms, unlimited publishes, full SEO suite, social post generation',
                  priceSpecification: {
                    '@type': 'UnitPriceSpecification',
                    price: '19',
                    priceCurrency: 'USD',
                    billingDuration: 'P1M',
                  },
                },
              ],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is an MCP server?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'MCP (Model Context Protocol) is the open standard that lets AI assistants like Claude Code connect to external tools. Pipepost is an MCP server that adds 8 publishing and SEO tools to your Claude Code session.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Do I need Claude Code to use Pipepost?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Pipepost runs as an MCP server inside Claude Code. It adds tools for SEO scoring, publishing, and social promotion to your terminal session.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is my API key safe?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Your credentials are stored locally in ~/.pipepost/config.json on your machine. They never leave your device or pass through any external server. Pipepost runs as a local stdio process.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What platforms can I publish to?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Currently Dev.to is supported. Ghost, Hashnode, WordPress, and Medium are coming in the next update.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can I use Pipepost for free?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. The free tier includes 3 publishes per month to Dev.to with basic SEO scoring. No credit card required, no time limit.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What does Pro add?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Pro ($19/month) gives you unlimited publishes to all 5 CMS platforms, the full SEO suite (meta tags, JSON-LD schemas), social post generation, and removes the "Published with Pipepost" badge from your articles.',
                  },
                },
              ],
            },
          ]),
        }}
      />
      <div className="grain" />

      {/* ═══════════ NAV ═══════════ */}
      <nav className="glass-nav fixed top-0 inset-x-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="text-xl font-mono text-[var(--accent)] font-bold tracking-tight">|&gt;</span>
            <span className="text-sm font-semibold tracking-tight">pipepost</span>
          </a>
          <div className="hidden sm:flex items-center gap-8 text-sm text-[var(--text-muted)]">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="/tools" className="hover:text-white transition-colors">Tools</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="https://github.com/MendleM/Pipepost" className="hover:text-white transition-colors">GitHub</a>
          </div>
          <a href="#get-started" className="btn-accent px-4 py-2 rounded-lg text-sm font-medium">
            Get started
          </a>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-36 sm:pt-44 pb-8 px-6">
        {/* Aurora */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 20%, rgba(249,115,22,0.1) 0%, rgba(249,115,22,0.02) 50%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Decorative pipe */}
        <div
          className="absolute top-24 right-[8%] text-[320px] font-mono font-bold pointer-events-none select-none hidden lg:block"
          style={{ color: "rgba(249, 115, 22, 0.025)" }}
        >
          |&gt;
        </div>
        {/* Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.15)] rounded-full text-xs text-[var(--accent)] font-mono mb-10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              MCP Server for Claude Code
            </span>
          </div>

          <h1 className="animate-fade-in-up delay-1 mb-8">
            <span className="block text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.05]">
              Claude writes it.
            </span>
            <span className="block text-5xl sm:text-6xl lg:text-[5.5rem] font-serif italic text-gradient leading-[1.1] mt-1">
              Pipepost ships it.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-2">
            Stop switching between your terminal, Dev.to, an SEO checker, and Twitter.
            Score, publish, and promote your content without leaving Claude Code.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 animate-fade-in-up delay-3">
            <CopyInstall />
            <a
              href="https://github.com/MendleM/Pipepost"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--bg-card)] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>

          <p className="text-xs text-[var(--text-dim)] mb-16 animate-fade-in-up delay-3">
            Free tier included &middot; No credit card &middot; Installs in 30 seconds
          </p>
        </div>

        {/* ── Hero terminal ── */}
        <div className="relative max-w-5xl mx-auto animate-fade-in-up delay-4">
          <div className="terminal terminal-hero">
            <div className="terminal-chrome">
              <div className="terminal-dots"><span /><span /><span /></div>
              <span className="terminal-title">pipepost &mdash; claude code session</span>
            </div>
            <div className="terminal-body text-[13px] sm:text-[13.5px] leading-[1.9] min-h-[360px] sm:min-h-[400px]">
              {/* Install */}
              <div className="animate-fade-in delay-5">
                <span className="text-[var(--text-dim)]">$</span>{" "}
                <span className="text-[var(--accent)]">npx</span>{" "}
                <span className="text-white">pipepost-mcp</span>
              </div>
              <div className="animate-fade-in delay-6 text-[#22C55E]">
                &#9670; Pipepost MCP v0.1.0 &mdash; 8 tools loaded
              </div>

              <div className="h-5" />

              {/* SEO command */}
              <div className="animate-fade-in delay-7">
                <span className="text-[var(--accent-light)]">you:</span>{" "}
                <span className="text-[var(--text-muted)]">&quot;Score my article about building MCP servers for SEO&quot;</span>
              </div>

              <div className="h-3" />

              {/* Score output */}
              <div className="animate-fade-in delay-8">
                <div className="flex items-center gap-4 mb-3">
                  <div className="score-ring">
                    <div className="score-ring-inner">
                      <span className="text-[var(--accent)] font-bold font-mono text-lg">84</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-white font-semibold">SEO Score: 84/100</div>
                    <div className="text-[var(--text-dim)] text-xs">Above publish threshold</div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-xs ml-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#22C55E]">&#10003;</span>
                    <span className="text-[var(--text-muted)]">Readability</span>
                    <span className="text-[var(--text-dim)] ml-auto">Grade 8 (Flesch-Kincaid)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#22C55E]">&#10003;</span>
                    <span className="text-[var(--text-muted)]">Keywords</span>
                    <span className="text-[var(--text-dim)] ml-auto">2.1% &ldquo;MCP server&rdquo;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#22C55E]">&#10003;</span>
                    <span className="text-[var(--text-muted)]">Headings</span>
                    <span className="text-[var(--text-dim)] ml-auto">5 H2s, clean hierarchy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#22C55E]">&#10003;</span>
                    <span className="text-[var(--text-muted)]">Meta tags</span>
                    <span className="text-[var(--text-dim)] ml-auto">Title 54ch, desc 148ch</span>
                  </div>
                </div>
              </div>

              <div className="h-5" />

              {/* Publish command */}
              <div className="animate-fade-in delay-10">
                <span className="text-[var(--accent-light)]">you:</span>{" "}
                <span className="text-[var(--text-muted)]">&quot;Great. Publish it to Dev.to and generate a tweet thread&quot;</span>
              </div>

              <div className="h-3" />

              {/* Publish output */}
              <div className="animate-fade-in delay-11 text-xs space-y-1">
                <div className="text-[#22C55E] text-sm font-medium">&#10003; Published to Dev.to</div>
                <div className="text-[var(--text-dim)]">
                  &ensp;&#8594; dev.to/you/building-mcp-servers &middot; 1,247 words &middot; 6 min read
                </div>
                <div className="h-1" />
                <div className="text-[#22C55E] text-sm font-medium">&#10003; Tweet thread generated</div>
                <div className="text-[var(--text-dim)]">
                  &ensp;&#8594; 5 tweets ready to post
                </div>
              </div>

              <div className="h-4" />

              {/* Blinking cursor */}
              <div className="animate-fade-in delay-13">
                <span className="text-[var(--accent-light)]">you:</span>
                <span className="inline-block w-2 h-[18px] bg-[var(--accent)] ml-2 align-middle rounded-sm" style={{ animation: "blink 1.2s step-end infinite" }} />
              </div>
            </div>
          </div>

          {/* Reflection glow under terminal */}
          <div
            className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-32 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse, rgba(249,115,22,0.06) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </div>
      </section>

      {/* ═══════════ TRUST BAR ═══════════ */}
      <section className="relative border-y border-[var(--border)] bg-[var(--bg-card)] mt-20">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs text-[var(--text-dim)] font-mono">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            Model Context Protocol
          </div>
          <span className="text-[var(--border-light)] hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z" />
            </svg>
            Published on npm
          </div>
          <span className="text-[var(--border-light)] hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Open source &middot; MIT License
          </div>
        </div>
      </section>

      {/* ═══════════ BEFORE / AFTER ═══════════ */}
      <section className="px-6 py-24 sm:py-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
            You know <span className="font-serif italic text-gradient">this pain</span>
          </h2>
          <p className="text-[var(--text-muted)] text-center mb-16 max-w-xl mx-auto">
            You just finished writing a great article with Claude. Now the real work starts.
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* WITHOUT */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 relative">
              <div className="text-xs font-mono text-[var(--text-dim)] uppercase tracking-widest mb-6">Without Pipepost</div>
              <div className="space-y-4">
                {[
                  { app: "Browser", task: "Open Dev.to, log in, find editor" },
                  { app: "Dev.to", task: "Paste article, fix formatting, add tags" },
                  { app: "SEO tool", task: "Open another tab, paste content, check score" },
                  { app: "Editor", task: "Go back, fix headings, rewrite meta" },
                  { app: "Dev.to", task: "Paste again, re-check, finally publish" },
                  { app: "Twitter", task: "Open Twitter, write a thread manually" },
                  { app: "LinkedIn", task: "Open LinkedIn, write a different post" },
                ].map(({ app, task }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-md bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-mono text-[var(--text-dim)]">{app}</span>
                      <span className="text-sm text-[var(--text-muted)] ml-2">{task}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-dim)]">7 steps &middot; 4 apps &middot; 25 minutes</span>
                <span className="text-[#EF4444] font-mono">painful</span>
              </div>
            </div>

            {/* WITH */}
            <div className="bg-[var(--bg-card)] border border-[var(--accent)] rounded-2xl p-8 relative shadow-[0_0_60px_-15px_rgba(249,115,22,0.15)]">
              <div className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest mb-6">With Pipepost</div>
              <div className="space-y-5">
                <div className="terminal rounded-xl">
                  <div className="terminal-body py-3 px-4 text-[12.5px] leading-[1.8]">
                    <div>
                      <span className="text-[var(--accent-light)]">you:</span>{" "}
                      <span className="text-[var(--text-muted)]">&quot;Score this for SEO and publish to Dev.to&quot;</span>
                    </div>
                    <div className="h-2" />
                    <div className="text-[#22C55E]">&#10003; SEO Score: 84/100 &mdash; all checks passing</div>
                    <div className="text-[#22C55E]">&#10003; Published to dev.to/you/article-slug</div>
                  </div>
                </div>
                <div className="terminal rounded-xl">
                  <div className="terminal-body py-3 px-4 text-[12.5px] leading-[1.8]">
                    <div>
                      <span className="text-[var(--accent-light)]">you:</span>{" "}
                      <span className="text-[var(--text-muted)]">&quot;Generate a tweet thread and a LinkedIn post&quot;</span>
                    </div>
                    <div className="h-2" />
                    <div className="text-[#22C55E]">&#10003; 5 tweets ready. LinkedIn post generated.</div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex items-center gap-3 text-sm text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  Same terminal
                </div>
                <span className="text-[var(--border)]">&middot;</span>
                <div>2 commands</div>
                <span className="text-[var(--border)]">&middot;</span>
                <div>30 seconds</div>
              </div>
              <div className="mt-4 pt-4 border-t border-[rgba(249,115,22,0.2)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-dim)]">You never left your terminal</span>
                <span className="text-[var(--accent)] font-mono">done</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ QUANTIFIED IMPACT ═══════════ */}
      <section className="relative px-6 py-20 sm:py-24 border-t border-[var(--border)] overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, transparent 0%, rgba(249,115,22,0.03) 50%, transparent 100%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="mb-4">
            <span className="text-7xl sm:text-8xl lg:text-9xl font-bold text-gradient font-mono leading-none">50&times;</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            faster than the browser shuffle
          </h2>
          <p className="text-[var(--text-muted)] mb-12 max-w-lg mx-auto">
            25 minutes saved per article. Every single time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-8">
            <div className="flex items-center gap-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-3">
              <span className="text-2xl font-bold text-white font-mono">4</span>
              <span className="text-sm text-[var(--text-muted)]">articles/week</span>
            </div>
            <span className="text-[var(--accent)] font-mono text-xl font-bold">&times;</span>
            <div className="flex items-center gap-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-3">
              <span className="text-2xl font-bold text-white font-mono">25</span>
              <span className="text-sm text-[var(--text-muted)]">min saved</span>
            </div>
            <span className="text-[var(--accent)] font-mono text-xl font-bold">=</span>
            <div className="flex items-center gap-2.5 bg-[var(--bg-card)] border-2 border-[var(--accent)] rounded-xl px-5 py-3 shadow-[0_0_30px_-10px_rgba(249,115,22,0.2)]">
              <span className="text-2xl font-bold text-[var(--accent)] font-mono">100</span>
              <span className="text-sm text-[var(--text-muted)]">min back/week</span>
            </div>
          </div>

          <p className="text-sm text-[var(--text-dim)]">
            That&apos;s two extra articles per week. Or an early lunch. Your call.
          </p>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="relative px-6 py-24 sm:py-32 border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Four tools. <span className="font-serif italic text-gradient">One pipeline.</span>
            </h2>
            <p className="text-[var(--text-muted)] max-w-lg mx-auto">
              Each tool does one thing well. Chain them in natural language.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                num: "01",
                title: "Score",
                tool: "seo_score",
                desc: "Flesch-Kincaid readability, keyword density, heading structure. 0-100 composite score.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                ),
              },
              {
                num: "02",
                title: "Optimize",
                tool: "seo_meta + seo_schema",
                desc: "Generate meta tags, Open Graph data, and JSON-LD structured data automatically.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                  </svg>
                ),
              },
              {
                num: "03",
                title: "Publish",
                tool: "publish",
                desc: "Push to Dev.to with tags, canonical URLs, and series. More platforms coming.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                  </svg>
                ),
              },
              {
                num: "04",
                title: "Promote",
                tool: "social posts",
                desc: "Generate platform-native social posts. Threads, single posts, LinkedIn articles.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                ),
              },
            ].map(({ num, title, tool, desc, icon }) => (
              <div
                key={num}
                className="card-hover bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="pipeline-number">{num}</div>
                  <div className="text-[var(--accent)] opacity-50 group-hover:opacity-100 transition-opacity">
                    {icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1">{title}</h3>
                <code className="text-[10px] text-[var(--text-dim)] font-mono">{tool}</code>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-3">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ MID-PAGE CTA ═══════════ */}
      <section className="relative px-6 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(249,115,22,0.06)] to-transparent" />
        <div className="absolute inset-0 border-y border-[rgba(249,115,22,0.1)]" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Ready to <span className="font-serif italic text-gradient">ship faster?</span>
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            Install in 30 seconds. Your first three publishes are free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <CopyInstall />
            <a
              href="https://pipepost.lemonsqueezy.com/checkout/buy/c9bcb420-ea9d-4ba7-b9c2-2305b6e3e06d"
              className="btn-accent px-6 py-3.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"
            >
              Get Pro &mdash; $19/mo
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="relative px-6 py-24 sm:py-32 border-t border-[var(--border)]">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(249,115,22,0.06) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Start free. <span className="font-serif italic text-gradient">Scale when ready.</span>
            </h2>
            <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
              The free tier is real — publish 3 articles a month to Dev.to with SEO scoring. No tricks.
            </p>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-6 py-3 text-sm inline-block">
              <span className="text-[var(--text-dim)]">25 min &times; $50/hr = </span>
              <span className="text-white font-semibold">$20.83 wasted</span>
              <span className="text-[var(--text-dim)]"> per article. </span>
              <span className="text-[var(--accent)] font-semibold">Pro pays for itself on publish&nbsp;#1.</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 flex flex-col">
              <h3 className="text-lg font-semibold mb-1">Free</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold">$0</span>
              </div>
              <p className="text-xs text-[var(--text-dim)] mb-8">Forever. No credit card.</p>
              <ul className="space-y-3.5 text-sm text-[var(--text-muted)] mb-8 flex-1">
                {[
                  "Dev.to publishing",
                  "3 publishes per month",
                  "Basic SEO scoring (seo_score)",
                  "Setup & status tools",
                  "\"Published with Pipepost\" badge",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-[var(--text-dim)] mt-0.5 flex-shrink-0">&#10003;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#get-started"
                className="block text-center px-5 py-3 rounded-xl text-sm font-semibold border border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--bg-elevated)] transition-all"
              >
                Get started free
              </a>
            </div>

            {/* Pro */}
            <div className="relative bg-[var(--bg-card)] border-2 border-[var(--accent)] rounded-2xl p-8 flex flex-col shadow-[0_0_80px_-20px_rgba(249,115,22,0.2)]">
              <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-[var(--accent)] to-[#EA580C] text-white text-xs font-bold px-3 py-1 rounded-full">
                LAUNCH PRICE
              </div>
              <h3 className="text-lg font-semibold mb-1">Pro</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-sm text-[var(--text-dim)]">/month</span>
                <span className="text-xs text-[var(--text-dim)] line-through ml-2">$29</span>
              </div>
              <p className="text-xs text-[var(--text-dim)] mb-8">Lock in launch pricing. Cancel anytime.</p>
              <ul className="space-y-3.5 text-sm text-[var(--text-muted)] mb-8 flex-1">
                {[
                  "All CMS platforms (5 total)",
                  "Unlimited publishes",
                  "Full SEO suite (score + meta + schema)",
                  "Social post generation",
                  "Post history & analytics",
                  "No badge on your articles",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-[var(--accent)] mt-0.5 flex-shrink-0">&#10003;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://pipepost.lemonsqueezy.com/checkout/buy/c9bcb420-ea9d-4ba7-b9c2-2305b6e3e06d"
                className="btn-accent block text-center px-5 py-3 rounded-xl text-sm font-bold"
              >
                Get Pro &rarr;
              </a>
            </div>
          </div>

          {/* Risk reversal */}
          <div className="flex items-center justify-center gap-6 mt-10 text-xs text-[var(--text-dim)]">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              No contracts
            </div>
            <span className="text-[var(--border)]">|</span>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Cancel anytime
            </div>
            <span className="text-[var(--border)]">|</span>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Free tier forever
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ GET STARTED ═══════════ */}
      <section id="get-started" className="relative px-6 py-24 sm:py-32 border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready in <span className="font-serif italic text-gradient">three steps</span>
            </h2>
          </div>

          <div className="space-y-6 max-w-xl mx-auto">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="pipeline-number mt-1">1</div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-2">Install</p>
                <CopyInstall compact />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="pipeline-number mt-1">2</div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-2">Add to Claude Code config</p>
                <div className="terminal rounded-xl">
                  <div className="terminal-body py-3 px-4 text-[12px] leading-[1.7]">
                    <div className="text-[var(--text-dim)]">// ~/.claude/settings.json</div>
                    <div><span className="text-[var(--accent)]">&quot;mcpServers&quot;</span>: {"{"}</div>
                    <div className="ml-4"><span className="text-[var(--accent)]">&quot;pipepost&quot;</span>: {"{"}</div>
                    <div className="ml-8"><span className="text-[var(--accent)]">&quot;command&quot;</span>: <span className="text-[#22C55E]">&quot;npx&quot;</span>,</div>
                    <div className="ml-8"><span className="text-[var(--accent)]">&quot;args&quot;</span>: [<span className="text-[#22C55E]">&quot;pipepost-mcp&quot;</span>]</div>
                    <div className="ml-4">{"}"}</div>
                    <div>{"}"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="pipeline-number mt-1">3</div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-2">Publish your first article</p>
                <div className="terminal rounded-xl">
                  <div className="terminal-body py-3 px-4 text-[13px]">
                    <span className="text-[var(--accent-light)]">you:</span>{" "}
                    <span className="text-[var(--text-muted)]">&quot;Score and publish my article to Dev.to&quot;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-14">
            <a
              href="https://github.com/MendleM/Pipepost"
              className="btn-accent inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold"
            >
              Get started now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="px-6 py-24 sm:py-32 border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Common <span className="font-serif italic text-gradient">questions</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is an MCP server?",
                a: "MCP (Model Context Protocol) is the open standard that lets AI assistants like Claude Code connect to external tools. Pipepost is an MCP server — when you install it, Claude Code gains 8 new tools for publishing and SEO. Think of it like a plugin for your terminal AI.",
              },
              {
                q: "Do I need Claude Code to use Pipepost?",
                a: "Yes. Pipepost runs as a local MCP server inside Claude Code. It adds tools to your existing Claude Code session — no new app to learn, no new interface. You just talk to Claude like you normally do.",
              },
              {
                q: "Is my API key safe?",
                a: "Your credentials are stored locally in ~/.pipepost/config.json on your machine. They never leave your device. Pipepost runs as a local stdio process — there's no external server, no cloud relay, nothing phoning home.",
              },
              {
                q: "What platforms can I publish to?",
                a: "Currently Dev.to. Ghost, Hashnode, WordPress, and Medium support is actively being built and coming in the next update.",
              },
              {
                q: "Can I really use it for free?",
                a: "Yes — 3 publishes per month to Dev.to with SEO scoring, forever. No credit card, no trial period. The free tier adds a small \"Published with Pipepost\" badge to your articles.",
              },
              {
                q: "What does Pro add?",
                a: "Unlimited publishes to all 5 CMS platforms, full SEO suite (meta tags, JSON-LD schemas), social post generation, post analytics, and no badge on your articles. $19/month, cancel anytime.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-sm font-semibold hover:text-[var(--accent)] transition-colors list-none">
                  {q}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 ml-4 transition-transform group-open:rotate-45"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 text-sm text-[var(--text-muted)] leading-relaxed">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ECOSYSTEM BAR ═══════════ */}
      <section className="px-6 py-14 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-[var(--text-dim)] uppercase tracking-widest font-mono mb-8">Works with &middot; More platforms coming</p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {[
              { name: "Claude Code", active: true },
              { name: "Dev.to", active: true },
              { name: "Ghost", active: false },
              { name: "Hashnode", active: false },
              { name: "WordPress", active: false },
              { name: "Medium", active: false },
            ].map(({ name, active }) => (
              <div
                key={name}
                className={`flex items-center gap-2 text-sm font-medium ${
                  active ? "text-white" : "text-[var(--text-dim)] opacity-50"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${active ? "bg-[#22C55E]" : "bg-[var(--border)]"}`} />
                {name}
                {!active && <span className="text-[10px] text-[var(--text-dim)] font-mono">soon</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative px-6 py-20 border-t border-[var(--border)] overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Stop context-switching.<br />
            <span className="font-serif italic text-gradient">Start shipping.</span>
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            Join developers who publish content without leaving their terminal.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <CopyInstall />
            <a
              href="https://pipepost.lemonsqueezy.com/checkout/buy/c9bcb420-ea9d-4ba7-b9c2-2305b6e3e06d"
              className="btn-accent px-8 py-3.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"
            >
              Get Pro &mdash; $19/mo
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="px-6 py-10 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[var(--text-dim)]">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[var(--accent)] font-bold text-lg">|&gt;</span>
              <span className="font-semibold text-white text-sm">pipepost</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="https://github.com/MendleM/Pipepost" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://npmjs.com/package/pipepost-mcp" className="hover:text-white transition-colors">npm</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="/tools" className="hover:text-white transition-colors">Tools</a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-dim)]">
            <p>&copy; 2026 Pipepost. Open source under MIT License.</p>
            <p>
              Built for developers who write. Powered by{" "}
              <a href="https://modelcontextprotocol.io" className="text-[var(--text-muted)] hover:text-white transition-colors">
                Model Context Protocol
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

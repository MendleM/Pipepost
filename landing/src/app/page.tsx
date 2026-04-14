import { CopyInstall } from "./components/CopyInstall";
import { PlatformIconRow } from "./components/PlatformIcon";

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
                {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                  name: "Free",
                  description:
                    "Dev.to publishing, 3 publishes per month, basic SEO scoring",
                },
                {
                  "@type": "Offer",
                  price: "9",
                  priceCurrency: "USD",
                  name: "Starter",
                  description:
                    "Unlimited publishes, full SEO suite, no badge",
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: "9",
                    priceCurrency: "USD",
                    billingDuration: "P1M",
                  },
                },
                {
                  "@type": "Offer",
                  price: "19",
                  priceCurrency: "USD",
                  name: "Pro",
                  description:
                    "All CMS platforms, unlimited publishes, full SEO suite, social post generation",
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: "19",
                    priceCurrency: "USD",
                    billingDuration: "P1M",
                  },
                },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is an MCP server?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "MCP (Model Context Protocol) is the open standard that lets AI assistants like Claude Code connect to external tools. Pipepost is an MCP server that adds 8 publishing and SEO tools to your Claude Code session.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What platforms are supported?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Dev.to is fully supported today. Ghost, Hashnode, WordPress, and Medium are coming in the next update.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is my data safe?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Your credentials are stored locally in ~/.pipepost/config.json on your machine. They never leave your device or pass through any external server.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What's the difference between tiers?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Free gives you Dev.to publishing with basic SEO scoring. Starter adds unlimited publishes and the full SEO suite. Pro unlocks all 5 CMS platforms, social post generation, and analytics.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I use this with other AI editors?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Pipepost uses the Model Context Protocol standard, so it works with any MCP-compatible client. Claude Code is the primary supported environment today.",
                  },
                },
              ],
            },
          ]),
        }}
      />
      <div className="grain" />

      {/* NAV */}
      <nav className="glass-nav fixed top-0 inset-x-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="text-xl font-mono text-[var(--accent)] font-bold tracking-tight">
              |&gt;
            </span>
            <span className="text-sm font-semibold tracking-tight">
              pipepost
            </span>
          </a>
          <div className="hidden sm:flex items-center gap-8 text-sm text-[var(--text-muted)]">
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors"
            >
              How it works
            </a>
            <a href="/tools" className="hover:text-white transition-colors">
              Tools
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a
              href="https://github.com/MendleM/Pipepost"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
          <a
            href="#pricing"
            className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--bg-card)] transition-all"
          >
            Get started
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-36 sm:pt-44 pb-8 px-6">
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.15)] rounded-full text-xs text-[var(--accent)] font-mono mb-10">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              MCP Server for Claude Code
            </span>
          </div>

          <h1 className="animate-fade-in-up delay-1 mb-8">
            <span className="block text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.05]">
              Publish everywhere.
            </span>
            <span className="block text-5xl sm:text-6xl lg:text-[5.5rem] font-serif italic text-gradient leading-[1.1] mt-1">
              From your terminal.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-2">
            Score, optimize, and publish your content to any platform without
            leaving Claude Code.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up delay-3">
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
        </div>

        {/* Platform Icon Row */}
        <div className="relative max-w-4xl mx-auto animate-fade-in-up delay-4">
          {/* Aurora glow behind icons */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(249,115,22,0.08) 0%, rgba(168,85,247,0.04) 30%, transparent 60%)",
              filter: "blur(60px)",
            }}
          />
          <div className="relative">
            <PlatformIconRow />
          </div>
        </div>
      </section>

      {/* TERMINAL DEMO */}
      <section className="px-6 py-20 sm:py-24">
        <div className="max-w-xl mx-auto">
          <div className="terminal">
            <div className="terminal-chrome">
              <div className="terminal-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="terminal-title">claude code</span>
            </div>
            <div className="terminal-body text-[13px] leading-[1.9]">
              <div>
                <span className="text-[var(--accent-light)]">you:</span>{" "}
                <span className="text-[var(--text-muted)]">
                  &quot;Score my article and publish to Dev.to&quot;
                </span>
              </div>
              <div className="h-4" />
              <div className="text-[#22C55E]">
                &#10003; SEO Score: 84/100
              </div>
              <div className="text-[#22C55E]">
                &#10003; Published &rarr; dev.to/you/building-mcp-servers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOOLS PIPELINE */}
      <section
        id="how-it-works"
        className="relative px-6 py-24 sm:py-32 border-t border-[var(--border)]"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Four tools.{" "}
              <span className="font-serif italic text-gradient">
                One pipeline.
              </span>
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
              },
              {
                num: "02",
                title: "Optimize",
                tool: "seo_meta + seo_schema",
                desc: "Generate meta tags, Open Graph data, and JSON-LD structured data automatically.",
              },
              {
                num: "03",
                title: "Publish",
                tool: "publish",
                desc: "Push to Dev.to with tags, canonical URLs, and series. More platforms coming.",
              },
              {
                num: "04",
                title: "Promote",
                tool: "social posts",
                desc: "Generate platform-native social posts. Threads, single posts, LinkedIn articles.",
              },
            ].map(({ num, title, tool, desc }) => (
              <div
                key={num}
                className="card-hover bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="pipeline-number">{num}</div>
                </div>
                <h3 className="text-lg font-semibold mb-1">{title}</h3>
                <code className="text-[10px] text-[var(--text-dim)] font-mono">
                  {tool}
                </code>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-3">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="relative px-6 py-24 sm:py-32 border-t border-[var(--border)]"
      >
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Simple pricing.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 flex flex-col">
              <h3 className="text-lg font-semibold mb-1">Free</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold">$0</span>
              </div>
              <p className="text-xs text-[var(--text-dim)] mb-8">
                Forever. No credit card.
              </p>
              <ul className="space-y-3.5 text-sm text-[var(--text-muted)] mb-8 flex-1">
                {[
                  "Dev.to publishing",
                  "3 publishes per month",
                  "Basic SEO scoring",
                  "Setup & status tools",
                  "\"Published with Pipepost\" badge",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-[var(--text-dim)] mt-0.5 flex-shrink-0">
                      &#10003;
                    </span>
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

            {/* Starter */}
            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-light)] rounded-2xl p-8 flex flex-col">
              <h3 className="text-lg font-semibold mb-1">Starter</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold">$9</span>
                <span className="text-sm text-[var(--text-dim)]">/month</span>
              </div>
              <p className="text-xs text-[var(--text-dim)] mb-8">
                Cancel anytime.
              </p>
              <ul className="space-y-3.5 text-sm text-[var(--text-muted)] mb-8 flex-1">
                {[
                  "Everything in Free",
                  "Unlimited publishes",
                  "Full SEO suite (score + meta + schema)",
                  "No badge on your articles",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-[var(--accent)] mt-0.5 flex-shrink-0">
                      &#10003;
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://pipepost.lemonsqueezy.com/checkout/buy/starter"
                className="btn-accent block text-center px-5 py-3 rounded-xl text-sm font-bold"
              >
                Get Starter
              </a>
            </div>

            {/* Pro */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 flex flex-col">
              <h3 className="text-lg font-semibold mb-1">Pro</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-sm text-[var(--text-dim)]">/month</span>
              </div>
              <p className="text-xs text-[var(--text-dim)] mb-8">
                Cancel anytime.
              </p>
              <ul className="space-y-3.5 text-sm text-[var(--text-muted)] mb-8 flex-1">
                {[
                  "Everything in Starter",
                  "All 5 CMS platforms",
                  "Social post generation",
                  "Post history & analytics",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-[var(--accent)] mt-0.5 flex-shrink-0">
                      &#10003;
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://pipepost.lemonsqueezy.com/checkout/buy/c9bcb420-ea9d-4ba7-b9c2-2305b6e3e06d"
                className="block text-center px-5 py-3 rounded-xl text-sm font-bold border border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--bg-elevated)] transition-all"
              >
                Get Pro
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-10 text-xs text-[var(--text-dim)]">
            <span>No contracts</span>
            <span className="text-[var(--border)]">|</span>
            <span>Cancel anytime</span>
            <span className="text-[var(--border)]">|</span>
            <span>Free tier forever</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 sm:py-32 border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Common questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is an MCP server?",
                a: "MCP (Model Context Protocol) is the open standard that lets AI assistants like Claude Code connect to external tools. Pipepost is an MCP server — install it, and Claude Code gains 8 new tools for SEO and publishing. Think of it like a plugin for your terminal AI.",
              },
              {
                q: "What platforms are supported?",
                a: "Dev.to is fully supported today. Ghost, Hashnode, WordPress, and Medium are actively being built and coming in the next update. Social post generation (X, Reddit, Bluesky) is on the roadmap.",
              },
              {
                q: "Is my data safe?",
                a: "Your credentials are stored locally in ~/.pipepost/config.json on your machine. They never leave your device. Pipepost runs as a local stdio process — no external server, no cloud relay.",
              },
              {
                q: "What's the difference between tiers?",
                a: "Free gives you Dev.to publishing with basic SEO scoring. Starter adds unlimited publishes and the full SEO suite. Pro unlocks all 5 CMS platforms, social post generation, and analytics.",
              },
              {
                q: "Can I use this with other AI editors?",
                a: "Pipepost uses the Model Context Protocol standard, so it works with any MCP-compatible client. Claude Code is the primary supported environment today.",
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
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
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

      {/* FOOTER */}
      <footer className="px-6 py-10 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[var(--text-dim)]">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[var(--accent)] font-bold text-lg">
                |&gt;
              </span>
              <span className="font-semibold text-white text-sm">
                pipepost
              </span>
            </div>
            <div className="flex items-center gap-8">
              <a
                href="https://github.com/MendleM/Pipepost"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://npmjs.com/package/pipepost-mcp"
                className="hover:text-white transition-colors"
              >
                npm
              </a>
              <a
                href="#pricing"
                className="hover:text-white transition-colors"
              >
                Pricing
              </a>
              <a
                href="/tools"
                className="hover:text-white transition-colors"
              >
                Tools
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-dim)]">
            <p>&copy; 2026 Pipepost. Open source under MIT License.</p>
            <p>
              Built for developers who write. Powered by{" "}
              <a
                href="https://modelcontextprotocol.io"
                className="text-[var(--text-muted)] hover:text-white transition-colors"
              >
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

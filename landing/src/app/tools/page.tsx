import type { Metadata } from "next";
import { CopyInstall } from "../components/CopyInstall";

export const metadata: Metadata = {
  title: "Docs — Pipepost MCP Server for Claude Code",
  description:
    "Complete documentation for Pipepost: installation, configuration, SEO scoring, meta tag generation, JSON-LD schemas, publishing, and account management.",
  keywords: [
    "pipepost docs",
    "pipepost documentation",
    "mcp server tools",
    "claude code seo",
    "claude code publishing",
    "seo scoring tool",
    "dev.to mcp",
  ],
  openGraph: {
    title: "Docs — Pipepost MCP Server for Claude Code",
    description:
      "Complete documentation for the Pipepost MCP server. Installation, tools reference, and configuration guide.",
    type: "website",
  },
  alternates: {
    canonical: "https://pipepost.dev/tools",
  },
};

interface Param {
  name: string;
  type: string;
  required: boolean;
  desc: string;
}

interface Tool {
  name: string;
  tier: "free" | "starter" | "pro";
  title: string;
  description: string;
  params: Param[];
  example: string;
  output: string;
}

const toolGroups: { id: string; title: string; desc: string; tools: Tool[] }[] = [
  {
    id: "seo-tools",
    title: "SEO Tools",
    desc: "Analyze, score, and optimize your content for search engines.",
    tools: [
      {
        name: "seo_score",
        tier: "free",
        title: "SEO Score",
        description:
          "Analyze your content for SEO quality. Returns a composite 0\u2013100 score based on readability (sentence length, passive voice, paragraph density), keyword usage (density, placement in headings), heading structure (hierarchy, count), and word count. Includes specific improvement tips.",
        params: [
          { name: "content", type: "string", required: true, desc: "The markdown content to analyze" },
          { name: "keyword", type: "string", required: true, desc: "Target keyword to check density for" },
        ],
        example: "Score my article about building MCP servers for SEO",
        output: "SEO Score: 84/100 \u2014 Readability: Grade 8, Keywords: 2.1%, Headings: clean hierarchy",
      },
      {
        name: "seo_meta",
        tier: "starter",
        title: "SEO Meta Tags",
        description:
          "Generate optimized meta titles, descriptions, and Open Graph tags for your content. Follows Google\u2019s recommended character limits (title \u226460 chars, description \u2264155 chars). Returns ready-to-use HTML meta tags.",
        params: [
          { name: "content", type: "string", required: true, desc: "The content to generate meta tags for" },
          { name: "keyword", type: "string", required: true, desc: "Target keyword for optimization" },
        ],
        example: "Generate meta tags for this article targeting 'node cli tools'",
        output: "Meta title (54ch), description (148ch), OG title, OG description, OG type",
      },
      {
        name: "seo_schema",
        tier: "starter",
        title: "JSON-LD Schema",
        description:
          "Generate structured data markup (JSON-LD) for your content. Supports Article, HowTo, FAQPage, and SoftwareApplication schemas. Output is a complete JSON-LD script tag ready to embed.",
        params: [
          { name: "content", type: "string", required: true, desc: "The content to generate schema for" },
          { name: "type", type: "string", required: true, desc: "Schema type: article, howto, faq, or software" },
        ],
        example: "Generate Article JSON-LD schema for this blog post",
        output: "Complete JSON-LD script tag ready to embed in your page",
      },
    ],
  },
  {
    id: "publishing",
    title: "Publishing",
    desc: "Publish and manage content across platforms.",
    tools: [
      {
        name: "publish",
        tier: "free",
        title: "Publish",
        description:
          "Publish your content to Dev.to (more platforms coming). Supports drafts and published states, tags, canonical URLs, series grouping, and cover images. Free tier includes 3 publishes per month.",
        params: [
          { name: "content", type: "string", required: true, desc: "Markdown content to publish" },
          { name: "title", type: "string", required: true, desc: "Article title" },
          { name: "platform", type: "string", required: true, desc: "Target platform (devto)" },
          { name: "tags", type: "string[]", required: false, desc: "Up to 4 tags for the article" },
          { name: "status", type: "string", required: false, desc: "draft or published (default: draft)" },
          { name: "canonical_url", type: "string", required: false, desc: "Canonical URL if cross-posting" },
          { name: "series", type: "string", required: false, desc: "Series name to group articles" },
        ],
        example: "Publish this article to Dev.to as a draft with tags: node, cli, javascript",
        output: "Published to dev.to/you/article-slug \u2014 1,247 words, 6 min read",
      },
      {
        name: "list_posts",
        tier: "pro",
        title: "List Posts",
        description:
          "List your published and draft posts on a platform. Shows title, status, publish date, URL, and basic stats. Filter by status to find drafts or published articles.",
        params: [
          { name: "platform", type: "string", required: true, desc: "Platform to list posts from (devto)" },
          { name: "status", type: "string", required: false, desc: "Filter: all, published, or draft (default: all)" },
        ],
        example: "Show me my draft posts on Dev.to",
        output: "3 drafts found \u2014 Building CLI Tools (Apr 12), MCP Guide (Apr 10), \u2026",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    desc: "Configure platforms, manage your license, and check status.",
    tools: [
      {
        name: "setup",
        tier: "free",
        title: "Setup",
        description:
          "Configure platform API keys. Keys are stored locally in ~/.pipepost/config.json and never leave your machine. Run this once per platform to connect it.",
        params: [
          { name: "platform", type: "string", required: true, desc: "Platform to configure (devto)" },
          { name: "api_key", type: "string", required: true, desc: "Your platform API key" },
        ],
        example: 'Set up my Dev.to API key: dv1_abc123\u2026',
        output: "Dev.to API key saved to ~/.pipepost/config.json",
      },
      {
        name: "activate",
        tier: "free",
        title: "Activate",
        description:
          "Activate a Starter or Pro license key. Validates with Lemon Squeezy and caches locally for offline use. Re-validates every 24 hours when online.",
        params: [
          { name: "license_key", type: "string", required: true, desc: "Your license key from checkout" },
        ],
        example: "Activate my Pipepost license: XXXX-XXXX-XXXX",
        output: "Pro license activated. Cached for offline use (re-validates every 24h).",
      },
      {
        name: "status",
        tier: "free",
        title: "Status",
        description:
          "Show your current Pipepost configuration: version, license tier, configured platforms, API key status, and monthly usage stats.",
        params: [],
        example: "Show my Pipepost status",
        output: "v0.1.2 \u2014 Free tier, Dev.to configured, 1/3 publishes used this month",
      },
    ],
  },
];

const sidebarSections = [
  {
    title: "Getting Started",
    links: [
      { href: "#installation", label: "Installation" },
      { href: "#quick-start", label: "Quick start" },
      { href: "#configuration", label: "Configuration" },
    ],
  },
  ...toolGroups.map((g) => ({
    title: g.title,
    links: g.tools.map((t) => ({ href: `#${t.name}`, label: t.name, code: true })),
  })),
];

function TierBadge({ tier }: { tier: "free" | "starter" | "pro" }) {
  const styles = {
    free: "bg-[rgba(34,197,94,0.1)] text-[#22C55E] border-[rgba(34,197,94,0.2)]",
    starter: "bg-[rgba(59,130,246,0.1)] text-[#60A5FA] border-[rgba(59,130,246,0.2)]",
    pro: "bg-[rgba(249,115,22,0.1)] text-[var(--accent)] border-[rgba(249,115,22,0.2)]",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${styles[tier]}`}>
      {tier}
    </span>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div id={tool.name} className="scroll-mt-24 pt-8 first:pt-0">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <code className="text-[var(--accent)] font-mono text-lg font-semibold">{tool.name}</code>
        <TierBadge tier={tool.tier} />
      </div>
      <h3 className="text-xl font-semibold mb-2">{tool.title}</h3>
      <p className="text-[var(--text-muted)] leading-relaxed mb-6">{tool.description}</p>

      {tool.params.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="docs-param-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Type</th>
                <th className="hidden sm:table-cell">Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {tool.params.map((p) => (
                <tr key={p.name}>
                  <td><code className="text-[var(--accent-light)] text-[13px]">{p.name}</code></td>
                  <td className="text-[var(--text-dim)] font-mono text-xs whitespace-nowrap">{p.type}</td>
                  <td className="hidden sm:table-cell text-[var(--text-dim)] text-xs">{p.required ? "Yes" : "No"}</td>
                  <td className="text-[var(--text-muted)]">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="terminal rounded-xl">
        <div className="terminal-chrome relative">
          <div className="terminal-dots"><span /><span /><span /></div>
          <span className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 24 24" className="text-[var(--accent)]">
              <rect x="10.5" y="2" width="3" height="20" rx="1.5" fill="currentColor"/>
              <rect x="10.5" y="2" width="3" height="20" rx="1.5" fill="currentColor" transform="rotate(60 12 12)"/>
              <rect x="10.5" y="2" width="3" height="20" rx="1.5" fill="currentColor" transform="rotate(120 12 12)"/>
            </svg>
            <span className="terminal-title">claude code</span>
          </span>
        </div>
        <div className="terminal-body text-[13px] leading-[1.8]">
          <div>
            <span className="text-[var(--accent-light)]">you:</span>{" "}
            <span className="text-[var(--text-muted)]">&quot;{tool.example}&quot;</span>
          </div>
          <div className="h-2" />
          <div className="text-[#4ADE80]">&#10003; {tool.output}</div>
        </div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <main className="overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            name: "Pipepost Documentation",
            description:
              "Complete documentation for the Pipepost MCP server: installation, tools reference, and configuration.",
            url: "https://pipepost.dev/tools",
            isPartOf: {
              "@type": "WebSite",
              name: "Pipepost",
              url: "https://pipepost.dev",
            },
          }),
        }}
      />
      <div className="grain" />

      {/* Nav */}
      <nav className="glass-nav fixed top-0 inset-x-0 z-50 px-6">
        <div className="max-w-6xl mx-auto h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <span className="text-xl font-mono text-[var(--accent)] font-bold tracking-tight group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)] transition-all">
              |&gt;
            </span>
            <span className="text-sm font-semibold tracking-tight">pipepost</span>
          </a>
          <div className="hidden sm:flex items-center gap-8 text-sm text-[var(--text-dim)]">
            <a href="/" className="nav-link hover:text-white transition-colors">Home</a>
            <a href="/tools" className="text-white">Docs</a>
            <a href="/#pricing" className="nav-link hover:text-white transition-colors">Pricing</a>
            <a href="https://github.com/MendleM/Pipepost" target="_blank" rel="noopener noreferrer" className="nav-link hover:text-white transition-colors">GitHub</a>
          </div>
          <a href="/#get-started" className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)] hover:text-white transition-all duration-300">
            Get started
          </a>
        </div>
      </nav>

      <div className="pt-24 pb-24 px-6">
        <div className="max-w-6xl mx-auto lg:flex lg:gap-16">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 docs-sidebar space-y-7 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
              {sidebarSections.map((section) => (
                <div key={section.title}>
                  <h4 className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-dim)] mb-2 px-3">
                    {section.title}
                  </h4>
                  <nav className="space-y-0.5">
                    {section.links.map((link) => (
                      <a key={link.href} href={link.href}>
                        {"code" in link && link.code ? (
                          <code>{link.label}</code>
                        ) : (
                          link.label
                        )}
                      </a>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </aside>

          {/* Mobile nav */}
          <div className="lg:hidden mb-8 -mx-6 px-6 overflow-x-auto">
            <div className="flex gap-2 pb-4 border-b border-[var(--border)]">
              {sidebarSections.map((section) => (
                <a
                  key={section.title}
                  href={section.links[0].href}
                  className="whitespace-nowrap px-3.5 py-2 rounded-lg text-sm text-[var(--text-dim)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-16">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.15)] rounded-full text-xs text-[var(--accent)] font-mono mb-6">
                v0.1.2
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Pipepost <span className="font-serif italic text-gradient">Docs</span>
              </h1>
              <p className="text-lg text-[var(--text-muted)] max-w-2xl leading-relaxed">
                Everything you need to install, configure, and use Pipepost with Claude Code. One command to set up, natural language to use.
              </p>
            </div>

            {/* ── Getting Started ── */}
            <section className="mb-20">
              <h2 id="installation" className="text-2xl font-bold tracking-tight mb-6 scroll-mt-24">Installation</h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-6">
                Run this in your terminal. It automatically installs the Pipepost MCP server, configures Claude Code to use it, and creates your local config file.
              </p>
              <div className="mb-8">
                <CopyInstall />
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-sm text-[var(--text-muted)] leading-relaxed">
                <span className="text-[var(--accent)] font-semibold">Manual setup:</span>{" "}
                If you prefer, add <code className="text-[var(--accent-light)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-xs">pipepost-mcp</code> to your Claude Code MCP server config in <code className="text-[var(--accent-light)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-xs">~/.claude/settings.json</code> under the <code className="text-[var(--accent-light)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-xs">mcpServers</code> key.
              </div>

              <h2 id="quick-start" className="text-2xl font-bold tracking-tight mt-16 mb-6 scroll-mt-24">Quick start</h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-8">
                Once installed, use Pipepost tools through natural language in Claude Code. Here&apos;s the typical workflow:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { step: "1", title: "Connect a platform", prompt: "Set up my Dev.to API key: dv1_abc123..." },
                  { step: "2", title: "Score your content", prompt: "Score this article for SEO targeting 'MCP servers'" },
                  { step: "3", title: "Optimize metadata", prompt: "Generate meta tags and JSON-LD for this article" },
                  { step: "4", title: "Publish", prompt: "Publish this to Dev.to as a draft with tags: node, cli" },
                ].map(({ step, title, prompt }) => (
                  <div key={step} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-7 h-7 rounded-lg bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)] flex items-center justify-center text-[var(--accent)] font-mono text-xs font-semibold">{step}</span>
                      <span className="font-semibold text-sm">{title}</span>
                    </div>
                    <p className="text-sm text-[var(--text-dim)] font-mono">&quot;{prompt}&quot;</p>
                  </div>
                ))}
              </div>

              <h2 id="configuration" className="text-2xl font-bold tracking-tight mt-16 mb-6 scroll-mt-24">Configuration</h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-6">
                Your API keys and license are stored locally in <code className="text-[var(--accent-light)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-xs">~/.pipepost/config.json</code>. They never leave your machine. Pipepost runs as a local stdio process &mdash; no cloud server, no telemetry.
              </p>
              <div className="terminal rounded-xl">
                <div className="terminal-chrome relative">
                  <div className="terminal-dots"><span /><span /><span /></div>
                </div>
                <div className="terminal-body text-[13px] leading-[1.8]">
                  <div className="text-[var(--text-dim)]">~/.pipepost/config.json</div>
                  <div className="h-1" />
                  <div className="text-[var(--text-muted)]">{"{"}</div>
                  <div className="text-[var(--text-muted)] pl-4">&quot;<span className="text-[var(--accent-light)]">platforms</span>&quot;: {"{"}</div>
                  <div className="text-[var(--text-muted)] pl-8">&quot;<span className="text-[var(--accent-light)]">devto</span>&quot;: {"{"} &quot;api_key&quot;: &quot;dv1_...&quot; {"}"}</div>
                  <div className="text-[var(--text-muted)] pl-4">{"}"},</div>
                  <div className="text-[var(--text-muted)] pl-4">&quot;<span className="text-[var(--accent-light)]">license</span>&quot;: {"{"} &quot;key&quot;: &quot;...&quot;, &quot;tier&quot;: &quot;pro&quot; {"}"}</div>
                  <div className="text-[var(--text-muted)]">{"}"}</div>
                </div>
              </div>
            </section>

            {/* ── Tool groups ── */}
            {toolGroups.map((group) => (
              <section key={group.id} id={group.id} className="mb-20">
                <div className="mb-10 pb-6 border-b border-[var(--border)]">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">{group.title}</h2>
                  <p className="text-[var(--text-muted)]">{group.desc}</p>
                </div>
                <div className="space-y-12">
                  {group.tools.map((tool) => (
                    <ToolCard key={tool.name} tool={tool} />
                  ))}
                </div>
              </section>
            ))}

            {/* ── CTA ── */}
            <section className="relative mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 sm:p-12 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(249,115,22,0.04)] to-transparent pointer-events-none" />
              <div className="relative text-center">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                  Ready to try these tools?
                </h2>
                <p className="text-[var(--text-muted)] mb-8 max-w-lg mx-auto">
                  Free tier includes seo_score, publish (3/mo), setup, activate, and status. Upgrade for the full SEO suite and all platforms.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <CopyInstall />
                  <a
                    href="/#pricing"
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.2)] transition-all duration-300"
                  >
                    View pricing
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
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
              <a href="/#pricing" className="hover:text-white transition-colors">Pricing</a>
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

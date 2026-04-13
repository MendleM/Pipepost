import type { Metadata } from "next";
import { CopyInstall } from "../components/CopyInstall";

export const metadata: Metadata = {
  title: "Pipepost Tools — MCP Server Tools for Claude Code",
  description:
    "Explore the 8 tools Pipepost adds to Claude Code: SEO scoring, meta tag generation, JSON-LD schemas, publishing, and more.",
  keywords: [
    "pipepost tools",
    "mcp server tools",
    "claude code seo",
    "claude code publishing",
    "seo scoring tool",
    "dev.to api",
  ],
  openGraph: {
    title: "Pipepost Tools — MCP Server Tools for Claude Code",
    description:
      "8 tools for SEO scoring, meta tag generation, publishing, and content management.",
    type: "website",
  },
  alternates: {
    canonical: "https://pipepost.dev/tools",
  },
};

const tools = [
  {
    name: "seo_score",
    tier: "free",
    title: "SEO Score",
    description:
      "Analyze your content for SEO quality. Returns a composite 0-100 score based on readability, keyword density, heading structure, and word count.",
    params: [
      { name: "content", type: "string", desc: "The markdown content to analyze" },
      { name: "keyword", type: "string", desc: "Target keyword to check density for" },
    ],
    example: '"Score my article about building MCP servers for SEO"',
    output: "SEO Score: 84/100 — Readability: Grade 8, Keywords: 2.1%, Headings: clean hierarchy",
  },
  {
    name: "seo_meta",
    tier: "pro",
    title: "SEO Meta Tags",
    description:
      "Generate optimized meta titles, descriptions, and Open Graph tags for your content. Follows Google's recommended character limits.",
    params: [
      { name: "content", type: "string", desc: "The content to generate meta tags for" },
      { name: "keyword", type: "string", desc: "Target keyword for optimization" },
    ],
    example: '"Generate meta tags for this article targeting \'node cli tools\'"',
    output: "Meta title (54ch), description (148ch), OG title, OG description, OG type",
  },
  {
    name: "seo_schema",
    tier: "pro",
    title: "JSON-LD Schema",
    description:
      "Generate structured data markup (JSON-LD) for your content. Supports Article, HowTo, FAQPage, and SoftwareApplication schemas.",
    params: [
      { name: "content", type: "string", desc: "The content to generate schema for" },
      { name: "type", type: "string", desc: "Schema type (article, howto, faq, software)" },
    ],
    example: '"Generate Article JSON-LD schema for this blog post"',
    output: "Complete JSON-LD script tag ready to embed in your page",
  },
  {
    name: "publish",
    tier: "free",
    title: "Publish",
    description:
      "Publish your content to Dev.to. Supports drafts and published states, tags, canonical URLs, and series. More platforms coming.",
    params: [
      { name: "content", type: "string", desc: "Markdown content to publish" },
      { name: "title", type: "string", desc: "Article title" },
      { name: "platform", type: "string", desc: "Target platform (devto)" },
      { name: "tags", type: "string[]", desc: "Up to 4 tags for the article" },
      { name: "status", type: "string", desc: "draft or published (default: draft)" },
    ],
    example:
      '"Publish this article to Dev.to as a draft with tags: node, cli, javascript"',
    output: "Published to dev.to/you/article-slug — 1,247 words, 6 min read",
  },
  {
    name: "list_posts",
    tier: "pro",
    title: "List Posts",
    description:
      "List your published and draft posts on a platform. Shows title, status, publish date, and URL.",
    params: [
      { name: "platform", type: "string", desc: "Platform to list posts from (devto)" },
      { name: "status", type: "string", desc: "Filter by status (all, published, draft)" },
    ],
    example: '"Show me my draft posts on Dev.to"',
    output: "3 drafts found — Building CLI Tools (Apr 12), MCP Guide (Apr 10), ...",
  },
  {
    name: "setup",
    tier: "free",
    title: "Setup",
    description:
      "Configure platform API keys. Keys are stored locally in ~/.pipepost/config.json and never leave your machine.",
    params: [
      { name: "platform", type: "string", desc: "Platform to configure (devto)" },
      { name: "api_key", type: "string", desc: "Your platform API key" },
    ],
    example: '"Set up my Dev.to API key: dv1_abc123..."',
    output: "Dev.to API key saved to ~/.pipepost/config.json",
  },
  {
    name: "activate",
    tier: "free",
    title: "Activate",
    description:
      "Activate a Pro license key. Validates with Lemon Squeezy and caches locally for offline use.",
    params: [
      { name: "license_key", type: "string", desc: "Your Pro license key" },
    ],
    example: '"Activate my Pipepost Pro license: XXXX-XXXX-XXXX"',
    output: "Pro license activated. Cached for offline use (re-validates every 24h).",
  },
  {
    name: "status",
    tier: "free",
    title: "Status",
    description:
      "Show your current Pipepost configuration, license status, configured platforms, and usage stats.",
    params: [],
    example: '"Show my Pipepost status"',
    output: "v0.1.2 — Free tier, Dev.to configured, 1/3 publishes used this month",
  },
];

export default function ToolsPage() {
  return (
    <main className="overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Pipepost Tools",
            description:
              "Documentation for the 8 MCP tools Pipepost adds to Claude Code.",
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
      <nav className="glass-nav fixed top-0 inset-x-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="text-xl font-mono text-[var(--accent)] font-bold tracking-tight">
              |&gt;
            </span>
            <span className="text-sm font-semibold tracking-tight">pipepost</span>
          </a>
          <div className="hidden sm:flex items-center gap-8 text-sm text-[var(--text-muted)]">
            <a href="/" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="/#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a
              href="https://github.com/MendleM/Pipepost"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
          <a href="/#get-started" className="btn-accent px-4 py-2 rounded-lg text-sm font-medium">
            Get started
          </a>
        </div>
      </nav>

      {/* Header */}
      <section className="relative pt-32 sm:pt-40 pb-12 px-6">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(249,115,22,0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.15)] rounded-full text-xs text-[var(--accent)] font-mono mb-8">
            8 tools
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Tools <span className="font-serif italic text-gradient">reference</span>
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10">
            Every tool Pipepost adds to your Claude Code session. Use them in natural language
            &mdash; Claude handles the rest.
          </p>
          <CopyInstall />
        </div>
      </section>

      {/* Tools list */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {tools.map((tool) => (
            <div
              key={tool.name}
              id={tool.name}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 scroll-mt-24"
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <code className="text-[var(--accent)] font-mono text-lg font-semibold">
                  {tool.name}
                </code>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    tool.tier === "free"
                      ? "bg-[rgba(34,197,94,0.1)] text-[#22C55E] border border-[rgba(34,197,94,0.2)]"
                      : "bg-[rgba(249,115,22,0.1)] text-[var(--accent)] border border-[rgba(249,115,22,0.2)]"
                  }`}
                >
                  {tool.tier}
                </span>
              </div>

              <h2 className="text-xl font-semibold mb-2">{tool.title}</h2>
              <p className="text-[var(--text-muted)] mb-6 leading-relaxed">{tool.description}</p>

              {tool.params.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-mono text-[var(--text-dim)] uppercase tracking-widest mb-3">
                    Parameters
                  </h3>
                  <div className="space-y-2">
                    {tool.params.map((p) => (
                      <div
                        key={p.name}
                        className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm"
                      >
                        <code className="text-[var(--accent-light)] font-mono text-xs">
                          {p.name}
                        </code>
                        <span className="text-[var(--text-dim)] text-xs font-mono">{p.type}</span>
                        <span className="text-[var(--text-muted)]">{p.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="terminal rounded-xl">
                <div className="terminal-body py-3 px-5 text-[12.5px] leading-[1.8] space-y-2">
                  <div>
                    <span className="text-[var(--accent-light)]">you:</span>{" "}
                    <span className="text-[var(--text-muted)]">&quot;{tool.example}&quot;</span>
                  </div>
                  <div className="text-[#22C55E]">{tool.output}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-16 border-t border-[var(--border)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(249,115,22,0.04)] to-transparent" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Ready to try these tools?
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            Free tier includes seo_score, publish (3/mo), setup, activate, and status.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <CopyInstall />
            <a
              href="https://pipepost.lemonsqueezy.com/checkout/buy/c9bcb420-ea9d-4ba7-b9c2-2305b6e3e06d"
              className="btn-accent px-6 py-3.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"
            >
              Get Pro &mdash; $19/mo
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[var(--text-dim)]">
          <a href="/" className="flex items-center gap-2.5">
            <span className="font-mono text-[var(--accent)] font-bold text-lg">|&gt;</span>
            <span className="font-semibold text-white text-sm">pipepost</span>
          </a>
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
            <a href="/#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          <p className="text-xs">&copy; 2026 Pipepost</p>
        </div>
      </footer>
    </main>
  );
}

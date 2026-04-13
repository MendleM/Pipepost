import type { Metadata } from "next";
import { CopyInstall } from "../../components/CopyInstall";

export const metadata: Metadata = {
  title: "I Built an MCP Server That Lets You Publish Blog Posts from Your Terminal",
  description:
    "I got tired of context-switching between Claude Code and Dev.to. So I built Pipepost — an open-source MCP server that lets you score SEO, publish articles, and manage content without leaving your terminal.",
  keywords: [
    "mcp server",
    "claude code",
    "publish from terminal",
    "dev.to api",
    "content publishing",
    "seo",
    "blog",
  ],
  openGraph: {
    title: "I Built an MCP Server That Lets You Publish Blog Posts from Your Terminal",
    description:
      "Pipepost is an open-source MCP server that adds publishing and SEO tools to Claude Code.",
    type: "article",
    publishedTime: "2026-04-14T00:00:00Z",
    authors: ["Pipepost"],
  },
  alternates: {
    canonical: "https://pipepost.dev/blog/publish-from-terminal",
  },
};

export default function Article() {
  return (
    <main className="overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline:
              "I Built an MCP Server That Lets You Publish Blog Posts from Your Terminal",
            description:
              "How I built Pipepost, an open-source MCP server that adds SEO scoring and publishing to Claude Code.",
            datePublished: "2026-04-14T00:00:00Z",
            dateModified: "2026-04-14T00:00:00Z",
            wordCount: 1300,
            author: {
              "@type": "Organization",
              name: "Pipepost",
              url: "https://pipepost.dev",
            },
            publisher: {
              "@type": "Organization",
              name: "Pipepost",
              url: "https://pipepost.dev",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": "https://pipepost.dev/blog/publish-from-terminal",
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

      {/* Article */}
      <article className="relative pt-32 sm:pt-40 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 text-xs text-[var(--text-dim)] mb-6">
              <time dateTime="2026-04-14">April 14, 2026</time>
              <span>&middot;</span>
              <span>6 min read</span>
              <span>&middot;</span>
              <span className="text-[var(--accent)]">MCP, Claude Code</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] mb-6">
              I Built an MCP Server That Lets You Publish Blog Posts from Your Terminal
            </h1>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
              I got tired of context-switching between Claude Code and Dev.to. So I built Pipepost
              &mdash; an open-source MCP server that lets you score SEO, publish articles, and
              manage content without leaving your terminal.
            </p>
          </div>

          {/* Content */}
          <div className="prose-custom">
            <p>
              I write a lot of technical content. And for the last few months, most of that writing
              happens inside Claude Code. I describe what I want, iterate on the structure, refine
              the wording &mdash; all from a terminal session. It works great.
            </p>
            <p>Then comes the part I dread: publishing.</p>
            <p>
              I copy the markdown. I open Dev.to. I paste it in. I fiddle with the frontmatter. I
              add tags. I preview it. I fix formatting that broke in the paste. I go back to my
              terminal to check something. I go back to the browser. I finally hit publish.
            </p>
            <p>
              Every single time, I lose 15-20 minutes to this ritual. And every single time, I
              think: <em>why am I leaving my terminal for this?</em>
            </p>
            <p>So I built a tool that means I don&apos;t have to.</p>

            <h2>What I built</h2>
            <p>
              <a href="https://pipepost.dev" className="text-[var(--accent)] hover:underline">
                Pipepost
              </a>{" "}
              is an MCP server that lets you publish content directly from Claude Code. Write an
              article, score it for SEO, and publish it to Dev.to &mdash; all without opening a
              browser.
            </p>
            <p>
              If you&apos;re not familiar with MCP (Model Context Protocol), here&apos;s the short
              version: it&apos;s an open standard from Anthropic that lets AI assistants use external
              tools. Think of it as a plugin system for Claude. You register an MCP server, and
              Claude gets access to whatever tools that server exposes &mdash; in this case, tools
              for content publishing and SEO analysis.
            </p>
            <p>Pipepost currently exposes eight tools:</p>

            <div className="overflow-x-auto my-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 pr-4 text-[var(--text-muted)] font-semibold">
                      Tool
                    </th>
                    <th className="text-left py-3 text-[var(--text-muted)] font-semibold">
                      What it does
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-muted)]">
                  {[
                    ["seo_score", "Analyzes readability, keyword density, heading structure"],
                    ["seo_meta", "Generates meta titles, descriptions, OG tags"],
                    ["seo_schema", "Generates JSON-LD structured data"],
                    ["publish", "Publishes to Dev.to (more platforms coming)"],
                    ["list_posts", "Lists your published and draft posts"],
                    ["setup", "Configures platform API keys"],
                    ["activate", "Activates a Pro license"],
                    ["status", "Shows your current config and usage"],
                  ].map(([tool, desc]) => (
                    <tr key={tool} className="border-b border-[var(--border)]">
                      <td className="py-3 pr-4">
                        <code className="text-[var(--accent)] text-xs">{tool}</code>
                      </td>
                      <td className="py-3">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              The <code>seo_score</code> and <code>publish</code> tools are available on the free
              tier. That covers the core workflow: write, check, publish.
            </p>

            <h2>How it works in practice</h2>

            <h3>Installation</h3>
            <p>
              Add Pipepost to your Claude Code config (
              <code>~/.claude/settings.json</code>):
            </p>

            <div className="terminal rounded-xl my-6">
              <div className="terminal-body py-4 px-5 text-[12.5px] leading-[1.8]">
                <div className="text-[var(--text-dim)]">
                  {"// ~/.claude/settings.json"}
                </div>
                <div>
                  <span className="text-[var(--accent)]">&quot;mcpServers&quot;</span>
                  {": {"}
                </div>
                <div className="ml-4">
                  <span className="text-[var(--accent)]">&quot;pipepost&quot;</span>
                  {": {"}
                </div>
                <div className="ml-8">
                  <span className="text-[var(--accent)]">&quot;command&quot;</span>
                  {": "}
                  <span className="text-[#22C55E]">&quot;npx&quot;</span>,
                </div>
                <div className="ml-8">
                  <span className="text-[var(--accent)]">&quot;args&quot;</span>
                  {": ["}
                  <span className="text-[#22C55E]">&quot;-y&quot;</span>
                  {", "}
                  <span className="text-[#22C55E]">&quot;pipepost-mcp&quot;</span>
                  {"]"}
                </div>
                <div className="ml-4">{"}"}</div>
                <div>{"}"}</div>
              </div>
            </div>

            <p>
              That&apos;s it. Next time you start Claude Code, the Pipepost tools are available.
            </p>

            <h3>Set up your Dev.to API key</h3>
            <p>Just ask Claude:</p>
            <div className="terminal rounded-xl my-6">
              <div className="terminal-body py-3 px-5 text-[12.5px]">
                <span className="text-[var(--accent-light)]">you:</span>{" "}
                <span className="text-[var(--text-muted)]">
                  &quot;Set up my Dev.to API key: dv1_abc123...&quot;
                </span>
              </div>
            </div>
            <p>
              Claude calls the <code>setup</code> tool, and your key gets saved locally to{" "}
              <code>~/.pipepost/config.json</code>. It never leaves your machine.
            </p>

            <h3>Score your content for SEO</h3>
            <p>
              Say you&apos;ve just written an article about building CLI tools in Node. Before
              publishing, you want to know if it&apos;s optimized:
            </p>
            <div className="terminal rounded-xl my-6">
              <div className="terminal-body py-3 px-5 text-[12.5px]">
                <span className="text-[var(--accent-light)]">you:</span>{" "}
                <span className="text-[var(--text-muted)]">
                  &quot;Score this article for SEO targeting &lsquo;node cli tools&rsquo;&quot;
                </span>
              </div>
            </div>
            <p>
              Pipepost runs a Flesch-Kincaid readability analysis, checks your keyword density,
              validates your heading structure, and returns a composite score with actionable
              suggestions.
            </p>
            <p>
              The score factors in word count, readability sweet spot (50-80 Flesch-Kincaid is
              ideal), keyword density (targeting 0.5-2.5%), and heading structure. It&apos;s not
              trying to replace Ahrefs &mdash; it&apos;s a quick sanity check before you hit
              publish.
            </p>

            <h3>Publish</h3>
            <div className="terminal rounded-xl my-6">
              <div className="terminal-body py-3 px-5 text-[12.5px]">
                <span className="text-[var(--accent-light)]">you:</span>{" "}
                <span className="text-[var(--text-muted)]">
                  &quot;Publish this article to Dev.to as a draft with tags: node, cli,
                  javascript&quot;
                </span>
              </div>
            </div>
            <p>
              Claude calls the <code>publish</code> tool and your article is now a draft on Dev.to.
              Open the URL, do a final review, and publish when you&apos;re ready.
            </p>
            <p>
              The whole flow &mdash; from finished markdown to draft on Dev.to &mdash; takes about
              10 seconds.
            </p>

            <h2>Under the hood</h2>
            <p>
              Pipepost is a Node.js process that communicates with Claude Code over{" "}
              <strong>STDIO transport</strong>. When Claude Code starts, it spawns the MCP server as
              a child process. They talk back and forth over stdin/stdout using the MCP protocol.
            </p>
            <p>The stack is intentionally minimal:</p>
            <ul>
              <li>
                <strong>@modelcontextprotocol/sdk</strong> &mdash; Anthropic&apos;s official
                TypeScript SDK for building MCP servers
              </li>
              <li>
                <strong>zod</strong> &mdash; Schema validation for every tool input
              </li>
              <li>
                <strong>tsup</strong> &mdash; Bundles everything into a single distributable file
              </li>
            </ul>
            <p>
              That&apos;s the entire dependency list. No Express, no database, no runtime
              dependencies beyond those three.
            </p>
            <p>
              Credentials are stored in <code>~/.pipepost/config.json</code> on your local
              filesystem. Nothing gets sent anywhere except the specific API calls you trigger (like
              publishing to Dev.to).
            </p>

            <h2>Free vs Pro</h2>
            <p>
              I wanted this to be genuinely useful without paying anything. The free tier gives you:
            </p>
            <ul>
              <li>
                <strong>SEO scoring</strong> &mdash; readability, keyword density, and word count
                analysis
              </li>
              <li>
                <strong>Publishing to Dev.to</strong> &mdash; 3 articles per month
              </li>
              <li>
                <strong>Setup and config tools</strong> &mdash; full access
              </li>
            </ul>
            <p>
              The Pro tier ($19/month) adds full SEO analysis with issues and suggestions, unlimited
              publishing, meta tag generation, JSON-LD schemas, post listing, and additional
              platforms.
            </p>

            <h2>What&apos;s next</h2>
            <p>
              <strong>More platforms.</strong> Ghost, Hashnode, WordPress, and Medium support are
              planned. The publishing layer is already designed for this &mdash; each platform gets
              its own module, and the <code>publish</code> tool routes based on the{" "}
              <code>platform</code> parameter.
            </p>
            <p>
              <strong>Social promotion.</strong> After you publish an article, you shouldn&apos;t
              have to manually write tweets and Reddit posts about it. The plan is to add tools that
              generate platform-appropriate promotion.
            </p>
            <p>
              <strong>The bigger picture.</strong> If you&apos;re already using Claude Code for
              writing, the workflow should be: write, optimize, publish, promote &mdash; without ever
              switching context.
            </p>

            <h2>Try it</h2>
            <p>If you use Claude Code and publish content, give it a shot:</p>
          </div>

          {/* CTA */}
          <div className="mt-8 mb-12 flex flex-col sm:flex-row items-start gap-4">
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

          <div className="prose-custom">
            <p className="text-sm text-[var(--text-dim)]">
              It&apos;s MIT licensed and open source. If you run into issues or have ideas, open an
              issue.
            </p>
          </div>
        </div>
      </article>

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

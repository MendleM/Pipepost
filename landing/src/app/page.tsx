export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="px-6 pt-20 pb-16 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl font-mono text-[#F97316] font-bold">|&gt;</span>
          <span className="text-xl font-bold tracking-tight">pipepost</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
          Publish from your terminal.
        </h1>

        <p className="text-lg text-[#78716C] mb-8 max-w-xl">
          An MCP server that turns Claude Code into a content studio.
          Write, score for SEO, publish to Dev.to, and promote on social —
          without switching apps.
        </p>

        <div className="bg-[#0F172A] rounded-lg p-4 mb-8 max-w-lg">
          <code className="text-sm text-green-400 font-mono">
            $ npx pipepost-mcp
          </code>
        </div>

        <div className="flex gap-4">
          <a
            href="https://github.com/MendleM/Pipepost"
            className="inline-flex items-center px-5 py-2.5 bg-[#0F172A] text-white rounded-lg text-sm font-medium hover:bg-[#1e293b] transition-colors"
          >
            View on GitHub
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center px-5 py-2.5 border border-[#d6d3d1] rounded-lg text-sm font-medium hover:border-[#a8a29e] transition-colors"
          >
            See pricing
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 border-t border-[#e7e5e4]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">How it works</h2>
          <div className="grid gap-8">
            {[
              {
                step: "01",
                title: "Write in Claude Code",
                desc: "You already do this. Write your article, guide, or tutorial in your terminal.",
              },
              {
                step: "02",
                title: "Score and optimize",
                desc: '"Score this for SEO targeting MCP server." Get readability, keyword density, and heading analysis.',
              },
              {
                step: "03",
                title: "Publish and promote",
                desc: '"Publish this to Dev.to." One command. Your article is live. Generate social posts to promote it.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <span className="text-sm font-mono text-[#F97316] font-bold mt-1 shrink-0">
                  {step}
                </span>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-[#78716C]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="px-6 py-16 border-t border-[#e7e5e4]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Tools</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d6d3d1]">
                  <th className="text-left py-3 font-semibold">Tool</th>
                  <th className="text-left py-3 font-semibold">Description</th>
                  <th className="text-left py-3 font-semibold">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e5e4]">
                {[
                  { name: "seo_score", desc: "Readability, keyword density, heading analysis", tier: "Free / Pro" },
                  { name: "seo_meta", desc: "Meta title, description, OG tags", tier: "Pro" },
                  { name: "seo_schema", desc: "JSON-LD structured data", tier: "Pro" },
                  { name: "publish", desc: "Publish to Dev.to (more coming)", tier: "Free (3/mo) / Pro" },
                  { name: "list_posts", desc: "List your posts", tier: "Pro" },
                  { name: "setup", desc: "Configure API keys", tier: "Free" },
                  { name: "status", desc: "Show config and license status", tier: "Free" },
                ].map(({ name, desc, tier }) => (
                  <tr key={name}>
                    <td className="py-2.5 font-mono text-xs text-[#F97316]">{name}</td>
                    <td className="py-2.5 text-[#78716C]">{desc}</td>
                    <td className="py-2.5 text-xs">{tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-16 border-t border-[#e7e5e4]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Pricing</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-[#e7e5e4] rounded-lg p-6">
              <h3 className="font-bold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">$0</p>
              <ul className="text-sm text-[#78716C] space-y-2">
                <li>Dev.to publishing</li>
                <li>3 publishes / month</li>
                <li>Basic SEO scoring</li>
                <li>&quot;Published with Pipepost&quot; badge</li>
              </ul>
            </div>
            <div className="border-2 border-[#F97316] rounded-lg p-6 relative">
              <span className="absolute -top-3 left-4 bg-[#F97316] text-white text-xs font-bold px-2 py-0.5 rounded">
                RECOMMENDED
              </span>
              <h3 className="font-bold mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-4">$19<span className="text-sm font-normal text-[#78716C]">/mo</span></p>
              <ul className="text-sm text-[#78716C] space-y-2">
                <li>All 5 CMS platforms</li>
                <li>Unlimited publishes</li>
                <li>Full SEO suite</li>
                <li>Social promotion</li>
                <li>No badge required</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section className="px-6 py-16 border-t border-[#e7e5e4]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Get started</h2>
          <div className="bg-[#0F172A] rounded-lg p-4 mb-6 max-w-lg mx-auto">
            <code className="text-sm text-green-400 font-mono">
              $ npx pipepost-mcp
            </code>
          </div>
          <p className="text-sm text-[#78716C]">
            Then add to <code className="text-xs bg-[#f5f5f4] px-1.5 py-0.5 rounded">~/.claude/settings.json</code> and start publishing.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[#e7e5e4]">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-sm text-[#78716C]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[#F97316] font-bold">|&gt;</span>
            <span className="font-medium text-[#0F172A]">pipepost</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/MendleM/Pipepost" className="hover:text-[#0F172A] transition-colors">GitHub</a>
            <a href="https://npmjs.com/package/pipepost-mcp" className="hover:text-[#0F172A] transition-colors">npm</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

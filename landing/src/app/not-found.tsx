import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Pipepost",
};

export default function NotFound() {
  return (
    <main className="overflow-hidden min-h-screen flex items-center justify-center">
      <div className="grain" />
      <div className="text-center px-6">
        <div className="text-8xl font-mono font-bold text-[var(--accent)] mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-[var(--text-muted)] mb-8">
          This page doesn&apos;t exist. Maybe you were looking for one of these?
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/"
            className="btn-accent px-6 py-3 rounded-xl text-sm font-bold"
          >
            Home
          </a>
          <a
            href="/tools"
            className="px-6 py-3 rounded-xl text-sm font-medium border border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--bg-card)] transition-all"
          >
            Tools
          </a>
          <a
            href="/blog/publish-from-terminal"
            className="px-6 py-3 rounded-xl text-sm font-medium border border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--bg-card)] transition-all"
          >
            Blog
          </a>
        </div>
      </div>
    </main>
  );
}

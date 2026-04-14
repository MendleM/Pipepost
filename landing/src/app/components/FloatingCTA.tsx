"use client";

import { useState, useEffect } from "react";

export function FloatingCTA() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText("npx pipepost-mcp");
    } catch {
      /* fallback not needed for modern browsers */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-fade-in-up">
      {expanded ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7),0_0_60px_-20px_rgba(249,115,22,0.12)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              Quick setup
            </span>
            <button
              onClick={() => setExpanded(false)}
              className="text-[var(--text-dim)] hover:text-white transition-colors"
            >
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <button
            onClick={copy}
            className="flex items-center gap-3 font-mono text-sm bg-[var(--bg-deep)] border border-[var(--border)] rounded-xl px-4 py-3 hover:border-[var(--accent)] transition-colors group cursor-pointer w-full"
          >
            <span className="text-[var(--text-dim)]">$</span>
            <span className="text-[var(--accent)]">npx</span>
            <span className="text-white">pipepost-mcp</span>
            <span className="ml-auto">
              {copied ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4ADE80"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--text-dim)] group-hover:text-white transition-colors"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
            </span>
          </button>
          <p className="text-[10px] text-[var(--text-dim)] mt-2.5 text-center">
            Installs the MCP server for Claude Code
          </p>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2.5 bg-[var(--accent)] hover:bg-[#EA580C] text-white font-semibold text-sm px-5 py-3 rounded-full shadow-[0_8px_32px_-4px_rgba(249,115,22,0.4)] hover:shadow-[0_8px_40px_-4px_rgba(249,115,22,0.5)] transition-all duration-300 hover:scale-105 cursor-pointer"
        >
          <svg
            width="16"
            height="16"
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
          Get started
        </button>
      )}
    </div>
  );
}

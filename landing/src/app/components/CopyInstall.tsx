"use client";

import { useState } from "react";

export function CopyInstall({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText("npx pipepost-mcp");
    } catch {
      const el = document.createElement("textarea");
      el.value = "npx pipepost-mcp";
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className={`install-box flex items-center gap-3 font-mono text-sm cursor-pointer group ${
        compact ? "py-3 px-4" : ""
      }`}
      title="Click to copy"
    >
      <span className="text-[var(--text-dim)]">$</span>
      <span className="text-[var(--accent)]">npx</span>
      <span className="text-white">pipepost-mcp</span>
      <span className="ml-2 transition-all duration-200 flex-shrink-0">
        {copied ? (
          <span className="flex items-center gap-1.5 text-[#22C55E] text-xs font-sans">
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied!
          </span>
        ) : (
          <svg
            width="16"
            height="16"
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
  );
}

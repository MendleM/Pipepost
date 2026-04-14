"use client";

import { useState } from "react";

export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:border-[var(--border-light)] transition-colors duration-300">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full cursor-pointer px-6 py-5 text-[15px] font-semibold text-left hover:text-[var(--accent)] transition-colors"
      >
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
          className={`flex-shrink-0 ml-4 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-5 text-[15px] text-[var(--text-muted)] leading-relaxed">
            {a}
          </div>
        </div>
      </div>
    </div>
  );
}

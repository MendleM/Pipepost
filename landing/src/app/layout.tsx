import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pipepost — Publish from your terminal",
  description:
    "MCP server that turns Claude Code into a content studio. SEO scoring, multi-platform publishing, and social promotion from your terminal.",
  keywords: ["mcp server", "claude code", "content publishing", "seo", "devto", "blog"],
  openGraph: {
    title: "Pipepost — Publish from your terminal",
    description: "MCP server for content publishing, SEO, and social promotion.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FAFAF9] text-[#0F172A] antialiased">
        {children}
      </body>
    </html>
  );
}

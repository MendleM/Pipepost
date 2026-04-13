import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "./providers";

export const metadata: Metadata = {
  title: "Pipepost — Publish from your terminal",
  description:
    "MCP server that turns Claude Code into a content studio. SEO scoring, multi-platform publishing, and social promotion — without switching apps.",
  keywords: ["mcp server", "claude code", "content publishing", "seo", "devto", "blog", "terminal"],
  openGraph: {
    title: "Pipepost — Publish from your terminal",
    description: "MCP server for content publishing, SEO, and social promotion.",
    type: "website",
    url: "https://pipepost.dev",
  },
  metadataBase: new URL("https://pipepost.dev"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#09090B] text-[#FAFAFA] antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

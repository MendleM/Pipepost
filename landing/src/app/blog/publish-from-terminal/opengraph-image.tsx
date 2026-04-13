import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "I Built an MCP Server That Lets You Publish Blog Posts from Your Terminal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "500px",
            background:
              "radial-gradient(ellipse at center, rgba(249,115,22,0.1) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              "linear-gradient(#27272A 1px, transparent 1px), linear-gradient(90deg, #27272A 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            maxWidth: "900px",
            padding: "0 40px",
          }}
        >
          {/* Blog badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "32px",
              padding: "6px 16px",
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.2)",
              borderRadius: "20px",
              fontSize: "14px",
              color: "#F97316",
              fontFamily: "monospace",
            }}
          >
            |&gt; pipepost blog
          </div>

          <div
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#FAFAFA",
              lineHeight: 1.15,
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            I Built an MCP Server That Lets You Publish Blog Posts from Your Terminal
          </div>

          <div
            style={{
              fontSize: "20px",
              color: "#A1A1AA",
              textAlign: "center",
              maxWidth: "700px",
              lineHeight: 1.5,
            }}
          >
            SEO scoring, Dev.to publishing, and social promotion — without leaving Claude Code
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "36px",
              fontSize: "14px",
              color: "#71717A",
            }}
          >
            <span>April 14, 2026</span>
            <span>|</span>
            <span>6 min read</span>
            <span>|</span>
            <span style={{ color: "#F97316" }}>pipepost.dev</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

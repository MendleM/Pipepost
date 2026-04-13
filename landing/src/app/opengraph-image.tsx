import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Pipepost — Publish from your terminal";
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
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "500px",
            background:
              "radial-gradient(ellipse at center, rgba(249,115,22,0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Grid pattern */}
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

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "40px",
            }}
          >
            <span
              style={{
                fontSize: "42px",
                fontFamily: "monospace",
                color: "#F97316",
                fontWeight: 700,
              }}
            >
              |&gt;
            </span>
            <span
              style={{
                fontSize: "24px",
                color: "#FAFAFA",
                fontWeight: 600,
              }}
            >
              pipepost
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: 700,
              color: "#FAFAFA",
              lineHeight: 1.1,
              textAlign: "center",
              marginBottom: "8px",
            }}
          >
            Claude writes it.
          </div>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 700,
              fontStyle: "italic",
              background: "linear-gradient(135deg, #F97316, #FB923C)",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1.1,
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            Pipepost ships it.
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "22px",
              color: "#A1A1AA",
              textAlign: "center",
              maxWidth: "600px",
            }}
          >
            MCP server for Claude Code. Score SEO, publish, and promote — from your terminal.
          </div>

          {/* Install command */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "40px",
              padding: "12px 24px",
              background: "#111113",
              border: "1px solid #27272A",
              borderRadius: "12px",
              fontFamily: "monospace",
              fontSize: "18px",
            }}
          >
            <span style={{ color: "#71717A" }}>$</span>
            <span style={{ color: "#F97316" }}>npx</span>
            <span style={{ color: "#FAFAFA" }}>pipepost-mcp</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

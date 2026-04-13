import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Pipepost Tools — 8 MCP Tools for Claude Code";
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
              "radial-gradient(ellipse at center, rgba(249,115,22,0.12) 0%, transparent 70%)",
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
          }}
        >
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
            <span style={{ fontSize: "24px", color: "#FAFAFA", fontWeight: 600 }}>
              pipepost
            </span>
          </div>

          <div
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "#FAFAFA",
              lineHeight: 1.1,
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            8 Tools for Claude Code
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "center",
              maxWidth: "700px",
            }}
          >
            {[
              "seo_score",
              "seo_meta",
              "seo_schema",
              "publish",
              "list_posts",
              "setup",
              "activate",
              "status",
            ].map((tool) => (
              <div
                key={tool}
                style={{
                  padding: "8px 16px",
                  background: "#111113",
                  border: "1px solid #27272A",
                  borderRadius: "8px",
                  fontFamily: "monospace",
                  fontSize: "16px",
                  color: "#F97316",
                }}
              >
                {tool}
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: "20px",
              color: "#A1A1AA",
              textAlign: "center",
              marginTop: "32px",
            }}
          >
            SEO scoring, publishing, meta tags, structured data — from your terminal
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

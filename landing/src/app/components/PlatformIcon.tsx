"use client";

import { clipSquircle } from "html-squircle";
import {
  SiDevdotto,
  SiGhost,
  SiHashnode,
  SiWordpress,
  SiMedium,
} from "@icons-pack/react-simple-icons";
import { type CSSProperties, type ReactNode } from "react";

type Platform = "devto" | "ghost" | "hashnode" | "wordpress" | "medium";

const PLATFORM_CONFIG: Record<
  Platform,
  {
    label: string;
    icon: ReactNode;
    gradient: string;
    glowColor: string;
    glowHover: string;
    live: boolean;
  }
> = {
  devto: {
    label: "Dev.to",
    icon: <SiDevdotto size={48} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #EC4899, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #A5B4FC, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #818CF8, transparent 55%)",
      "linear-gradient(145deg, #6366F1, #7C3AED)",
    ].join(", "),
    glowColor: "rgba(99,102,241,0.4)",
    glowHover: "rgba(99,102,241,0.55)",
    live: true,
  },
  ghost: {
    label: "Ghost",
    icon: <SiGhost size={48} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #2DD4BF, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #A5F3FC, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #22D3EE, transparent 55%)",
      "linear-gradient(145deg, #06B6D4, #0891B2)",
    ].join(", "),
    glowColor: "rgba(6,182,212,0.4)",
    glowHover: "rgba(6,182,212,0.55)",
    live: false,
  },
  hashnode: {
    label: "Hashnode",
    icon: <SiHashnode size={48} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #F472B6, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #D8B4FE, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #C084FC, transparent 55%)",
      "linear-gradient(145deg, #A855F7, #9333EA)",
    ].join(", "),
    glowColor: "rgba(168,85,247,0.4)",
    glowHover: "rgba(168,85,247,0.55)",
    live: false,
  },
  wordpress: {
    label: "WordPress",
    icon: <SiWordpress size={48} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #34D399, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #BEF264, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #4ADE80, transparent 55%)",
      "linear-gradient(145deg, #10B981, #059669)",
    ].join(", "),
    glowColor: "rgba(16,185,129,0.4)",
    glowHover: "rgba(16,185,129,0.55)",
    live: false,
  },
  medium: {
    label: "Medium",
    icon: <SiMedium size={48} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #FB923C, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #FDE68A, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #FBBF24, transparent 55%)",
      "linear-gradient(145deg, #F59E0B, #EAB308)",
    ].join(", "),
    glowColor: "rgba(245,158,11,0.4)",
    glowHover: "rgba(245,158,11,0.55)",
    live: false,
  },
};

const ICON_SIZE = 108;

// Generate squircle clip-path once (radius 17%, smoothing 100%)
const squircleClip = clipSquircle({
  width: ICON_SIZE,
  height: ICON_SIZE,
  curveLength: ICON_SIZE * 0.17,
  roundness: 1.0,
});

export function PlatformIcon({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];

  const glowStyle: CSSProperties = {
    ["--glow-color" as string]: config.glowColor,
    ["--glow-hover" as string]: config.glowHover,
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="icon-glow" style={glowStyle}>
        <div
          className={`icon-face ${!config.live ? "opacity-60" : ""}`}
          style={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            background: config.gradient,
            clipPath: squircleClip,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Noise grain */}
          <div className="icon-noise" />
          {/* Top gloss */}
          <div className="icon-gloss" />
          {/* Bottom inner shadow */}
          <div className="icon-inner-shadow" />
          {/* Shimmer */}
          <div className="icon-shimmer" />
          {/* Logo */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {config.icon}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[13px] text-[var(--text-muted)] font-medium">
          {config.label}
        </span>
        {!config.live && (
          <span className="text-[10px] text-[var(--text-dim)] font-mono">
            soon
          </span>
        )}
      </div>
    </div>
  );
}

export function PlatformIconRow() {
  const platforms: Platform[] = [
    "devto",
    "ghost",
    "hashnode",
    "wordpress",
    "medium",
  ];

  return (
    <div className="flex flex-wrap items-start justify-center gap-10 sm:gap-12">
      {platforms.map((p) => (
        <PlatformIcon key={p} platform={p} />
      ))}
    </div>
  );
}

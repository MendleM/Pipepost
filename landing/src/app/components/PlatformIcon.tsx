"use client";

import { clipSquircle } from "html-squircle";
import {
  SiDevdotto,
  SiGhost,
  SiHashnode,
  SiWordpress,
  SiMedium,
  SiX,
  SiReddit,
  SiBluesky,
  SiSubstack,
  SiThreads,
  SiMastodon,
} from "@icons-pack/react-simple-icons";
import { type CSSProperties, type ReactNode } from "react";

function LinkedInIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

type Platform =
  | "devto"
  | "ghost"
  | "hashnode"
  | "wordpress"
  | "medium"
  | "x"
  | "reddit"
  | "bluesky"
  | "substack"
  | "linkedin"
  | "threads"
  | "mastodon";

interface PlatformEntry {
  label: string;
  icon: ReactNode;
  gradient: string;
  glowColor: string;
  glowHover: string;
}

const ICON_SIZE = 96;
const LOGO_SIZE = 48;

const squircleClip = clipSquircle({
  width: ICON_SIZE,
  height: ICON_SIZE,
  curveLength: ICON_SIZE * 0.25,
  roundness: 0.3,
});

const PLATFORM_CONFIG: Record<Platform, PlatformEntry> = {
  devto: {
    label: "Dev.to",
    icon: <SiDevdotto size={LOGO_SIZE} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #EC4899, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #A5B4FC, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #818CF8, transparent 55%)",
      "linear-gradient(145deg, #6366F1, #7C3AED)",
    ].join(", "),
    glowColor: "rgba(99,102,241,0.35)",
    glowHover: "rgba(99,102,241,0.5)",
  },
  ghost: {
    label: "Ghost",
    icon: <SiGhost size={LOGO_SIZE} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #2DD4BF, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #A5F3FC, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #22D3EE, transparent 55%)",
      "linear-gradient(145deg, #06B6D4, #0891B2)",
    ].join(", "),
    glowColor: "rgba(6,182,212,0.35)",
    glowHover: "rgba(6,182,212,0.5)",
  },
  hashnode: {
    label: "Hashnode",
    icon: <SiHashnode size={LOGO_SIZE} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #F472B6, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #D8B4FE, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #C084FC, transparent 55%)",
      "linear-gradient(145deg, #A855F7, #9333EA)",
    ].join(", "),
    glowColor: "rgba(168,85,247,0.35)",
    glowHover: "rgba(168,85,247,0.5)",
  },
  wordpress: {
    label: "WordPress",
    icon: <SiWordpress size={LOGO_SIZE} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #34D399, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #BEF264, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #4ADE80, transparent 55%)",
      "linear-gradient(145deg, #10B981, #059669)",
    ].join(", "),
    glowColor: "rgba(16,185,129,0.35)",
    glowHover: "rgba(16,185,129,0.5)",
  },
  medium: {
    label: "Medium",
    icon: <SiMedium size={LOGO_SIZE} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #FB923C, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #FDE68A, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #FBBF24, transparent 55%)",
      "linear-gradient(145deg, #F59E0B, #EAB308)",
    ].join(", "),
    glowColor: "rgba(245,158,11,0.35)",
    glowHover: "rgba(245,158,11,0.5)",
  },
  substack: {
    label: "Substack",
    icon: <SiSubstack size={LOGO_SIZE} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #FB923C, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #FDBA74, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #F97316, transparent 55%)",
      "linear-gradient(145deg, #EA580C, #C2410C)",
    ].join(", "),
    glowColor: "rgba(234,88,12,0.35)",
    glowHover: "rgba(234,88,12,0.5)",
  },
  linkedin: {
    label: "LinkedIn",
    icon: <LinkedInIcon size={LOGO_SIZE} />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #38BDF8, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #93C5FD, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #0EA5E9, transparent 55%)",
      "linear-gradient(145deg, #0284C7, #0369A1)",
    ].join(", "),
    glowColor: "rgba(2,132,199,0.35)",
    glowHover: "rgba(2,132,199,0.5)",
  },
  x: {
    label: "X",
    icon: <SiX size={LOGO_SIZE} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #6B7280, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #9CA3AF, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #4B5563, transparent 55%)",
      "linear-gradient(145deg, #374151, #1F2937)",
    ].join(", "),
    glowColor: "rgba(107,114,128,0.3)",
    glowHover: "rgba(107,114,128,0.45)",
  },
  reddit: {
    label: "Reddit",
    icon: <SiReddit size={LOGO_SIZE} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #FB923C, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #FCA5A5, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #F87171, transparent 55%)",
      "linear-gradient(145deg, #EF4444, #DC2626)",
    ].join(", "),
    glowColor: "rgba(239,68,68,0.35)",
    glowHover: "rgba(239,68,68,0.5)",
  },
  bluesky: {
    label: "Bluesky",
    icon: <SiBluesky size={LOGO_SIZE} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #60A5FA, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #93C5FD, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #3B82F6, transparent 55%)",
      "linear-gradient(145deg, #2563EB, #1D4ED8)",
    ].join(", "),
    glowColor: "rgba(37,99,235,0.35)",
    glowHover: "rgba(37,99,235,0.5)",
  },
  threads: {
    label: "Threads",
    icon: <SiThreads size={LOGO_SIZE} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #E879F9, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #F9A8D4, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #D946EF, transparent 55%)",
      "linear-gradient(145deg, #C026D3, #A21CAF)",
    ].join(", "),
    glowColor: "rgba(192,38,211,0.35)",
    glowHover: "rgba(192,38,211,0.5)",
  },
  mastodon: {
    label: "Mastodon",
    icon: <SiMastodon size={LOGO_SIZE} color="white" />,
    gradient: [
      "radial-gradient(circle at 15% 85%, #A78BFA, transparent 50%)",
      "radial-gradient(circle at 85% 15%, #C4B5FD, transparent 50%)",
      "radial-gradient(circle at 50% 40%, #8B5CF6, transparent 55%)",
      "linear-gradient(145deg, #7C3AED, #6D28D9)",
    ].join(", "),
    glowColor: "rgba(124,58,237,0.35)",
    glowHover: "rgba(124,58,237,0.5)",
  },
};

// Staggered float animations — each icon bobs at its own rhythm
const FLOAT_CONFIGS = [
  { duration: "5s", delay: "0s", distance: 6, rotation: 2 },
  { duration: "6s", delay: "0.8s", distance: 8, rotation: -1.5 },
  { duration: "5.5s", delay: "0.3s", distance: 5, rotation: 1 },
  { duration: "7s", delay: "1.2s", distance: 7, rotation: -2 },
  { duration: "5.8s", delay: "0.5s", distance: 6, rotation: 1.5 },
  { duration: "6.5s", delay: "0.9s", distance: 9, rotation: -1 },
  { duration: "5.2s", delay: "0.2s", distance: 5, rotation: 2.5 },
  { duration: "6.8s", delay: "1.5s", distance: 7, rotation: -2.5 },
  { duration: "5.6s", delay: "0.6s", distance: 8, rotation: 1.8 },
  { duration: "7.2s", delay: "1.0s", distance: 6, rotation: -1.2 },
  { duration: "6.2s", delay: "0.4s", distance: 7, rotation: 2.2 },
  { duration: "5.4s", delay: "1.3s", distance: 5, rotation: -1.8 },
];

export function PlatformIcon({
  platform,
  index = 0,
}: {
  platform: Platform;
  index?: number;
}) {
  const config = PLATFORM_CONFIG[platform];
  const float = FLOAT_CONFIGS[index % FLOAT_CONFIGS.length];

  const glowStyle = {
    "--glow-color": config.glowColor,
    "--glow-hover": config.glowHover,
  } as CSSProperties;

  const floatStyle: CSSProperties = {
    animation: `iconFloat${index % 4} ${float.duration} ease-in-out ${float.delay} infinite`,
  };

  return (
    <div className="flex flex-col items-center gap-2.5" style={floatStyle}>
      <div className="icon-glow" style={glowStyle}>
        <div
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
          <div className="icon-noise" />
          <div className="icon-gloss" />
          <div className="icon-inner-shadow" />
          <div className="icon-shimmer" />
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
      <span className="text-[13px] text-[var(--text-muted)] font-medium">
        {config.label}
      </span>
    </div>
  );
}

export function PlatformIconGrid() {
  const platforms: Platform[] = [
    "devto",
    "ghost",
    "hashnode",
    "wordpress",
    "medium",
    "substack",
    "linkedin",
    "x",
    "reddit",
    "bluesky",
    "threads",
    "mastodon",
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-5 sm:gap-7 justify-items-center">
      {platforms.map((p, i) => (
        <PlatformIcon key={p} platform={p} index={i} />
      ))}
    </div>
  );
}

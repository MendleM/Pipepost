/** Core content audit logic — scans markdown for quality issues. */

// ── Types ────────────────────────────────────────────────────────────

export interface AuditIssue {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface ReadabilityStats {
  avg_sentence_length: number;
  avg_word_length: number;
  passive_voice_ratio: number;
}

export interface AuditResult {
  issues: AuditIssue[];
  word_count: number;
  reading_time_minutes: number;
  tag_suggestions: string[];
  readability: ReadabilityStats | null;
  structure_score: number | null;
  heading_hierarchy_ok: boolean | null;
}

// ── Helpers ──────────────────────────────────────────────────────────

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")     // code blocks
    .replace(/`[^`]*`/g, "")            // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[[^\]]*\]\([^)]*\)/g, (m) => m.replace(/\[([^\]]*)\]\([^)]*\)/, "$1")) // links → text
    .replace(/^#{1,6}\s+/gm, "")        // heading markers
    .replace(/[*_~]+/g, "")             // bold/italic/strike
    .replace(/^>\s+/gm, "")             // blockquotes
    .replace(/^[-*+]\s+/gm, "")         // unordered list markers
    .replace(/^\d+\.\s+/gm, "");        // ordered list markers
}

function countWords(text: string): number {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

function getParagraphs(md: string): string[] {
  // Split on double newlines, filter out headings and empty
  return md
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("#"));
}

function getHeadings(md: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  for (const line of md.split("\n")) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      headings.push({ level: match[1].length, text: match[2] });
    }
  }
  return headings;
}

const TECHNICAL_KEYWORDS = [
  "install",
  "run",
  "command",
  "api",
  "cli",
  "terminal",
  "npm",
  "yarn",
  "pip",
  "docker",
  "git",
  "bash",
  "shell",
  "sdk",
  "endpoint",
  "curl",
  "config",
  "deploy",
];

function isTechnicalContent(md: string): boolean {
  const lower = md.toLowerCase();
  return TECHNICAL_KEYWORDS.some((kw) => lower.includes(kw));
}

function hasCodeBlocks(md: string): boolean {
  return /```[\s\S]*?```/.test(md) || /^    \S/m.test(md);
}

function hasImages(md: string): boolean {
  return /!\[[^\]]*\]\([^)]*\)/.test(md);
}

function hasLinks(md: string): boolean {
  return /\[[^\]]*\]\([^)]*\)/.test(md) || /https?:\/\/\S+/.test(md);
}

function hasConclusionSection(md: string): boolean {
  const lower = md.toLowerCase();
  return /^#{1,3}\s+(conclusion|summary|wrap.?up|final.?thoughts|next.?steps|call.?to.?action|cta|takeaway)/m.test(lower);
}

// ── Passive voice heuristic ─────────────────────────────────────────

const PASSIVE_AUXILIARIES = /\b(was|were|been|being|is|are|am)\b/i;
// Common past participles (simplified — ends in -ed, -en, -t with aux)
const PAST_PARTICIPLE = /\b\w+(ed|en|wn|ht|lt|nt)\b/i;

function estimatePassiveRatio(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return 0;

  let passiveCount = 0;
  for (const sentence of sentences) {
    if (PASSIVE_AUXILIARIES.test(sentence) && PAST_PARTICIPLE.test(sentence)) {
      // Check if auxiliary comes before participle
      const auxMatch = sentence.match(PASSIVE_AUXILIARIES);
      const partMatch = sentence.match(PAST_PARTICIPLE);
      if (auxMatch && partMatch && auxMatch.index !== undefined && partMatch.index !== undefined) {
        if (auxMatch.index < partMatch.index) {
          passiveCount++;
        }
      }
    }
  }

  return Math.round((passiveCount / sentences.length) * 100) / 100;
}

// ── Readability ─────────────────────────────────────────────────────

function computeReadability(text: string): ReadabilityStats {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);

  const avg_sentence_length = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
  const totalChars = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, "").length, 0);
  const avg_word_length = words.length > 0 ? Math.round((totalChars / words.length) * 10) / 10 : 0;
  const passive_voice_ratio = estimatePassiveRatio(text);

  return { avg_sentence_length, avg_word_length, passive_voice_ratio };
}

// ── Structure score ─────────────────────────────────────────────────

function computeStructureScore(md: string, headings: { level: number; text: string }[]): number {
  let score = 0;
  const paragraphs = getParagraphs(md);

  // Has intro (content before first H2)
  const firstH2Index = md.indexOf("\n## ");
  if (firstH2Index > 0) {
    const beforeH2 = md.slice(0, firstH2Index).trim();
    const introWords = countWords(stripMarkdown(beforeH2));
    if (introWords > 20) score += 25;
  }

  // Has body with multiple sections
  const h2Count = headings.filter((h) => h.level === 2).length;
  if (h2Count >= 2) score += 25;
  else if (h2Count === 1) score += 10;

  // Has conclusion
  if (hasConclusionSection(md)) score += 25;

  // Reasonable paragraph count
  if (paragraphs.length >= 3) score += 25;
  else if (paragraphs.length >= 1) score += 10;

  return score;
}

// ── Tag suggestions ─────────────────────────────────────────────────

const TAG_KEYWORDS: Record<string, string[]> = {
  javascript: ["javascript", "js", "node", "npm", "typescript", "ts", "react", "vue", "angular", "deno", "bun"],
  python: ["python", "pip", "django", "flask", "fastapi", "pytorch"],
  devops: ["docker", "kubernetes", "k8s", "ci/cd", "github actions", "terraform", "deploy"],
  api: ["api", "rest", "graphql", "endpoint", "webhook", "sdk"],
  database: ["database", "sql", "postgres", "mysql", "mongodb", "redis", "sqlite"],
  tutorial: ["tutorial", "guide", "how to", "step by step", "walkthrough", "getting started"],
  webdev: ["html", "css", "frontend", "backend", "fullstack", "web"],
  ai: ["ai", "machine learning", "llm", "gpt", "claude", "openai", "neural", "ml"],
  security: ["security", "auth", "oauth", "jwt", "encryption", "vulnerability"],
  testing: ["test", "testing", "vitest", "jest", "cypress", "playwright", "tdd"],
};

function suggestTags(md: string): string[] {
  const lower = md.toLowerCase();
  const tags: string[] = [];

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 5);
}

// ── Main audit function ─────────────────────────────────────────────

/**
 * Run a content audit on markdown text.
 *
 * @param markdown - Raw markdown content to audit.
 * @param full     - If true, run the full (credits-required) analysis.
 * @returns Audit results with issues and optional extended analysis.
 */
export function auditContent(markdown: string, full: boolean): AuditResult {
  const issues: AuditIssue[] = [];
  const headings = getHeadings(markdown);
  const plainText = stripMarkdown(markdown);
  const wordCount = countWords(plainText);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // ── Basic checks (FREE) ──────────────────────────────────────────

  // Missing H1
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count === 0) {
    issues.push({ id: "missing-h1", severity: "error", message: "Missing title — no H1 heading found" });
  }

  // Very short content
  if (wordCount < 300) {
    issues.push({
      id: "short-content",
      severity: "warning",
      message: `Content is very short (${wordCount} words). Aim for at least 300 words.`,
    });
  }

  // No images/media
  if (!hasImages(markdown)) {
    issues.push({ id: "no-images", severity: "info", message: "No images found. Adding visuals improves engagement." });
  }

  // No links
  if (!hasLinks(markdown)) {
    issues.push({
      id: "no-links",
      severity: "warning",
      message: "No links found. Add internal or external links for SEO and credibility.",
    });
  }

  // Missing code blocks in technical content
  if (isTechnicalContent(markdown) && !hasCodeBlocks(markdown)) {
    issues.push({
      id: "missing-code-blocks",
      severity: "warning",
      message: "Technical content detected but no code blocks found. Add code examples.",
    });
  }

  // Duplicate consecutive paragraphs
  const paragraphs = getParagraphs(markdown);
  for (let i = 1; i < paragraphs.length; i++) {
    if (paragraphs[i] === paragraphs[i - 1]) {
      issues.push({
        id: "duplicate-paragraph",
        severity: "error",
        message: `Duplicate consecutive paragraph found: "${paragraphs[i].slice(0, 60)}..."`,
      });
      break; // only report once
    }
  }

  // Overly long paragraphs
  for (const p of paragraphs) {
    const pWords = countWords(p);
    if (pWords > 300) {
      issues.push({
        id: "long-paragraph",
        severity: "warning",
        message: `Paragraph with ${pWords} words is too long. Break it up for readability.`,
      });
      break; // only report once
    }
  }

  // Missing conclusion/CTA
  if (wordCount >= 300 && !hasConclusionSection(markdown)) {
    issues.push({
      id: "missing-conclusion",
      severity: "info",
      message: "No conclusion or CTA section found. Add one to guide readers on next steps.",
    });
  }

  // ── Full checks (credits required) ───────────────────────────────

  let readability: ReadabilityStats | null = null;
  let structureScore: number | null = null;
  let headingHierarchyOk: boolean | null = null;
  let tagSuggestions: string[] = [];

  if (full) {
    // Heading hierarchy
    headingHierarchyOk = true;
    for (let i = 1; i < headings.length; i++) {
      const gap = headings[i].level - headings[i - 1].level;
      if (gap > 1) {
        headingHierarchyOk = false;
        issues.push({
          id: "heading-hierarchy",
          severity: "warning",
          message: `Heading hierarchy skip: H${headings[i - 1].level} → H${headings[i].level} (missing H${headings[i - 1].level + 1})`,
        });
        break;
      }
    }

    // Readability
    readability = computeReadability(plainText);

    if (readability.passive_voice_ratio > 0.3) {
      issues.push({
        id: "high-passive-voice",
        severity: "warning",
        message: `High passive voice ratio (${Math.round(readability.passive_voice_ratio * 100)}%). Use active voice for clarity.`,
      });
    }

    if (readability.avg_sentence_length > 25) {
      issues.push({
        id: "long-sentences",
        severity: "info",
        message: `Average sentence length is ${readability.avg_sentence_length} words. Shorter sentences improve readability.`,
      });
    }

    // Structure score
    structureScore = computeStructureScore(markdown, headings);

    if (structureScore < 50) {
      issues.push({
        id: "weak-structure",
        severity: "warning",
        message: `Content structure score is ${structureScore}/100. Add clear intro, body sections, and conclusion.`,
      });
    }

    // Tag suggestions
    tagSuggestions = suggestTags(markdown);
  }

  return {
    issues,
    word_count: wordCount,
    reading_time_minutes: readingTime,
    tag_suggestions: tagSuggestions,
    readability,
    structure_score: structureScore,
    heading_hierarchy_ok: headingHierarchyOk,
  };
}

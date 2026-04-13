export interface SeoScore {
  score: number;
  readability: {
    flesch_kincaid: number;
    grade_level: string;
  };
  keyword_density: number;
  word_count: number;
  heading_structure: { h1: number; h2: number; h3: number };
  issues: string[];
  suggestions: string[];
}

function countWords(text: string): number {
  const cleaned = text.replace(/[#*_\[\]()>`~-]/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  let count = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .match(/[aeiouy]{1,2}/g)?.length ?? 1;
  return Math.max(1, count);
}

function fleschKincaid(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.replace(/[#*_\[\]()>`~-]/g, " ").split(/\s+/).filter(Boolean);
  if (sentences.length === 0 || words.length === 0) return 0;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const score =
    206.835 -
    1.015 * (words.length / sentences.length) -
    84.6 * (totalSyllables / words.length);
  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}

function gradeLevel(fk: number): string {
  if (fk >= 90) return "5th grade (very easy)";
  if (fk >= 80) return "6th grade (easy)";
  if (fk >= 70) return "7th grade (fairly easy)";
  if (fk >= 60) return "8th-9th grade (standard)";
  if (fk >= 50) return "10th-12th grade (fairly difficult)";
  if (fk >= 30) return "College (difficult)";
  return "College graduate (very difficult)";
}

function countHeadings(content: string): { h1: number; h2: number; h3: number } {
  const lines = content.split("\n");
  let h1 = 0, h2 = 0, h3 = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) h3++;
    else if (trimmed.startsWith("## ")) h2++;
    else if (trimmed.startsWith("# ")) h1++;
  }
  return { h1, h2, h3 };
}

function keywordDensity(content: string, keyword: string): number {
  const words = countWords(content);
  if (words === 0) return 0;
  const kwLower = keyword.toLowerCase();
  const contentLower = content.toLowerCase();
  const matches = contentLower.split(kwLower).length - 1;
  const kwWords = kwLower.split(/\s+/).length;
  return Math.round((matches * kwWords / words) * 100 * 10) / 10;
}

export function scoreContent(content: string, keyword: string): SeoScore {
  const words = countWords(content);
  const headings = countHeadings(content);
  const fk = fleschKincaid(content);
  const density = keywordDensity(content, keyword);
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (words === 0) {
    return {
      score: 0,
      readability: { flesch_kincaid: 0, grade_level: "N/A" },
      keyword_density: 0,
      word_count: 0,
      heading_structure: headings,
      issues: ["Content is empty"],
      suggestions: ["Add content to analyze"],
    };
  }

  // Word count checks
  if (words < 300) {
    issues.push(`Content is under 300 words (got ${words})`);
    suggestions.push("Aim for at least 800-1,500 words for SEO");
  } else if (words < 800) {
    suggestions.push("Consider expanding to 1,000+ words for better ranking potential");
  }

  // Heading checks
  if (headings.h1 === 0) {
    issues.push("Missing H1 heading");
  } else if (headings.h1 > 1) {
    issues.push(`Multiple H1 headings found (${headings.h1}) — use only one`);
  }

  if (headings.h2 === 0 && words > 300) {
    issues.push("No H2 subheadings — break content into sections");
  }

  // Keyword checks
  if (density === 0) {
    issues.push(`Target keyword "${keyword}" not found in content`);
  } else if (density > 3) {
    issues.push(`Keyword density too high (${density}%) — may be flagged as keyword stuffing`);
    suggestions.push("Aim for 1-2% keyword density");
  } else if (density < 0.5) {
    suggestions.push(`Low keyword density (${density}%) — consider adding "${keyword}" in key sections`);
  }

  // Check keyword in headings
  const kwLower = keyword.toLowerCase();
  const headingLines = content.split("\n").filter((l) => l.trim().startsWith("#"));
  const kwInHeading = headingLines.some((l) => l.toLowerCase().includes(kwLower));
  if (!kwInHeading && headingLines.length > 0) {
    issues.push(`Target keyword "${keyword}" not found in any heading`);
    suggestions.push("Include the target keyword in at least one heading");
  }

  // Calculate composite score
  let score = 50; // base

  // Word count contribution (0-20)
  if (words >= 1500) score += 20;
  else if (words >= 800) score += 15;
  else if (words >= 300) score += 8;
  else score -= 10;

  // Readability contribution (0-15)
  if (fk >= 50 && fk <= 80) score += 15; // sweet spot
  else if (fk >= 30) score += 8;

  // Keyword density contribution (0-15)
  if (density >= 0.5 && density <= 2.5) score += 15;
  else if (density > 0 && density < 3.5) score += 8;

  // Structure contribution (0-10)
  if (headings.h1 === 1) score += 5;
  if (headings.h2 >= 2) score += 5;

  // Penalty per issue
  score -= issues.length * 5;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    readability: { flesch_kincaid: fk, grade_level: gradeLevel(fk) },
    keyword_density: density,
    word_count: words,
    heading_structure: headings,
    issues,
    suggestions,
  };
}

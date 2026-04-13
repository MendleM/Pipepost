import type { ParsedContent } from "./types.js";

/**
 * Parse markdown content into structured components for repurposing.
 */
export function parseMarkdown(content: string): ParsedContent {
  const lines = content.split("\n");
  const headings: ParsedContent["headings"] = [];
  const paragraphs: string[] = [];
  const codeBlocks: string[] = [];
  const keyPoints: string[] = [];

  let inCodeBlock = false;
  let currentCodeBlock = "";
  let currentParagraph = "";

  for (const line of lines) {
    // Code block detection
    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        codeBlocks.push(currentCodeBlock.trim());
        currentCodeBlock = "";
        inCodeBlock = false;
      } else {
        // Flush any current paragraph before entering code block
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = "";
        }
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      currentCodeBlock += line + "\n";
      continue;
    }

    // Heading detection
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = "";
      }
      headings.push({
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    // Empty line = paragraph break
    if (!line.trim()) {
      if (currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = "";
      }
      continue;
    }

    // List items are potential key points
    const listMatch = line.match(/^[-*+]\s+(.+)$/);
    if (listMatch) {
      keyPoints.push(listMatch[1].trim());
    }

    // Numbered list items too
    const numListMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (numListMatch) {
      keyPoints.push(numListMatch[1].trim());
    }

    currentParagraph += (currentParagraph ? " " : "") + line.trim();
  }

  // Flush remaining paragraph
  if (currentParagraph.trim()) {
    paragraphs.push(currentParagraph.trim());
  }

  // If no explicit key points from lists, extract from headings and first sentences
  if (keyPoints.length === 0) {
    for (const heading of headings) {
      if (heading.level >= 2) {
        keyPoints.push(heading.text);
      }
    }
  }

  // Word count from all text content
  const allText = [...paragraphs, ...keyPoints, ...headings.map((h) => h.text)].join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 250));

  return {
    headings,
    paragraphs,
    codeBlocks,
    keyPoints,
    wordCount,
    readingTimeMinutes,
  };
}

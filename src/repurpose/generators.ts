import type {
  ParsedContent,
  TwitterThread,
  LinkedInPost,
  RedditPost,
  HackerNewsPost,
  BlueskyPost,
  NewsletterContent,
} from "./types.js";

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

function pickTopPoints(parsed: ParsedContent, count: number): string[] {
  // Prefer key points, fall back to paragraph first sentences
  const candidates = parsed.keyPoints.length > 0
    ? parsed.keyPoints
    : parsed.paragraphs.map((p) => {
        const firstSentence = p.match(/^[^.!?]+[.!?]/);
        return firstSentence ? firstSentence[0] : truncate(p, 120);
      });
  return candidates.slice(0, count);
}

/** Curated map of tech topics to hashtags for reliable extraction. */
const TECH_HASHTAG_MAP: Record<string, string[]> = {
  typescript: ["#TypeScript"],
  javascript: ["#JavaScript"],
  react: ["#ReactJS"],
  nextjs: ["#NextJS"],
  node: ["#NodeJS"],
  python: ["#Python"],
  rust: ["#Rust"],
  golang: ["#Golang"],
  docker: ["#Docker"],
  kubernetes: ["#Kubernetes"],
  api: ["#API", "#WebDev"],
  "rest api": ["#API", "#REST"],
  graphql: ["#GraphQL"],
  mcp: ["#MCP"],
  ai: ["#AI", "#MachineLearning"],
  "machine learning": ["#MachineLearning", "#AI"],
  llm: ["#LLM", "#AI"],
  devops: ["#DevOps"],
  frontend: ["#Frontend", "#WebDev"],
  backend: ["#Backend"],
  webdev: ["#WebDev"],
  opensource: ["#OpenSource"],
  "open source": ["#OpenSource"],
  cli: ["#CLI"],
  database: ["#Database"],
  sql: ["#SQL"],
  serverless: ["#Serverless"],
  testing: ["#Testing"],
  css: ["#CSS"],
  tailwind: ["#TailwindCSS"],
  vue: ["#VueJS"],
  angular: ["#Angular"],
  svelte: ["#Svelte"],
  aws: ["#AWS", "#Cloud"],
  azure: ["#Azure", "#Cloud"],
  gcp: ["#GCP", "#Cloud"],
  cloud: ["#Cloud"],
  security: ["#Security", "#InfoSec"],
  performance: ["#Performance", "#WebPerf"],
};

function inferHashtags(parsed: ParsedContent, title: string): string[] {
  const text = [title, ...parsed.headings.map((h) => h.text), ...parsed.paragraphs.slice(0, 3)].join(" ").toLowerCase();
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const [keyword, keywordTags] of Object.entries(TECH_HASHTAG_MAP)) {
    if (text.includes(keyword)) {
      for (const tag of keywordTags) {
        if (!seen.has(tag) && tags.length < 5) {
          seen.add(tag);
          tags.push(tag);
        }
      }
    }
  }

  // Always add dev tag if none found
  if (tags.length === 0) {
    tags.push("#Dev", "#Programming");
  }

  return tags;
}

/** Expanded subreddit map with more communities. */
const SUBREDDIT_MAP: Record<string, string> = {
  javascript: "r/javascript",
  typescript: "r/typescript",
  react: "r/reactjs",
  node: "r/node",
  python: "r/python",
  rust: "r/rust",
  golang: "r/golang",
  webdev: "r/webdev",
  "web dev": "r/webdev",
  frontend: "r/Frontend",
  devops: "r/devops",
  docker: "r/docker",
  kubernetes: "r/kubernetes",
  "machine learning": "r/MachineLearning",
  ai: "r/artificial",
  database: "r/Database",
  linux: "r/linux",
  "open source": "r/opensource",
  opensource: "r/opensource",
  startup: "r/startup",
  saas: "r/SaaS",
  "side project": "r/SideProject",
  cli: "r/commandline",
  "self host": "r/selfhosted",
  selfhost: "r/selfhosted",
  "self-host": "r/selfhosted",
  "indie": "r/IndieHackers",
  "learn": "r/learnprogramming",
  tutorial: "r/learnprogramming",
  "how to": "r/learnprogramming",
};

function inferSubreddits(parsed: ParsedContent, title: string): string[] {
  const text = [title, ...parsed.headings.map((h) => h.text), ...parsed.paragraphs.slice(0, 3)].join(" ").toLowerCase();
  const subreddits: string[] = ["r/programming"];

  for (const [keyword, sub] of Object.entries(SUBREDDIT_MAP)) {
    if (text.includes(keyword) && !subreddits.includes(sub)) {
      subreddits.push(sub);
    }
  }

  // Always include r/webdev for web-related content
  if (
    !subreddits.includes("r/webdev") &&
    (text.includes("web") || text.includes("html") || text.includes("css") || text.includes("frontend"))
  ) {
    subreddits.push("r/webdev");
  }

  // Always suggest r/SideProject for project launches
  if (detectProjectLaunch(title, parsed) && !subreddits.includes("r/SideProject")) {
    subreddits.push("r/SideProject");
  }

  return subreddits.slice(0, 6);
}

function detectProjectLaunch(title: string, parsed: ParsedContent): boolean {
  const text = [title, ...parsed.paragraphs.slice(0, 3)].join(" ").toLowerCase();
  const launchWords = ["built", "launched", "introducing", "announcing", "release", "open source", "side project", "i made", "i created", "show", "demo"];
  return launchWords.some((w) => text.includes(w));
}

/** Deterministic hook rotation based on content length. */
function pickHookIndex(parsed: ParsedContent): number {
  return parsed.wordCount % 3;
}

// --- Platform generators ---

/** Generate a Twitter/X thread from parsed article content. Multiple hook formulas, heading-based tweets. */
export function generateTwitterThread(
  title: string,
  parsed: ParsedContent,
  url?: string
): TwitterThread {
  const hashtags = inferHashtags(parsed, title);
  const topHashtags = hashtags.slice(0, 3).join(" ");
  const tweets: string[] = [];

  // Hook tweet: rotate between different formulas
  const hookIndex = pickHookIndex(parsed);
  const firstParagraph = parsed.paragraphs[0] ? truncate(parsed.paragraphs[0], 160) : title;
  let hook: string;

  switch (hookIndex) {
    case 0:
      // Question hook
      hook = `Ever wondered how to ${title.toLowerCase().replace(/^how to /i, "")}?\n\n${firstParagraph}\n\nA thread ${topHashtags}`;
      break;
    case 1:
      // Bold claim hook
      hook = `Most developers get this wrong.\n\n${truncate(title, 180)}\n\nHere's what I learned ${topHashtags}`;
      break;
    default:
      // Story hook
      hook = `${firstParagraph}\n\nA thread ${topHashtags}`;
      break;
  }
  tweets.push(truncate(hook, 280));

  // Body tweets: use headings as structure when available, fall back to key points
  const headingTexts = parsed.headings
    .filter((h) => h.level >= 2)
    .map((h) => h.text);

  const points = headingTexts.length >= 3
    ? headingTexts.slice(0, 7)
    : pickTopPoints(parsed, 7);

  const transitions = ["First,", "Next,", "Also,", "Then,", "Key insight:", "Important:", "Finally,"];

  for (let i = 0; i < points.length; i++) {
    const num = `${i + 2}/`;
    const transition = transitions[i % transitions.length];
    const pointHashtag = i === points.length - 1 ? "" : ` ${hashtags[i % hashtags.length] || ""}`;
    const body = truncate(`${num} ${transition} ${points[i]}${pointHashtag}`, 280);
    tweets.push(body);
  }

  // Final tweet with CTA
  const ctaLink = url ? `\n\nRead the full post: ${url}` : "";
  const ctaTweet = truncate(`${points.length + 2}/ If you found this useful, give it a retweet and follow for more.${ctaLink}\n\n${topHashtags}`, 280);
  tweets.push(ctaTweet);

  return { tweets };
}

/** Engagement question templates that rotate. */
const ENGAGEMENT_QUESTIONS = [
  "What's your experience with this? I'd love to hear your take.",
  "Have you tried a different approach? Drop it in the comments.",
  "What would you add to this list? Let me know below.",
];

/** Generate a LinkedIn post with hook line, takeaways, reading time, and engagement question. */
export function generateLinkedInPost(
  title: string,
  parsed: ParsedContent,
  url?: string
): LinkedInPost {
  const lines: string[] = [];

  // Hook line — under 210 characters (LinkedIn truncates at "see more")
  // Rotate between hook styles
  const hookIndex = pickHookIndex(parsed);
  let hookText: string;
  switch (hookIndex) {
    case 0:
      hookText = parsed.paragraphs[0]
        ? truncate(parsed.paragraphs[0], 205)
        : truncate(title, 205);
      break;
    case 1:
      hookText = truncate(`I just published: ${title}`, 205);
      break;
    default:
      hookText = truncate(`${title} — here's what I learned.`, 205);
      break;
  }

  lines.push(hookText);
  lines.push("");

  // Aggressive line breaks for algorithm
  lines.push("Here's what I learned:");
  lines.push("");

  // Key takeaways — blank line after each for aggressive spacing
  const points = pickTopPoints(parsed, 5);
  for (const point of points) {
    lines.push(`-> ${truncate(point, 200)}`);
    lines.push("");
  }

  // Reading time context
  lines.push(`(${parsed.readingTimeMinutes} min read)`);
  lines.push("");

  // Engagement question — rotate
  const question = ENGAGEMENT_QUESTIONS[pickHookIndex(parsed)];
  lines.push(question);
  lines.push("");

  // Link
  if (url) {
    lines.push(`Full post: ${url}`);
    lines.push("");
  }

  // Hashtags — curated map instead of word frequency
  const hashtags = inferHashtags(parsed, title);
  lines.push(hashtags.join(" "));

  return { content: lines.join("\n") };
}

/** Generate a Reddit post body with key takeaways, code snippets, and suggested subreddits. */
export function generateRedditPost(
  title: string,
  parsed: ParsedContent,
  url?: string
): RedditPost {
  const bodyLines: string[] = [];

  // Lead with the problem
  if (parsed.paragraphs.length > 0) {
    bodyLines.push(parsed.paragraphs[0]);
    bodyLines.push("");
  }

  // Key points as value
  const points = pickTopPoints(parsed, 5);
  if (points.length > 0) {
    bodyLines.push("**Key takeaways:**");
    bodyLines.push("");
    for (const point of points) {
      bodyLines.push(`- ${point}`);
    }
    bodyLines.push("");
  }

  // Include best code snippet — prefer short, self-contained examples
  if (parsed.codeBlocks.length > 0) {
    // Pick the shortest code block that's still meaningful (>20 chars, <300 chars preferred)
    const ranked = [...parsed.codeBlocks]
      .filter((block) => block.trim().length > 20)
      .sort((a, b) => {
        // Prefer blocks between 50-300 chars (self-contained examples)
        const scoreA = a.length <= 300 ? 1000 - a.length : -(a.length - 300);
        const scoreB = b.length <= 300 ? 1000 - b.length : -(b.length - 300);
        return scoreB - scoreA;
      });

    const bestBlock = ranked[0] ?? parsed.codeBlocks[0];
    bodyLines.push("**Example:**");
    bodyLines.push("");
    bodyLines.push("```");
    bodyLines.push(truncate(bestBlock, 500));
    bodyLines.push("```");
    bodyLines.push("");
  }

  if (url) {
    bodyLines.push(`Full write-up: ${url}`);
    bodyLines.push("");
  }

  bodyLines.push("Happy to answer questions or hear your thoughts.");

  // Reddit title: no clickbait, direct
  const redditTitle = title.replace(/!+$/, "").trim();

  return {
    title: redditTitle,
    body: bodyLines.join("\n"),
    suggestedSubreddits: inferSubreddits(parsed, title),
  };
}

/** Generate a Hacker News title. Auto-detects project launches for "Show HN:" prefix. */
export function generateHackerNewsPost(
  title: string,
  parsed: ParsedContent
): HackerNewsPost {
  const isProjectLaunch = detectProjectLaunch(title, parsed);

  // HN title: factual, under 80 chars, no clickbait
  let hnTitle = title.replace(/!+$/, "").replace(/\?$/, "").trim();
  if (isProjectLaunch && !hnTitle.toLowerCase().startsWith("show hn")) {
    hnTitle = `Show HN: ${hnTitle}`;
  }
  hnTitle = truncate(hnTitle, 80);

  return {
    title: hnTitle,
    suggestShowHN: isProjectLaunch,
    bestTimeToPost: "Weekday mornings (9-11am ET) tend to get the most visibility on HN",
  };
}

/** Generate a Bluesky post (max 300 chars). */
export function generateBlueskyPost(
  title: string,
  parsed: ParsedContent,
  url?: string
): BlueskyPost {
  // Single post under 300 chars
  const summary = parsed.paragraphs[0]
    ? truncate(parsed.paragraphs[0], 150)
    : title;

  const link = url ? `\n\n${url}` : "";
  const content = truncate(`${summary}${link}`, 300);

  return { content };
}

/** Generate newsletter-style email content with personal intro and key takeaways. */
export function generateNewsletter(
  title: string,
  parsed: ParsedContent,
  url?: string
): NewsletterContent {
  const lines: string[] = [];

  // Personal intro
  lines.push(`I just published something I've been working on: "${title}".`);
  lines.push("");

  // Context from the article
  if (parsed.paragraphs.length > 0) {
    lines.push(truncate(parsed.paragraphs[0], 300));
    lines.push("");
  }

  // Key takeaways
  const points = pickTopPoints(parsed, 5);
  if (points.length > 0) {
    lines.push("Key takeaways:");
    lines.push("");
    for (const point of points) {
      lines.push(`  - ${truncate(point, 200)}`);
    }
    lines.push("");
  }

  // Reading time
  lines.push(`It's a ${parsed.readingTimeMinutes} minute read.`);
  lines.push("");

  // CTA
  if (url) {
    lines.push(`Read the full post here: ${url}`);
    lines.push("");
  }

  // PS line
  lines.push("P.S. Hit reply and let me know what you think — I read every response.");

  return { content: lines.join("\n") };
}

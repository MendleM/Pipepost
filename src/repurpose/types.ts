/** Platforms supported by the repurpose engine. */
export type RepurposePlatform =
  | "twitter"
  | "linkedin"
  | "reddit"
  | "hackernews"
  | "bluesky"
  | "newsletter";

/** Input to the repurpose engine. */
export interface RepurposeInput {
  content: string;
  title: string;
  url?: string;
  platforms: RepurposePlatform[];
}

/** Structured representation of a parsed markdown article. */
export interface ParsedContent {
  headings: { level: number; text: string }[];
  paragraphs: string[];
  codeBlocks: string[];
  keyPoints: string[];
  wordCount: number;
  readingTimeMinutes: number;
}

/** A generated Twitter/X thread as an array of tweet strings. */
export interface TwitterThread {
  tweets: string[];
}

/** A generated LinkedIn post. */
export interface LinkedInPost {
  content: string;
}

/** A generated Reddit post with title, body, and suggested subreddits. */
export interface RedditPost {
  title: string;
  body: string;
  suggestedSubreddits: string[];
}

/** A generated Hacker News submission with Show HN detection. */
export interface HackerNewsPost {
  title: string;
  suggestShowHN: boolean;
  bestTimeToPost: string;
}

/** A generated Bluesky post (max 300 chars). */
export interface BlueskyPost {
  content: string;
}

/** A generated newsletter email body. */
export interface NewsletterContent {
  content: string;
}

/** One platform's repurposed output. */
export interface RepurposeResult {
  platform: RepurposePlatform;
  content: TwitterThread | LinkedInPost | RedditPost | HackerNewsPost | BlueskyPost | NewsletterContent;
}

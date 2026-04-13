/**
 * Markdown response formatters for every MCP tool.
 *
 * Each tool handler continues to return structured ToolResult data.
 * These formatters are called only in index.ts to produce Markdown
 * for the MCP client, keeping the presentation layer separate from
 * business logic and tests.
 */

import { isToolError, type ToolResult, type ToolError } from "./errors.js";
import {
  successHeader,
  errorHeader,
  field,
  table,
  section,
  statBar,
  divider,
  note,
  checklist,
} from "./format.js";

// ── Error formatting ────────────────────────────────────────────────

function formatError(toolName: string, result: ToolError): string {
  const lines = [
    errorHeader(`${toolName} failed`),
    "",
    field("Error", result.error.message),
    field("Code", `\`${result.error.code}\``),
  ];

  if (result.error.retryable) {
    lines.push("", note("This error may be temporary. Try again in a moment."));
  }

  if (result.error.code === "AUTH_FAILED") {
    lines.push(
      "",
      section(
        "Troubleshooting",
        '1. Run the `setup` tool to configure your API credentials\n2. Verify the credentials are valid on the platform\'s website'
      )
    );
  } else if (result.error.code === "PUBLISH_LIMIT") {
    lines.push(
      "",
      section(
        "Next Steps",
        "Purchase credits at [pipepost.dev](https://pipepost.dev) or wait for your monthly free credits to reset."
      )
    );
  } else if (result.error.code === "RATE_LIMITED") {
    lines.push(
      "",
      note("The platform is rate-limiting requests. Wait a few minutes and try again.")
    );
  }

  lines.push("", `*Pipepost v0.4.0 \u00b7 [Docs](https://pipepost.dev/tools)*`);
  return lines.join("\n");
}

// ── Generic formatter ───────────────────────────────────────────────

/** Format any ToolResult through an optional per-tool formatter, falling back to JSON. */
export function formatToolResponse(
  toolName: string,
  result: ToolResult,
  formatter?: (data: unknown) => string
): string {
  if (isToolError(result)) {
    return formatError(toolName, result);
  }
  if (formatter) {
    return formatter(result.data);
  }
  return typeof result.data === "string"
    ? result.data
    : JSON.stringify(result.data, null, 2);
}

// ── Publish ─────────────────────────────────────────────────────────

function platformLabel(p: string): string {
  const map: Record<string, string> = {
    devto: "Dev.to",
    ghost: "Ghost",
    hashnode: "Hashnode",
    wordpress: "WordPress",
    medium: "Medium",
  };
  return map[p] ?? p;
}

export function formatPublish(data: unknown): string {
  const d = data as Record<string, unknown>;
  const lines = [successHeader(`Published to ${platformLabel(d.platform as string ?? "")}`)];
  if (d.url) lines.push("", field("URL", String(d.url)));
  if (d.id) lines.push(field("Post ID", String(d.id)));
  if (d.platform) lines.push(field("Platform", platformLabel(String(d.platform))));
  if (d.note) lines.push("", note(String(d.note)));
  return lines.join("\n");
}

export function formatCrossPublish(data: unknown): string {
  const d = data as { summary: string; results: Array<{ platform: string; success: boolean; url?: string; error?: string }> };
  const succeeded = d.results.filter((r) => r.success).length;
  const lines = [
    successHeader(`Cross-published to ${succeeded} platform${succeeded !== 1 ? "s" : ""}`),
    "",
    table(
      ["Platform", "Status", "URL"],
      d.results.map((r) => [
        platformLabel(r.platform),
        r.success ? "\u2714 Published" : "\u2718 Failed",
        r.success ? (r.url ?? "\u2014") : (r.error ?? "Unknown error"),
      ])
    ),
  ];
  if (d.results.some((r) => !r.success)) {
    lines.push("", note("Failed platforms can be retried individually with the `publish` tool."));
  }
  return lines.join("\n");
}

export function formatListPosts(data: unknown): string {
  const d = data as { posts: Array<{ title: string; slug?: string; url?: string; published_at?: string; status?: string }> };
  const posts = d.posts ?? [];

  if (posts.length === 0) {
    return [successHeader("Posts"), "", "No posts found."].join("\n");
  }

  const published = posts.filter((p) => p.status === "published").length;
  const draft = posts.length - published;

  const rows = posts.map((p, i) => [
    String(i + 1),
    p.title,
    p.status ?? "\u2014",
    p.published_at ? formatDate(p.published_at) : "\u2014",
  ]);

  const lines = [
    `# Posts`,
    "",
    table(["#", "Title", "Status", "Published"], rows),
    "",
    field("Total", `${posts.length} posts (${published} published, ${draft} draft)`),
  ];
  return lines.join("\n");
}

// ── SEO ─────────────────────────────────────────────────────────────

export function formatSeoScore(data: unknown): string {
  const d = data as {
    score: number;
    readability: { flesch_kincaid: number; grade_level: string };
    keyword_density: number;
    word_count: number;
    heading_structure?: { h1: number; h2: number; h3: number };
    issues?: string[];
    suggestions?: string[];
    note?: string;
  };

  const readTime = Math.max(1, Math.ceil(d.word_count / 200));
  const lines = [
    `# SEO Score: ${d.score}/100`,
    "",
    statBar(d.score, 100),
    "",
    section(
      "Breakdown",
      table(
        ["Category", "Details"],
        [
          ["Readability", `${d.readability.grade_level} (Flesch-Kincaid ${d.readability.flesch_kincaid})`],
          ["Keywords", `Density: ${d.keyword_density}%`],
          ...(d.heading_structure
            ? [["Structure" as string | number, `H1: ${d.heading_structure.h1} \u00b7 H2: ${d.heading_structure.h2} \u00b7 H3: ${d.heading_structure.h3}` as string | number]]
            : []),
          ["Word Count", `${d.word_count.toLocaleString()} words (${readTime} min read)`],
        ]
      )
    ),
  ];

  if (d.issues && d.issues.length > 0) {
    lines.push(
      "",
      section("Issues", d.issues.map((i) => `\u2718 ${i}`).join("\n"))
    );
  }

  if (d.suggestions && d.suggestions.length > 0) {
    lines.push(
      "",
      section("Suggestions", d.suggestions.map((s) => `\u2192 ${s}`).join("\n"))
    );
  }

  if (d.note) {
    lines.push("", note(d.note));
  }

  return lines.join("\n");
}

export function formatSeoMeta(data: unknown): string {
  const d = data as {
    meta_title: string;
    meta_description: string;
    og_title: string;
    og_description: string;
    twitter_card: string;
  };

  return [
    successHeader("Meta Tags Generated"),
    "",
    field("Title", `(${d.meta_title.length} chars): ${d.meta_title}`),
    field("Description", `(${d.meta_description.length} chars): ${d.meta_description}`),
    "",
    section(
      "Open Graph",
      [
        field("og:title", d.og_title),
        field("og:description", d.og_description),
        field("twitter:card", d.twitter_card),
      ].join("\n")
    ),
    "",
    note("Paste these into your page's `<head>` section."),
  ].join("\n");
}

export function formatSeoSchema(data: unknown): string {
  const d = data as { json_ld: string };
  const parsed = JSON.parse(d.json_ld);
  const type = (parsed["@type"] as string) ?? "Schema";
  const fieldCount = Object.keys(parsed).length;

  return [
    successHeader(`${type} Schema Generated`),
    "",
    field("Type", type),
    field("Fields", `${fieldCount} properties`),
    "",
    "```json",
    d.json_ld,
    "```",
    "",
    note("Add this inside a `<script type=\"application/ld+json\">` tag. [Validate](https://validator.schema.org/)"),
  ].join("\n");
}

export function formatIndexNow(data: unknown): string {
  const d = data as {
    urls_submitted: number;
    engines_notified: string[];
    errors?: string[];
  };

  const lines = [
    successHeader("URLs Submitted for Indexing"),
    "",
    field("URLs submitted", d.urls_submitted),
    field("Engines notified", d.engines_notified.join(", ")),
  ];

  if (d.errors && d.errors.length > 0) {
    lines.push(
      "",
      section("Errors", d.errors.map((e) => `\u2718 ${e}`).join("\n"))
    );
  }

  lines.push("", note("Search engines typically crawl submitted URLs within 24\u201348 hours."));
  return lines.join("\n");
}

// ── Images ──────────────────────────────────────────────────────────

export function formatCoverImage(data: unknown): string {
  const d = data as {
    query: string;
    orientation: string;
    total_available: number;
    results: Array<{
      id: string;
      description: string;
      urls: { regular: string; small: string };
      attribution: { photographer: string; profile_url: string; text: string };
    }>;
  };

  const lines = [
    successHeader("Cover Images Found"),
    "",
    field("Query", `"${d.query}"`),
    field("Results", `${d.results.length} of ${d.total_available.toLocaleString()}+`),
  ];

  for (let i = 0; i < d.results.length; i++) {
    const photo = d.results[i];
    lines.push(
      "",
      `### ${i + 1}. ${photo.description || "Untitled"}`,
      `![](${photo.urls.small})`,
      `\ud83d\udcf7 Photo by ${photo.attribution.photographer} on [Unsplash](${photo.attribution.profile_url})`,
      `\`${photo.urls.regular}\``
    );
  }

  lines.push("", note("Use the full-size URL in your frontmatter's `featured_image` field."));
  return lines.join("\n");
}

// ── Analytics ───────────────────────────────────────────────────────

export function formatAnalytics(data: unknown): string {
  const d = data as {
    platforms: Array<{
      platform: string;
      posts: Array<{
        title: string;
        url: string;
        views?: number;
        reactions?: number;
        comments?: number;
        published_at?: string;
        status?: string;
      }>;
      note?: string;
    }>;
    summary: { total_posts: number; total_views: number; total_reactions: number };
  };

  const lines = [
    "# Analytics Overview",
    "",
    section(
      "Summary",
      [
        field("Total posts", `${d.summary.total_posts} across ${d.platforms.length} platform${d.platforms.length !== 1 ? "s" : ""}`),
        field("Total views", d.summary.total_views.toLocaleString()),
        field("Total reactions", d.summary.total_reactions.toLocaleString()),
      ].join("\n")
    ),
  ];

  for (const plat of d.platforms) {
    const label = platformLabel(plat.platform);
    if (plat.note) {
      lines.push("", section(label, note(plat.note)));
      continue;
    }
    if (plat.posts.length === 0) {
      lines.push("", section(label, "No posts found."));
      continue;
    }

    const hasViews = plat.posts.some((p) => p.views !== undefined);
    const hasReactions = plat.posts.some((p) => p.reactions !== undefined);
    const hasComments = plat.posts.some((p) => p.comments !== undefined);

    const headers = ["Title"];
    if (hasViews) headers.push("Views");
    if (hasReactions) headers.push("Reactions");
    if (hasComments) headers.push("Comments");
    if (!hasViews && !hasReactions && !hasComments) {
      headers.push("Status", "Published");
    }

    const rows = plat.posts.map((p) => {
      const row: (string | number)[] = [p.title];
      if (hasViews) row.push(p.views?.toLocaleString() ?? "\u2014");
      if (hasReactions) row.push(p.reactions?.toLocaleString() ?? "\u2014");
      if (hasComments) row.push(p.comments?.toLocaleString() ?? "\u2014");
      if (!hasViews && !hasReactions && !hasComments) {
        row.push(p.status ?? "\u2014");
        row.push(p.published_at ? formatDate(p.published_at) : "\u2014");
      }
      return row;
    });

    lines.push("", section(label, table(headers, rows)));
  }

  return lines.join("\n");
}

// ── Repurpose ───────────────────────────────────────────────────────

export function formatRepurpose(data: unknown): string {
  const d = data as {
    platforms_generated: number;
    results: Array<{
      platform: string;
      content: Record<string, unknown>;
    }>;
  };

  const lines = [successHeader(`Repurposed for ${d.platforms_generated} platform${d.platforms_generated !== 1 ? "s" : ""}`)];

  for (const result of d.results) {
    lines.push("", divider(), "");

    switch (result.platform) {
      case "twitter": {
        const tweets = (result.content as { tweets: string[] }).tweets;
        lines.push(`## Twitter/X Thread (${tweets.length} tweets)`);
        for (let i = 0; i < tweets.length; i++) {
          lines.push("", `**${i + 1}/${tweets.length}** ${tweets[i]}`);
        }
        break;
      }
      case "linkedin": {
        const content = (result.content as { content: string }).content;
        lines.push("## LinkedIn", "", content);
        break;
      }
      case "reddit": {
        const r = result.content as { title: string; body: string; suggestedSubreddits: string[] };
        lines.push(
          "## Reddit",
          "",
          field("Title", r.title),
          "",
          "**Body:**",
          "",
          r.body,
          "",
          field("Suggested subreddits", r.suggestedSubreddits.map((s) => `r/${s}`).join(", "))
        );
        break;
      }
      case "hackernews": {
        const hn = result.content as { title: string; suggestShowHN: boolean; bestTimeToPost: string };
        lines.push(
          "## Hacker News",
          "",
          field("Title", hn.title),
          field("Show HN", hn.suggestShowHN ? "Yes" : "No"),
          field("Best time to post", hn.bestTimeToPost)
        );
        break;
      }
      case "bluesky": {
        const content = (result.content as { content: string }).content;
        lines.push("## Bluesky", "", content, "", field("Characters", `${content.length}/300`));
        break;
      }
      case "newsletter": {
        const content = (result.content as { content: string }).content;
        lines.push("## Newsletter", "", content);
        break;
      }
      default:
        lines.push(`## ${result.platform}`, "", JSON.stringify(result.content, null, 2));
    }
  }

  return lines.join("\n");
}

// ── Frontmatter ─────────────────────────────────────────────────────

export function formatFrontmatter(data: unknown): string {
  const d = data as {
    frontmatter: string;
    meta: {
      description: string;
      reading_time_minutes: number;
      slug: string;
      tags: string[];
      word_count: number;
    };
  };

  // Detect format type from frontmatter content
  const isJson = d.frontmatter.startsWith("{") || d.frontmatter.startsWith("export ");
  const lang = isJson ? "ts" : "yaml";

  const lines = [
    successHeader("Frontmatter Generated"),
    "",
    `\`\`\`${lang}`,
    d.frontmatter,
    "```",
    "",
    section(
      "Extracted Metadata",
      [
        field("Reading time", `${d.meta.reading_time_minutes} min`),
        field("Word count", d.meta.word_count.toLocaleString()),
        field("Slug", d.meta.slug),
        field("Tags", d.meta.tags.join(", ")),
      ].join("\n")
    ),
  ];

  return lines.join("\n");
}

// ── Social ──────────────────────────────────────────────────────────

export function formatSocialPosts(data: unknown): string {
  const d = data as {
    posts: Array<{
      platform: string;
      content: string;
      char_count: number;
    }>;
  };

  const charLimits: Record<string, number> = {
    twitter: 280,
    bluesky: 300,
    linkedin: 1300,
    reddit: 40000,
  };

  const lines = [successHeader("Social Posts Generated")];

  for (const post of d.posts) {
    const limit = charLimits[post.platform] ?? post.char_count;
    lines.push(
      "",
      `## ${platformLabel(post.platform) || post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}`,
      "",
      post.content,
      "",
      field("Characters", `${post.char_count}/${limit}`)
    );
  }

  return lines.join("\n");
}

// ── Setup ───────────────────────────────────────────────────────────

export function formatSetup(data: unknown): string {
  const d = data as { message: string; platform: string };
  return [
    successHeader(`${platformLabel(d.platform)} Configured`),
    "",
    "API key saved to `~/.pipepost/config.json`",
    "",
    note(`Try it: ask Claude to "list my ${platformLabel(d.platform)} posts" to verify the connection.`),
  ].join("\n");
}

export function formatStatus(data: unknown): string {
  const d = data as {
    credits: { purchased: number; free_remaining: number; total: number };
    platforms_configured: string[];
    social_configured: string[];
    license_status: string;
  };

  const allPlatforms = ["devto", "ghost", "hashnode", "wordpress", "medium", "unsplash"];
  const configured = new Set(d.platforms_configured);

  const platformChecklist = allPlatforms.map((p) => ({
    label: platformLabel(p),
    ok: configured.has(p),
  }));

  return [
    "# Pipepost Status",
    "",
    field("Version", "0.4.0"),
    field("License", d.license_status),
    "",
    section(
      "Credits",
      [
        field("Purchased", d.credits.purchased),
        field("Free this month", d.credits.free_remaining),
        field("Total available", d.credits.total),
      ].join("\n")
    ),
    "",
    section("Platforms", checklist(platformChecklist)),
  ].join("\n");
}

export function formatActivate(data: unknown): string {
  const d = data as { activated: boolean; instance_id: string; credits_added: number };
  return [
    successHeader("License Activated"),
    "",
    field("Credits added", d.credits_added),
    field("Instance ID", d.instance_id),
    "",
    note("Credits never expire. Free credits reset monthly."),
  ].join("\n");
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

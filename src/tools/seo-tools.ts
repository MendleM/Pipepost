import * as crypto from "node:crypto";
import { z } from "zod";
import { scoreContent } from "../seo/score.js";
import { generateMeta } from "../seo/meta.js";
import { generateSchema } from "../seo/schema.js";
import { readConfig, writeConfig } from "../config.js";
import { hasCredits } from "../credits.js";
import { httpRequest } from "../http.js";
import { makeError, makeSuccess } from "../errors.js";
import { validateRequired } from "../validate.js";

/** Zod schema for the `seo_score` tool input. */
export const seoScoreSchema = z.object({
  content: z.string().describe("The markdown content to analyze"),
  keyword: z.string().describe("The target keyword or phrase"),
});

/**
 * Score content for SEO quality. Free users get a reduced result (no issues/suggestions).
 */
export async function handleSeoScore(input: z.infer<typeof seoScoreSchema>) {
  const contentErr = validateRequired(input.content, "content");
  if (contentErr) return makeError("VALIDATION_ERROR", contentErr);

  const keywordErr = validateRequired(input.keyword, "keyword");
  if (keywordErr) return makeError("VALIDATION_ERROR", keywordErr);

  const result = scoreContent(input.content, input.keyword);

  if (!hasCredits()) {
    return makeSuccess({
      score: result.score,
      readability: result.readability,
      keyword_density: result.keyword_density,
      word_count: result.word_count,
      note: "Purchase credits at pipepost.dev to unlock full SEO analysis with issues and suggestions",
    });
  }

  return makeSuccess(result);
}

/** Zod schema for the `seo_meta` tool input. */
export const seoMetaSchema = z.object({
  title: z.string().describe("The article title"),
  content: z.string().describe("The article content"),
  keyword: z.string().optional().describe("Optional target keyword"),
});

/** Generate meta tags (title, description, OG, Twitter Card) for an article. Requires credits. */
export async function handleSeoMeta(input: z.infer<typeof seoMetaSchema>) {
  if (!hasCredits()) return makeError("PUBLISH_LIMIT", "Purchase credits at pipepost.dev to use this tool");

  const titleErr = validateRequired(input.title, "title");
  if (titleErr) return makeError("VALIDATION_ERROR", titleErr);

  return makeSuccess(generateMeta(input.title, input.content, input.keyword));
}

const articleDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string(),
  date_published: z.string(),
  author_name: z.string(),
  image_url: z.string().optional(),
});

const faqDataSchema = z.object({
  questions: z.array(z.object({ question: z.string(), answer: z.string() })),
});

const howToDataSchema = z.object({
  name: z.string(),
  steps: z.array(z.object({ name: z.string(), text: z.string() })),
});

/** Zod schema for the `seo_schema` tool input. */
export const seoSchemaInput = z.object({
  type: z.enum(["article", "faq", "howto"]).describe("Schema type"),
  data: z.record(z.unknown()).describe("Schema data (varies by type)"),
});

/** Generate JSON-LD structured data (Article, FAQ, or HowTo). Requires credits. */
export async function handleSeoSchema(input: z.infer<typeof seoSchemaInput>) {
  if (!hasCredits()) return makeError("PUBLISH_LIMIT", "Purchase credits at pipepost.dev to use this tool");

  let validatedData;
  switch (input.type) {
    case "article":
      validatedData = articleDataSchema.parse(input.data);
      break;
    case "faq":
      validatedData = faqDataSchema.parse(input.data);
      break;
    case "howto":
      validatedData = howToDataSchema.parse(input.data);
      break;
  }

  return makeSuccess(generateSchema(input.type, validatedData));
}

// IndexNow tool

/** Zod schema for the `indexnow` tool input. */
export const indexNowSchema = z.object({
  url: z.string().describe("The URL to submit for indexing"),
  urls: z
    .array(z.string())
    .max(10)
    .optional()
    .describe("Batch of URLs to submit (max 10)"),
});

function getOrCreateIndexNowKey(): string {
  const config = readConfig();
  if (config.indexnow_key) return config.indexnow_key;

  const key = crypto.randomBytes(16).toString("hex");
  writeConfig({ indexnow_key: key });
  return key;
}

/**
 * Submit URLs to search engines via the IndexNow protocol.
 *
 * Auto-generates and persists a verification key on first use.
 * Notifies both the IndexNow API and Bing.
 */
export async function handleIndexNow(input: z.infer<typeof indexNowSchema>) {
  const urlErr = validateRequired(input.url, "url");
  if (urlErr) return makeError("VALIDATION_ERROR", urlErr);

  // Build URL list — primary url + optional batch
  const urlList = [input.url, ...(input.urls ?? [])];

  // Extract host from the first URL
  let host: string;
  try {
    host = new URL(input.url).host;
  } catch {
    return makeError("VALIDATION_ERROR", `Invalid URL: ${input.url}`);
  }

  const key = getOrCreateIndexNowKey();

  const payload = {
    host,
    key,
    urlList,
  };

  const engines = ["https://api.indexnow.org/indexnow", "https://www.bing.com/indexnow"];
  const notified: string[] = [];
  const errors: string[] = [];

  for (const engine of engines) {
    const result = await httpRequest(engine, {
      method: "POST",
      body: payload,
    });

    const name = engine.includes("bing") ? "Bing" : "IndexNow";
    if (result.success) {
      notified.push(name);
    } else {
      errors.push(`${name}: ${result.error.message}`);
    }
  }

  return makeSuccess({
    urls_submitted: urlList.length,
    engines_notified: notified,
    ...(errors.length > 0 && { errors }),
  });
}

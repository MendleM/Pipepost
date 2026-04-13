import { z } from "zod";
import { scoreContent } from "../seo/score.js";
import { generateMeta } from "../seo/meta.js";
import { generateSchema } from "../seo/schema.js";
import { checkTier } from "../tier.js";
import { makeError, makeSuccess } from "../errors.js";
import { validateRequired } from "../validate.js";

export const seoScoreSchema = z.object({
  content: z.string().describe("The markdown content to analyze"),
  keyword: z.string().describe("The target keyword or phrase"),
});

export async function handleSeoScore(input: z.infer<typeof seoScoreSchema>) {
  const contentErr = validateRequired(input.content, "content");
  if (contentErr) return makeError("VALIDATION_ERROR", contentErr);

  const keywordErr = validateRequired(input.keyword, "keyword");
  if (keywordErr) return makeError("VALIDATION_ERROR", keywordErr);

  const tier = await checkTier();
  const result = scoreContent(input.content, input.keyword);

  if (tier === "free") {
    return makeSuccess({
      score: result.score,
      readability: result.readability,
      keyword_density: result.keyword_density,
      word_count: result.word_count,
      note: "Upgrade to Pro for full heading analysis, issues, and suggestions",
    });
  }

  return makeSuccess(result);
}

export const seoMetaSchema = z.object({
  title: z.string().describe("The article title"),
  content: z.string().describe("The article content"),
  keyword: z.string().optional().describe("Optional target keyword"),
});

export async function handleSeoMeta(input: z.infer<typeof seoMetaSchema>) {
  const tier = await checkTier();
  if (tier !== "pro") return makeError("TIER_REQUIRED", "Meta tag generation requires Pro tier");

  const titleErr = validateRequired(input.title, "title");
  if (titleErr) return makeError("VALIDATION_ERROR", titleErr);

  return makeSuccess(generateMeta(input.title, input.content, input.keyword));
}

export const seoSchemaInput = z.object({
  type: z.enum(["article", "faq", "howto"]).describe("Schema type"),
  data: z.record(z.unknown()).describe("Schema data (varies by type)"),
});

export async function handleSeoSchema(input: z.infer<typeof seoSchemaInput>) {
  const tier = await checkTier();
  if (tier !== "pro") return makeError("TIER_REQUIRED", "Schema generation requires Pro tier");

  return makeSuccess(generateSchema(input.type, input.data as never));
}

import { z } from "zod";
import { checkLinks } from "../audit/links.js";
import { makeError, makeSuccess } from "../errors.js";
import { validateRequired } from "../validate.js";

/** Zod schema for the `check_links` tool input. */
export const checkLinksSchema = z.object({
  content: z.string().describe("The markdown content containing URLs to check"),
});

/**
 * Validate all URLs found in markdown content. FREE tool.
 * Makes HEAD requests to each URL and reports broken/redirected links.
 */
export async function handleCheckLinks(input: z.infer<typeof checkLinksSchema>) {
  const contentErr = validateRequired(input.content, "content");
  if (contentErr) return makeError("VALIDATION_ERROR", contentErr);

  const result = await checkLinks(input.content);
  return makeSuccess(result);
}

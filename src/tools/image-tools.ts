import { z } from "zod";
import { readConfig } from "../config.js";
import { httpRequest } from "../http.js";
import { makeError, makeSuccess } from "../errors.js";
import { validateRequired } from "../validate.js";

/** Zod schema for the `cover_image` tool input. */
export const coverImageSchema = z.object({
  query: z.string().describe("Search terms for the image"),
  orientation: z
    .enum(["landscape", "portrait", "squarish"])
    .optional()
    .describe("Image orientation (default: landscape)"),
  count: z
    .number()
    .min(1)
    .max(5)
    .optional()
    .describe("Number of results 1-5 (default: 3)"),
});

interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: { regular: string; small: string };
  user: { name: string; links: { html: string } };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
}

/**
 * Search Unsplash for cover images matching a query.
 *
 * Requires an Unsplash API key configured via the `setup` tool.
 * Returns photo URLs with proper attribution for Unsplash API compliance.
 */
export async function handleCoverImage(input: z.infer<typeof coverImageSchema>) {
  const queryErr = validateRequired(input.query, "query");
  if (queryErr) return makeError("VALIDATION_ERROR", queryErr);

  const config = readConfig();
  const accessKey = config.images?.unsplash_access_key;

  if (!accessKey) {
    return makeError(
      "VALIDATION_ERROR",
      'Unsplash API key not configured. Run: setup unsplash with credentials { "access_key": "your_unsplash_access_key" }. Get a free key at https://unsplash.com/developers'
    );
  }

  const orientation = input.orientation ?? "landscape";
  const count = input.count ?? 3;

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(input.query)}&orientation=${orientation}&per_page=${count}`;

  const result = await httpRequest(url, {
    method: "GET",
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  if (!result.success) return result;

  const data = result.data as UnsplashSearchResponse;
  const photos = (data.results ?? []).map((photo) => {
    // Fire and forget download tracking for Unsplash API compliance
    httpRequest(`https://api.unsplash.com/photos/${photo.id}/download`, {
      method: "GET",
      headers: { Authorization: `Client-ID ${accessKey}` },
    }).catch(() => {});

    return {
      id: photo.id,
      description: photo.description ?? photo.alt_description ?? "",
      urls: {
        regular: photo.urls.regular,
        small: photo.urls.small,
      },
      attribution: {
        photographer: photo.user.name,
        profile_url: photo.user.links.html,
        text: `Photo by ${photo.user.name} on Unsplash`,
      },
    };
  });

  return makeSuccess({
    query: input.query,
    orientation,
    total_available: data.total,
    results: photos,
  });
}

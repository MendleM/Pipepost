const VALID_PLATFORMS = ["devto", "ghost", "hashnode", "wordpress", "medium"] as const;
/** Union of supported publishing platform identifiers. */
export type Platform = (typeof VALID_PLATFORMS)[number];

/** Return an error string if `value` is empty/blank, or null if valid. */
export function validateRequired(value: string, field: string): string | null {
  if (!value || !value.trim()) {
    return `${field} is required`;
  }
  return null;
}

/**
 * Validate that a string is a well-formed URL.
 * Returns null on success, or an error message on failure.
 * Does NOT accept empty strings — callers must guard optionality themselves
 * (e.g. `value ? validateUrl(value) : null`).
 */
export function validateUrl(value: string): string | null {
  if (!value || !value.trim()) {
    return "URL is required";
  }
  try {
    new URL(value);
    return null;
  } catch {
    return `Invalid URL: ${value}`;
  }
}

/** Return an error string if `value` is not one of the supported platform identifiers. */
export function validatePlatform(value: string): string | null {
  if (VALID_PLATFORMS.includes(value as Platform)) {
    return null;
  }
  return `Unknown platform: ${value}. Valid: ${VALID_PLATFORMS.join(", ")}`;
}

/** Return an error string if `value` exceeds `max` characters. */
export function validateStringLength(
  value: string,
  field: string,
  max: number
): string | null {
  if (value.length > max) {
    return `${field} must be under ${max} characters (got ${value.length})`;
  }
  return null;
}

/** Return an error string if any tag in the array is empty/blank. Undefined arrays pass. */
export function validateTags(tags: string[] | undefined): string | null {
  if (!tags) return null;
  if (tags.some((t) => !t.trim())) {
    return "Tags must not contain empty strings";
  }
  return null;
}

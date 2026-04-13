const VALID_PLATFORMS = ["devto", "ghost", "hashnode", "wordpress", "medium"] as const;
export type Platform = (typeof VALID_PLATFORMS)[number];

export function validateRequired(value: string, field: string): string | null {
  if (!value || !value.trim()) {
    return `${field} is required`;
  }
  return null;
}

export function validateUrl(value: string): string | null {
  if (!value) return null; // optional
  try {
    new URL(value);
    return null;
  } catch {
    return `Invalid URL: ${value}`;
  }
}

export function validatePlatform(value: string): string | null {
  if (VALID_PLATFORMS.includes(value as Platform)) {
    return null;
  }
  return `Unknown platform: ${value}. Valid: ${VALID_PLATFORMS.join(", ")}`;
}

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

export function validateTags(tags: string[] | undefined): string | null {
  if (!tags) return null;
  if (tags.some((t) => !t.trim())) {
    return "Tags must not contain empty strings";
  }
  return null;
}

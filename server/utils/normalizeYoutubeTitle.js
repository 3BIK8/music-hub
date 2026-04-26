const BRACKET_CONTENT_REGEXP = /\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g;
const SPACE_REGEXP = /\s+/g;

export function normalizeYoutubeTitle(rawTitle = "") {
  return String(rawTitle)
    .replace(BRACKET_CONTENT_REGEXP, " ")
    .replace(SPACE_REGEXP, " ")
    .trim();
}

export function buildDurationBucket(duration) {
  const seconds =
    typeof duration === "number"
      ? Math.round(duration > 1000 ? duration / 1000 : duration)
      : 0;

  return Math.max(0, Math.round(seconds / 2));
}

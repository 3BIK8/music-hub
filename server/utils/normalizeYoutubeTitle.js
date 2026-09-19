// /server/utils/normalizeYoutubeTitle.js

const BRACKET_CONTENT = /\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g;
const JUNK_WORDS =
  /\b(official|video|audio|lyrics|hd|4k|remastered|clip|music video|live|version)\b/gi;
const FEAT = /\b(feat\.?|ft\.?)\b/gi;
const DASH_SPLIT = /[-–—]/;

export function normalizeYoutubeTitle(rawTitle = "") {
  return String(rawTitle)
    .toLowerCase()
    .replace(BRACKET_CONTENT, " ")
    .replace(JUNK_WORDS, " ")
    .replace(FEAT, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractArtistAndTitle(title = "") {
  const parts = title.split(DASH_SPLIT).map((p) => p.trim());

  if (parts.length >= 2) {
    return {
      artist: parts[0],
      title: parts.slice(1).join(" "),
    };
  }

  return {
    artist: "",
    title,
  };
}

export function buildDurationBucket(duration) {
  let seconds = 0;

  if (typeof duration === "number") {
    seconds = duration > 1000 ? duration / 1000 : duration;
  }

  if (typeof duration === "string") {
    const match = /PT(?:(\d+)M)?(?:(\d+)S)?/.exec(duration) || [];
    const m = parseInt(match[1] || "0", 10);
    const s = parseInt(match[2] || "0", 10);
    seconds = m * 60 + s;
  }

  seconds = Math.round(seconds);
  return Math.round(seconds / 2);
}

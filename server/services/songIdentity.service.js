import {
  normalizeYoutubeTitle,
  extractArtistAndTitle,
  buildDurationBucket,
} from "../utils/normalizeYoutubeTitle.js";

const STOP_WORDS = [
  "official",
  "video",
  "lyrics",
  "lyric",
  "audio",
  "hd",
  "4k",
  "remastered",
  "version",
  "clip",
  "music",
  "prod",
  "feat",
  "ft",
];

const clean = (text = "") => {
  return normalizeYoutubeTitle(text)
    .toLowerCase()
    .split(" ")
    .filter((w) => w && !STOP_WORDS.includes(w))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

const parseDurationSeconds = (duration) => {
  if (typeof duration === "number") {
    return Math.round(duration > 1000 ? duration / 1000 : duration);
  }

  if (typeof duration === "string") {
    const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(duration) || [];
    const h = Number(match[1] || 0);
    const m = Number(match[2] || 0);
    const s = Number(match[3] || 0);
    return h * 3600 + m * 60 + s;
  }

  return 0;
};

const normalizeText = (text = "") => clean(text);

export function buildSongIdentity({
  title,
  artist = "",
  duration,
  source = "youtube",
}) {
  const rawTitle = String(title || "").trim();
  const rawArtist = String(artist || "").trim();

  let canonicalArtist = normalizeText(rawArtist);
  let canonicalTitle = normalizeText(rawTitle);

  if (source === "youtube") {
    const parsed = extractArtistAndTitle(normalizeYoutubeTitle(rawTitle));
    canonicalArtist = normalizeText(parsed.artist || rawArtist);
    canonicalTitle = normalizeText(parsed.title || rawTitle);
  }

  if (!canonicalTitle && rawTitle) {
    canonicalTitle = normalizeText(rawTitle);
  }
  if (!canonicalArtist && rawArtist) {
    canonicalArtist = normalizeText(rawArtist);
  }

  const durationSeconds = parseDurationSeconds(duration);
  const durationBucket = buildDurationBucket(durationSeconds);

  const normalizedText = [canonicalArtist, canonicalTitle]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    normalizedKey: `${normalizedText}_${durationBucket}`,
    durationBucket,
    normalizedText,
    canonical: {
      title: canonicalTitle,
      artist: canonicalArtist,
      duration: durationSeconds,
    },
  };
}

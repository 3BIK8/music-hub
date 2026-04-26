import {
  normalizeYoutubeTitle,
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
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .split(" ")
    .filter((w) => w && !STOP_WORDS.includes(w))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

export function buildSongIdentity({ title, artist = "", duration }) {
  const cleanTitle = clean(title);
  const cleanArtist = clean(artist);

  const normalizedText = `${cleanArtist} ${cleanTitle}`
    .replace(/\s+/g, " ")
    .trim();

  const durationBucket = buildDurationBucket(duration);

  return {
    normalizedKey: `${normalizedText}_${durationBucket}`,
    durationBucket,
    normalizedText,
  };
}

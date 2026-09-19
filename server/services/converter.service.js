import { searchYoutubeVideoId } from "./youtube.service.js";
import { extractAndUploadAudio } from "./audio.service.js";
import Song from "../models/Song.js";
import { buildSongIdentity } from "./songIdentity.service.js";

const cache = new Map();

export async function spotifyToYoutube(track) {
  const key = track.id;
  if (cache.has(key)) return cache.get(key);

  const videoId = await searchYoutubeVideoId(
    `${track.name} ${track.artist} audio`,
  );

  if (!videoId) throw new Error("No video found");

  const identity = buildSongIdentity({
    title: track.name,
    artist: track.artist,
    duration: track.duration_ms,
    source: "spotify",
  });

  const existingGlobal = await Song.findOne({
    normalizedKey: identity.normalizedKey,
  });

  if (existingGlobal?.audio?.url) {
    const result = {
      youtubeId: existingGlobal.audio.sourceId,
      audioUrl: existingGlobal.audio.url,
    };

    cache.set(key, result);
    return result;
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const audioUrl = await extractAndUploadAudio(url);

  const result = {
    youtubeId: videoId,
    audioUrl,
  };

  cache.set(key, result);
  return result;
}

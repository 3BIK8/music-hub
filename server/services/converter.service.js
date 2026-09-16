import { searchYoutubeVideoId } from "./youtube.service.js";
import { extractAndUploadAudio } from "./audio.service.js";
import Song from "../models/Song.js";
import { buildSongIdentity } from "./songIdentity.service.js";

const cache = new Map();

export async function spotifyToYoutube(track) {
  if (!track?.id) throw new Error("Missing Spotify track id");
  const key = track.id;
  if (cache.has(key)) return cache.get(key);

  const videoId = await searchYoutubeVideoId(`${track.name} ${track.artist} audio`);
  if (!videoId) throw new Error("No video found");

  const identity = buildSongIdentity({ title: track.name, artist: track.artist, duration: track.duration_ms });
  const existingYoutube = await Song.findOne({ platform: "youtube", sourceId: videoId });
  if (existingYoutube?.audioUrl) {
    const result = { youtubeId: videoId, audioUrl: existingYoutube.audioUrl };
    cache.set(key, result);
    return result;
  }

  const existingGlobal = await Song.findOne({ normalizedKey: identity.normalizedKey });
  if (existingGlobal?.audioUrl) {
    const result = { youtubeId: videoId, audioUrl: existingGlobal.audioUrl };
    cache.set(key, result);
    return result;
  }

  const audioUrl = await extractAndUploadAudio(`https://www.youtube.com/watch?v=${videoId}`);
  const result = { youtubeId: videoId, audioUrl };
  cache.set(key, result);
  return result;
}

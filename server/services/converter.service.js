import { searchYoutube } from "./youtube.service.js";
import { extractAndUploadAudio } from "./audio.service.js";
import Song from "../models/Song.js";

// ✅ GLOBAL cache (outside function)
const spotifyYTCache = new Map();

export async function spotifyToYoutube(track) {
  const key = `${track.artist}-${track.name}`.toLowerCase();

  // ✅ 1. CACHE FIRST
  if (spotifyYTCache.has(key)) {
    return spotifyYTCache.get(key);
  }

  // ✅ 2. DB FIRST
  const existing = await Song.findOne({
    title: track.name,
  });

  if (existing) {
    spotifyYTCache.set(key, existing);
    return existing;
  }

  // ✅ 3. SEARCH YOUTUBE
  const query = `${track.name} ${track.artist}`;
  const videoId = await searchYoutube(query);

  if (!videoId) {
    throw new Error("No YouTube video found");
  }

  // ✅ 4. CHECK AGAIN WITH videoId (VERY IMPORTANT)
  const existingByVideo = await Song.findOne({ videoId });
  if (existingByVideo) {
    spotifyYTCache.set(key, existingByVideo);
    return existingByVideo;
  }

  // ✅ 5. EXTRACT AUDIO
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const audioUrl = await extractAndUploadAudio(youtubeUrl);

  if (!audioUrl) {
    throw new Error("Audio extraction failed");
  }

  const result = {
    title: track.name,
    artist: track.artist,
    youtubeId: videoId,
    image: track.image,
    audioUrl,
  };

  // ✅ 6. SAVE CACHE
  spotifyYTCache.set(key, result);

  return result;
}

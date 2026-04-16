import { searchYoutube } from "./youtube.service.js";
import { extractAndUploadAudio } from "./audio.service.js";

export async function spotifyToYoutube(track) {
  const query = `${track.name} ${track.artist}`;

  const videoId = await searchYoutube(query);

  if (!videoId) {
    throw new Error("No YouTube video found");
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const audioUrl = await extractAndUploadAudio(youtubeUrl);

  if (!audioUrl) {
    throw new Error("Audio extraction failed");
  }

  return {
    title: track.name,
    artist: track.artist,
    youtubeId: videoId,
    image: track.image,
    audioUrl,
  };
}

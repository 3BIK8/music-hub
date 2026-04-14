import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

const getBestThumbnail = (thumbnails = {}) =>
  thumbnails.maxres?.url ||
  thumbnails.high?.url ||
  thumbnails.medium?.url ||
  thumbnails.default?.url ||
  "";

const normalizeUrl = (url) => {
  const cleanedUrl = String(url || "").trim();
  if (!cleanedUrl) return null;
  return /^https?:\/\//i.test(cleanedUrl)
    ? cleanedUrl
    : `https://${cleanedUrl}`;
};

export const getYoutubeId = (url) => {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) return null;

  try {
    const parsedUrl = new URL(normalizedUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;

    if (hostname.includes("youtu.be")) {
      return pathname.slice(1) || null;
    }

    if (
      hostname.includes("youtube.com") ||
      hostname.includes("youtube-nocookie.com")
    ) {
      if (pathname.startsWith("/watch")) {
        return parsedUrl.searchParams.get("v") || null;
      }

      if (pathname.startsWith("/shorts/") || pathname.startsWith("/embed/")) {
        return pathname.split("/")[2] || null;
      }
    }
  } catch (error) {
    // Fall back to regex extraction for non-standard formats.
  }

  const fallbackRegExp =
    /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/i;
  const match = String(url).match(fallbackRegExp);

  return match ? match[1] : null;
};

export const getYoutubePlaylistId = (url) => {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) return null;

  try {
    const parsedUrl = new URL(normalizedUrl);
    const playlistId = parsedUrl.searchParams.get("list");
    if (playlistId) return playlistId;
  } catch (error) {
    // Fall back to regex extraction.
  }

  const fallbackRegExp = /[?&]list=([a-zA-Z0-9_-]+)/i;
  const match = String(url).match(fallbackRegExp);
  return match ? match[1] : null;
};

export const fetchYoutubeVideo = async (url) => {
  const videoId = getYoutubeId(url);
  if (!videoId) return null;

  const response = await youtube.videos.list({
    part: "snippet,contentDetails",
    id: videoId,
  });

  const video = response.data.items[0];
  if (!video) return null;

  return {
    videoId,
    title: video.snippet.title,
    description: video.snippet.description,
    thumbnail: getBestThumbnail(video.snippet.thumbnails),
    duration: video.contentDetails?.duration || "",
    snippet: video.snippet,
  };
};

export const fetchYoutubePlaylist = async (url) => {
  const playlistId = getYoutubePlaylistId(url);
  if (!playlistId) return null;

  const playlistResponse = await youtube.playlists.list({
    part: "snippet",
    id: playlistId,
  });

  const playlist = playlistResponse.data.items?.[0];
  if (!playlist) return null;

  let items = [];
  let nextPageToken = undefined;

  do {
    const response = await youtube.playlistItems.list({
      part: "snippet,contentDetails",
      playlistId,
      maxResults: 50,
      pageToken: nextPageToken,
    });

    items = items.concat(response.data.items || []);
    nextPageToken = response.data.nextPageToken;
  } while (nextPageToken);

  const videoIds = items
    .map((item) => item.contentDetails?.videoId)
    .filter(Boolean);

  if (!videoIds.length) return null;

  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const videos = [];
  for (const chunk of chunks) {
    const response = await youtube.videos.list({
      part: "snippet,contentDetails",
      id: chunk.join(","),
    });
    videos.push(...(response.data.items || []));
  }

  const videoMap = new Map(videos.map((video) => [video.id, video]));

  const playlistItems = videoIds
    .map((videoId) => {
      const video = videoMap.get(videoId);
      if (!video) return null;

      return {
        videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: getBestThumbnail(video.snippet.thumbnails),
        duration: video.contentDetails?.duration || "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    })
    .filter(Boolean);

  return {
    playlistId,
    title: playlist.snippet.title,
    itemCount: playlistItems.length,
    items: playlistItems,
  };
};

import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

const videoCache = new Map();
const searchCache = new Map();

const getBestThumbnail = (t = {}) =>
  t.maxres?.url || t.high?.url || t.medium?.url || t.default?.url || "";

export const getYoutubeId = (url) => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
};

export const searchYoutubeVideoId = async (query) => {
  const key = query.toLowerCase().trim();
  if (searchCache.has(key)) return searchCache.get(key);

  const res = await youtube.search.list({
    part: "snippet",
    q: query,
    maxResults: 1,
    type: "video",
  });

  const id = res.data.items?.[0]?.id?.videoId || null;
  if (id) searchCache.set(key, id);
  return id;
};

export const fetchYoutubeVideo = async (url) => {
  const videoId = getYoutubeId(url);
  if (!videoId) return null;

  if (videoCache.has(videoId)) return videoCache.get(videoId);

  const res = await youtube.videos.list({
    part: "snippet,contentDetails",
    id: videoId,
  });

  const v = res.data.items?.[0];
  if (!v) return null;

  const result = {
    videoId,
    title: v.snippet.title,
    channelTitle: v.snippet.channelTitle,
    thumbnail: getBestThumbnail(v.snippet.thumbnails),
    duration: v.contentDetails?.duration || "",
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };

  videoCache.set(videoId, result);
  return result;
};

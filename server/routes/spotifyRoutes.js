import express from "express";
import { searchTracks } from "../services/spotify.service.js";
import { spotifyToYoutube } from "../services/converter.service.js";
import { formatDurationMs } from "../utils/formatDuration.js";
import { buildSongIdentity } from "../services/songIdentity.service.js";
import { createOrGetSong } from "../services/song.service.js";

const router = express.Router();

const getTrackArtist = (track) => String(track.artist || track?.artists?.[0]?.name || "").trim();
const buildSpotifyTrackUrl = (track) => track?.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`;

const createOrGetSpotifySong = async (track) => {
  if (!track?.id || !track?.name) throw new Error("Invalid track");

  const sourceId = track.id;
  const artist = getTrackArtist(track);
  const identity = buildSongIdentity({ title: track.name, artist, duration: track.duration_ms });
  const conversion = await spotifyToYoutube({
    id: sourceId,
    name: track.name,
    artist,
    image: track.image,
    duration_ms: track.duration_ms,
  });

  return createOrGetSong({
    songId: `spotify_${sourceId}`,
    platform: "spotify",
    sourceId,
    normalizedKey: identity.normalizedKey,
    durationBucket: identity.durationBucket,
    title: track.name,
    url: buildSpotifyTrackUrl(track),
    thumbnail: track.image,
    duration: formatDurationMs(track.duration_ms),
    audioUrl: conversion.audioUrl,
    processing: false,
    processingError: "",
  });
};

router.post("/", async (req, res) => {
  try {
    const track = req.body.track || req.body;
    const result = await createOrGetSpotifySong(track);
    return res.json(result);
  } catch (err) {
    console.error("Spotify route error:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "Missing query" });
    const tracks = await searchTracks(q);
    return res.json(tracks);
  } catch (err) {
    console.error("Spotify search failed:", err);
    return res.status(500).json({ error: "Failed to search Spotify" });
  }
});

export default router;

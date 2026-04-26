import express from "express";
import Song from "../models/Song.js";
import { searchTracks } from "../services/spotify.service.js";
import { spotifyToYoutube } from "../services/converter.service.js";
import { formatDurationMs } from "../utils/formatDuration.js";
import { buildSongIdentity } from "../services/songIdentity.service.js";

const router = express.Router();

const getTrackArtist = (t) =>
  String(t.artist || t?.artists?.[0]?.name || "").trim();

const buildSpotifyTrackUrl = (t) =>
  t?.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`;

/* =========================
   CREATE / GET SPOTIFY SONG
========================= */
const createOrGetSpotifySong = async (track) => {
  if (!track?.id || !track?.name) {
    throw new Error("Invalid track");
  }

  const sourceId = track.id;
  const songId = `spotify_${sourceId}`;
  const artist = getTrackArtist(track);

  const identity = buildSongIdentity({
    title: track.name,
    artist,
    duration: track.duration_ms,
  });

  /* -------------------------
     1. STRICT DEDUPE (GLOBAL)
  ------------------------- */
  const existingGlobal = await Song.findOne({
    normalizedKey: identity.normalizedKey,
  });

  if (existingGlobal) {
    return { song: existingGlobal, isExisting: true };
  }

  /* -------------------------
     2. CONVERT TO YOUTUBE
  ------------------------- */
  const conversion = await spotifyToYoutube({
    id: sourceId,
    name: track.name,
    artist,
    image: track.image,
  });

  /* -------------------------
     3. RECHECK AFTER CONVERSION
     (race condition safety)
  ------------------------- */
  const existingAfter = await Song.findOne({
    normalizedKey: identity.normalizedKey,
  });

  if (existingAfter) {
    return { song: existingAfter, isExisting: true };
  }

  /* -------------------------
     4. CREATE NEW SONG
  ------------------------- */
  const song = await Song.create({
    songId,
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

  return { song, isExisting: false };
};

/* =========================
   ADD SONG
========================= */
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

/* =========================
   SEARCH
========================= */
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "Missing query" });

    const tracks = await searchTracks(q);
    return res.json(tracks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

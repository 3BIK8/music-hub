import express from "express";
import Song from "../models/Song.js";
import { searchTracks } from "../services/spotify.service.js";
import { spotifyToYoutube } from "../services/converter.service.js";
import { buildSongIdentity } from "../services/songIdentity.service.js";

const router = express.Router();

const getTrackArtist = (t) =>
  String(t.artist || t?.artists?.[0]?.name || "").trim();

const buildSpotifyTrackUrl = (t) =>
  t?.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`;

const createOrGetSpotifySong = async (track) => {
  if (!track?.id || !track?.name) {
    throw new Error("Invalid track");
  }

  const sourceId = String(track.id).trim();
  if (!sourceId || sourceId === "undefined") {
    throw new Error("Invalid Spotify sourceId");
  }

  const artist = getTrackArtist(track);
  const durationSeconds = Math.floor((track.duration_ms || 0) / 1000);

  const identity = buildSongIdentity({
    title: track.name,
    artist,
    duration: durationSeconds,
    source: "spotify",
  });

  const spotifyProvider = {
    sourceId,
    title: track.name,
    artist,
    thumbnail: track.image || "",
    url: buildSpotifyTrackUrl(track),
    duration: durationSeconds,
  };

  const conversion = await spotifyToYoutube({
    id: sourceId,
    name: track.name,
    artist,
    image: track.image,
    duration_ms: track.duration_ms,
  });

  const youtubeProvider = conversion.youtubeId
    ? {
        sourceId: conversion.youtubeId,
        title: track.name,
        artist,
        thumbnail: conversion.thumbnail || "",
        url: `https://www.youtube.com/watch?v=${conversion.youtubeId}`,
        duration: durationSeconds,
      }
    : null;

  const upsertDoc = {
    songId: identity.normalizedKey,
    platform: "spotify",
    sourceId,
    audioKey: identity.normalizedKey,
    normalizedKey: identity.normalizedKey,
    title: identity.canonical.title,
    url: buildSpotifyTrackUrl(track),
    thumbnail: track.image || conversion.thumbnail || "",
    duration: identity.canonical.duration,
    canonical: identity.canonical,
    audio: {
      status: conversion.audioUrl ? "ready" : "processing",
      url: conversion.audioUrl || "",
      source: "youtube",
      sourceId: conversion.youtubeId || "",
    },
    providers: {
      spotify: spotifyProvider,
      youtube: youtubeProvider,
    },
    preferredProvider: "spotify",
  };

  const result = await Song.collection.findOneAndUpdate(
    { normalizedKey: identity.normalizedKey },
    { $setOnInsert: upsertDoc },
    { upsert: true, returnDocument: "after" },
  );

  const created = !!(result.lastErrorObject && result.lastErrorObject.upserted);
  const song = await Song.findById(result.value._id);

  let changed = false;
  if (!song.providers || !song.providers.spotify) {
    song.providers = {
      ...song.providers,
      spotify: spotifyProvider,
    };
    changed = true;
  }

  if (youtubeProvider && (!song.providers || !song.providers.youtube)) {
    song.providers = {
      ...song.providers,
      youtube: youtubeProvider,
    };
    changed = true;
  }

  if (!song.preferredProvider) {
    song.preferredProvider = "spotify";
    changed = true;
  }

  const canonical = {
    title: identity.canonical.title || song.canonical?.title,
    artist: identity.canonical.artist || song.canonical?.artist,
    duration: identity.canonical.duration || song.canonical?.duration,
  };

  if (
    !song.canonical ||
    song.canonical.title !== canonical.title ||
    song.canonical.artist !== canonical.artist ||
    song.canonical.duration !== canonical.duration
  ) {
    song.canonical = canonical;
    changed = true;
  }

  if (changed) {
    await song.save();
  }

  return { song, isExisting: !created };
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
    return res.status(500).json({ error: err.message });
  }
});

export default router;

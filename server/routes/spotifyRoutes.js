import express from "express";
import { spotifyToYoutube } from "../services/converter.service.js";
import Song from "../models/Song.js";
import { searchTracks } from "../services/spotify.service.js";

const router = express.Router();

router.post("/convert", async (req, res) => {
  try {
    const track = req.body;

    const result = await spotifyToYoutube(track);

    if (!result.audioUrl) {
      return res.status(500).json({
        error: "audioUrl missing from pipeline",
      });
    }

    const song = await Song.create({
      title: result.title,
      thumbnail: result.image,
      url: result.youtubeId,
      audioUrl: result.audioUrl,
    });
    console.log("SPOTIFY RESULT:", result);
    return res.json(song);
  } catch (err) {
    console.error("SPOTIFY PIPELINE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const tracks = await searchTracks(q);
    res.json(tracks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Spotify search failed" });
  }
});

export default router;

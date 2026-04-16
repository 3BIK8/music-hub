import express from "express";
import Song from "../models/Song.js";
import dotenv from "dotenv";
import { formatDuration } from "../utils/formatDuration.js";
import {
  fetchYoutubePlaylist,
  fetchYoutubeVideo,
  getYoutubeId,
} from "../services/youtube.service.js";
import { extractAndUploadAudio } from "../services/audio.service.js";

dotenv.config();
const router = express.Router();

/* -------------------- CREATE -------------------- */

router.post("/", async (req, res) => {
  try {
    const url = String(req.body.url || "").trim();

    const playlist = await fetchYoutubePlaylist(url);

    /* ================= PLAYLIST ================= */
    if (playlist) {
      const results = [];

      for (const item of playlist.items) {
        try {
          const sourceId = item.videoId;

          if (!sourceId) continue;

          const existing = await Song.findOne({ sourceId });

          if (existing) {
            results.push(existing);
            continue;
          }

          const audioUrl = await extractAndUploadAudio(item.url);

          const song = await Song.create({
            title: item.title,
            url: item.url,
            sourceId,
            platform: "youtube",
            thumbnail: item.thumbnail,
            duration: formatDuration(item.duration),
            audioUrl,
          });

          results.push(song);
        } catch (err) {
          console.error(`Playlist item failed: ${item.title}`, err);
        }
      }

      return res.json(results);
    }

    /* ================= SINGLE VIDEO ================= */
    const video = await fetchYoutubeVideo(url);

    if (!video) {
      return res.status(400).json({ error: "Invalid or unsupported URL" });
    }

    const sourceId = video.videoId || getYoutubeId(url);

    if (!sourceId) {
      return res.status(400).json({ error: "Cannot extract video ID" });
    }

    const existing = await Song.findOne({ sourceId });

    if (existing) return res.json(existing);

    const audioUrl = await extractAndUploadAudio(url);

    const song = await Song.create({
      title: video.title,
      url,
      sourceId,
      platform: "youtube",
      thumbnail: video.thumbnail,
      duration: formatDuration(video.duration),
      audioUrl,
    });

    res.json(song);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- READ -------------------- */

router.get("/", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- DELETE -------------------- */

router.delete("/:id", async (req, res) => {
  try {
    await Song.findByIdAndDelete(req.params.id);
    res.json({ msg: "deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- CLEANUP -------------------- */

router.delete("/cleanup/invalid", async (req, res) => {
  try {
    const result = await Song.deleteMany({
      $or: [
        { audioUrl: null },
        { audioUrl: { $exists: false } },
        { audioUrl: "" },
      ],
    });

    res.json({
      msg: `Cleaned up ${result.deletedCount} invalid songs`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import express from "express";
import Song from "../models/Song.js";
import dotenv from "dotenv";
import { formatDuration } from "../utils/formatDuration.js";
import {
  fetchYoutubePlaylist,
  fetchYoutubeVideo,
} from "../services/youtube.service.js";
import { extractAndUploadAudio } from "../services/audio.service.js";

dotenv.config();
const router = express.Router();

// CREATE

router.post("/", async (req, res) => {
  try {
    const url = String(req.body.url || "").trim();

    const playlist = await fetchYoutubePlaylist(url);
    if (playlist) {
      const createdSongs = [];
      for (const item of playlist.items) {
        try {
          const existingSong = await Song.findOne({
            videoId: item.videoId,
          });
          if (existingSong) {
            createdSongs.push(existingSong);
            continue;
          }

          const audioUrl = await extractAndUploadAudio(item.url);

          const song = await Song.create({
            title: item.title,
            url: item.url,
            videoId: item.videoId,
            thumbnail: item.thumbnail,
            duration: formatDuration(item.duration),
            audioUrl,
          });
          createdSongs.push(song);
        } catch (err) {
          console.error(`Failed to import song ${item.title}:`, err);
        }
      }
      return res.json(createdSongs);
    }

    const video = await fetchYoutubeVideo(url);

    if (!video) {
      return res
        .status(400)
        .json({ error: "Invalid or unsupported YouTube URL" });
    }

    const existingSong = await Song.findOne({ videoId: video.videoId });
    if (existingSong) {
      return res.json(existingSong);
    }

    const audioUrl = await extractAndUploadAudio(url);

    const song = await Song.create({
      title: video.title,
      url,
      videoId: video.videoId,
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

// READ
router.get("/", async (req, res) => {
  const songs = await Song.find().sort({ createdAt: -1 });
  res.json(songs);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Song.findByIdAndDelete(req.params.id);
  res.json({ msg: "deleted" });
});

// CLEANUP - Remove songs with invalid audio URLs
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
      msg: `Cleaned up ${result.deletedCount} songs with invalid audio URLs`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

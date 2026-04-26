import express from "express";
import Song from "../models/Song.js";
import {
  fetchYoutubeVideo,
  getYoutubeId,
} from "../services/youtube.service.js";
import { buildSongIdentity } from "../services/songIdentity.service.js";
import { extractAndUploadAudio } from "../services/audio.service.js";

const router = express.Router();

/* =========================
   GET ALL SONGS
========================= */
router.get("/", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    return res.json(songs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================
   BACKGROUND AUDIO PROCESS
========================= */
const startAudioJob = (songId, youtubeUrl) => {
  setImmediate(async () => {
    try {
      const song = await Song.findById(songId);
      if (!song || song.audioUrl) return;

      await Song.updateOne({ _id: songId }, { $set: { processing: true } });

      const audioUrl = await extractAndUploadAudio(youtubeUrl);

      await Song.updateOne(
        { _id: songId },
        {
          $set: {
            audioUrl,
            processing: false,
            processingError: "",
          },
        },
      );
    } catch (err) {
      await Song.updateOne(
        { _id: songId },
        {
          $set: {
            processing: false,
            processingError: err.message,
          },
        },
      );
    }
  });
};

/* =========================
   CREATE YOUTUBE SONG
========================= */
router.post("/", async (req, res) => {
  try {
    const url = String(req.body.url || "").trim();
    if (!url) {
      return res.status(400).json({ error: "Missing YouTube URL" });
    }

    const video = await fetchYoutubeVideo(url);
    if (!video) {
      return res.status(400).json({ error: "Video not found" });
    }

    const sourceId = video.videoId || getYoutubeId(url);

    const identity = buildSongIdentity({
      title: video.title,
      artist: video.channelTitle,
      duration: video.duration,
    });

    const existing = await Song.findOne({
      normalizedKey: identity.normalizedKey,
    });

    if (existing) {
      return res.json({ song: existing, isExisting: true });
    }

    const song = await Song.create({
      songId: `youtube_${sourceId}`,
      platform: "youtube",
      sourceId,
      normalizedKey: identity.normalizedKey,
      durationBucket: identity.durationBucket,
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail,
      duration: video.duration || "",
      audioUrl: "",
      processing: true,
      processingError: "",
    });

    // 🔥 THIS WAS MISSING (MAIN BUG)
    startAudioJob(song._id, video.url);

    return res.json({ song, isExisting: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/* =========================
   DELETE SONG
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Song.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });

    return res.json({ msg: "deleted" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================
   CLEAN INVALID SONGS
========================= */
router.delete("/cleanup/invalid", async (req, res) => {
  try {
    const result = await Song.deleteMany({
      $or: [{ title: "" }, { normalizedKey: "" }, { normalizedKey: null }],
    });

    return res.json({
      msg: "cleanup done",
      deleted: result.deletedCount,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

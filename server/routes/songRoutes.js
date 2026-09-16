import express from "express";
import Song from "../models/Song.js";
import { fetchYoutubeVideo, getYoutubeId } from "../services/youtube.service.js";
import { buildSongIdentity } from "../services/songIdentity.service.js";
import { extractAndUploadAudio } from "../services/audio.service.js";
import { createOrGetSong } from "../services/song.service.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    return res.json(songs);
  } catch (err) {
    console.error("List songs failed:", err);
    return res.status(500).json({ error: "Failed to load songs" });
  }
});

const startAudioJob = (songId, youtubeUrl) => {
  setImmediate(async () => {
    try {
      const song = await Song.findById(songId);
      if (!song || song.audioUrl) return;

      await Song.updateOne({ _id: songId }, { $set: { processing: true, processingError: "" } });
      const audioUrl = await extractAndUploadAudio(youtubeUrl);

      await Song.updateOne(
        { _id: songId },
        { $set: { audioUrl, processing: false, processingError: "" } },
      );
    } catch (err) {
      console.error(`Audio job failed for ${songId}:`, err);
      await Song.updateOne(
        { _id: songId },
        { $set: { processing: false, processingError: err.message } },
      );
    }
  });
};

router.post("/", async (req, res) => {
  try {
    const url = String(req.body.url || "").trim();
    if (!url) return res.status(400).json({ error: "Missing YouTube URL" });

    const video = await fetchYoutubeVideo(url);
    if (!video) return res.status(400).json({ error: "Video not found" });

    const sourceId = video.videoId || getYoutubeId(url);
    if (!sourceId) return res.status(400).json({ error: "Invalid YouTube URL" });

    const identity = buildSongIdentity({
      title: video.title,
      artist: video.channelTitle,
      duration: video.duration,
    });

    const result = await createOrGetSong({
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

    if (!result.isExisting) startAudioJob(result.song._id, video.url);
    return res.json(result);
  } catch (err) {
    console.error("YouTube song creation failed:", err);
    return res.status(500).json({ error: "Failed to create song" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Song.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Song not found" });
    return res.json({ msg: "deleted" });
  } catch (err) {
    console.error("Delete song failed:", err);
    return res.status(500).json({ error: "Failed to delete song" });
  }
});

router.delete("/cleanup/invalid", async (req, res) => {
  try {
    const result = await Song.deleteMany({
      $or: [{ title: "" }, { normalizedKey: "" }, { normalizedKey: null }],
    });
    return res.json({ msg: "cleanup done", deleted: result.deletedCount });
  } catch (err) {
    console.error("Song cleanup failed:", err);
    return res.status(500).json({ error: "Failed to clean invalid songs" });
  }
});

export default router;

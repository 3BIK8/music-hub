import express from "express";
import Song from "../models/Song.js";
import {
  fetchYoutubeVideo,
  getYoutubeId,
} from "../services/youtube.service.js";
import { buildSongIdentity } from "../services/songIdentity.service.js";
import { extractAndUploadAudio } from "../services/audio.service.js";

const router = express.Router();

const startAudioJob = (songId, youtubeUrl) => {
  setImmediate(async () => {
    try {
      const song = await Song.findById(songId);
      if (!song || song.audio?.url || song.audio?.status === "ready") return;

      await Song.updateOne(
        { _id: songId },
        { $set: { "audio.status": "processing", "audio.error": "" } },
      );

      const audioUrl = await extractAndUploadAudio(youtubeUrl);

      await Song.updateOne(
        { _id: songId },
        {
          $set: {
            "audio.status": "ready",
            "audio.url": audioUrl,
            "audio.error": "",
          },
        },
      );
    } catch (err) {
      await Song.updateOne(
        { _id: songId },
        {
          $set: {
            "audio.status": "error",
            "audio.error": err.message,
          },
        },
      );
    }
  });
};

const parseYoutubeDuration = (iso) => {
  if (!iso) return 0;

  const match = String(iso).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  const h = Number(match?.[1] || 0);
  const m = Number(match?.[2] || 0);
  const s = Number(match?.[3] || 0);

  return h * 3600 + m * 60 + s;
};

router.get("/", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    return res.json(songs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

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
    const durationSeconds = parseYoutubeDuration(video.duration);

    const identity = buildSongIdentity({
      title: video.title,
      artist: video.channelTitle,
      duration: durationSeconds,
      source: "youtube",
    });

    const youtubeProvider = {
      sourceId,
      title: video.title,
      artist: video.channelTitle,
      thumbnail: video.thumbnail,
      url: video.url,
      duration: durationSeconds,
      channel: video.channelTitle,
    };

    const upsertDoc = {
      songId: identity.normalizedKey,
      platform: "youtube",
      sourceId,
      audioKey: identity.normalizedKey,
      normalizedKey: identity.normalizedKey,
      title: identity.canonical.title,
      url: video.url,
      thumbnail: video.thumbnail,
      duration: identity.canonical.duration,
      canonical: identity.canonical,
      audio: {
        status: "processing",
        url: "",
        source: "youtube",
        sourceId,
      },
      providers: {
        youtube: youtubeProvider,
        spotify: null,
      },
      preferredProvider: "youtube",
    };

    const result = await Song.collection.findOneAndUpdate(
      { normalizedKey: identity.normalizedKey },
      { $setOnInsert: upsertDoc },
      { upsert: true, returnDocument: "after" },
    );

    const created = !!(
      result.lastErrorObject && result.lastErrorObject.upserted
    );
    const song = await Song.findById(result.value._id);

    // If the document pre-existed, ensure youtube provider is attached
    if (!created) {
      if (!song.providers?.youtube?.sourceId) {
        song.providers = {
          ...song.providers,
          youtube: youtubeProvider,
        };
        if (!song.preferredProvider) {
          song.preferredProvider = "youtube";
        }
        song.canonical = {
          title: identity.canonical.title || song.canonical?.title,
          artist: identity.canonical.artist || song.canonical?.artist,
          duration: identity.canonical.duration || song.canonical?.duration,
        };
        await song.save();
      }
    }

    // Start audio job if newly created or audio URL is missing
    if (created || !song.audio?.url) {
      startAudioJob(song._id, video.url);
    }

    return res.json({ song, isExisting: !created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Song.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({ msg: "deleted" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/cleanup/invalid", async (req, res) => {
  try {
    const result = await Song.deleteMany({
      $or: [
        { audioKey: "" },
        { normalizedKey: "" },
        { canonical: { $exists: false } },
      ],
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

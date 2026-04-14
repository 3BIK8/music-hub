import express from "express";
import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";

const router = express.Router();

// CREATE
router.post("/", async (req, res) => {
  try {
    const { name, description, songIds } = req.body;

    const songs = songIds ? await Song.find({ _id: { $in: songIds } }) : [];

    const playlist = await Playlist.create({
      name,
      description,
      songs: songs.map((s) => s._id),
    });

    await playlist.populate("songs");

    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// READ
router.get("/", async (req, res) => {
  const playlists = await Playlist.find()
    .populate("songs")
    .sort({ createdAt: -1 });
  res.json(playlists);
});

router.get("/:id", async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate("songs");
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { name, description, songIds } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (songIds) {
      const songs = await Song.find({ _id: { $in: songIds } });
      updateData.songs = songs.map((s) => s._id);
    }

    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    ).populate("songs");

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ msg: "Playlist deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ADD SONG TO PLAYLIST
router.post("/:id/songs", async (req, res) => {
  try {
    const { songId } = req.body;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    if (!playlist.songs.includes(songId)) {
      playlist.songs.push(songId);
      await playlist.save();
    }

    await playlist.populate("songs");
    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// REMOVE SONG FROM PLAYLIST
router.delete("/:id/songs/:songId", async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    playlist.songs = playlist.songs.filter(
      (id) => id.toString() !== req.params.songId,
    );
    await playlist.save();

    await playlist.populate("songs");
    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

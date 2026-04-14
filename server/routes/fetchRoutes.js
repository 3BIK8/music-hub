import express from "express";
import dotenv from "dotenv";
import { fetchYoutubeVideo } from "../services/youtube.service.js";

dotenv.config();
const router = express.Router();

router.get("/youtube", async (req, res) => {
  try {
    const { url } = req.query;
    const video = await fetchYoutubeVideo(url);

    if (!video) {
      return res
        .status(400)
        .json({ error: "Invalid or unsupported YouTube URL" });
    }

    res.json({
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

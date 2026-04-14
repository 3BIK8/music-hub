import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    thumbnail: String,
    duration: String,
    videoId: { type: String, unique: true, sparse: true },
    audioUrl: String,
  },
  { timestamps: true },
);

songSchema.index({ videoId: 1 });

export default mongoose.model("Song", songSchema);

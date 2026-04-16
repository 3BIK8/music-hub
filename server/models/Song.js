import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    thumbnail: String,
    duration: String,

    sourceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    platform: {
      type: String, // youtube | spotify
      required: true,
    },

    audioUrl: String,
  },
  { timestamps: true },
);

export default mongoose.model("Song", songSchema);

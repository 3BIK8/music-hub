import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    coverImage: String,
  },
  { timestamps: true },
);

export default mongoose.model("Playlist", playlistSchema);

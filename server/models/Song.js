import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    songId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ["youtube", "spotify"],
      index: true,
    },
    sourceId: { type: String, required: true, index: true, trim: true },
    normalizedKey: {
      type: String,
      required: true,
      index: true,
      trim: true,
      unique: true,
    },
    durationBucket: { type: Number, required: true, default: 0, index: true },
    title: { type: String, trim: true },
    url: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    duration: { type: String, default: "" },
    audioUrl: { type: String, trim: true },
    processing: { type: Boolean, default: false, index: true },
    processingError: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

songSchema.index({ platform: 1, sourceId: 1 }, { unique: true });
songSchema.index({ normalizedKey: 1 }, { unique: true });

export default mongoose.model("Song", songSchema);

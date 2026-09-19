import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    sourceId: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    artist: { type: String, trim: true, default: "" },
    thumbnail: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    duration: { type: Number, default: 0 },
    channel: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const audioSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["processing", "ready", "error"],
      default: "processing",
    },
    url: { type: String, trim: true, default: "" },
    source: { type: String, enum: ["youtube", "spotify"], default: "youtube" },
    sourceId: { type: String, trim: true, default: "" },
    error: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const songSchema = new mongoose.Schema(
  {
    songId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    audioKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    normalizedKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    title: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    thumbnail: { type: String, trim: true, default: "" },
    duration: { type: Number, default: 0 },

    canonical: {
      title: { type: String, trim: true, default: "" },
      artist: { type: String, trim: true, default: "" },
      duration: { type: Number, default: 0 },
    },

    audio: {
      type: audioSchema,
      default: () => ({}),
    },

    providers: {
      youtube: {
        type: providerSchema,
        default: null,
      },
      spotify: {
        type: providerSchema,
        default: null,
      },
    },

    preferredProvider: {
      type: String,
      enum: ["youtube", "spotify"],
      default: "youtube",
    },
  },
  { timestamps: true },
);

songSchema.index({ audioKey: 1 }, { unique: true });
songSchema.index({ normalizedKey: 1 }, { unique: true });

export default mongoose.model("Song", songSchema);

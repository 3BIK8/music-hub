import dns from "node:dns/promises";
dns.setServers(["1.1.1.1"]); // Cloudflare DNS
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import songRoutes from "./routes/songRoutes.js";
import fetchRoutes from "./routes/fetchRoutes.js";
import playlistRoutes from "./routes/playlistRoutes.js";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/songs", songRoutes);
app.use("/api/fetch", fetchRoutes);
app.use("/api/playlists", playlistRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(process.env.PORT, () => console.log("Server running"));

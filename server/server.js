import dns from "node:dns/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dns.setServers(["1.1.1.1"]); // Cloudflare DNS

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(serverDirectory, ".env") });

const [
  { default: express },
  { default: mongoose },
  { default: cors },
  { default: songRoutes },
  { default: fetchRoutes },
  { default: playlistRoutes },
  { default: spotifyRoutes },
] = await Promise.all([
  import("express"),
  import("mongoose"),
  import("cors"),
  import("./routes/songRoutes.js"),
  import("./routes/fetchRoutes.js"),
  import("./routes/playlistRoutes.js"),
  import("./routes/spotifyRoutes.js"),
]);

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/songs", songRoutes);
app.use("/api/fetch", fetchRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/spotify", spotifyRoutes);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));
app.get("/test", (req, res) => {
  res.json({ ok: true });
});
app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(process.env.PORT, () => console.log("Server running"));

import { useState } from "react";
import api from "../../api/axios";
import "./AddSong.css";

export default function AddSong({ onAdd, onPlayNext }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e, playNext = false) => {
    e.preventDefault();
    setError("");

    if (!url) return;

    setIsLoading(true);

    try {
      const res = await api.post("/songs", { title, url });

      const payload = res.data;
      const song = payload.song || payload;

      const enrichedSong = {
        ...song,
        isExisting: payload.isExisting || false,
      };

      if (playNext && onPlayNext) {
        onPlayNext(enrichedSong);
      } else if (onAdd) {
        onAdd(enrichedSong);
      }

      setTitle("");
      setUrl("");
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed";

      setError(msg);
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-song-form">
      <input
        className="add-song-input"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="YouTube URL"
        disabled={isLoading}
      />

      <div className="add-song-buttons">
        <button disabled={!url.trim() || isLoading}>
          {isLoading ? "Extracting..." : "Add to Queue"}
        </button>

        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={!url.trim() || isLoading}
        >
          {isLoading ? "Extracting..." : "Play Next"}
        </button>
      </div>

      {error && <p className="add-song-error">{error}</p>}
    </form>
  );
}

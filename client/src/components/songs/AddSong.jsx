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
      const res = await api.post("/songs", {
        title,
        url,
      });

      if (playNext && onPlayNext) {
        onPlayNext(res.data);
      } else if (onAdd) {
        onAdd(res.data);
      }

      setTitle("");
      setUrl("");
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to add song";
      setError(errorMsg);
      alert(errorMsg);
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
        <button
          type="submit"
          className="add-song-button"
          disabled={!url.trim() || isLoading}
        >
          {isLoading ? "Extracting..." : "Add to Queue"}
        </button>

        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          className="add-song-button play-next-btn"
          disabled={!url.trim() || isLoading}
        >
          {isLoading ? "Extracting..." : "Play Next"}
        </button>
      </div>

      {isLoading && <div className="add-song-progress"></div>}

      {error && <p className="add-song-error">{error}</p>}
    </form>
  );
}

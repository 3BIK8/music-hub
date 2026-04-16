import React, { useState, useContext } from "react";
import api from "../../api/axios";
import { convertSpotifyTrack } from "../../api/spotifyApi";
import { PlayerContext } from "../../context/PlayerContext";

export default function SpotifySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  const { addSongOptimistic, updateSong, songExists } =
    useContext(PlayerContext);

  const search = async () => {
    try {
      const res = await api.get(`/spotify/search?q=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError("Search failed");
      setTimeout(() => setError(""), 3000);
    }
  };

  const addSong = async (track) => {
    if (songExists(track)) {
      setError("Already in queue");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (loadingId === track.id) return;

    setLoadingId(track.id);

    const tempId = "temp-" + Date.now();
    const sourceId = track.id;

    addSongOptimistic({
      id: track.id,
      title: track.name,
      thumbnail: track.image,
      audioUrl: null,
      processing: true,
    });

    try {
      const res = await convertSpotifyTrack(track);

      const alreadyInQueue = songExists(res);

      if (alreadyInQueue) {
        updateSong(tempId, null);
        setError("Already exists");
        setTimeout(() => setError(""), 3000);
        return;
      }

      updateSong(tempId, {
        ...res,
        sourceId,
        processing: false,
      });
    } catch (err) {
      console.error(err);

      updateSong(tempId, null);
      setError("Failed to add song");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Spotify..."
      />
      <button onClick={search}>Search</button>

      {error && <div className="error-toast">{error}</div>}

      <div>
        {results.map((t) => (
          <div key={t.id}>
            <img src={t.image} width="50" alt="" />
            <span>
              {t.name} - {t.artist}
            </span>

            <button onClick={() => addSong(t)} disabled={loadingId === t.id}>
              {loadingId === t.id ? "Adding..." : "Add"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

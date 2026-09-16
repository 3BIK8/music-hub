import React, { useContext, useState } from "react";
import api from "../../api/axios";
import { convertSpotifyTrack } from "../../api/spotifyApi";
import { PlayerContext } from "../../context/PlayerContextV2";

export default function SpotifySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");
  const { addSong, songExists } = useContext(PlayerContext);

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(""), 3000);
  };

  const search = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    try {
      const res = await api.get(`/spotify/search?q=${encodeURIComponent(trimmedQuery)}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      showError("Search failed");
    }
  };

  const addTrack = async (track) => {
    if (!track?.id || loadingId === track.id) return;
    setLoadingId(track.id);
    try {
      const result = await convertSpotifyTrack(track);
      const savedSong = result?.song || result;
      const id = savedSong?.id || savedSong?.songId;
      if (!id) throw new Error("Invalid song payload returned from server");
      if (songExists(id)) {
        showError("Already in queue");
        return;
      }
      addSong(savedSong, { startPlaying: !savedSong.audioUrl });
    } catch (err) {
      console.error(err);
      showError("Failed to add song");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Spotify..." />
      <button onClick={search}>Search</button>
      {error && <div className="error-toast">{error}</div>}
      <div>
        {results.map((track) => {
          const alreadyInQueue = songExists(`spotify_${track.id}`);
          return (
            <div key={track.id}>
              <img src={track.image} width="50" alt="" />
              <span>{track.name} - {track.artist}</span>
              <button onClick={() => addTrack(track)} disabled={loadingId === track.id || alreadyInQueue}>
                {alreadyInQueue ? "Added" : loadingId === track.id ? "Adding..." : "Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

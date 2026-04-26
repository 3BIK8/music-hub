import React, { useContext, useState } from "react";
import api from "../../api/axios";
import { convertSpotifyTrack } from "../../api/spotifyApi";
import { PlayerContext } from "../../context/PlayerContext";

export default function SpotifySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  const { addSongOptimistic, updateSong, removeSong, songExists } =
    useContext(PlayerContext);

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

  const addSong = async (track) => {
    if (!track?.id) return;

    const spotifySongId = `spotify_${track.id}`;

    if (songExists(spotifySongId)) {
      showError("Already in queue");
      return;
    }

    if (loadingId === track.id) return;

    setLoadingId(track.id);

    addSongOptimistic({
      songId: spotifySongId,
      platform: "spotify",
      sourceId: track.id,
      title: track.name,
      thumbnail: track.image,
      url: track.url,
      audioUrl: "",
      duration: "",
      processing: true,
    });

    try {
      const savedSong = await convertSpotifyTrack(track);

      if (!savedSong?.songId) {
        throw new Error("Invalid song payload returned from server");
      }

      updateSong(spotifySongId, {
        ...savedSong,
        processing: false,
      });
    } catch (err) {
      console.error(err);
      removeSong(spotifySongId);
      showError("Failed to add song");
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
        {results.map((track) => {
          const spotifySongId = `spotify_${track.id}`;
          const alreadyInQueue = songExists(spotifySongId);

          return (
            <div key={track.id}>
              <img src={track.image} width="50" alt="" />
              <span>
                {track.name} - {track.artist}
              </span>

              <button
                onClick={() => addSong(track)}
                disabled={loadingId === track.id || alreadyInQueue}
              >
                {alreadyInQueue
                  ? "Added"
                  : loadingId === track.id
                    ? "Adding..."
                    : "Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

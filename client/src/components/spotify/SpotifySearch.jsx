import React, { useState, useContext } from "react";
import api from "../../api/axios";
import { convertSpotifyTrack } from "../../api/spotifyApi";
import { PlayerContext } from "../../context/PlayerContext";

export default function SpotifySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const { addSongOptimistic, updateSong, songExists } =
    useContext(PlayerContext);

  const search = async () => {
    try {
      const res = await api.get(`/spotify/search?q=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addSong = async (track) => {
    if (songExists(track)) {
      alert("Already in queue");
      return;
    }

    const tempId = "temp-" + Date.now();

    // IMPORTANT: use ONE unified id field
    const sourceId = track.id;

    addSongOptimistic({
      _id: tempId,
      sourceId, // 🔥 THIS is now the real dedupe key
      title: track.name,
      thumbnail: track.image,
      audioUrl: null,
      processing: true,
    });

    try {
      const res = await convertSpotifyTrack(track);

      // preserve sourceId in final song too
      updateSong(tempId, {
        ...res.data,
        sourceId,
      });
    } catch (err) {
      console.error(err);
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

      <div>
        {results.map((t) => (
          <div key={t.id}>
            <img src={t.image} width="50" alt="" />
            <span>
              {t.name} - {t.artist}
            </span>
            <button onClick={() => addSong(t)}>Add</button>
          </div>
        ))}
      </div>
    </div>
  );
}

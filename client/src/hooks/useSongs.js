import { useEffect, useState } from "react";
import api from "../api/axios";

const dedupeBySongId = (songs = []) => {
  const seen = new Set();
  const deduped = [];

  for (const song of songs) {
    const songId = song?.songId;
    if (!songId || seen.has(songId)) continue;

    seen.add(songId);
    deduped.push(song);
  }

  return deduped;
};

export const useSongs = () => {
  const [songs, setSongs] = useState([]);

  const fetchSongs = async () => {
    try {
      const res = await api.get("/songs");
      setSongs(dedupeBySongId(res.data));
    } catch (err) {
      console.error("Failed to fetch songs:", err);
    }
  };

  const addSongs = (songOrSongs) => {
    const incomingSongs = Array.isArray(songOrSongs)
      ? songOrSongs
      : [songOrSongs];

    setSongs((prevSongs) => {
      const merged = dedupeBySongId([...incomingSongs, ...prevSongs]);

      merged.sort((a, b) => {
        if (a.isExisting && !b.isExisting) return -1;
        if (!a.isExisting && b.isExisting) return 1;
        return 0;
      });

      return merged;
    });
  };

  const deleteSong = (songOrId) => {
    const payload =
      typeof songOrId === "object" && songOrId !== null
        ? songOrId
        : {
            songId: String(songOrId || "").includes("_") ? songOrId : null,
            _id: String(songOrId || "").includes("_") ? null : songOrId,
          };

    setSongs((prevSongs) => {
      return prevSongs.filter((song) => {
        if (payload.songId && song.songId === payload.songId) return false;
        if (payload._id && song._id === payload._id) return false;
        return true;
      });
    });
  };

  const cleanupInvalidSongs = async () => {
    try {
      const res = await api.delete("/songs/cleanup/invalid");
      alert(res.data.msg);
      fetchSongs();
    } catch (err) {
      console.error("Failed to cleanup:", err);
      alert("Failed to cleanup: " + err.message);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  return {
    songs,
    fetchSongs,
    addSongs,
    deleteSong,
    cleanupInvalidSongs,
  };
};

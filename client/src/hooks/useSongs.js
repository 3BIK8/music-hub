import { useEffect, useState } from "react";
import api from "../api/axios";

const getSongKey = (song = {}) => {
  const key = String(
    song.audioKey || song.normalizedKey || song._id || song.songId || "",
  ).trim();
  return key || null;
};

const dedupeBySongId = (songs = []) => {
  const seen = new Set();
  const deduped = [];

  for (const song of songs) {
    const songId = getSongKey(song);
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
    let matchById = null;
    if (typeof songOrId === "object" && songOrId !== null) {
      matchById = songOrId._id || songOrId.songId || null;
    } else if (typeof songOrId === "string") {
      const str = songOrId;
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(str);
      matchById = isMongoId ? { _id: str } : { songId: str };
    }

    if (!matchById) return;

    setSongs((prevSongs) => {
      return prevSongs.filter((song) => {
        if (matchById._id && song._id === matchById._id) return false;
        if (matchById.songId && song.songId === matchById.songId) return false;
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

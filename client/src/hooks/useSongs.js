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

  const deleteSong = async (songOrId) => {
    let songId = null;
    if (typeof songOrId === "object" && songOrId !== null) {
      songId = songOrId._id || songOrId.songId || null;
    } else if (typeof songOrId === "string") {
      songId = songOrId;
    }

    if (!songId) return false;
    if (!window.confirm("Delete this song from your library?")) return false;

    try {
      await api.delete(`/songs/${songId}`);
      setSongs((prevSongs) =>
        prevSongs.filter(
          (song) => song._id !== songId && song.songId !== songId,
        ),
      );
      return true;
    } catch (err) {
      console.error("Failed to delete song:", err);
      window.alert(
        err.response?.data?.error || err.message || "Failed to delete song",
      );
      return false;
    }
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

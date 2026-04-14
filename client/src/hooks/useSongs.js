import { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { PlayerContext } from "../context/PlayerContext";

export const useSongs = () => {
  const [songs, setSongs] = useState([]);
  const { setQueue } = useContext(PlayerContext);

  const fetchSongs = async () => {
    try {
      const res = await api.get("/songs");
      setSongs(res.data);
    } catch (err) {
      console.error("Failed to fetch songs:", err);
    }
  };

  const addSongs = (songOrSongs) => {
    const newSongs = Array.isArray(songOrSongs) ? songOrSongs : [songOrSongs];
    const updated = [...newSongs, ...songs];
    setSongs(updated);
    setQueue(updated);
  };

  const deleteSong = (id) => {
    const updated = songs.filter((s) => s._id !== id);
    setSongs(updated);
    setQueue(updated);
  };

  const cleanupInvalidSongs = async () => {
    try {
      const res = await api.delete("/songs/cleanup/invalid");
      alert(res.data.msg);
      fetchSongs(); // Refresh the list
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

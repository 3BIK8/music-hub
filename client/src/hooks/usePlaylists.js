import { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { PlayerContext } from "../context/PlayerContext";

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const { setQueue } = useContext(PlayerContext);

  const fetchPlaylists = async () => {
    try {
      const res = await api.get("/playlists");
      setPlaylists(res.data);
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    }
  };

  const createPlaylist = async (name, description = "") => {
    try {
      const res = await api.post("/playlists", { name, description });
      setPlaylists([res.data, ...playlists]);
      return res.data;
    } catch (err) {
      console.error("Failed to create playlist:", err);
      throw err;
    }
  };

  const deletePlaylist = async (playlistId) => {
    try {
      await api.delete(`/playlists/${playlistId}`);
      setPlaylists(playlists.filter((p) => p._id !== playlistId));
      if (selectedPlaylist?._id === playlistId) {
        setSelectedPlaylist(null);
      }
    } catch (err) {
      console.error("Failed to delete playlist:", err);
      throw err;
    }
  };

  const selectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  return {
    playlists,
    selectedPlaylist,
    fetchPlaylists,
    createPlaylist,
    deletePlaylist,
    selectPlaylist,
  };
};

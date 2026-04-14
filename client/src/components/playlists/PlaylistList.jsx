import { useState, useEffect } from "react";
import api from "../../api/axios";
import "./PlaylistList.css";

export default function PlaylistList({ onSelectPlaylist, selectedPlaylistId }) {
  const [playlists, setPlaylists] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await api.get("/playlists");
      setPlaylists(res.data);
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const res = await api.post("/playlists", {
        name: newPlaylistName.trim(),
        description: "",
      });
      setPlaylists([res.data, ...playlists]);
      setNewPlaylistName("");
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to create playlist:", err);
      alert("Failed to create playlist");
    }
  };

  const handleDeletePlaylist = async (playlistId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this playlist?"))
      return;

    try {
      await api.delete(`/playlists/${playlistId}`);
      setPlaylists(playlists.filter((p) => p._id !== playlistId));
      if (selectedPlaylistId === playlistId) {
        onSelectPlaylist(null);
      }
    } catch (err) {
      console.error("Failed to delete playlist:", err);
      alert("Failed to delete playlist");
    }
  };

  return (
    <div className="playlist-list">
      <div className="playlist-header">
        <h3>Playlists</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="create-playlist-btn"
        >
          {isCreating ? "✕" : "+"}
        </button>
      </div>

      {isCreating && (
        <div className="create-playlist-form">
          <input
            type="text"
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreatePlaylist()}
            className="create-playlist-input"
          />
          <button
            onClick={handleCreatePlaylist}
            className="create-playlist-submit"
          >
            Create
          </button>
        </div>
      )}

      <div className="playlists-container">
        {playlists.map((playlist) => (
          <div
            key={playlist._id}
            className={`playlist-item ${selectedPlaylistId === playlist._id ? "active" : ""}`}
            onClick={() => onSelectPlaylist(playlist)}
          >
            <div className="playlist-item-info">
              <div className="playlist-item-title">{playlist.name}</div>
              <div className="playlist-item-count">
                {playlist.songs?.length || 0} songs
              </div>
            </div>
            <button
              onClick={(e) => handleDeletePlaylist(playlist._id, e)}
              className="playlist-item-delete"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useContext, useEffect } from "react";
import Player from "./components/player/Player";
import QueueView from "./components/queue/QueueView";
import MainContent from "./components/MainContent";
import Sidebar from "./components/Sidebar";
import { PlayerContext } from "./context/PlayerContext";
import { useSongs } from "./hooks/useSongs";
import { usePlaylists } from "./hooks/usePlaylists";
import api from "./api/axios";
import { useSearch } from "./hooks/useSearch";
import "./styles.css";

function App() {
  const { addSongOptimistic, removeSong } = useContext(PlayerContext);

  const { songs, addSongs, deleteSong, cleanupInvalidSongs } = useSongs();
  const {
    playlists,
    selectedPlaylist,
    selectPlaylist,
    createPlaylist,
    fetchPlaylists,
  } = usePlaylists();
  const { searchTerm, setSearchTerm, filteredSongs } = useSearch(songs);

  useEffect(() => {
    // Queue is user-managed and independent from library filtering.
    // Removed automatic syncing of queue with filteredSongs/playlist.
  }, []);

  const handleDeleteSong = async (song) => {
    const deleted = await deleteSong(song);
    if (deleted) removeSong(song);
  };

  const handleAddSongs = (songOrSongs) => {
    const incomingSongs = Array.isArray(songOrSongs)
      ? songOrSongs
      : [songOrSongs];

    addSongs(incomingSongs);
    incomingSongs.forEach((song) => addSongOptimistic(song));
  };

  const handlePlayNext = (song) => {
    if (!song?.songId) return;

    addSongs(song);
    addSongOptimistic(song, { playNext: true });
  };

  const handleAddToPlaylist = async (song) => {
    try {
      if (!playlists || playlists.length === 0) {
        const name = window.prompt(
          "No playlists found. Enter a name to create one:",
        );
        if (!name) return;
        await createPlaylist(name);
        await fetchPlaylists();
      }

      const listText = playlists
        .map((p, i) => `${i + 1}: ${p.name}`)
        .join("\n");
      const choice = window.prompt(
        `Choose a playlist number to add:\n${listText}`,
      );
      const idx = Number(choice) - 1;
      if (!Number.isFinite(idx) || idx < 0 || idx >= playlists.length) return;

      const playlistId = playlists[idx]._id;
      const songId = song._id || song.songId;
      await api.post(`/playlists/${playlistId}/songs`, { songId });
      window.alert("Added to playlist");
    } catch (err) {
      console.error("Add to playlist failed", err);
      window.alert("Failed to add to playlist");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        selectedPlaylistId={selectedPlaylist?._id}
        onSelectPlaylist={selectPlaylist}
      />

      <MainContent
        songs={songs}
        filteredSongs={filteredSongs}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAddSongs={handleAddSongs}
        onDeleteSong={handleDeleteSong}
        onCleanup={cleanupInvalidSongs}
        onAddToPlaylist={handleAddToPlaylist}
        onPlayNext={handlePlayNext}
      />

      <div className="sidebar-right">
        <QueueView />
      </div>

      <Player />
    </div>
  );
}

export default App;

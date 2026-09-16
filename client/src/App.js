import { useContext, useEffect } from "react";
import Player from "./components/player/Player";
import QueueView from "./components/queue/QueueView";
import MainContent from "./components/MainContent";
import Sidebar from "./components/Sidebar";
import { PlayerContext } from "./context/PlayerContextV2";
import { useSongs } from "./hooks/useSongs";
import { usePlaylists } from "./hooks/usePlaylists";
import { useSearch } from "./hooks/useSearch";
import "./styles.css";

function App() {
  const { replaceQueue, addSong } = useContext(PlayerContext);
  const { songs, addSongs, deleteSong, cleanupInvalidSongs } = useSongs();
  const { selectedPlaylist, selectPlaylist } = usePlaylists();
  const { searchTerm, setSearchTerm, filteredSongs } = useSearch(songs);

  useEffect(() => {
    replaceQueue(selectedPlaylist ? selectedPlaylist.songs || [] : filteredSongs);
  }, [filteredSongs, selectedPlaylist, replaceQueue]);

  const handlePlayNext = (song) => {
    if (!song) return;
    addSong(song, { playNext: true });
  };

  const handleAddToPlaylist = async (song) => {
    alert(`Add "${song.title}" to playlist - feature coming soon!`);
  };

  return (
    <div className="app-layout">
      <Sidebar selectedPlaylistId={selectedPlaylist?._id} onSelectPlaylist={selectPlaylist} />
      <MainContent
        songs={songs}
        filteredSongs={filteredSongs}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAddSongs={addSongs}
        onDeleteSong={deleteSong}
        onCleanup={cleanupInvalidSongs}
        onAddToPlaylist={handleAddToPlaylist}
        onPlayNext={handlePlayNext}
      />
      <div className="sidebar-right"><QueueView /></div>
      <Player />
    </div>
  );
}

export default App;

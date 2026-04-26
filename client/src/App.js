import { useContext, useEffect } from "react";
import Player from "./components/player/Player";
import QueueView from "./components/queue/QueueView";
import MainContent from "./components/MainContent";
import Sidebar from "./components/Sidebar";
import { PlayerContext } from "./context/PlayerContext";
import { useSongs } from "./hooks/useSongs";
import { usePlaylists } from "./hooks/usePlaylists";
import { useSearch } from "./hooks/useSearch";
import "./styles.css";

function App() {
  const { setQueue, currentSong } = useContext(PlayerContext);

  const { songs, addSongs, deleteSong, cleanupInvalidSongs } = useSongs();
  const { selectedPlaylist, selectPlaylist } = usePlaylists();
  const { searchTerm, setSearchTerm, filteredSongs } = useSearch(songs);

  useEffect(() => {
    const songsToShow = selectedPlaylist ? selectedPlaylist.songs || [] : filteredSongs;
    setQueue(songsToShow);
  }, [filteredSongs, selectedPlaylist, setQueue]);

  const handlePlayNext = (song) => {
    if (!song?.songId) return;

    setQueue((prevQueue) => {
      const withoutDuplicate = prevQueue.filter(
        (queuedSong) => queuedSong.songId !== song.songId,
      );

      if (!currentSong?.songId) {
        return [song, ...withoutDuplicate];
      }

      const currentPosition = withoutDuplicate.findIndex(
        (queuedSong) => queuedSong.songId === currentSong.songId,
      );

      if (currentPosition < 0) {
        return [song, ...withoutDuplicate];
      }

      const nextQueue = [...withoutDuplicate];
      nextQueue.splice(currentPosition + 1, 0, song);
      return nextQueue;
    });
  };

  const handleAddToPlaylist = async (song) => {
    alert(`Add "${song.title}" to playlist - feature coming soon!`);
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
        onAddSongs={addSongs}
        onDeleteSong={deleteSong}
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

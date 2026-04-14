import AddSong from "../components/songs/AddSong";
import SongList from "../components/songs/SongList";
import "./MainContent.css";

const MainContent = ({
  songs,
  filteredSongs,
  searchTerm,
  setSearchTerm,
  onAddSongs,
  onDeleteSong,
  onCleanup,
  onAddToPlaylist,
  onPlayNext,
}) => {
  return (
    <div className="main-grid">
      <h1>Music Hub</h1>

      <AddSong onAdd={onAddSongs} onPlayNext={onPlayNext} />

      <input
        type="text"
        placeholder="Search songs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="main-content-search"
      />

      <button onClick={onCleanup} className="main-content-cleanup-btn">
        🧹 Clean Up Invalid Songs
      </button>

      <SongList
        songs={filteredSongs}
        onDelete={onDeleteSong}
        searchTerm={searchTerm}
        onAddToPlaylist={onAddToPlaylist}
      />
    </div>
  );
};

export default MainContent;

import PlaylistList from "./playlists/PlaylistList";
import SpotifySearch from "./spotify/SpotifySearch";

const Sidebar = ({ selectedPlaylistId, onSelectPlaylist }) => {
  return (
    <div className="sidebar-left">
      <PlaylistList
        onSelectPlaylist={onSelectPlaylist}
        selectedPlaylistId={selectedPlaylistId}
      />
      <SpotifySearch />
    </div>
  );
};

export default Sidebar;

import PlaylistList from "./playlists/PlaylistList";

const Sidebar = ({ selectedPlaylistId, onSelectPlaylist }) => {
  return (
    <div className="sidebar-left">
      <PlaylistList
        onSelectPlaylist={onSelectPlaylist}
        selectedPlaylistId={selectedPlaylistId}
      />
    </div>
  );
};

export default Sidebar;

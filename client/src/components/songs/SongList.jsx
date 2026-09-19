import React, { useContext } from "react";
import SongItem from "./SongItem";
import { PlayerContext } from "../../context/PlayerContext";
import "./SongList.css";

const getSongKey = (song = {}) =>
  String(
    song.audioKey || song.normalizedKey || song._id || song.songId || "",
  ).trim();

export default function SongList({
  songs = [],
  onDelete,
  searchTerm = "",
  onAddToPlaylist,
}) {
  const { addSongOptimistic, playSongBySongId } = useContext(PlayerContext);

  return (
    <div className="songlist-container">
      <div className="songlist-grid">
        {songs.map((song) => {
          const key = getSongKey(song) || song._id || song.songId;

          return (
            <div key={key} className="songlist-card-wrapper">
              <SongItem
                song={song}
                isSearchResult={true}
                onPlay={() => playSongBySongId(getSongKey(song) || song.songId)}
                onAddToPlaylist={onAddToPlaylist}
                onDelete={onDelete}
                onAddToQueue={() => addSongOptimistic(song)}
                onPlayNow={() =>
                  addSongOptimistic(song, { startPlaying: true })
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

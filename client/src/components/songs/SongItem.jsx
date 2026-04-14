import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SongItem({
  song,
  index,
  isDragging,
  justDragged,
  setCurrentIndex,
  setIsPlaying,
  isSearchResult = false,
  onAddToPlaylist,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: song._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="songlist-card"
      {...attributes}
      {...listeners}
      onClick={() => {
        if (isDragging || justDragged) return;

        setCurrentIndex(index);
        setIsPlaying(true);
      }}
    >
      {!isSearchResult && <div className="songlist-drag-indicator">⋮⋮</div>}

      <img src={song.thumbnail} alt={song.title} className="songlist-img" />

      <div className="songlist-overlay">
        <p className="songlist-title">{song.title}</p>
        <div className="songlist-actions">
          <button
            className="song-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              // Show playlist menu or play next
              if (onAddToPlaylist) {
                onAddToPlaylist(song);
              }
            }}
            title="Add to playlist"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

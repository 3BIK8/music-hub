import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SongItem({
  song,
  index,
  isDragging,
  justDragged,
  onPlay,
  isSearchResult = false,
  onAddToPlaylist,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: song._id }); // 🔥 ONLY _id

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!song) return null;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="songlist-card"
      {...attributes}
      {...listeners}
      onClick={() => {
        if (isDragging || justDragged) return;
        onPlay?.();
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
              onAddToPlaylist?.(song);
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

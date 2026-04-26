import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SongItem({
  song,
  isDragging,
  justDragged,
  onPlay,
  isSearchResult = false,
  onAddToPlaylist,
  dragOverlay = false,
}) {
  const songId = song?.songId || "missing-song-id";

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: songId,
      disabled: dragOverlay || isSearchResult || !song?.songId,
    });

  if (!song?.songId) return null;

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
        onPlay?.();
      }}
    >
      {!isSearchResult && !dragOverlay && (
        <div className="songlist-drag-indicator">..</div>
      )}

      <img src={song.thumbnail} alt={song.title} className="songlist-img" />

      <div className="songlist-overlay">
        <p className="songlist-title">{song.title}</p>

        {song.isExisting && (
          <span className="songlist-duplicate">Already in queue</span>
        )}

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

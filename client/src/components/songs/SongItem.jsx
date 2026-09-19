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
  onAddToQueue,
  onPlayNow,
  dragOverlay = false,
  onDelete,
}) {
  const dragId = String(
    song?.audioKey || song?.normalizedKey || song?._id || song?.songId || "",
  ).trim();

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: dragId || song.songId || "drag-id",
      disabled: dragOverlay || isSearchResult || !dragId,
    });

  if (!song) return null;

  const providerMeta =
    song.providers?.[song.preferredProvider] ||
    song.providers?.spotify ||
    song.providers?.youtube ||
    {};

  const title =
    providerMeta.title || song.canonical?.title || song.title || "Unknown";
  const artist = providerMeta.artist || song.canonical?.artist || "";
  const thumbnail =
    providerMeta.thumbnail || providerMeta.image || song.thumbnail || "";
  const processing = song.audio?.status !== "ready";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDragStart = (e) => {
    try {
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("application/json", JSON.stringify(song));
    } catch (err) {
      // ignore
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="songlist-card"
      draggable={isSearchResult}
      onDragStart={isSearchResult ? handleDragStart : undefined}
      onClick={() => {
        if (isDragging || justDragged) return;
        onPlay?.();
      }}
    >
      {!isSearchResult && !dragOverlay && (
        <div className="songlist-drag-indicator">⋮⋮</div>
      )}

      <div className="songlist-image-wrapper">
        <img
          src={thumbnail}
          alt={title + " thumbnail"}
          className="songlist-img"
        />
        {processing && (
          <span className="songlist-processing">processing...</span>
        )}
        {song.isExisting && !processing && (
          <span className="songlist-duplicate">Already in queue</span>
        )}
      </div>

      <div className="songlist-card-footer">
        <div className="songlist-title">{title}</div>
        {artist && <div className="songlist-artist">{artist}</div>}

        <div className="songlist-actions-row">
          <button
            aria-label={`Drag handle for ${title}`}
            className="drag-handle"
            {...attributes}
            {...listeners}
          >
            ☰
          </button>

          {isSearchResult ? (
            <>
              <button
                aria-label={`Add ${title} to queue`}
                className="song-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToQueue?.(song);
                }}
              >
                ▶
              </button>

              <button
                aria-label={`Play ${title} now`}
                className="song-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayNow?.(song);
                }}
              >
                ⏵
              </button>
            </>
          ) : null}

          <button
            aria-label={`Add ${title} to playlist`}
            className="song-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlaylist?.(song);
            }}
          >
            +
          </button>

          <button
            aria-label={`Delete ${title}`}
            className="song-action-btn danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(song);
            }}
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

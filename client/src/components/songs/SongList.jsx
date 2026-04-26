import React, { useContext, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import api from "../../api/axios";
import { PlayerContext } from "../../context/PlayerContext";
import SongItem from "./SongItem";
import "./SongList.css";

function TrashZone({ isDraggingOver }) {
  const { setNodeRef } = useDroppable({ id: "trash-zone" });

  return (
    <div
      ref={setNodeRef}
      className={`trash-zone ${isDraggingOver ? "active" : ""}`}
    >
      Drop to delete
    </div>
  );
}

export default function SongList({
  songs = [],
  onDelete,
  searchTerm = "",
  onAddToPlaylist,
}) {
  const { queue, setQueue, removeSong, playSongBySongId, getId } =
    useContext(PlayerContext);

  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const isSearchActive = searchTerm.trim() !== "";

  const safeQueue = useMemo(
    () => queue.filter((song) => song && getId(song)),
    [queue, getId],
  );

  const list = useMemo(() => {
    const source = isSearchActive ? songs : safeQueue;
    return source.filter((song) => song && getId(song));
  }, [isSearchActive, songs, safeQueue, getId]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setIsDragging(false);
    setIsDraggingOver(false);
    setActiveId(null);

    if (!over) return;

    const draggedSongId = String(active.id || "");
    if (!draggedSongId) return;

    // =========================
    // DELETE FLOW (FIXED)
    // =========================
    if (over.id === "trash-zone") {
      const songToDelete = safeQueue.find(
        (song) => song.songId === draggedSongId,
      );

      if (!songToDelete) return;

      try {
        // ALWAYS prefer Mongo ID
        if (songToDelete._id) {
          await api.delete(`/songs/${songToDelete._id}`);
        } else {
          console.warn("Missing _id for deletion:", songToDelete);
        }

        removeSong(songToDelete.songId);
        onDelete?.(songToDelete);
      } catch (error) {
        console.error("Delete failed", error);
      }

      return;
    }

    // =========================
    // SEARCH MODE LOCK
    // =========================
    if (isSearchActive) return;

    // =========================
    // REORDER QUEUE
    // =========================
    if (active.id === over.id) return;

    setQueue((prevQueue) => {
      const oldIndex = prevQueue.findIndex((song) => song.songId === active.id);
      const newIndex = prevQueue.findIndex((song) => song.songId === over.id);

      if (oldIndex < 0 || newIndex < 0) return prevQueue;

      return arrayMove(prevQueue, oldIndex, newIndex);
    });
  };

  return (
    <div className={`songlist-container ${isDragging ? "no-select" : ""}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => {
          setActiveId(String(active.id));
          setIsDragging(true);
        }}
        onDragEnd={handleDragEnd}
        onDragOver={(event) =>
          setIsDraggingOver(event.over?.id === "trash-zone")
        }
      >
        {isDragging && !isSearchActive && (
          <TrashZone isDraggingOver={isDraggingOver} />
        )}

        <SortableContext
          items={list.map((song) => song.songId)}
          strategy={rectSortingStrategy}
        >
          <div className="songlist-grid">
            {list.map((song) => (
              <SongItem
                key={song.songId}
                song={song}
                isSearchResult={isSearchActive}
                onAddToPlaylist={onAddToPlaylist}
                onPlay={() => playSongBySongId(song.songId)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <SongItem
              song={safeQueue.find((song) => song.songId === activeId)}
              dragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

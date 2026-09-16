import React, { useContext, useMemo, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, closestCorners, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import api from "../../api/axios";
import { PlayerContext } from "../../context/PlayerContextV2";
import SongItem from "./SongItem";
import "./SongList.css";

function TrashZone({ isDraggingOver }) {
  const { setNodeRef } = useDroppable({ id: "trash-zone" });
  return <div ref={setNodeRef} className={`trash-zone ${isDraggingOver ? "active" : ""}`}>Drop to delete</div>;
}

export default function SongList({ songs = [], onDelete, searchTerm = "", onAddToPlaylist }) {
  const { queue, reorderQueue, removeSong, playSongBySongId, getId } = useContext(PlayerContext);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const isSearchActive = searchTerm.trim() !== "";
  const safeQueue = useMemo(() => queue.filter((song) => song && getId(song)), [queue, getId]);
  const list = useMemo(() => (isSearchActive ? songs : safeQueue).filter((song) => song && getId(song)), [isSearchActive, songs, safeQueue, getId]);

  const handleDragEnd = async ({ active, over }) => {
    setIsDragging(false);
    setIsDraggingOver(false);
    setActiveId(null);
    if (!over) return;
    const draggedSongId = String(active.id || "");
    if (!draggedSongId) return;

    if (over.id === "trash-zone") {
      const songToDelete = safeQueue.find((song) => getId(song) === draggedSongId);
      if (!songToDelete) return;
      try {
        if (!songToDelete._id) throw new Error("Song is missing persistence id");
        await api.delete(`/songs/${songToDelete._id}`);
        removeSong(draggedSongId);
        onDelete?.(songToDelete);
      } catch (error) {
        console.error("Delete failed", error);
      }
      return;
    }

    if (isSearchActive || active.id === over.id) return;
    reorderQueue(String(active.id), String(over.id));
  };

  return (
    <div className={`songlist-container ${isDragging ? "no-select" : ""}`}>
      <DndContext sensors={sensors} collisionDetection={closestCorners}
        onDragStart={({ active }) => { setActiveId(String(active.id)); setIsDragging(true); }}
        onDragEnd={handleDragEnd}
        onDragOver={(event) => setIsDraggingOver(event.over?.id === "trash-zone")}>
        {isDragging && !isSearchActive && <TrashZone isDraggingOver={isDraggingOver} />}
        <SortableContext items={list.map((song) => getId(song))} strategy={rectSortingStrategy}>
          <div className="songlist-grid">
            {list.map((song) => (
              <SongItem key={getId(song)} song={song} isSearchResult={isSearchActive}
                onAddToPlaylist={onAddToPlaylist} onPlay={() => playSongBySongId(getId(song))} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>{activeId ? <SongItem song={safeQueue.find((song) => getId(song) === activeId)} dragOverlay /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

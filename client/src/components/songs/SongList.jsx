import React, { useContext, useState } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
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
  const { setNodeRef } = useDroppable({
    id: "trash-zone",
  });

  return (
    <div
      ref={setNodeRef}
      className={`trash-zone ${isDraggingOver ? "active" : ""}`}
    >
      🗑️ Drop to delete
    </div>
  );
}

export default function SongList({
  songs,
  onDelete,
  searchTerm = "",
  onAddToPlaylist,
}) {
  const { queue, setQueue, setCurrentIndex, setIsPlaying, currentIndex } =
    useContext(PlayerContext);

  const filteredQueue = songs;

  const [isDragging, setIsDragging] = useState(false);
  const [justDragged, setJustDragged] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setIsDragging(false);
    setIsDraggingOver(false);
    setJustDragged(true);
    setTimeout(() => setJustDragged(false), 150);

    if (!over) return;

    if (over.id === "trash-zone") {
      const songId = active.id;
      try {
        await api.delete(`/songs/${songId}`);
        const updated = queue.filter((s) => s._id !== songId);
        setQueue(updated);
        if (onDelete) onDelete(songId);
      } catch (err) {
        console.error("Failed to delete song", err);
      }
      return;
    }

    if (active.id === over.id) return;

    const oldIndex = queue.findIndex((s) => s._id === active.id);
    const newIndex = queue.findIndex((s) => s._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newQueue = arrayMove(queue, oldIndex, newIndex);
    setQueue(newQueue);
  };

  const handleDragOver = (event) => {
    setIsDraggingOver(event.over?.id === "trash-zone");
  };

  const isSearchActive = searchTerm.trim() !== "";

  return (
    <div className={`songlist-container ${isDragging ? "no-select" : ""}`}>
      {isDragging && !isSearchActive && (
        <TrashZone isDraggingOver={isDraggingOver} />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => {
          setIsDragging(true);
          document.body.classList.add("dragging");
        }}
        onDragEnd={(e) => {
          document.body.classList.remove("dragging");
          handleDragEnd(e);
        }}
        onDragOver={handleDragOver}
      >
        <SortableContext
          items={(isSearchActive ? filteredQueue : queue).map((s) => s._id)}
          strategy={rectSortingStrategy}
        >
          <div className="songlist-grid">
            {(isSearchActive ? filteredQueue : queue).map((song, index) => (
              <SongItem
                key={song._id}
                song={song}
                index={index}
                onDelete={onDelete}
                onPlay={() => {
                  const actualIndex = queue.findIndex(
                    (s) => s._id === song._id,
                  );
                  setCurrentIndex(actualIndex);
                  setIsPlaying(true);
                }}
                isSearchResult={isSearchActive}
                isDragging={isDragging}
                justDragged={justDragged}
                setCurrentIndex={setCurrentIndex}
                setIsPlaying={setIsPlaying}
                onAddToPlaylist={onAddToPlaylist}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

import React, { useContext, useState } from "react";
import {
  DndContext,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  DragOverlay,
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
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setIsDragging(false);
    setIsDraggingOver(false);
    setActiveId(null);

    setJustDragged(true);
    setTimeout(() => setJustDragged(false), 150);

    if (!over) return;

    if (over.id === "trash-zone") {
      const songId = active.id;

      try {
        await api.delete(`/songs/${songId}`);

        const indexToDelete = queue.findIndex((s) => s._id === songId);
        const newQueue = queue.filter((s) => s._id !== songId);

        setQueue(newQueue);

        if (indexToDelete === currentIndex) {
          setCurrentIndex((i) =>
            i < newQueue.length ? i : newQueue.length - 1,
          );
        } else if (indexToDelete < currentIndex) {
          setCurrentIndex((i) => i - 1);
        }

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
    const isOverTrash = event.over?.id === "trash-zone";
    setIsDraggingOver((prev) => (prev !== isOverTrash ? isOverTrash : prev));
  };

  const isSearchActive = searchTerm.trim() !== "";
  const list = queue;

  return (
    <div className={`songlist-container ${isDragging ? "no-select" : ""}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => {
          setActiveId(active.id);
          setIsDragging(true);
          document.body.classList.add("dragging");
        }}
        onDragEnd={(e) => {
          document.body.classList.remove("dragging");
          handleDragEnd(e);
        }}
        onDragOver={handleDragOver}
      >
        {isDragging && !isSearchActive && (
          <TrashZone isDraggingOver={isDraggingOver} />
        )}

        <SortableContext
          items={list.map((s) => s._id)}
          strategy={rectSortingStrategy}
        >
          <div className="songlist-grid">
            {list.map((song, index) => (
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

        <DragOverlay>
          {activeId ? (
            <SongItem
              song={queue.find((s) => s._id === activeId)}
              dragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

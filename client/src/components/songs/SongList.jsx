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
  const { setNodeRef } = useDroppable({ id: "trash-zone" });

  return (
    <div
      ref={setNodeRef}
      className={`trash-zone ${isDraggingOver ? "active" : ""}`}
    >
      🗑️ Drop to delete
    </div>
  );
}

export default function SongList({ onDelete, searchTerm = "" }) {
  const { queue, setQueue, setCurrentIndex, setIsPlaying, currentIndex } =
    useContext(PlayerContext);

  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const list = queue.filter(Boolean);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setIsDragging(false);
    setIsDraggingOver(false);
    setActiveId(null);

    if (!over) return;

    const activeId = active.id; // ALWAYS _id

    // 🗑 DELETE
    if (over.id === "trash-zone") {
      try {
        await api.delete(`/songs/${activeId}`);

        const newQueue = queue.filter((s) => s._id !== activeId);
        setQueue(newQueue);

        if (newQueue.length === 0) {
          setCurrentIndex(0);
        } else if (currentIndex >= newQueue.length) {
          setCurrentIndex(newQueue.length - 1);
        }

        onDelete?.(activeId);
      } catch (err) {
        console.error("Delete failed", err);
      }
      return;
    }

    // 🔁 REORDER
    if (active.id === over.id) return;

    const oldIndex = queue.findIndex((s) => s._id === active.id);
    const newIndex = queue.findIndex((s) => s._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    setQueue(arrayMove(queue, oldIndex, newIndex));
  };

  const isSearchActive = searchTerm.trim() !== "";

  return (
    <div className={`songlist-container ${isDragging ? "no-select" : ""}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => {
          setActiveId(active.id);
          setIsDragging(true);
        }}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => setIsDraggingOver(e.over?.id === "trash-zone")}
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
                onPlay={() => {
                  const idx = queue.findIndex((s) => s._id === song._id);

                  if (idx === -1) return;

                  setCurrentIndex(idx);
                  setIsPlaying(true);
                }}
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

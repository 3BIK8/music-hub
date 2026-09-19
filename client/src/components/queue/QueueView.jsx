import React, { useContext, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { PlayerContext } from "../../context/PlayerContext";
import SongItem from "../songs/SongItem";
import api from "../../api/axios";
import "./QueueView.css";

export default function QueueView() {
  const {
    queue,
    currentSongId,
    playSongBySongId,
    setQueue,
    removeSong,
    getId,
    addSongOptimistic,
  } = useContext(PlayerContext);

  const [isDragging, setIsDragging] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [isDraggingOverTrash, setIsDraggingOverTrash] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const items = useMemo(() => queue.map((s) => getId(s)), [queue, getId]);

  const findSongById = (id) => queue.find((s) => getId(s) === id);

  const handleDropFromLibrary = (e) => {
    e.preventDefault();
    try {
      const payload = e.dataTransfer.getData("application/json");
      if (!payload) return;
      const song = JSON.parse(payload);
      if (!song) return;
      addSongOptimistic(song);
    } catch (err) {
      console.error("Failed to handle drop from library", err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className="QueView"
      onDrop={handleDropFromLibrary}
      onDragOver={handleDragOver}
    >
      <h3 style={{ marginBottom: 10 }}>Queue</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => {
          setActiveId(active.id);
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          setIsDraggingOverTrash(event.over?.id === "trash-zone");
        }}
        onDragEnd={async (event) => {
          const { active, over } = event;
          setIsDragging(false);
          setActiveId(null);
          setIsDraggingOverTrash(false);

          if (!over) return;

          // Delete if dropped on trash
          if (over.id === "trash-zone") {
            const song = findSongById(active.id);
            if (!song) return;
            try {
              if (song._id) {
                await api.delete(`/songs/${song._id}`);
              }
            } catch (err) {
              console.error("Failed to delete on server", err);
            }
            removeSong(active.id);
            return;
          }

          if (active.id === over.id) return;

          const oldIndex = items.indexOf(active.id);
          const newIndex = items.indexOf(over.id);
          if (oldIndex < 0 || newIndex < 0) return;

          setQueue((prev) => arrayMove(prev, oldIndex, newIndex));
        }}
      >
        {isDragging && (
          <div
            className={`trash-zone ${isDraggingOverTrash ? "active" : ""}`}
            id="trash-zone"
          >
            Drop here to delete
          </div>
        )}

        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {queue.map((song, index) => {
              const id = getId(song);
              return (
                <SongItem
                  key={id}
                  song={song}
                  onPlay={() => playSongBySongId(id)}
                  dragOverlay={false}
                  isSearchResult={false}
                  onDelete={() => {
                    if (song._id)
                      api.delete(`/songs/${song._id}`).catch(console.error);
                    removeSong(id);
                  }}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <SongItem song={findSongById(activeId)} dragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

import { createContext, useState } from "react";

export const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [songs, setSongs] = useState([]);

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);

  const reorderQueue = (fromIndex, toIndex) => {
    setQueue((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const addSongOptimistic = (song) => {
    setQueue((prev) => [...prev, song]);
  };

  const updateSong = (tempId, newSong) => {
    setQueue((prev) => prev.map((s) => (s._id === tempId ? newSong : s)));
  };

  // FIXED dedupe (youtube + spotify )
  const songExists = (track) => {
    const id = track.id;

    return queue.some((s) => s.sourceId === id);
  };

  return (
    <PlayerContext.Provider
      value={{
        songs,
        setSongs,
        queue,
        setQueue,
        currentIndex,
        setCurrentIndex,
        isPlaying,
        setIsPlaying,
        reorderQueue,

        addSongOptimistic,
        updateSong,
        songExists,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

import { createContext, useState } from "react";

export const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 🔥 SAFE ID (works with old + new data)
  const getId = (s) => s?._id || s?.videoId || s?.sourceId;

  const addSongOptimistic = (song) => {
    setQueue((prev) => {
      if (!song) return prev;

      const id = song._id || song.videoId || song.sourceId;

      const exists = prev.some((s) => getId(s) === id);

      if (exists) return prev;

      return [...prev, song];
    });
  };

  const updateSong = (id, newData) => {
    setQueue((prev) =>
      newData
        ? prev.map((s) => (getId(s) === id ? { ...s, ...newData } : s))
        : prev.filter((s) => getId(s) !== id),
    );
  };

  const songExists = (id) => queue.some((s) => getId(s) === id);

  return (
    <PlayerContext.Provider
      value={{
        queue,
        setQueue,
        currentIndex,
        setCurrentIndex,
        isPlaying,
        setIsPlaying,
        addSongOptimistic,
        updateSong,
        songExists,
        getId,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

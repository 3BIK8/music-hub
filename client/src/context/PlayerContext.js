import { createContext, useCallback, useEffect, useMemo, useState } from "react";

export const PlayerContext = createContext();

const getSongId = (song) => {
  const id = typeof song?.id === "string" ? song.id.trim() : "";
  if (id) return id;
  const legacyId = typeof song?.songId === "string" ? song.songId.trim() : "";
  return legacyId || null;
};

const dedupeSongs = (songs = []) => {
  const seen = new Set();
  return songs.filter((song) => {
    const id = getSongId(song);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export function PlayerProvider({ children }) {
  const [queue, setQueueState] = useState([]);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const replaceQueue = useCallback((songs) => {
    if (Array.isArray(songs)) setQueueState(dedupeSongs(songs));
  }, []);

  const reorderQueue = useCallback((activeId, overId) => {
    if (!activeId || !overId || activeId === overId) return;
    setQueueState((prevQueue) => {
      const oldIndex = prevQueue.findIndex((song) => getSongId(song) === String(activeId));
      const newIndex = prevQueue.findIndex((song) => getSongId(song) === String(overId));
      if (oldIndex < 0 || newIndex < 0) return prevQueue;
      const nextQueue = [...prevQueue];
      const [moved] = nextQueue.splice(oldIndex, 1);
      nextQueue.splice(newIndex, 0, moved);
      return nextQueue;
    });
  }, []);

  useEffect(() => {
    if (!queue.length) {
      setCurrentSongId(null);
      setIsPlaying(false);
      return;
    }
    if (!queue.some((song) => getSongId(song) === currentSongId)) {
      setCurrentSongId(getSongId(queue[0]));
    }
  }, [queue, currentSongId]);

  const currentIndex = useMemo(
    () => queue.findIndex((song) => getSongId(song) === currentSongId),
    [queue, currentSongId],
  );

  const currentSong = useMemo(
    () => (currentIndex >= 0 ? queue[currentIndex] : queue[0] || null),
    [queue, currentIndex],
  );

  const playSongBySongId = useCallback((songId) => {
    if (!songId || !queue.some((song) => getSongId(song) === songId)) return;
    setCurrentSongId(songId);
    setIsPlaying(true);
  }, [queue]);

  const removeSong = useCallback((songOrSongId) => {
    const id = typeof songOrSongId === "string" ? songOrSongId : getSongId(songOrSongId);
    if (!id) return;
    setQueueState((prevQueue) => prevQueue.filter((song) => getSongId(song) !== id));
    if (id === currentSongId) setCurrentSongId(null);
  }, [currentSongId]);

  const addSong = useCallback((song, { playNext = false, startPlaying = false } = {}) => {
    const id = getSongId(song);
    if (!id) return;
    setQueueState((prevQueue) => {
      const normalized = dedupeSongs(prevQueue);
      if (normalized.some((item) => getSongId(item) === id)) return normalized;
      if (playNext && currentSongId) {
        const position = normalized.findIndex((item) => getSongId(item) === currentSongId);
        if (position >= 0) {
          const nextQueue = [...normalized];
          nextQueue.splice(position + 1, 0, song);
          return nextQueue;
        }
      }
      return [...normalized, song];
    });
    if (startPlaying || !currentSongId) setCurrentSongId(id);
    if (startPlaying) setIsPlaying(true);
  }, [currentSongId]);

  const updateSong = useCallback((songOrSongId, newData) => {
    const targetId = typeof songOrSongId === "string" ? songOrSongId : getSongId(songOrSongId);
    if (!targetId || !newData) return;
    setQueueState((prevQueue) => dedupeSongs(prevQueue.map((song) => (
      getSongId(song) === targetId
        ? { ...song, ...newData, id: getSongId(newData) || targetId }
        : song
    ))));
  }, []);

  const songExists = useCallback((songOrSongId) => {
    const id = typeof songOrSongId === "string" ? songOrSongId : getSongId(songOrSongId);
    return Boolean(id && queue.some((song) => getSongId(song) === id));
  }, [queue]);

  const playNext = useCallback(({ wrap = false } = {}) => {
    if (!queue.length) return;
    const activeId = currentSongId || getSongId(queue[0]);
    const activeIndex = queue.findIndex((song) => getSongId(song) === activeId);
    if (activeIndex < queue.length - 1) setCurrentSongId(getSongId(queue[activeIndex + 1]));
    else if (wrap) setCurrentSongId(getSongId(queue[0]));
  }, [queue, currentSongId]);

  const playPrev = useCallback(() => {
    if (!queue.length) return;
    const activeId = currentSongId || getSongId(queue[0]);
    const activeIndex = queue.findIndex((song) => getSongId(song) === activeId);
    setCurrentSongId(getSongId(queue[Math.max(activeIndex - 1, 0)]));
  }, [queue, currentSongId]);

  return (
    <PlayerContext.Provider value={{ queue, replaceQueue, reorderQueue, currentIndex, currentSong, currentSongId, isPlaying, setIsPlaying, addSong, updateSong, removeSong, songExists, playSongBySongId, playNext, playPrev, getId: getSongId }}>
      {children}
    </PlayerContext.Provider>
  );
}

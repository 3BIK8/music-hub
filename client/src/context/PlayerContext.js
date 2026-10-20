import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addSongToQueue,
  dedupeSongs,
  getSongKey,
} from "./queueUtils.mjs";

export const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [queue, setQueueState] = useState([]);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const setQueue = useCallback((nextQueueOrUpdater) => {
    setQueueState((prevQueue) => {
      const rawNextQueue =
        typeof nextQueueOrUpdater === "function"
          ? nextQueueOrUpdater(prevQueue)
          : nextQueueOrUpdater;

      if (!Array.isArray(rawNextQueue)) {
        return prevQueue;
      }

      return dedupeSongs(rawNextQueue);
    });
  }, []);

  useEffect(() => {
    if (!queue.length) {
      if (currentSongId !== null) setCurrentSongId(null);
      if (isPlaying) setIsPlaying(false);
      return;
    }

    const hasCurrentSong = queue.some(
      (song) => getSongKey(song) === currentSongId,
    );
    if (!hasCurrentSong) {
      setCurrentSongId(getSongKey(queue[0]));
    }
  }, [queue, currentSongId, isPlaying]);

  const currentIndex = useMemo(() => {
    if (!queue.length || !currentSongId) return -1;
    return queue.findIndex((song) => getSongKey(song) === currentSongId);
  }, [queue, currentSongId]);

  const currentSong = useMemo(() => {
    if (!queue.length) return null;
    if (currentIndex < 0) return queue[0];
    return queue[currentIndex];
  }, [queue, currentIndex]);

  const setCurrentIndex = useCallback(
    (nextIndexOrUpdater) => {
      if (!queue.length) return;

      const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
      const rawNextIndex =
        typeof nextIndexOrUpdater === "function"
          ? nextIndexOrUpdater(safeCurrentIndex)
          : nextIndexOrUpdater;

      const numericIndex = Number(rawNextIndex);
      if (!Number.isFinite(numericIndex)) return;

      const clampedIndex = Math.max(
        0,
        Math.min(queue.length - 1, Math.trunc(numericIndex)),
      );

      const nextSongId = getSongKey(queue[clampedIndex]);
      if (!nextSongId) return;

      setCurrentSongId(nextSongId);
    },
    [queue, currentIndex],
  );

  const playSongBySongId = useCallback(
    (songId) => {
      if (!songId) return;

      const existsInQueue = queue.some((song) => getSongKey(song) === songId);
      if (!existsInQueue) return;

      setCurrentSongId(songId);
      setIsPlaying(true);
    },
    [queue],
  );

  const removeSong = useCallback(
    (songOrSongId) => {
      const songId =
        typeof songOrSongId === "string"
          ? songOrSongId
          : getSongKey(songOrSongId);

      if (!songId) return;

      setQueueState((prevQueue) =>
        prevQueue.filter((song) => getSongKey(song) !== songId),
      );

      if (songId === currentSongId) {
        setCurrentSongId(null);
      }
    },
    [currentSongId],
  );

  const addSongOptimistic = useCallback(
    (song, options = {}) => {
      const songId = getSongKey(song);
      if (!songId) return;

      const { playNext = false, startPlaying = false } = options;

      setQueueState((prevQueue) =>
        addSongToQueue(prevQueue, song, { currentSongId, playNext }),
      );

      if (startPlaying || !currentSongId) {
        setCurrentSongId(songId);
      }

      if (startPlaying) {
        setIsPlaying(true);
      }
    },
    [currentSongId],
  );

  const updateSong = useCallback(
    (songOrSongId, newData) => {
      const targetSongId =
        typeof songOrSongId === "string"
          ? songOrSongId
          : getSongKey(songOrSongId);

      if (!targetSongId) return;

      if (!newData) {
        removeSong(targetSongId);
        return;
      }

      setQueueState((prevQueue) =>
        dedupeSongs(
          prevQueue.map((song) => {
            if (getSongKey(song) !== targetSongId) return song;

            const nextSongId = getSongKey(newData) || targetSongId;
            return {
              ...song,
              ...newData,
              songId: nextSongId,
            };
          }),
        ),
      );
    },
    [removeSong],
  );

  const songExists = useCallback(
    (songOrSongId) => {
      const songId =
        typeof songOrSongId === "string"
          ? songOrSongId
          : getSongKey(songOrSongId);

      if (!songId) return false;

      return queue.some((song) => getSongKey(song) === songId);
    },
    [queue],
  );

  const playNext = useCallback(
    ({ wrap = false } = {}) => {
      if (!queue.length) return;

      const activeSongId = currentSongId || getSongKey(queue[0]);
      const activeIndex = queue.findIndex(
        (song) => getSongKey(song) === activeSongId,
      );

      if (activeIndex === -1) {
        setCurrentSongId(getSongKey(queue[0]));
        return;
      }

      if (activeIndex < queue.length - 1) {
        setCurrentSongId(getSongKey(queue[activeIndex + 1]));
        return;
      }

      if (wrap) {
        setCurrentSongId(getSongKey(queue[0]));
      }
    },
    [queue, currentSongId],
  );

  const playPrev = useCallback(() => {
    if (!queue.length) return;

    const activeSongId = currentSongId || getSongKey(queue[0]);
    const activeIndex = queue.findIndex(
      (song) => getSongKey(song) === activeSongId,
    );

    if (activeIndex > 0) {
      setCurrentSongId(getSongKey(queue[activeIndex - 1]));
      return;
    }

    setCurrentSongId(getSongKey(queue[0]));
  }, [queue, currentSongId]);

  return (
    <PlayerContext.Provider
      value={{
        queue,
        setQueue,
        currentIndex,
        setCurrentIndex,
        currentSong,
        currentSongId,
        isPlaying,
        setIsPlaying,
        addSongOptimistic,
        updateSong,
        removeSong,
        songExists,
        playSongBySongId,
        playNext,
        playPrev,
        getId: getSongKey,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

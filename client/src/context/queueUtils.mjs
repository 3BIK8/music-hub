export const getSongKey = (song) => {
  if (!song || typeof song !== "object") return null;
  const key = String(
    song.audioKey || song.normalizedKey || song._id || song.songId || "",
  ).trim();
  return key || null;
};

export const dedupeSongs = (songs = []) => {
  const seen = new Set();
  const normalized = [];

  for (const song of songs) {
    const songKey = getSongKey(song);
    if (!songKey || seen.has(songKey)) continue;

    seen.add(songKey);
    normalized.push(song);
  }

  return normalized;
};

export const addSongToQueue = (
  queue,
  song,
  { currentSongId = null, playNext = false } = {},
) => {
  const songId = getSongKey(song);
  if (!songId) return dedupeSongs(queue);

  const normalizedQueue = dedupeSongs(queue);
  if (normalizedQueue.some((item) => getSongKey(item) === songId)) {
    return normalizedQueue;
  }

  if (playNext && currentSongId) {
    const currentPosition = normalizedQueue.findIndex(
      (item) => getSongKey(item) === currentSongId,
    );

    if (currentPosition !== -1) {
      const nextQueue = [...normalizedQueue];
      nextQueue.splice(currentPosition + 1, 0, song);
      return nextQueue;
    }
  }

  return [...normalizedQueue, song];
};

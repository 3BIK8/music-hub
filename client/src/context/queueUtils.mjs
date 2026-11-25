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
  if (playNext) {
    const queueWithoutSong = normalizedQueue.filter(
      (item) => getSongKey(item) !== songId,
    );
    const currentPosition = queueWithoutSong.findIndex(
      (item) => getSongKey(item) === currentSongId,
    );

    if (currentPosition !== -1) {
      const nextQueue = [...queueWithoutSong];
      nextQueue.splice(currentPosition + 1, 0, song);
      return nextQueue;
    }

    return [song, ...queueWithoutSong];
  }

  if (normalizedQueue.some((item) => getSongKey(item) === songId)) {
    return normalizedQueue;
  }

  return [...normalizedQueue, song];
};

import { useState, useMemo } from "react";

export const useSearch = (songs) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSongs = useMemo(() => {
    if (!searchTerm.trim()) return songs;

    const q = searchTerm.toLowerCase();

    return songs.filter((song) => {
      const providerMeta =
        song.providers?.spotify || song.providers?.youtube || {};

      return (
        String(song.title || song.canonical?.title || "")
          .toLowerCase()
          .includes(q) ||
        String(song.canonical?.artist || providerMeta.artist || "")
          .toLowerCase()
          .includes(q) ||
        String(song.url || "")
          .toLowerCase()
          .includes(q) ||
        String(song.sourceId || providerMeta.sourceId || "")
          .toLowerCase()
          .includes(q) ||
        String(song.songId || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [songs, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredSongs,
  };
};

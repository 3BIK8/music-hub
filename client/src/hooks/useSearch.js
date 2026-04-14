import { useState, useMemo } from "react";

export const useSearch = (songs) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSongs = useMemo(() => {
    if (!searchTerm.trim()) return songs;

    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (song.videoId &&
          song.videoId.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [songs, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredSongs,
  };
};

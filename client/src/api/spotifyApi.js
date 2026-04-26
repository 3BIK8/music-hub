import api from "./axios";

export const convertSpotifyTrack = async (track) => {
  const res = await api.post("/spotify", { track });
  return res.data;
};

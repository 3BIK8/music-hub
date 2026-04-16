// server/services/spotify.service.js
import axios from "axios";

let token = null;
let expiresAt = 0;

export async function getSpotifyToken() {
  if (token && Date.now() < expiresAt) return token;

  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET,
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  token = res.data.access_token;
  expiresAt = Date.now() + res.data.expires_in * 1000;

  return token;
}

export async function searchTracks(query) {
  const accessToken = await getSpotifyToken();

  const res = await axios.get("https://api.spotify.com/v1/search", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      q: query,
      type: "track",
      limit: 10,
    },
  });

  return res.data.tracks.items.map((t) => ({
    id: t.id,
    name: t.name,
    artist: t.artists[0].name,
    preview: t.preview_url,
    image: t.album.images?.[0]?.url,
  }));
}

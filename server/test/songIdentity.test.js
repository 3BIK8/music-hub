import assert from "node:assert/strict";
import test from "node:test";
import { buildSongIdentity } from "../services/songIdentity.service.js";

test("buildSongIdentity returns the same result for the same input", () => {
  const input = {
    title: "Artist - Song (Official Audio)",
    artist: "Channel Name",
    duration: 214,
    source: "youtube",
  };

  assert.deepEqual(buildSongIdentity(input), buildSongIdentity(input));
});

test("buildSongIdentity distinguishes a different artist", () => {
  const input = { title: "Same Song", artist: "Artist A", duration: 200 };
  const differentArtist = { ...input, artist: "Artist B" };

  assert.notDeepEqual(
    buildSongIdentity(input),
    buildSongIdentity(differentArtist),
  );
});

test("buildSongIdentity distinguishes a different title", () => {
  const input = { title: "Song A", artist: "Same Artist", duration: 200 };
  const differentTitle = { ...input, title: "Song B" };

  assert.notDeepEqual(
    buildSongIdentity(input),
    buildSongIdentity(differentTitle),
  );
});

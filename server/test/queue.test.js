import assert from "node:assert/strict";
import test from "node:test";
import { addSongToQueue, getSongKey } from "../../client/src/context/queueUtils.mjs";

test("adding the same song twice does not create a duplicate", () => {
  const song = { songId: "song-1", title: "Track" };
  const queue = addSongToQueue([], song);
  const updatedQueue = addSongToQueue(queue, { ...song });

  assert.deepEqual(updatedQueue.map(getSongKey), ["song-1"]);
});

test("adding a new song as play-next keeps its existing queue position behavior", () => {
  const queue = [
    { songId: "song-1" },
    { songId: "song-2" },
    { songId: "song-3" },
  ];
  const updatedQueue = addSongToQueue(
    queue,
    { songId: "song-4" },
    { currentSongId: "song-2", playNext: true },
  );

  assert.deepEqual(updatedQueue.map(getSongKey), [
    "song-1",
    "song-2",
    "song-4",
    "song-3",
  ]);
});

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

test("adding an existing song as play-next moves it without duplicating it", () => {
  const queue = [
    { songId: "song-1" },
    { songId: "song-2" },
    { songId: "song-3" },
  ];
  const updatedQueue = addSongToQueue(
    queue,
    { songId: "song-3" },
    { currentSongId: "song-1", playNext: true },
  );

  assert.deepEqual(updatedQueue.map(getSongKey), [
    "song-1",
    "song-3",
    "song-2",
  ]);
});

test("adding a song as play-next puts it first when there is no current song", () => {
  const queue = [{ songId: "song-1" }, { songId: "song-2" }];
  const updatedQueue = addSongToQueue(
    queue,
    { songId: "song-3" },
    { playNext: true },
  );

  assert.deepEqual(updatedQueue.map(getSongKey), [
    "song-3",
    "song-1",
    "song-2",
  ]);
});

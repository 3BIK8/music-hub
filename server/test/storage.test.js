import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import test from "node:test";
import { createStorage } from "../services/storage.service.js";

test("storage supports put, exists, getUrl, and delete in a temp directory", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "music-hub-storage-"));
  const storage = createStorage(directory);
  t.after(() => rm(directory, { recursive: true, force: true }));

  const key = "albums/track one.opus";
  assert.equal(await storage.exists(key), false);
  assert.equal(storage.getUrl(key), "/audio/albums/track%20one.opus");

  await storage.put(key, Buffer.from("buffer data"));
  assert.equal(await storage.exists(key), true);
  assert.equal(await readFile(path.join(directory, "albums", "track one.opus"), "utf8"), "buffer data");

  await storage.put("stream.opus", Readable.from([Buffer.from("stream data")]));
  assert.equal(await readFile(path.join(directory, "stream.opus"), "utf8"), "stream data");

  assert.equal(await storage.delete(key), true);
  assert.equal(await storage.exists(key), false);
  assert.equal(await storage.delete(key), false);
});

test("storage rejects traversal and absolute keys", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "music-hub-storage-"));
  const storage = createStorage(directory);
  t.after(() => rm(directory, { recursive: true, force: true }));

  const invalidKeys = [
    "../outside.opus",
    "albums/../../outside.opus",
    path.join(directory, "absolute.opus"),
    "C:\\outside\\absolute.opus",
    "\\\\server\\share\\absolute.opus",
  ];

  for (const key of invalidKeys) {
    await assert.rejects(storage.put(key, Buffer.from("x")), /safe relative path/);
    assert.throws(() => storage.getUrl(key), /safe relative path/);
  }
});

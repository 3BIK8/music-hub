import test from "node:test";
import assert from "node:assert/strict";
import { buildSongIdentity } from "./songIdentity.service.js";

test("buildSongIdentity normalizes title noise and artist casing", () => {
  const first = buildSongIdentity({
    title: "My Song (Official Video)",
    artist: "Artist",
    duration: 180000,
  });
  const second = buildSongIdentity({
    title: "my song",
    artist: "artist",
    duration: 180200,
  });

  assert.equal(first.normalizedKey, second.normalizedKey);
  assert.equal(first.durationBucket, 90);
});

test("buildSongIdentity separates materially different durations", () => {
  const first = buildSongIdentity({ title: "Track", artist: "Artist", duration: 120000 });
  const second = buildSongIdentity({ title: "Track", artist: "Artist", duration: 130000 });

  assert.notEqual(first.normalizedKey, second.normalizedKey);
});

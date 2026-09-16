import Song from "../models/Song.js";

const isDuplicateKeyError = (error) => error?.code === 11000;

const findExisting = async ({ platform, sourceId, normalizedKey }) => {
  return Song.findOne({
    $or: [
      { platform, sourceId },
      { normalizedKey },
    ],
  });
};

export async function createOrGetSong(data) {
  const existing = await findExisting(data);
  if (existing) return { song: existing, isExisting: true };

  try {
    const song = await Song.create(data);
    return { song, isExisting: false };
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const concurrent = await findExisting(data);
    if (concurrent) return { song: concurrent, isExisting: true };
    throw error;
  }
}

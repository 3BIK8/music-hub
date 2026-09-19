import mongoose from "mongoose";
import dotenv from "dotenv";
import Song from "../../server/models/Song.js";

dotenv.config();

const MONGO = process.env.MONGO_URI;
if (!MONGO) {
  console.error("Missing MONGO_URI in environment");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGO);
  console.log("Connected to Mongo for migration");

  // Backfill platform/sourceId for docs that are missing them
  const query = {
    $or: [
      { platform: { $exists: false } },
      { platform: null },
      { sourceId: { $exists: false } },
      { sourceId: null },
    ],
  };

  const cursor = Song.find(query).cursor();
  let updated = 0;
  for await (const doc of cursor) {
    let platform = doc.platform;
    let sourceId = doc.sourceId;

    if (!platform) {
      if (doc.providers?.youtube) platform = "youtube";
      else if (doc.providers?.spotify) platform = "spotify";
      else platform = "unknown";
    }

    if (!sourceId) {
      sourceId =
        doc.providers?.youtube?.sourceId ||
        doc.providers?.spotify?.sourceId ||
        "";
    }

    doc.platform = platform;
    doc.sourceId = sourceId;
    await doc.save();
    updated++;
  }

  console.log(`Backfilled ${updated} documents`);

  // Attempt to drop legacy unique index if present
  try {
    const coll = mongoose.connection.db.collection("songs");
    const indexes = await coll.indexes();
    const idx = indexes.find((i) => i.name === "platform_1_sourceId_1");
    if (idx) {
      console.log("Dropping legacy index platform_1_sourceId_1");
      await coll.dropIndex("platform_1_sourceId_1");
      console.log("Dropped legacy index");
    } else {
      console.log("Legacy index not found; nothing to drop");
    }
  } catch (err) {
    console.error("Error checking/dropping index:", err.message);
  }

  await mongoose.disconnect();
  console.log("Migration complete");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

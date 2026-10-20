import { createWriteStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const serverDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function resolveAudioDirectory(directory) {
  if (!directory) return path.resolve(serverDirectory, "..", "temp-audio");
  return path.isAbsolute(directory)
    ? path.resolve(directory)
    : path.resolve(serverDirectory, directory);
}

function resolveKey(audioDirectory, key) {
  if (typeof key !== "string" || key.length === 0) {
    throw new TypeError("Storage key must be a non-empty string");
  }

  if (
    key.includes("..") ||
    path.isAbsolute(key) ||
    path.win32.isAbsolute(key) ||
    /^[a-zA-Z]:/.test(key)
  ) {
    throw new Error("Storage key must be a safe relative path");
  }

  const relativeKey = key.replace(/[\\/]+/g, path.sep);
  const filePath = path.resolve(audioDirectory, relativeKey);
  const relativePath = path.relative(audioDirectory, filePath);

  if (
    !relativePath ||
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Storage key resolves outside AUDIO_DIR");
  }

  return { filePath, relativeKey };
}

export function createStorage(directory = process.env.AUDIO_DIR) {
  const audioDirectory = resolveAudioDirectory(directory);

  async function put(key, streamOrBuffer) {
    const { filePath } = resolveKey(audioDirectory, key);
    await mkdir(path.dirname(filePath), { recursive: true });

    if (Buffer.isBuffer(streamOrBuffer) || streamOrBuffer instanceof Uint8Array) {
      await writeFile(filePath, streamOrBuffer);
    } else if (
      streamOrBuffer &&
      (typeof streamOrBuffer.pipe === "function" ||
        typeof streamOrBuffer[Symbol.asyncIterator] === "function")
    ) {
      await pipeline(streamOrBuffer, createWriteStream(filePath));
    } else {
      throw new TypeError("put expects a Buffer, Uint8Array, or readable stream");
    }

    return key;
  }

  async function exists(key) {
    const { filePath } = resolveKey(audioDirectory, key);

    try {
      return (await stat(filePath)).isFile();
    } catch (error) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
  }

  function getUrl(key) {
    const { relativeKey } = resolveKey(audioDirectory, key);
    const urlKey = relativeKey
      .split(path.sep)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `/audio/${urlKey}`;
  }

  async function deleteFile(key) {
    const { filePath } = resolveKey(audioDirectory, key);

    try {
      await rm(filePath);
      return true;
    } catch (error) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
  }

  return { put, exists, getUrl, delete: deleteFile };
}

const defaultStorage = createStorage();
export const put = defaultStorage.put;
export const exists = defaultStorage.exists;
export const getUrl = defaultStorage.getUrl;
export const remove = defaultStorage.delete;
export { remove as delete };
export default defaultStorage;

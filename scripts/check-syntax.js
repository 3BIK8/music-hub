import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverRoot = path.join(repositoryRoot, "server");

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectJavaScriptFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(entryPath);
    }
  }

  return files;
}

const files = await collectJavaScriptFiles(serverRoot);
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`Could not check ${path.relative(repositoryRoot, file)}:`, result.error);
    failed = true;
  } else if (result.status !== 0) {
    failed = true;
  }
}

if (failed) process.exitCode = 1;
else console.log(`Syntax check passed for ${files.length} server JavaScript files.`);

import fs from "fs";
import path from "path";

function readCachedArray(fileName: string) {
  const cachePath = path.join(__dirname, ".cache", fileName);
  if (!fs.existsSync(cachePath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCachedSongs() {
  return readCachedArray("songs.json");
}

export function getCachedChannels() {
  return readCachedArray("channels.json");
}

export function getCachedMilestones() {
  return readCachedArray("milestones.json");
}

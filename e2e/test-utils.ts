import fs from "fs";
import path from "path";

export function getCachedSongs() {
  const cachePath = path.join(__dirname, ".cache", "songs.json");
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
  }
  return [];
}

export function getCachedChannels() {
  const cachePath = path.join(__dirname, ".cache", "channels.json");
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
  }
  return [];
}

export function getCachedMilestones() {
  const cachePath = path.join(__dirname, ".cache", "milestones.json");
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
  }
  return [];
}

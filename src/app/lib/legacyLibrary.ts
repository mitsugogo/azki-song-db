import type { PlaylistEntry } from "@/app/lib/playlistUrl";

export const sanitizeLegacyEntries = (value: unknown, maxEntries = 300) => {
  if (!Array.isArray(value) || value.length > maxEntries) {
    throw new Error("INVALID_MIGRATION");
  }
  const seen = new Set<string>();
  const entries = value
    .map((entry): PlaylistEntry | null => {
      if (!entry || typeof entry !== "object") return null;
      const raw = entry as Record<string, unknown>;
      const videoId = typeof raw.videoId === "string" ? raw.videoId.trim() : "";
      const start =
        typeof raw.start === "string" ||
        (typeof raw.start === "number" && Number.isFinite(raw.start))
          ? String(raw.start)
          : "";
      if (!videoId || videoId.length > 100 || !start || start.length > 32) {
        return null;
      }
      return { videoId, start };
    })
    .filter((entry): entry is PlaylistEntry => entry !== null)
    .filter((entry) => {
      const key = `${entry.videoId}\0${entry.start}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (value.length > 0 && entries.length === 0) {
    throw new Error("INVALID_MIGRATION");
  }
  return entries;
};

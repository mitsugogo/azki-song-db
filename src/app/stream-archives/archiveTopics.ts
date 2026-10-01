import { normalizeArchiveSeriesKey } from "./archiveSearch";

export type ArchiveTopic = { title: string; key: string };

export const getArchiveTopics = (
  value: string,
  uncategorizedLabel?: string,
): ArchiveTopic[] => {
  const seen = new Set<string>();
  const topics = value.split(/[、,]/u).flatMap((rawTitle) => {
    const title = rawTitle.trim();
    const key = normalizeArchiveSeriesKey(title) || "other";
    if (!title || seen.has(key)) return [];
    seen.add(key);
    return [{ title, key }];
  });

  return topics.length || !uncategorizedLabel
    ? topics
    : [
        {
          title: uncategorizedLabel,
          key: normalizeArchiveSeriesKey(uncategorizedLabel) || "other",
        },
      ];
};

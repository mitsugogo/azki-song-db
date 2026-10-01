import { normalizeArchiveSeriesKey } from "./archiveSearch";

export type ArchiveTopic = { title: string; key: string };

const splitArchiveTopics = (value: string): string[] => {
  const titles: string[] = [];
  let start = 0;
  let inQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '"') {
      if (inQuotes && value[index + 1] === '"') {
        index += 1;
      } else if (inQuotes || !value.slice(start, index).trim()) {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && (char === "、" || char === ",")) {
      titles.push(value.slice(start, index));
      start = index + 1;
    }
  }
  titles.push(value.slice(start));

  return titles.map((rawTitle) => {
    const title = rawTitle.trim();
    return title.length >= 2 && title.startsWith('"') && title.endsWith('"')
      ? title.slice(1, -1).replace(/""/g, '"').trim()
      : title;
  });
};

/** 「、」「,」で分割する。区切りを含む名前は "Papers, Please" のように囲む。 */
export const getArchiveTopics = (
  value: string,
  uncategorizedLabel?: string,
): ArchiveTopic[] => {
  const seen = new Set<string>();
  const topics = splitArchiveTopics(value).flatMap((title) => {
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

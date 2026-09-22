import type {
  LivePerformance,
  LiveSetlistEntry,
  LiveTitleGroup,
} from "@/app/types/live";
import { resolveLiveId } from "@/app/lib/legacyLiveIds";
import { isValidLiveSlug } from "@/app/lib/livePaths";

type HeaderDefinition<Key extends string> = {
  key: Key;
  aliases: string[];
};

type LiveHeaderKey =
  | "id"
  | "title"
  | "category"
  | "performance"
  | "date"
  | "doorsTime"
  | "startTime"
  | "venue"
  | "url"
  | "performers"
  | "ticket"
  | "note"
  | "pageSlug"
  | "performanceSlug";

type SetlistHeaderKey =
  "id" | "order" | "title" | "artist" | "singers" | "note";

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/[（）()\s?？.,，、!！_]/g, "")
    .toLocaleLowerCase("ja");

const getString = (value: unknown) => String(value ?? "").trim();

const liveHeaderSchema: HeaderDefinition<LiveHeaderKey>[] = [
  { key: "id", aliases: ["ライブID", "liveid", "live_id"] },
  { key: "title", aliases: ["ライブタイトル", "title", "livetitle"] },
  { key: "category", aliases: ["カテゴリ", "category"] },
  { key: "performance", aliases: ["公演", "performance", "show"] },
  { key: "date", aliases: ["開催日", "date", "eventdate"] },
  { key: "doorsTime", aliases: ["開場", "doors", "doorstime"] },
  { key: "startTime", aliases: ["開演", "start", "starttime"] },
  { key: "venue", aliases: ["場所", "会場", "venue", "place"] },
  { key: "url", aliases: ["URL", "リンク", "url"] },
  { key: "performers", aliases: ["出演者", "performers", "cast"] },
  { key: "ticket", aliases: ["チケット", "ticket", "price"] },
  { key: "note", aliases: ["備考", "note", "extra"] },
  { key: "pageSlug", aliases: ["ページslug", "pageslug"] },
  { key: "performanceSlug", aliases: ["公演slug", "performanceslug"] },
];

const setlistHeaderSchema: HeaderDefinition<SetlistHeaderKey>[] = [
  { key: "id", aliases: ["ライブID", "liveid", "live_id"] },
  { key: "order", aliases: ["曲順", "order", "track"] },
  { key: "title", aliases: ["楽曲タイトル", "曲名", "title"] },
  { key: "artist", aliases: ["アーティスト名", "artist"] },
  { key: "singers", aliases: ["歌った人", "歌唱者", "singers"] },
  { key: "note", aliases: ["備考", "note", "extra"] },
];

const buildColumnMap = <Key extends string>(
  headers: unknown[],
  schema: HeaderDefinition<Key>[],
) =>
  Object.fromEntries(
    schema.map(({ key, aliases }) => [
      key,
      headers.findIndex((header) =>
        aliases.some(
          (alias) => normalizeHeader(alias) === normalizeHeader(header),
        ),
      ),
    ]),
  ) as Record<Key, number>;

const getCell = <Key extends string>(
  row: unknown[],
  columns: Record<Key, number>,
  key: Key,
) => {
  const index = columns[key];
  return index >= 0 ? getString(row[index]) : "";
};

export const buildLiveTitleGroups = (
  liveRows: unknown[][],
  setlistRows: unknown[][],
): LiveTitleGroup[] => {
  const liveColumns = buildColumnMap(liveRows[0] ?? [], liveHeaderSchema);
  const setlistColumns = buildColumnMap(
    setlistRows[0] ?? [],
    setlistHeaderSchema,
  );
  const setlistsByLiveId = new Map<string, LiveSetlistEntry[]>();

  setlistRows.slice(1).forEach((row) => {
    const id = getCell(row, setlistColumns, "id");
    const title = getCell(row, setlistColumns, "title");
    if (!id || !title) return;

    const entry: LiveSetlistEntry = {
      order: getCell(row, setlistColumns, "order"),
      title,
      artist: getCell(row, setlistColumns, "artist"),
      singers: getCell(row, setlistColumns, "singers"),
      note: getCell(row, setlistColumns, "note"),
    };
    const entries = setlistsByLiveId.get(id) ?? [];
    entries.push(entry);
    setlistsByLiveId.set(id, entries);
  });

  const groupsByTitle = new Map<string, LivePerformance[]>();
  liveRows.slice(1).forEach((row) => {
    const id = getCell(row, liveColumns, "id");
    const title = getCell(row, liveColumns, "title");
    const date = getCell(row, liveColumns, "date");
    if (!id || !title || !date) return;

    const performance: LivePerformance = {
      id,
      pageSlug: getCell(row, liveColumns, "pageSlug"),
      performanceSlug: getCell(row, liveColumns, "performanceSlug"),
      title,
      category: getCell(row, liveColumns, "category"),
      performance: getCell(row, liveColumns, "performance"),
      date,
      doorsTime: getCell(row, liveColumns, "doorsTime"),
      startTime: getCell(row, liveColumns, "startTime"),
      venue: getCell(row, liveColumns, "venue"),
      url: getCell(row, liveColumns, "url"),
      performers: getCell(row, liveColumns, "performers"),
      ticket: getCell(row, liveColumns, "ticket"),
      note: getCell(row, liveColumns, "note"),
      setlist: setlistsByLiveId.get(id) ?? [],
    };
    const performances = groupsByTitle.get(title) ?? [];
    performances.push(performance);
    groupsByTitle.set(title, performances);
  });

  const groups = Array.from(groupsByTitle.entries())
    .map(([title, performances]) => {
      const sortedPerformances = [...performances].sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.startTime.localeCompare(b.startTime) ||
          a.doorsTime.localeCompare(b.doorsTime),
      );
      const canonicalId = sortedPerformances[0]?.id ?? "";
      const latestDate = sortedPerformances.at(-1)?.date ?? "";
      const pageSlug = sortedPerformances[0]?.pageSlug ?? "";
      const performanceSlugs = sortedPerformances.map(
        (performance) => performance.performanceSlug ?? "",
      );
      const hasValidHierarchy =
        isValidLiveSlug(pageSlug) &&
        sortedPerformances.every(
          (performance) =>
            performance.pageSlug === pageSlug &&
            isValidLiveSlug(performance.performanceSlug ?? "") &&
            performance.performanceSlug !== "all",
        ) &&
        new Set(performanceSlugs).size === sortedPerformances.length;
      return {
        canonicalId,
        pageSlug: hasValidHierarchy ? pageSlug : "",
        title,
        category: sortedPerformances[0]?.category ?? "",
        performances: sortedPerformances,
        totalSongs: sortedPerformances.reduce(
          (count, performance) => count + performance.setlist.length,
          0,
        ),
        latestDate,
      } satisfies LiveTitleGroup;
    })
    .filter((group) => group.canonicalId);
  const liveIds = new Set(
    groups.flatMap((group) =>
      group.performances.map((performance) => performance.id),
    ),
  );
  const pageSlugCounts = new Map<string, number>();
  groups.forEach((group) => {
    if (group.pageSlug) {
      pageSlugCounts.set(
        group.pageSlug,
        (pageSlugCounts.get(group.pageSlug) ?? 0) + 1,
      );
    }
  });

  return groups
    .map((group) => ({
      ...group,
      pageSlug:
        group.pageSlug &&
        pageSlugCounts.get(group.pageSlug) === 1 &&
        !liveIds.has(group.pageSlug)
          ? group.pageSlug
          : "",
    }))
    .sort(
      (a, b) =>
        b.latestDate.localeCompare(a.latestDate) ||
        a.title.localeCompare(b.title, "ja"),
    );
};

export const findLiveTitleGroup = (groups: LiveTitleGroup[], liveId: string) =>
  groups.find((group) =>
    group.performances.some(
      (performance) => performance.id === resolveLiveId(liveId),
    ),
  );

export const getLiveCategoryKey = (category: string) => {
  const keys: Record<string, string> = {
    ソロライブ: "solo",
    企画ライブ: "special",
    対バンライブ: "versus",
    公式fes: "officialFestival",
    ユニットライブ: "unit",
  };
  return keys[category];
};

const azkiSingerPattern = /(?:^|[^a-z0-9])AZKi(?=$|[^a-z0-9])/i;

export const isAzkiSungOfficialFesEntry = (
  category: string,
  entry: LiveSetlistEntry,
) =>
  category === "公式fes" &&
  azkiSingerPattern.test(entry.singers.normalize("NFKC"));

export const normalizeLiveSearchText = (value: string) =>
  value.normalize("NFKC").toLocaleLowerCase("ja");

export const filterLiveTitleGroups = (
  groups: LiveTitleGroup[],
  {
    query,
    category,
  }: {
    query: string;
    category: string;
  },
) => {
  const searchTerms = normalizeLiveSearchText(query.trim())
    .split(/\s+/)
    .filter(Boolean);
  return groups.filter((group) => {
    if (category && group.category !== category) return false;
    if (searchTerms.length === 0) return true;
    const searchable = normalizeLiveSearchText(
      [
        group.title,
        ...group.performances.flatMap((performance) => [
          performance.performance,
          performance.venue,
          performance.performers,
        ]),
      ].join(" "),
    );
    return searchTerms.every((term) => searchable.includes(term));
  });
};

export const groupLiveTitleGroupsByYear = (groups: LiveTitleGroup[]) => {
  const result = new Map<string, LiveTitleGroup[]>();
  groups.forEach((group) => {
    const year = group.latestDate.slice(0, 4);
    result.set(year, [...(result.get(year) ?? []), group]);
  });
  return result;
};

export const formatLiveDate = (date: string, locale: string) => {
  const parsed = new Date(`${date}T00:00:00+09:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(parsed);
};

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
  | "titleEn"
  | "category"
  | "performance"
  | "performanceEn"
  | "date"
  | "doorsTime"
  | "startTime"
  | "venue"
  | "venueEn"
  | "url"
  | "performers"
  | "performersEn"
  | "ticket"
  | "ticketEn"
  | "note"
  | "noteEn"
  | "pageSlug"
  | "performanceSlug";

type SetlistHeaderKey =
  | "id"
  | "order"
  | "title"
  | "titleEn"
  | "artist"
  | "artistEn"
  | "singers"
  | "singersEn"
  | "note"
  | "noteEn";

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/[（）()\s?？.,，、!！_]/g, "")
    .toLocaleLowerCase("ja");

const getString = (value: unknown) => String(value ?? "").trim();

const liveHeaderSchema: HeaderDefinition<LiveHeaderKey>[] = [
  { key: "id", aliases: ["ライブID", "liveid", "live_id"] },
  { key: "title", aliases: ["ライブタイトル", "title", "livetitle"] },
  { key: "titleEn", aliases: ["ライブタイトル英語", "titleen", "title_en"] },
  { key: "category", aliases: ["カテゴリ", "category"] },
  { key: "performance", aliases: ["公演", "performance", "show"] },
  {
    key: "performanceEn",
    aliases: ["公演英語", "performanceen", "performance_en"],
  },
  { key: "date", aliases: ["開催日", "date", "eventdate"] },
  { key: "doorsTime", aliases: ["開場", "doors", "doorstime"] },
  { key: "startTime", aliases: ["開演", "start", "starttime"] },
  { key: "venue", aliases: ["場所", "会場", "venue", "place"] },
  { key: "venueEn", aliases: ["会場英語", "venueen", "venue_en"] },
  { key: "url", aliases: ["URL", "リンク", "url"] },
  { key: "performers", aliases: ["出演者", "performers", "cast"] },
  {
    key: "performersEn",
    aliases: ["出演者英語", "performersen", "performers_en"],
  },
  { key: "ticket", aliases: ["チケット", "ticket", "price"] },
  { key: "ticketEn", aliases: ["チケット英語", "ticketen", "ticket_en"] },
  { key: "note", aliases: ["備考", "note", "extra"] },
  { key: "noteEn", aliases: ["備考英語", "noteen", "note_en"] },
  { key: "pageSlug", aliases: ["ページslug", "pageslug"] },
  { key: "performanceSlug", aliases: ["公演slug", "performanceslug"] },
];

const setlistHeaderSchema: HeaderDefinition<SetlistHeaderKey>[] = [
  { key: "id", aliases: ["ライブID", "liveid", "live_id"] },
  { key: "order", aliases: ["曲順", "order", "track"] },
  { key: "title", aliases: ["楽曲タイトル", "曲名", "title"] },
  {
    key: "titleEn",
    aliases: ["楽曲タイトル英語", "曲名英語", "titleen", "title_en"],
  },
  { key: "artist", aliases: ["アーティスト名", "artist"] },
  { key: "artistEn", aliases: ["アーティスト名英語", "artisten", "artist_en"] },
  { key: "singers", aliases: ["歌った人", "歌唱者", "singers"] },
  {
    key: "singersEn",
    aliases: ["歌った人英語", "歌唱者英語", "singersen", "singers_en"],
  },
  { key: "note", aliases: ["備考", "note", "extra"] },
  { key: "noteEn", aliases: ["備考英語", "noteen", "note_en"] },
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
      titleEn: getCell(row, setlistColumns, "titleEn"),
      artist: getCell(row, setlistColumns, "artist"),
      artistEn: getCell(row, setlistColumns, "artistEn"),
      singers: getCell(row, setlistColumns, "singers"),
      singersEn: getCell(row, setlistColumns, "singersEn"),
      note: getCell(row, setlistColumns, "note"),
      noteEn: getCell(row, setlistColumns, "noteEn"),
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
      titleEn: getCell(row, liveColumns, "titleEn"),
      category: getCell(row, liveColumns, "category"),
      performance: getCell(row, liveColumns, "performance"),
      performanceEn: getCell(row, liveColumns, "performanceEn"),
      date,
      doorsTime: getCell(row, liveColumns, "doorsTime"),
      startTime: getCell(row, liveColumns, "startTime"),
      venue: getCell(row, liveColumns, "venue"),
      venueEn: getCell(row, liveColumns, "venueEn"),
      url: getCell(row, liveColumns, "url"),
      performers: getCell(row, liveColumns, "performers"),
      performersEn: getCell(row, liveColumns, "performersEn"),
      ticket: getCell(row, liveColumns, "ticket"),
      ticketEn: getCell(row, liveColumns, "ticketEn"),
      note: getCell(row, liveColumns, "note"),
      noteEn: getCell(row, liveColumns, "noteEn"),
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
        titleEn: sortedPerformances[0]?.titleEn || "",
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
          ...performance.setlist.flatMap((entry) => [
            entry.title,
            entry.titleEn,
            entry.artist,
            entry.artistEn,
            entry.singers,
            entry.singersEn,
            entry.note,
            entry.noteEn,
          ]),
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

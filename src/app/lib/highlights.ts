import { AnniversaryItem } from "../types/anniversaryItem";
import { Song } from "../types/song";

const dayInMs = 24 * 60 * 60 * 1000;
const hourInMs = 60 * 60 * 1000;

export const jstOffsetMs = 9 * hourInMs;

export type MilestoneHighlightItem = {
  date: string;
  content: string;
  note?: string;
  url?: string;
  is_external?: boolean;
  song?: Song;
};

export type TimelineMilestoneHighlight = {
  date: Date;
  text: string;
  note: string;
  url: string;
  is_external: boolean;
  song?: Song;
};

export const parseToJstDayStart = (input: string) => {
  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0) - jstOffsetMs;
    return new Date(utcMs);
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const jst = new Date(parsed.getTime() + jstOffsetMs);
  const year = jst.getUTCFullYear();
  const month = jst.getUTCMonth();
  const day = jst.getUTCDate();
  const utcMs = Date.UTC(year, month, day, 0, 0, 0) - jstOffsetMs;
  return new Date(utcMs);
};

export const parseToTargetDateTime = (input: string) => {
  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0) - jstOffsetMs;
    return new Date(utcMs);
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

export const getDaysUntil = (nextDateAt: string, nowMsArg?: number) => {
  const target = parseToJstDayStart(nextDateAt);
  if (!target) {
    return null;
  }

  const nowMs = typeof nowMsArg === "number" ? nowMsArg : Date.now();
  const jstNowMs = nowMs + jstOffsetMs;
  const jstNow = new Date(jstNowMs);
  const year = jstNow.getUTCFullYear();
  const month = jstNow.getUTCMonth();
  const day = jstNow.getUTCDate();
  const todayStartUtcMs = Date.UTC(year, month, day, 0, 0, 0) - jstOffsetMs;
  const diffDays = Math.ceil((target.getTime() - todayStartUtcMs) / dayInMs);
  return Math.max(0, diffDays);
};

export const computeNextIsoForAnniversary = (
  item: AnniversaryItem,
  nowMsArg?: number,
) => {
  const nowMs = typeof nowMsArg === "number" ? nowMsArg : Date.now();
  const nowJst = new Date(nowMs + jstOffsetMs);
  const nowYear = nowJst.getUTCFullYear();
  const nowMonth = nowJst.getUTCMonth();
  const nowDay = nowJst.getUTCDate();

  const firstIso = item.first_date_at || "";
  if (firstIso) {
    const parsed = new Date(firstIso);
    if (!Number.isNaN(parsed.getTime())) {
      const jst = new Date(parsed.getTime() + jstOffsetMs);
      const month = jst.getUTCMonth();
      const day = jst.getUTCDate();
      const candidateUtc = Date.UTC(nowYear, month, day, 0, 0, 0) - jstOffsetMs;
      const isToday = month === nowMonth && day === nowDay;
      if (isToday || candidateUtc > nowMs) {
        return new Date(candidateUtc).toISOString();
      }

      const nextUtc = Date.UTC(nowYear + 1, month, day, 0, 0, 0) - jstOffsetMs;
      return new Date(nextUtc).toISOString();
    }
  }

  const mdMatch = (item.date || "").match(/^(\d{2})\/(\d{2})$/);
  if (mdMatch) {
    const month = Number(mdMatch[1]) - 1;
    const day = Number(mdMatch[2]);
    const candidateUtc = Date.UTC(nowYear, month, day, 0, 0, 0) - jstOffsetMs;
    const isToday = month === nowMonth && day === nowDay;
    if (isToday || candidateUtc > nowMs) {
      return new Date(candidateUtc).toISOString();
    }

    const nextUtc = Date.UTC(nowYear + 1, month, day, 0, 0, 0) - jstOffsetMs;
    return new Date(nextUtc).toISOString();
  }

  return "";
};

export const isAnniversaryToday = (
  item: AnniversaryItem,
  nowMsArg?: number,
) => {
  const nowMs = typeof nowMsArg === "number" ? nowMsArg : Date.now();
  const target = parseToJstDayStart(computeNextIsoForAnniversary(item, nowMs));
  if (!target) {
    return false;
  }

  const targetJst = new Date(target.getTime() + jstOffsetMs);
  const nowJst = new Date(nowMs + jstOffsetMs);
  return (
    targetJst.getUTCMonth() === nowJst.getUTCMonth() &&
    targetJst.getUTCDate() === nowJst.getUTCDate()
  );
};

export const getFeaturedAnniversaries = (
  items: AnniversaryItem[],
  nowMsArg?: number,
) => {
  const nowMs = typeof nowMsArg === "number" ? nowMsArg : Date.now();
  const sortedItems = [...items].sort((a, b) => {
    const aNextIso = computeNextIsoForAnniversary(a, nowMs);
    const bNextIso = computeNextIsoForAnniversary(b, nowMs);
    const aDays = aNextIso ? getDaysUntil(aNextIso, nowMs) : null;
    const bDays = bNextIso ? getDaysUntil(bNextIso, nowMs) : null;
    const aKey = aDays === null ? Number.MAX_SAFE_INTEGER : aDays;
    const bKey = bDays === null ? Number.MAX_SAFE_INTEGER : bDays;

    if (aKey !== bKey) {
      return aKey - bKey;
    }

    const aTime = aNextIso
      ? new Date(aNextIso).getTime()
      : Number.MAX_SAFE_INTEGER;
    const bTime = bNextIso
      ? new Date(bNextIso).getTime()
      : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  const todayItems = sortedItems.filter((item) =>
    isAnniversaryToday(item, nowMs),
  );
  if (todayItems.length > 0) {
    return todayItems;
  }

  let minDays = Number.MAX_SAFE_INTEGER;
  const nextItems: AnniversaryItem[] = [];
  sortedItems.forEach((item) => {
    const nextIso = computeNextIsoForAnniversary(item, nowMs);
    const days = nextIso ? getDaysUntil(nextIso, nowMs) : null;
    if (days === null || days <= 0) {
      return;
    }

    if (days < minDays) {
      minDays = days;
      nextItems.length = 0;
      nextItems.push(item);
      return;
    }

    if (days === minDays) {
      nextItems.push(item);
    }
  });

  return nextItems;
};

const getYearFromDate = (dateStr?: string | null) => {
  if (!dateStr) {
    return null;
  }

  const dateOnlyMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    return Number(dateOnlyMatch[1]);
  }

  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const jst = new Date(parsed.getTime() + jstOffsetMs);
  return jst.getUTCFullYear();
};

export const formatAnniversaryName = (
  item: AnniversaryItem,
  locale: string,
  nowMsArg?: number,
) => {
  const template = item.name || "";
  if (!template) {
    return "";
  }

  const nextIso = computeNextIsoForAnniversary(item, nowMsArg);
  if (!nextIso) {
    return template;
  }

  const nextJst = new Date(new Date(nextIso).getTime() + jstOffsetMs);
  const occurrenceYear = nextJst.getUTCFullYear();
  let result = template.replace(/\{year\}/g, String(occurrenceYear));

  if (!result.includes("{n}")) {
    return result;
  }

  const firstYear = getYearFromDate(item.first_date_at || item.date);
  if (!firstYear) {
    return result;
  }

  const n = occurrenceYear - firstYear;
  if (!Number.isFinite(n) || n <= 0) {
    return result;
  }

  const isEnLocale = locale.toLowerCase().startsWith("en");
  const ordinal = (value: number) => {
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (mod10 === 1 && mod100 !== 11) return `${value}st`;
    if (mod10 === 2 && mod100 !== 12) return `${value}nd`;
    if (mod10 === 3 && mod100 !== 13) return `${value}rd`;
    return `${value}th`;
  };

  return result.replace(/\{n\}/g, isEnLocale ? ordinal(n) : String(n));
};

export const toJstMonthDayKey = (date: Date) => {
  const jstDate = new Date(date.getTime() + jstOffsetMs);
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jstDate.getUTCDate()).padStart(2, "0");
  return `${month}-${day}`;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const buildTimelineMilestones = (
  songs: Song[],
  externalMilestones: MilestoneHighlightItem[],
) => {
  const songMilestones = songs
    .filter(
      (song) =>
        song.milestones && song.milestones.length > 0 && song.broadcast_at,
    )
    .flatMap((song) =>
      (song.milestones || []).map((milestone) => ({
        date: new Date(song.broadcast_at),
        text: milestone.trim(),
        note: "",
        url: "",
        is_external: false,
        song: song,
      })),
    );

  const dedupedSongMilestones = Array.from(
    songMilestones
      .reduce((map, milestone) => {
        const existing = map.get(milestone.text);
        if (!existing || milestone.date.getTime() < existing.date.getTime()) {
          map.set(milestone.text, milestone);
        }
        return map;
      }, new Map<string, TimelineMilestoneHighlight>())
      .values(),
  );

  const apiMilestones: TimelineMilestoneHighlight[] = (
    externalMilestones || []
  ).flatMap((milestone) => {
    const date = milestone.date ? new Date(milestone.date) : null;
    const text = milestone.content?.trim() || "";
    if (!date || Number.isNaN(date.getTime()) || !text) {
      return [];
    }

    return [
      {
        date,
        text,
        note: milestone.note || "",
        url: milestone.url || "",
        is_external: true,
        song: milestone.song,
      },
    ];
  });

  const songByText = new Map(
    dedupedSongMilestones.map(
      (milestone) => [milestone.text, milestone] as const,
    ),
  );
  const apiByText = apiMilestones.reduce((map, milestone) => {
    const list = map.get(milestone.text);
    if (list) {
      list.push(milestone);
    } else {
      map.set(milestone.text, [milestone]);
    }
    return map;
  }, new Map<string, TimelineMilestoneHighlight[]>());

  const mergedCrossSourceMilestones: TimelineMilestoneHighlight[] = [];

  for (const songMilestone of dedupedSongMilestones) {
    const apiGroup = apiByText.get(songMilestone.text);
    if (!apiGroup || apiGroup.length === 0) {
      mergedCrossSourceMilestones.push(songMilestone);
      continue;
    }

    const oldestApi = apiGroup.reduce((oldest, current) =>
      current.date.getTime() < oldest.date.getTime() ? current : oldest,
    );
    const mergedDate =
      oldestApi.date.getTime() < songMilestone.date.getTime()
        ? oldestApi.date
        : songMilestone.date;
    const mergedNote =
      songMilestone.note ||
      apiGroup.find((milestone) => Boolean(milestone.note))?.note ||
      "";
    const mergedUrl =
      apiGroup.find((milestone) => Boolean(milestone.url))?.url || "";

    mergedCrossSourceMilestones.push({
      ...songMilestone,
      date: mergedDate,
      note: mergedNote,
      url: mergedUrl,
      is_external: songMilestone.is_external || apiGroup.length > 0,
    });
  }

  const allMilestones: TimelineMilestoneHighlight[] = [
    ...mergedCrossSourceMilestones,
    ...apiMilestones.filter((milestone) => !songByText.has(milestone.text)),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const uniqueMilestones = new Map<string, TimelineMilestoneHighlight>();
  for (const milestone of allMilestones) {
    const key = `${toDateKey(milestone.date)}::${milestone.text}`;
    const previous = uniqueMilestones.get(key);
    if (!previous) {
      uniqueMilestones.set(key, milestone);
      continue;
    }

    uniqueMilestones.set(key, {
      ...previous,
      note: previous.note || milestone.note,
      url: previous.url || milestone.url,
      is_external: previous.is_external || milestone.is_external,
      song: previous.song || milestone.song,
    });
  }

  return Array.from(uniqueMilestones.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
};

export const getTodayMilestones = <T extends MilestoneHighlightItem>(
  items: T[],
  nowArg?: Date,
) => {
  const todayKey = toJstMonthDayKey(nowArg ?? new Date());
  return items.filter((item) => {
    if (!item.date) {
      return false;
    }

    const parsed = new Date(item.date);
    if (Number.isNaN(parsed.getTime())) {
      return false;
    }

    return toJstMonthDayKey(parsed) === todayKey;
  });
};

export const buildMilestoneSearchHref = (text: string) => {
  return `/?q=${encodeURIComponent(`milestone:${text}`)}`;
};

export const getTodayTimelineMilestones = (
  songs: Song[],
  externalMilestones: MilestoneHighlightItem[],
  nowArg?: Date,
) => {
  return buildTimelineMilestones(songs, externalMilestones).filter(
    (milestone) =>
      toJstMonthDayKey(milestone.date) ===
      toJstMonthDayKey(nowArg ?? new Date()),
  );
};

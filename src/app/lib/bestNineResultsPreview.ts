import type { Song } from "@/app/types/song";
import type { BestNineResults, BestNineTopicView } from "./bestNineTopics";
import { canonicalSongKey } from "./bestNineTopics";
import { normalizeStart } from "./myBestNineSongs";
import { isBestNineSongAllowed } from "./bestNineCategories";
import { prepareBestNineResultSlots } from "./bestNineResults";

export const BEST_NINE_PREVIEW_RESPONSES = 1000;

/** 開発用の表示確認。DBへの保存・既存回答の読み取りは行わない。 */
export function createBestNineResultsPreview(
  topic: BestNineTopicView,
  songs: Song[],
): BestNineResults {
  const groups = new Map<string, Song[]>();
  for (const song of songs) {
    if (
      song.is_members_only ||
      !song.video_id ||
      !Number.isFinite(Number(song.start))
    )
      continue;
    const key = canonicalSongKey(
      song.hl?.ja?.title || song.title,
      song.hl?.ja?.artist || song.artist,
    );
    const performances = groups.get(key) ?? [];
    if (
      !performances.some(
        (item) =>
          item.video_id === song.video_id &&
          normalizeStart(item.start) === normalizeStart(song.start),
      )
    )
      performances.push(song);
    groups.set(key, performances);
  }
  const preferred = [
    "いのち",
    "without U",
    "エントロピー",
    "フェリシア",
    "藍深く",
    "afterglow",
    "map in the cup",
    "Intersection",
  ];
  const priority = (group: Song[]) => {
    const title = group[0].hl?.ja?.title || group[0].title;
    const index = preferred.findIndex(
      (value) => value.toLowerCase() === title.toLowerCase(),
    );
    return index >= 0
      ? index
      : (group[0].hl?.ja?.artist || group[0].artist) === "AZKi"
        ? 100
        : 200;
  };
  const candidates = [...groups.entries()].sort(
    (a, b) => priority(a[1]) - priority(b[1]) || a[0].localeCompare(b[0]),
  );
  if (!candidates.length) throw new Error("No songs available for preview");
  let seed = 0x9e3779b9;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const slots: BestNineResults["slots"] = Array.from(
    { length: 9 },
    (_, slot) => {
      const slotCandidates = candidates
        .map(
          ([key, songs]) =>
            [
              key,
              songs.filter((song) =>
                isBestNineSongAllowed(song, topic.slotCategories?.[slot]),
              ),
            ] as const,
        )
        .filter(([, songs]) => songs.length);
      if (!slotCandidates.length)
        return {
          slot,
          theme: topic.themes[slot],
          answerCount: 0,
          rankings: [],
        };
      const offset = slot % slotCandidates.length;
      const pool = [
        ...slotCandidates.slice(offset),
        ...slotCandidates.slice(0, offset),
      ].slice(0, 12);
      const rankings = pool.map(([songKey, performances]) => ({
        songKey,
        title: performances[0].title,
        artist: performances[0].artist,
        count: 0,
        performances: performances.slice(0, 3).map((song) => ({
          videoId: song.video_id,
          start: normalizeStart(song.start)!,
          count: 0,
          videoTitle: song.video_title || song.title,
          broadcastAt: song.broadcast_at,
        })),
      }));
      const weights = rankings.map((_, index) => 1 / (index + 1) ** 1.3);
      const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
      for (
        let respondent = 0;
        respondent < BEST_NINE_PREVIEW_RESPONSES;
        respondent++
      ) {
        let roll = random() * weightSum;
        let choice = rankings.length - 1;
        for (let index = 0; index < weights.length; index++) {
          roll -= weights[index];
          if (roll < 0) {
            choice = index;
            break;
          }
        }
        const rank = rankings[choice];
        rank.count++;
        rank.performances[Math.floor(random() * rank.performances.length)]
          .count++;
      }
      for (const rank of rankings)
        rank.performances = rank.performances
          .filter((item) => item.count > 0)
          .sort((a, b) => b.count - a.count);
      rankings.sort(
        (a, b) => b.count - a.count || a.title.localeCompare(b.title),
      );
      return {
        slot,
        theme: topic.themes[slot] || "",
        answerCount: BEST_NINE_PREVIEW_RESPONSES,
        rankings: rankings.filter((rank) => rank.count > 0),
      };
    },
  );
  return {
    topic,
    responseCount: BEST_NINE_PREVIEW_RESPONSES,
    guestCount: 700,
    accountCount: 300,
    slots: prepareBestNineResultSlots(topic, slots),
  };
}

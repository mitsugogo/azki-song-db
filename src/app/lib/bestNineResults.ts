import type { BestNineResults, BestNineTopicView } from "./bestNineTopics";
import { hasFixedSlots } from "./myBestNineSongs";

type ResultSlot = BestNineResults["slots"][number];

/** 順不同のお題は全枠を合算し、枠に意味があるお題は個別の集計を維持する。 */
export function prepareBestNineResultSlots(
  topic: BestNineTopicView,
  slots: ResultSlot[],
): ResultSlot[] {
  let results: ResultSlot[];
  if (hasFixedSlots(topic)) {
    results = slots.map((slot) => ({
      ...slot,
      rankings: slot.rankings.map((rank) => ({
        ...rank,
        performances: rank.performances.map((performance) => ({
          ...performance,
        })),
      })),
    }));
  } else {
    const rankings = new Map<string, ResultSlot["rankings"][number]>();
    for (const slot of slots) {
      for (const rank of slot.rankings) {
        let combined = rankings.get(rank.songKey);
        if (!combined) {
          combined = { ...rank, count: 0, performances: [] };
          rankings.set(rank.songKey, combined);
        }
        combined.count += rank.count;
        for (const performance of rank.performances) {
          const existing = combined.performances.find(
            (item) =>
              item.videoId === performance.videoId &&
              item.start === performance.start,
          );
          if (existing) existing.count += performance.count;
          else combined.performances.push({ ...performance });
        }
      }
    }
    results = [
      {
        slot: 0,
        theme: "",
        answerCount: slots.reduce((count, slot) => count + slot.answerCount, 0),
        rankings: [...rankings.values()],
      },
    ];
  }
  for (const slot of results) {
    slot.rankings.sort(
      (a, b) => b.count - a.count || a.title.localeCompare(b.title),
    );
    for (const rank of slot.rankings)
      rank.performances.sort(
        (a, b) => b.count - a.count || a.videoId.localeCompare(b.videoId),
      );
  }
  return results;
}

import { describe, expect, it } from "vitest";
import type { Song } from "@/app/types/song";
import type { BestNineTopicView } from "../bestNineTopics";
import { createBestNineResultsPreview } from "../bestNineResultsPreview";
import { emptySlotCategories } from "../bestNineCategories";
import { emptyThemes } from "../myBestNineSongs";

const topic: BestNineTopicView = {
  id: "topic",
  title: "表示確認のお題",
  themes: Array.from({ length: 9 }, (_, index) => `お題${index + 1}`),
  version: 1,
  createdAt: "2026-10-28T00:00:00Z",
  canEdit: false,
  canDelete: false,
  canViewResults: false,
};
const songs = Array.from(
  { length: 36 },
  (_, index) =>
    ({
      title: `曲${Math.floor(index / 3)}`,
      artist: "AZKi",
      video_id: `video-${index}`,
      start: index * 10,
      video_title: `動画${index}`,
      broadcast_at: "2026-10-28T00:00:00Z",
    }) as Song,
);

describe("1000回答の集計表示用データ", () => {
  it("9枠で各1000回答、曲別と歌唱別の件数を一致させる", () => {
    const result = createBestNineResultsPreview(topic, songs);
    expect(result).toMatchObject({
      topic,
      responseCount: 1000,
      guestCount: 700,
      accountCount: 300,
    });
    expect(result.slots).toHaveLength(9);
    for (const [index, slot] of result.slots.entries()) {
      expect(slot).toMatchObject({
        slot: index,
        theme: `お題${index + 1}`,
        answerCount: 1000,
      });
      expect(slot.rankings.reduce((sum, rank) => sum + rank.count, 0)).toBe(
        1000,
      );
      expect(slot.rankings.length).toBeGreaterThan(8);
      for (const [position, rank] of slot.rankings.entries()) {
        expect(
          rank.performances.reduce(
            (sum, performance) => sum + performance.count,
            0,
          ),
        ).toBe(rank.count);
        if (position)
          expect(slot.rankings[position - 1].count).toBeGreaterThanOrEqual(
            rank.count,
          );
      }
    }
  });
  it("同じ入力では毎回同じ結果で、入力データを変更しない", () => {
    const before = JSON.stringify({ topic, songs });
    expect(createBestNineResultsPreview(topic, songs)).toEqual(
      createBestNineResultsPreview(topic, songs),
    );
    expect(JSON.stringify({ topic, songs })).toBe(before);
  });

  it("順不同の1000回答は9枠を合算した選曲9000件のランキングになる", () => {
    const result = createBestNineResultsPreview(
      { ...topic, themes: emptyThemes() },
      songs,
    );
    expect(result.responseCount).toBe(1000);
    expect(result.slots).toHaveLength(1);
    expect(result.slots[0].answerCount).toBe(9000);
    const ranks = result.slots[0].rankings;
    expect(new Set(ranks.map((rank) => rank.songKey)).size).toBe(ranks.length);
    expect(ranks.reduce((sum, rank) => sum + rank.count, 0)).toBe(9000);
    for (const rank of ranks) {
      expect(
        rank.performances.reduce(
          (sum, performance) => sum + performance.count,
          0,
        ),
      ).toBe(rank.count);
      expect(
        new Set(
          rank.performances.map(
            (performance) => `${performance.videoId}:${performance.start}`,
          ),
        ).size,
      ).toBe(rank.performances.length);
    }
  });

  it("プレビュー回答も枠ごとのカテゴリ制限を守る", () => {
    const slotCategories = emptySlotCategories();
    slotCategories[0] = ["original"];
    slotCategories[1] = ["cover"];
    const result = createBestNineResultsPreview({ ...topic, slotCategories }, [
      { ...songs[0], title: "オリジナル", tags: ["オリ曲"], sing: "AZKi" },
      { ...songs[1], title: "カバー", tags: ["カバー曲"], sing: "AZKi" },
    ]);
    expect(result.slots[0].rankings.map((rank) => rank.title)).toEqual([
      "オリジナル",
    ]);
    expect(result.slots[1].rankings.map((rank) => rank.title)).toEqual([
      "カバー",
    ]);
    expect(result.slots[2].rankings).toHaveLength(2);
  });
  it("メンバー限定と重複歌唱を除外し、少ない候補でも件数を維持する", () => {
    const result = createBestNineResultsPreview(topic, [
      songs[0],
      songs[0],
      { ...songs[1], is_members_only: true },
    ]);
    expect(
      result.slots.every(
        (slot) =>
          slot.rankings.length === 1 &&
          slot.rankings[0].count === 1000 &&
          slot.rankings[0].performances.length === 1,
      ),
    ).toBe(true);
  });
});

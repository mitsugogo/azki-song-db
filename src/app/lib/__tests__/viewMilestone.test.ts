import { describe, expect, it } from "vitest";
import { buildViewMilestoneInfo } from "../viewMilestone";
import { ViewStat } from "../../types/api/stat/views";

const createStat = (date: string, viewCount: number): ViewStat => ({
  datetime: new Date(date),
  viewCount,
  likeCount: 0,
  commentCount: 0,
});

describe("buildViewMilestoneInfo", () => {
  it("達成済みラベルの場合は最初の達成日を返す", () => {
    const history: ViewStat[] = [
      createStat("2026-01-05T00:00:00.000Z", 99500),
      createStat("2026-01-06T00:00:00.000Z", 100100),
      createStat("2026-01-07T00:00:00.000Z", 101200),
    ];

    const result = buildViewMilestoneInfo(101200, history);

    expect(result?.status).toBe("achieved");
    expect(result?.targetCount).toBe(100000);
    expect(result?.achievedAt).toBe("2026-01-06T00:00:00.000Z");
  });

  it("開始時点ですでに閾値超過している場合は達成日を表示しない", () => {
    const history: ViewStat[] = [
      createStat("2026-02-16T00:00:00.000Z", 100500),
      createStat("2026-02-17T00:00:00.000Z", 100900),
    ];

    const result = buildViewMilestoneInfo(100900, history);

    expect(result?.status).toBe("achieved");
    expect(result?.targetCount).toBe(100000);
    expect(result?.achievedAt).toBeNull();
  });

  it("未達成ラベルの場合は達成見込み日を返す", () => {
    const history: ViewStat[] = [
      createStat("2026-01-01T00:00:00.000Z", 94000),
      createStat("2026-01-10T00:00:00.000Z", 96000),
      createStat("2026-01-20T00:00:00.000Z", 98000),
    ];

    const result = buildViewMilestoneInfo(98000, history);

    expect(result?.status).toBe("remain");
    expect(result?.targetCount).toBe(100000);
    expect(result?.estimatedAt).not.toBeNull();
  });

  it("増分がない場合は見込み日を返さない", () => {
    const history: ViewStat[] = [
      createStat("2026-01-01T00:00:00.000Z", 98000),
      createStat("2026-01-20T00:00:00.000Z", 98000),
    ];

    const result = buildViewMilestoneInfo(98000, history);

    expect(result?.status).toBe("remain");
    expect(result?.estimatedAt).toBeNull();
  });

  it("達成見込みが14日より先の場合は表示しない", () => {
    const history: ViewStat[] = [
      createStat("2026-01-01T00:00:00.000Z", 97000),
      createStat("2026-01-31T00:00:00.000Z", 97300),
    ];

    const result = buildViewMilestoneInfo(97300, history);

    expect(result?.status).toBe("remain");
    expect(result?.estimatedAt).toBeNull();
  });

  it("600万再生達成時は達成日を返す", () => {
    const history: ViewStat[] = [
      createStat("2026-02-22T00:00:00.000Z", 5999100),
      createStat("2026-02-23T00:00:00.000Z", 6000905),
      createStat("2026-02-24T00:00:00.000Z", 6003500),
    ];

    const result = buildViewMilestoneInfo(6000905, history);

    expect(result?.status).toBe("achieved");
    expect(result?.targetCount).toBe(6000000);
    expect(result?.achievedAt).toBe("2026-02-23T00:00:00.000Z");
  });

  it("対象外の再生回数ならnullを返す", () => {
    const result = buildViewMilestoneInfo(55555, []);
    expect(result).toBeNull();
  });
});

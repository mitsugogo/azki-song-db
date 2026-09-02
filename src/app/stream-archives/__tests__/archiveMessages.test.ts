import { describe, expect, it } from "vitest";
import enMessages from "@/messages/en.json";
import jaMessages from "@/messages/ja.json";

describe("stream archive messages", () => {
  it("defines archive labels in Japanese and English", () => {
    expect(jaMessages.Archives.activityLabel).toBe("活動量");
    expect(jaMessages.Archives.filterToggleLabel).toBe("検索条件");
    expect(jaMessages.Archives.castLabel).toBe("出演");
    expect(jaMessages.Archives.castFilterPlaceholder).toBe("出演者");
    expect(jaMessages.Archives.castSelectedCount).toBe("{count}人選択中");
    expect(jaMessages.Archives.collaborationRankingTitle).toBe(
      "よくコラボしたホロメン",
    );
    expect(jaMessages.Archives.collaborationCount).toBe("{count}件");
    expect(jaMessages.Archives.collaborationRankingCombinationMode).toBe(
      "組み合わせ別",
    );
    expect(jaMessages.Archives.collaborationFirstDate).toBe(
      "初コラボ {date}・{duration}",
    );
    expect(jaMessages.Archives.collaborationNoHistory).toBe("未コラボ");
    expect(jaMessages.Archives.statsTabLabel).toBe("統計");
    expect(jaMessages.Archives.listTitle).toBe("アーカイブ一覧");
    expect(jaMessages.Archives.categoryRankingTitle).toBe(
      "配信数の多いカテゴリ",
    );
    expect(jaMessages.Archives.longestStreamRankingTitle).toBe(
      "配信時間が長い配信",
    );
    expect(enMessages.Archives.activityLabel).toBe("Activity");
    expect(enMessages.Archives.filterToggleLabel).toBe("Search filters");
    expect(enMessages.Archives.castLabel).toBe("Cast");
    expect(enMessages.Archives.castFilterPlaceholder).toBe("Cast members");
    expect(enMessages.Archives.castSelectedCount).toBe(
      "{count} cast members selected",
    );
    expect(enMessages.Archives.collaborationRankingTitle).toBe("Top collabs");
    expect(enMessages.Archives.collaborationRankingMemberMode).toBe(
      "By member",
    );
    expect(enMessages.Archives.collaborationFirstDate).toBe(
      "First collab {date} · {duration}",
    );
    expect(enMessages.Archives.collaborationNoHistory).toBe("No collabs yet");
    expect(enMessages.Archives.longestStreamRankingTitle).toBe(
      "Longest streams",
    );
    expect(enMessages.Archives.statsTabLabel).toBe("Statistics");
    expect(enMessages.Archives.listTitle).toBe("Archive List");
    expect(enMessages.Metadata.archiveList.title).toBe("Archive List");
  });
});

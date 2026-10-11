import { describe, expect, it } from "vitest";
import { removeYouTubeLinksFromDescription } from "../description";

const youtubeUrl = "https://youtu.be/example?t=1694";

describe("removeYouTubeLinksFromDescription", () => {
  it.each(["~", "〜", "～", " ～"])(
    "タイムスタンプとリンクを除去した後に区切り記号 %s を残さない",
    (separator) => {
      expect(
        removeYouTubeLinksFromDescription(
          `【GeoGuessr】日本の鉄道\n28:14${separator}${youtubeUrl}`,
          [youtubeUrl],
        ),
      ).toBe("【GeoGuessr】日本の鉄道");
    },
  );

  it("時刻を含む説明文や本文の波線を維持する", () => {
    expect(
      removeYouTubeLinksFromDescription(
        `営業時間 9:00～17:00\n駅〜博物館のルート ~ メモ\n見どころ 1:28:14～ ${youtubeUrl}`,
        [youtubeUrl],
      ),
    ).toBe("営業時間 9:00～17:00\n駅〜博物館のルート ~ メモ\n見どころ");
  });

  it("リンク除去後に区切り記号だけになった行を省く", () => {
    expect(
      removeYouTubeLinksFromDescription(`説明\n${youtubeUrl} ～\n続き`, [
        youtubeUrl,
      ]),
    ).toBe("説明\n続き");
  });

  it("YouTube 以外の URL と時刻はそのまま残す", () => {
    expect(
      removeYouTubeLinksFromDescription(
        "公式サイト 9:00～ https://example.com/",
        [],
      ),
    ).toBe("公式サイト 9:00～ https://example.com/");
  });

  it("複数の動画リンクとタイムスタンプを除去する", () => {
    const secondUrl = "https://www.youtube.com/watch?v=second&t=123";
    expect(
      removeYouTubeLinksFromDescription(
        `説明\n28:14～${youtubeUrl} 2:03〜${secondUrl}`,
        [youtubeUrl, secondUrl],
      ),
    ).toBe("説明");
  });
});

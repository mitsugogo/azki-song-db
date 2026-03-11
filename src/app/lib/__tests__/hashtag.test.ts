import { describe, expect, it } from "vitest";
import { getYoutubeVisibleHashtagBodies } from "../hashtag";

describe("hashtag - getYoutubeVisibleHashtagBodies", () => {
  it("タイトルにハッシュタグがある場合は空配列を返す", () => {
    const tags = getYoutubeVisibleHashtagBodies(
      "新曲 #talk&live 公開",
      "説明文 #desc1 #desc2 #desc3",
    );
    expect(tags).toEqual([]);
  });

  it("タイトルに無い場合は説明文から先頭3件を返す", () => {
    const tags = getYoutubeVisibleHashtagBodies(
      "新曲リリース",
      "説明文 #first #second #third #fourth",
    );
    expect(tags).toEqual(["first", "second", "third"]);
  });

  it("YouTube判定で & を含むハッシュタグを許可する", () => {
    const tags = getYoutubeVisibleHashtagBodies(
      "お知らせ",
      "配信タグ #talk&live と #music",
    );
    expect(tags).toEqual(["talk&live", "music"]);
  });
});

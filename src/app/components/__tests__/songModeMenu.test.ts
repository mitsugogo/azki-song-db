import { describe, expect, it } from "vitest";
import { getSongMode, getSongModeSearchTerm } from "../songModeMenu";

describe("songModeMenu", () => {
  it("歌枠モードを内部識別子から検索用タグへ変換する", () => {
    expect(getSongModeSearchTerm("singing-stream")).toBe("tag:歌枠");
  });

  it("既存の歌枠検索 URL を歌枠モードとして認識する", () => {
    expect(getSongMode("tag:歌枠")).toBe("singing-stream");
  });

  it("VOCALOIDタグをボカロモードとして認識する", () => {
    expect(getSongMode("tag:VOCALOID")).toBe("vocaloid-songs");
  });

  it.each([
    ["spring-song", "tag:春ソング"],
    ["summer-song", "tag:夏ソング"],
    ["winter-song", "tag:冬ソング"],
  ] as const)("%sモードを季節タグへ変換して認識する", (mode, tag) => {
    expect(getSongModeSearchTerm(mode)).toBe(tag);
    expect(getSongMode(tag)).toBe(mode);
  });
});

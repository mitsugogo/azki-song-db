import { describe, expect, it } from "vitest";
import { getArchiveTopics } from "../archiveTopics";

describe("getArchiveTopics", () => {
  it("preserves commas in quoted game titles and removes surrounding quotes", () => {
    expect(
      getArchiveTopics(' "Papers, Please" 、 雑談, "ゲーム、タイトル" '),
    ).toEqual([
      { title: "Papers, Please", key: "papersplease" },
      { title: "雑談", key: "雑談" },
      { title: "ゲーム、タイトル", key: "ゲームタイトル" },
    ]);
    expect(getArchiveTopics('"Papers, Please"')).toEqual([
      { title: "Papers, Please", key: "papersplease" },
    ]);
  });

  it("decodes escaped quotes and deduplicates quoted and unquoted categories", () => {
    expect(getArchiveTopics('"Game ""Title"", Again",雑談、"雑談"')).toEqual([
      { title: 'Game "Title", Again', key: 'game"title"again' },
      { title: "雑談", key: "雑談" },
    ]);
    expect(getArchiveTopics('"", "   "、歌枠')).toEqual([
      { title: "歌枠", key: "歌枠" },
    ]);
  });

  it("preserves unmatched quotes and quotes within unquoted names", () => {
    expect(getArchiveTopics('雑談、"Papers, Please')).toEqual([
      { title: "雑談", key: "雑談" },
      { title: '"Papers, Please', key: '"papersplease' },
    ]);
    expect(getArchiveTopics('Game "Title",雑談')).toEqual([
      { title: 'Game "Title"', key: 'game"title"' },
      { title: "雑談", key: "雑談" },
    ]);
  });

  it("splits Japanese and ASCII commas, trims and deduplicates normalized names", () => {
    expect(
      getArchiveTopics(" 雑談 、 Minecraft, ,雑談、Ｍｉｎｅｃｒａｆｔ,歌枠、"),
    ).toEqual([
      { title: "雑談", key: "雑談" },
      { title: "Minecraft", key: "minecraft" },
      { title: "歌枠", key: "歌枠" },
    ]);
  });

  it("keeps single categories and supplies a fallback only for empty categories", () => {
    expect(getArchiveTopics("歌枠")).toEqual([{ title: "歌枠", key: "歌枠" }]);
    expect(getArchiveTopics(" 、, ")).toEqual([]);
    expect(getArchiveTopics(" 、, ", "Other")).toEqual([
      { title: "Other", key: "other" },
    ]);
  });
});

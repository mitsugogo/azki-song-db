import { describe, expect, it } from "vitest";
import { getArchiveTopics } from "../archiveTopics";

describe("getArchiveTopics", () => {
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

import { describe, expect, it } from "vitest";
import { getSongMode, getSongModeSearchTerm } from "../songModeMenu";
import {
  expandSongModeQuery,
  getSongModeMetadataKey,
  SONG_MODE_METADATA_KEYS,
} from "../../config/songModes";

describe("songModeMenu", () => {
  it("歌枠モードを専用検索クエリへ変換する", () => {
    expect(getSongModeSearchTerm("singing-stream")).toBe("singing-stream");
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
  ] as const)("%sの専用・従来クエリを認識する", (mode, tag) => {
    expect(getSongModeSearchTerm(mode)).toBe(mode);
    expect(getSongMode(mode)).toBe(mode);
    expect(getSongMode(tag)).toBe(mode);
  });

  it("バラードモードでは専用検索クエリを表示する", () => {
    expect(getSongModeSearchTerm("ballad")).toBe("ballad");
    expect(getSongMode("ballad")).toBe("ballad");
    expect(getSongMode("tag:しっとり OR tag:バラード")).toBe("ballad");
  });

  it("バラードの専用検索クエリを従来と同じ検索条件へ展開する", () => {
    expect(expandSongModeQuery("ballad")).toBe("tag:しっとり OR tag:バラード");
    expect(expandSongModeQuery("year:2025|ballad")).toBe(
      "year:2025|tag:しっとり OR tag:バラード",
    );
  });

  it("すべての専用モードにOGメタデータキーがある", () => {
    Object.entries(SONG_MODE_METADATA_KEYS).forEach(([mode, metadataKey]) => {
      expect(getSongModeMetadataKey(mode)).toBe(metadataKey);
    });
    expect(getSongModeMetadataKey("sololive2025")).toBe("original");
  });
});

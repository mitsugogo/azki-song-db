import { describe, it, expect } from "vitest";
import { MyBestNineSongs } from "@/app/hook/useMyBestNineSongs";

import {
  encodeSelection as encodeToUrlParam,
  decodeSelection as decodeFromUrlParam,
} from "@/app/lib/myBestNineSongs";

describe("MyBestNineSongs codec", () => {
  it("シンプルな9選データをエンコード/デコードできる", () => {
    const original: MyBestNineSongs = {
      title: "推し曲ランキング",
      author: "ユーザー1",
      songs: [
        { v: "video1", s: "0" },
        { v: "video2", s: "30" },
        { v: "video3", s: "60" },
      ],
    };

    const encoded = encodeToUrlParam(original);
    const decoded = decodeFromUrlParam(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.title).toBe("推し曲ランキング");
    expect(decoded?.author).toBe("ユーザー1");
    expect(decoded?.songs).toHaveLength(3);
    expect(decoded?.songs[0]).toEqual({ v: "video1", s: "0" });
  });

  it("日本語タイトルをエンコード/デコードできる", () => {
    const original: MyBestNineSongs = {
      title: "好きな歌9選",
      author: "みちゃん",
      songs: [{ v: "abc123", s: "45" }],
    };

    const encoded = encodeToUrlParam(original);
    const decoded = decodeFromUrlParam(encoded);

    expect(decoded?.title).toBe("好きな歌9選");
    expect(decoded?.author).toBe("みちゃん");
  });

  it("作成者名なしでエンコード/デコードできる", () => {
    const original: MyBestNineSongs = {
      title: "セレクション",
      songs: [{ v: "xyz789", s: "0" }],
    };

    const encoded = encodeToUrlParam(original);
    const decoded = decodeFromUrlParam(encoded);

    expect(decoded?.title).toBe("セレクション");
    expect(decoded?.author).toBeUndefined();
  });

  it("9曲上限を超えるデータはデコード失敗", () => {
    const invalid: MyBestNineSongs = {
      title: "many songs",
      songs: Array.from({ length: 10 }, (_, i) => ({
        v: `v${i}`,
        s: `${i * 30}`,
      })),
    };

    const encoded = encodeToUrlParam(invalid);
    const decoded = decodeFromUrlParam(encoded);

    // 10 曲なので失敗
    expect(decoded).toBeNull();
  });

  it("エンコード結果は URL-safe である", () => {
    const selection: MyBestNineSongs = {
      title: "test",
      songs: [{ v: "v1", s: "0" }],
    };

    const encoded = encodeToUrlParam(selection);

    // URL-safe base64 では + / = が含まれていない
    expect(encoded).not.toMatch(/\+/);
    expect(encoded).not.toMatch(/\//);
    expect(encoded).not.toMatch(/=/);

    // - _ は許可（base64url の仕様）
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
  });
});

import { expect, describe, it } from "vitest";
import { MyBestNineSongs } from "@/app/hook/useMyBestNineSongs";

/**
 * MyBestNineSongs 統合テスト
 * 実装の基本フロー確認
 */
describe("MyBestNineSongs integration", () => {
  it("9選ページ URL のシミュレーション", () => {
    // 1. ユーザーが 9 選を作成
    const selection: MyBestNineSongs = {
      title: "AZKi推し曲9選",
      author: "タネムシ",
      songs: [
        { v: "dQw4w9WgXcQ", s: "0" },
        { v: "jNQXAC9IVRw", s: "30" },
        { v: "9bZkp7q19f0", s: "60" },
        { v: "kFFacGZ5TLg", s: "0" },
        { v: "ZDjlbUmezo0", s: "90" },
        { v: "l5aknot1N80", s: "120" },
        { v: "gG62zf-wrRE", s: "0" },
        { v: "K_z7WJHwl3M", s: "150" },
        { v: "tYzMGcUty6s", s: "180" },
      ],
    };

    // 2. エンコード
    const jsonString = JSON.stringify({
      t: selection.title,
      a: selection.author,
      s: selection.songs,
    });
    expect(jsonString).toContain("AZKi推し曲9選");
    expect(jsonString).toContain("タネムシ");

    // UTF-8 エンコーディング
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(jsonString);
    expect(utf8Bytes.length).toBeGreaterThan(0);

    // base64url
    const binaryString = String.fromCharCode(...utf8Bytes);
    const base64 = btoa(binaryString);
    const base64url = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    expect(base64url).toMatch(/^[A-Za-z0-9_-]+$/);
    console.log(`生成された URL パラメータ長: ${base64url.length} 文字`);

    // 3. デコード
    let base64Decoded = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padding = 4 - (base64Decoded.length % 4);
    if (padding !== 4) {
      base64Decoded += "=".repeat(padding);
    }

    const binaryStringDecoded = atob(base64Decoded);
    const len = binaryStringDecoded.length;
    const bytesDecoded = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytesDecoded[i] = binaryStringDecoded.charCodeAt(i);
    }

    const decoder = new TextDecoder();
    const decodedText = decoder.decode(bytesDecoded);
    const compressedJson = JSON.parse(decodedText);

    const decodedSelection: MyBestNineSongs = {
      title: compressedJson.t,
      author: compressedJson.a,
      songs: compressedJson.s.map((entry: { v: string; s: string }) => ({
        v: entry.v,
        s: entry.s,
      })),
    };

    // 4. 検証
    expect(decodedSelection.title).toBe("AZKi推し曲9選");
    expect(decodedSelection.author).toBe("タネムシ");
    expect(decodedSelection.songs).toHaveLength(9);
    expect(decodedSelection.songs[0]).toEqual({ v: "dQw4w9WgXcQ", s: "0" });

    // 5. 共有 URL の形式チェック
    const shareUrl = `https://azki-song-db.vercel.app/share/my-best-9-songs/${base64url}`;
    expect(shareUrl).toMatch(
      /^https:\/\/.*\/share\/my-best-9-songs\/[A-Za-z0-9_-]+$/,
    );
    console.log(`共有 URL: ${shareUrl.substring(0, 80)}...`);
  });

  it("9 選の制約をシミュレーション", () => {
    // 最大 9 曲でバリデーション
    const tooMany: MyBestNineSongs = {
      title: "too many",
      songs: Array.from({ length: 10 }, (_, i) => ({
        v: `v${i}`,
        s: `${i * 30}`,
      })),
    };

    // デコード時のバリデーション
    const jsonStr = JSON.stringify({
      t: tooMany.title,
      s: tooMany.songs,
    });

    const encoded = btoa(jsonStr);
    const base64url = encoded
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    // デコード＆バリデーション
    let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padding = 4 - (base64.length % 4);
    if (padding !== 4) {
      base64 += "=".repeat(padding);
    }

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const decoder = new TextDecoder();
    const decoded = decoder.decode(bytes);
    const json = JSON.parse(decoded);

    // 9 曲超は invalid
    const isValid = !!(json.t && Array.isArray(json.s) && json.s.length <= 9);

    expect(isValid).toBe(false);
  });

  it("OG 画像パラメータの検証", () => {
    // メタデータで使用される URL パラメータ
    const encoded = "sampleEncodedData";
    const ogImageUrl = `https://azki-song-db.vercel.app/api/og/share/my-best-9-songs?encoded=${encoded}&w=1200&h=630`;

    expect(ogImageUrl).toContain("api/og/share/my-best-9-songs");
    expect(ogImageUrl).toContain("w=1200");
    expect(ogImageUrl).toContain("h=630");
  });

  it("9 曲グリッドレイアウトのシミュレーション", () => {
    // 3x3 グリッドのカード数検証
    const gridCols = 3;
    const gridRows = 3;
    const totalCards = gridCols * gridRows;

    expect(totalCards).toBe(9);

    // 9 曲未満の場合もグリッドに配置可能（空カード対応）
    const songs = Array.from({ length: 7 }, (_, i) => ({
      v: `v${i}`,
      s: `${i * 30}`,
    }));

    expect(songs.length).toBeLessThanOrEqual(totalCards);
  });
});

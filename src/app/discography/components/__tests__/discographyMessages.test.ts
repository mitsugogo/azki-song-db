import enMessages from "@/messages/en.json";
import jaMessages from "@/messages/ja.json";
import { describe, expect, it } from "vitest";

const viewModeMessageKeys = [
  "viewMode",
  "viewModeTile",
  "viewModeSongList",
] as const;

describe("Discography表示形式の翻訳", () => {
  it.each([
    ["ja", jaMessages],
    ["en", enMessages],
  ] as const)("%sで必要な表示形式ラベルを提供する", (_locale, messages) => {
    for (const key of viewModeMessageKeys) {
      expect(messages.Discography.controls[key]).toEqual(expect.any(String));
      expect(messages.Discography.controls[key]).not.toHaveLength(0);
    }
  });
});

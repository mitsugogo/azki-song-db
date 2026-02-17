import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderLinkedText } from "../textLinkify";

type Case = {
  input: string;
  platform: "x" | "youtube" | "self";
  shouldLink: boolean;
  href?: string;
  display: string;
};

const cases: Case[] = [
  {
    input: "#ぺこーら24",
    platform: "youtube",
    shouldLink: true,
    href: "https://www.youtube.com/hashtag/ぺこーら24",
    display: "#ぺこーら24",
  },
  {
    input: "＃ぺこーら２４",
    platform: "youtube",
    shouldLink: true,
    href: "https://www.youtube.com/hashtag/ぺこーら２４",
    display: "＃ぺこーら２４",
  },
  {
    input: "#ホロライブ #VTuber",
    platform: "x",
    shouldLink: true,
    href: "https://x.com/hashtag/ホロライブ",
    display: "#ホロライブ",
  },
  {
    input: "#YouTube_Gaming",
    platform: "x",
    shouldLink: true,
    href: "https://x.com/hashtag/YouTube_Gaming",
    display: "#YouTube_Gaming",
  },
  { input: "#12345", platform: "x", shouldLink: false, display: "#12345" },
  { input: "＃１２３", platform: "x", shouldLink: false, display: "＃１２３" },
  {
    input: "email@#tag",
    platform: "x",
    shouldLink: true,
    href: "https://x.com/hashtag/tag",
    display: "#tag",
  },
  {
    input: "これは#テスト です",
    platform: "youtube",
    shouldLink: true,
    href: "https://www.youtube.com/hashtag/テスト",
    display: "#テスト",
  },
  {
    input: "#hash-tag",
    platform: "youtube",
    shouldLink: true,
    href: "https://www.youtube.com/hashtag/hash-tag",
    display: "#hash-tag",
  },
];

describe("textLinkify - ハッシュタグ検出", () => {
  for (const c of cases) {
    it(`${c.platform} - ${c.input}`, () => {
      const nodes = renderLinkedText(c.input, { hashtagPlatform: c.platform });
      render(<>{nodes}</>);

      const found = screen.queryByText((content, element) => {
        if (!element) return false;
        return content === c.display;
      });

      expect(found).toBeTruthy();
      const a = found?.closest("a") as HTMLAnchorElement | null;
      if (c.shouldLink) {
        expect(a).toBeTruthy();
        expect(a?.getAttribute("href")).toBe(c.href);
      } else {
        expect(a).toBeNull();
      }
    });
  }

  it("複数のハッシュタグを含むテキスト", () => {
    const input = "これは#テスト1 と #テスト2 です";
    const nodes = renderLinkedText(input, { hashtagPlatform: "youtube" });
    render(<>{nodes}</>);
    // リンクになっていることを確認
    const found1 = screen.queryByText("#テスト1");
    const found2 = screen.queryByText("#テスト2");
    expect(found1).toBeTruthy();
    expect(found2).toBeTruthy();
    const a1 = found1?.closest("a") as HTMLAnchorElement | null;
    const a2 = found2?.closest("a") as HTMLAnchorElement | null;
    expect(a1?.getAttribute("href")).toBe(
      "https://www.youtube.com/hashtag/テスト1",
    );
    expect(a2?.getAttribute("href")).toBe(
      "https://www.youtube.com/hashtag/テスト2",
    );
  });
});

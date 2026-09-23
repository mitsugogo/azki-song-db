import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LiveTitleGroup } from "@/app/types/live";
import LivesClient from "../client";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ja",
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) => {
      const messages: Record<string, string> = {
        searchLabel: "ライブを検索",
        categoryFilterLabel: "ライブカテゴリ",
        allCategories: "すべてのカテゴリ",
        clearFilters: "条件をクリア",
        empty: "条件に一致するライブはありません。",
        "category.solo": "ソロライブ",
        "category.unit": "ユニットライブ",
      };
      if (key === "yearHeading") return `${values?.year}年`;
      if (key === "songCount") return `${values?.count}曲`;
      if (key === "openLive") return `${values?.title}の詳細を見る`;
      if (key === "resultCount") return `${values?.count}件のライブ`;
      return messages[key] ?? key;
    },
}));

const makeGroup = (
  id: string,
  title: string,
  category: string,
  date: string,
  venue: string,
): LiveTitleGroup => ({
  canonicalId: id,
  title,
  category,
  latestDate: date,
  totalSongs: 2,
  performances: [
    {
      id,
      title,
      category,
      performance: "",
      date,
      doorsTime: "",
      startTime: "",
      venue,
      url: "",
      performers: "AZKi",
      ticket: "",
      note: "",
      setlist: [],
    },
  ],
});

const groups = [
  makeGroup(
    "LIVE-028",
    "Departure",
    "ソロライブ",
    "2025-11-19",
    "ぴあアリーナMM",
  ),
  makeGroup(
    "LIVE-019",
    "First Gravity",
    "ユニットライブ",
    "2024-01-27",
    "CLUB CITTA’",
  ),
];

describe("LivesClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/lives");
    window.matchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("年別カードにカテゴリ、日付、場所、曲数を表示する", () => {
    render(
      <MantineProvider>
        <LivesClient groups={groups} />
      </MantineProvider>,
    );

    expect(screen.getByRole("heading", { name: "2025年" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "2024年" })).toBeVisible();
    expect(screen.getByText("Departure")).toBeVisible();
    expect(screen.getByText("ぴあアリーナMM")).toBeVisible();
    expect(screen.getAllByText("2曲")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Departureの詳細を見る" }),
    ).toHaveAttribute("href", "/lives/LIVE-028");
  });

  it("URLのカテゴリとキーワードを復元し、クリアで全件に戻す", () => {
    window.history.replaceState(
      null,
      "",
      "/lives?category=%E3%82%BD%E3%83%AD%E3%83%A9%E3%82%A4%E3%83%96&q=departure",
    );
    render(
      <MantineProvider>
        <LivesClient groups={groups} />
      </MantineProvider>,
    );

    expect(screen.getByText("Departure")).toBeVisible();
    expect(screen.queryByText("First Gravity")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "条件をクリア" }));
    expect(screen.getByText("First Gravity")).toBeVisible();
    expect(window.location.search).toBe("");
  });

  it("検索入力をURLへ反映し、該当なしを表示する", () => {
    render(
      <MantineProvider>
        <LivesClient groups={groups} />
      </MantineProvider>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "ライブを検索" }), {
      target: { value: "存在しないライブ" },
    });
    expect(
      screen.getByText("条件に一致するライブはありません。"),
    ).toBeVisible();
    expect(new URLSearchParams(window.location.search).get("q")).toBe(
      "存在しないライブ",
    );
  });

  it("カテゴリ選択をURLへ反映し、対象カテゴリだけ表示する", () => {
    render(
      <MantineProvider>
        <LivesClient groups={groups} />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "ライブカテゴリ" }));
    fireEvent.click(screen.getByRole("option", { name: "ユニットライブ" }));

    expect(screen.getByText("First Gravity")).toBeVisible();
    expect(screen.queryByText("Departure")).toBeNull();
    expect(new URLSearchParams(window.location.search).get("category")).toBe(
      "ユニットライブ",
    );
  });

  it("声音エントロピーの一覧リンクはタイトルslugを指す", () => {
    const entropy = makeGroup(
      "kowairo-entropy-yokohama-day",
      "AZKi Major Debut LiVE 「声音エントロピー」",
      "ソロライブ",
      "2024-08-03",
      "横浜",
    );
    entropy.pageSlug = "kowairo-entropy";
    entropy.performances[0].performanceSlug = "yokohama-day";
    render(
      <MantineProvider>
        <LivesClient groups={[entropy]} />
      </MantineProvider>,
    );

    expect(
      screen.getByRole("link", {
        name: "AZKi Major Debut LiVE 「声音エントロピー」の詳細を見る",
      }),
    ).toHaveAttribute("href", "/lives/kowairo-entropy");
  });

  it("複数公演の一覧リンクはALL比較ページを指す", () => {
    const entropy = makeGroup(
      "kowairo-entropy-yokohama-day",
      "AZKi Major Debut LiVE 「声音エントロピー」",
      "ソロライブ",
      "2024-08-03",
      "横浜",
    );
    entropy.pageSlug = "kowairo-entropy";
    entropy.performances.push({
      ...entropy.performances[0],
      id: "kowairo-entropy-yokohama-night",
      performance: "横浜夜",
      performanceSlug: "yokohama-night",
    });
    render(
      <MantineProvider>
        <LivesClient groups={[entropy]} />
      </MantineProvider>,
    );

    expect(
      screen.getByRole("link", {
        name: "AZKi Major Debut LiVE 「声音エントロピー」の詳細を見る",
      }),
    ).toHaveAttribute("href", "/lives/kowairo-entropy/all");
  });
});

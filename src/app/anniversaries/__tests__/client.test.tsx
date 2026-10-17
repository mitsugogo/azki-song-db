import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnniversaryItem } from "../../types/anniversaryItem";
import { theme } from "../../theme";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";

const mocks = vi.hoisted(() => ({
  items: [] as AnniversaryItem[],
  isLoading: false,
  locale: "ja",
}));
vi.mock("../../hook/useAnniversaries", () => ({ default: () => mocks }));
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useLocale: () => mocks.locale,
    useTranslations: () =>
      actual.createTranslator({
        locale: mocks.locale,
        messages: mocks.locale === "en" ? en : ja,
        namespace: "Anniversaries",
      }),
  };
});

import AnniversariesPageClient from "../client";

const item = (overrides: Partial<AnniversaryItem> = {}): AnniversaryItem => ({
  date: "11/15",
  first_date_at: "2018-11-14T15:00:00.000Z",
  name: "活動開始{n}周年",
  url: "https://www.youtube.com/watch?v=example",
  note: "思い出を振り返る https://example.com/memory",
  ...overrides,
});
const renderPage = () =>
  render(
    <MantineProvider theme={theme}>
      <AnniversariesPageClient />
    </MantineProvider>,
  );

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-17T03:00:00Z"));
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  mocks.items = [item()];
  mocks.isLoading = false;
  mocks.locale = "ja";
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("anniversaries page", () => {
  it("shows the same name and days in the hero and list, retaining dates, notes and links", () => {
    renderPage();
    const hero = screen.getByRole("region", { name: "次の記念日" });
    const card = screen.getByRole("article", { name: "活動開始8周年" });
    expect(
      within(hero).getByRole("heading", { name: "活動開始8周年" }),
    ).toBeVisible();
    expect(within(hero).getByLabelText("あと29日")).toBeVisible();
    expect(within(card).getByText("あと29日")).toBeVisible();
    expect(within(hero).getByText("2026年11月15日")).toHaveAttribute(
      "datetime",
      "2026-11-14T15:00:00.000Z",
    );
    expect(within(card).getByText("2018年11月15日")).toBeVisible();
    expect(
      within(card).getByRole("link", { name: "https://example.com/memory" }),
    ).toHaveAttribute("href", "https://example.com/memory");
    for (const section of [hero, card]) {
      expect(
        within(section).getByRole("link", {
          name: "活動開始8周年のYouTubeを開く",
        }),
      ).toHaveAttribute("href", mocks.items[0].url);
    }
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeVisible();
  });

  it("shows all same-day anniversaries together with one shared countdown", () => {
    mocks.items.push(
      item({ name: "同日の記念日", url: "https://example.com" }),
    );
    renderPage();
    const hero = screen.getByRole("region", { name: "次の記念日" });
    expect(within(hero).getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(within(hero).getAllByLabelText("あと29日")).toHaveLength(1);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(
      within(hero).getByRole("link", { name: "同日の記念日のリンクを開く" }),
    ).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("makes every month jump point to the corresponding section, including the next year", () => {
    mocks.items.push(item({ date: "01/01", first_date_at: "", name: "年始" }));
    renderPage();
    const nav = screen.getByRole("navigation", { name: "記念日の月へ移動" });
    const jumps = within(nav).getAllByRole("link");
    expect(jumps.map((link) => link.textContent)).toEqual([
      "2026年11月",
      "2027年1月",
    ]);
    for (const jump of jumps) {
      const section = document.getElementById(
        jump.getAttribute("href")!.slice(1),
      );
      expect(section).toBe(
        screen.getByRole("region", { name: jump.textContent! }),
      );
    }
  });

  it("omits missing optional fields and retains an undated item", () => {
    mocks.items = [
      item({
        first_date_at: "",
        date: "",
        name: "日付不明",
        url: "",
        note: "",
      }),
    ];
    renderPage();
    expect(screen.getByRole("region", { name: "日付未設定" })).toBeVisible();
    expect(screen.getByRole("article", { name: "日付不明" })).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "次の記念日" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("初回")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /を開く/ }),
    ).not.toBeInTheDocument();
  });

  it("formats the English anniversary and singular countdown", () => {
    mocks.locale = "en";
    mocks.items = [item({ name: "The {n} anniversary in {year}" })];
    vi.setSystemTime(new Date("2029-11-14T03:00:00Z"));
    renderPage();
    const hero = screen.getByRole("region", { name: "Next anniversary" });
    expect(
      within(hero).getByRole("heading", {
        name: "The 11th anniversary in 2029",
      }),
    ).toBeVisible();
    expect(within(hero).getByLabelText("In 1 day")).toBeVisible();
    expect(within(hero).getByText("day")).toBeVisible();
    expect(within(hero).getByText("Nov 15, 2029")).toBeVisible();
    expect(screen.getByRole("region", { name: "November 2029" })).toBeVisible();
  });

  it("updates at JST midnight and switches to the following occurrence the next day", () => {
    vi.setSystemTime(new Date("2026-11-14T14:59:59Z"));
    renderPage();
    expect(screen.getByRole("region", { name: "次の記念日" })).toBeVisible();
    act(() => vi.advanceTimersByTime(1000));
    const hero = screen.getByRole("region", { name: "今日は記念日！" });
    expect(within(hero).getByText("おめでとう！")).toBeVisible();
    expect(within(screen.getByRole("article")).getByText("今日")).toBeVisible();
    act(() => vi.advanceTimersByTime(24 * 60 * 60 * 1000));
    expect(
      screen.getByRole("region", { name: "次の記念日" }),
    ).toHaveTextContent("活動開始9周年");
  });

  it.each(["focus", "visibilitychange"])(
    "refreshes after returning to a sleeping tab via %s",
    (event) => {
      renderPage();
      vi.setSystemTime(new Date("2026-11-15T03:00:00Z"));
      if (event === "focus") fireEvent.focus(window);
      else fireEvent(document, new Event("visibilitychange"));
      expect(
        screen.getByRole("region", { name: "今日は記念日！" }),
      ).toBeVisible();
    },
  );

  it("cleans up the day timer on unmount", () => {
    const { unmount } = renderPage();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("shows a loading status without exposing the list", () => {
    mocks.isLoading = true;
    renderPage();
    expect(
      screen.getByRole("status", { name: ja.Anniversaries.loading }),
    ).toBeVisible();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("shows the empty state without month navigation", () => {
    mocks.items = [];
    renderPage();
    expect(screen.getByText(ja.Anniversaries.empty)).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: "記念日の月へ移動" }),
    ).not.toBeInTheDocument();
  });
});

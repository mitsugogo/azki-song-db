import { MantineProvider } from "@mantine/core";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Client from "../client";
import type { BestNineResults } from "@/app/lib/bestNineTopics";
import { PageNavigationViewportContext } from "@/app/components/PageNavigationLayoutContext";
vi.mock("@mantine/charts", () => ({
  BarChart: ({ data }: { data: unknown }) => (
    <div data-testid="chart-bar" data-values={JSON.stringify(data)} />
  ),
  PieChart: ({ data }: { data: unknown }) => (
    <div data-testid="chart-pie" data-values={JSON.stringify(data)} />
  ),
  Treemap: ({ data }: { data: unknown }) => (
    <div data-testid="chart-treemap" data-values={JSON.stringify(data)} />
  ),
}));
const notify = vi.fn();
vi.mock("@/app/lib/notifications", () => ({
  showAppNotification: (...args: unknown[]) => notify(...args),
}));
let status = "unauthenticated";
const login = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ status }),
  signIn: (...args: unknown[]) => login(...args),
}));

describe("非公開のお題集計画面", () => {
  beforeEach(() => {
    status = "unauthenticated";
    notify.mockClear();
    global.__mockNextRouter.replace.mockClear();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(async () =>
          Response.json({ topic: { id: "topic" } }),
        ),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
  const mount = (previewData?: BestNineResults) =>
    render(
      <MantineProvider env="test">
        <Client id="topic" previewData={previewData} />
      </MantineProvider>,
    );

  it("ゲストにはログインを案内し、公開のお題の存在だけを確認する", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "login" }));
    expect(login).toHaveBeenCalledWith("google", expect.any(Object));
    expect(fetch).toHaveBeenCalledWith(
      "/api/share/my-best-9-songs/topics/topic",
      expect.any(Object),
    );
    expect(screen.getByRole("link", { name: "backToTopics" })).toHaveAttribute(
      "href",
      "/share/my-best-9-songs/topics",
    );
  });

  it.each(["authenticated", "unauthenticated"])(
    "削除済みお題の集計URLは新規画面へ戻して通知する: %s",
    async (auth) => {
      status = auth;
      vi.mocked(fetch).mockResolvedValue(
        Response.json({ error: "NOT_FOUND" }, { status: 404 }),
      );
      mount();
      await waitFor(() =>
        expect(global.__mockNextRouter.replace).toHaveBeenCalledWith(
          "/share/my-best-9-songs",
        ),
      );
      expect(notify).toHaveBeenCalledWith({
        type: "warning",
        message: "missingTopic",
      });
      expect(screen.queryByRole("table")).toBeNull();
    },
  );

  it("表示プレビューは実回答APIを呼ばず、未ログインでもダミーの1000件を表示する", () => {
    const preview: BestNineResults = {
      topic: {
        id: "topic",
        title: "1000件の表示確認",
        themes: [],
        version: 1,
        createdAt: "2026-10-28T00:00:00Z",
        canEdit: false,
        canDelete: false,
        canViewResults: false,
      },
      responseCount: 1000,
      guestCount: 700,
      accountCount: 300,
      slots: [
        {
          slot: 0,
          theme: "出会い",
          answerCount: 1000,
          rankings: [
            {
              songKey: "key",
              title: "プレビュー曲",
              artist: "AZKi",
              count: 1000,
              performances: [],
            },
          ],
        },
      ],
    };
    mount(preview);
    expect(
      screen.getByRole("heading", { name: "1000件の表示確認" }),
    ).toBeInTheDocument();
    expect(screen.getByText("プレビュー曲")).toBeInTheDocument();
    expect(screen.getByText("previewNotice")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "refresh" })).toBeNull();
    expect(screen.queryByRole("button", { name: "login" })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("403では集計データを表示しない", async () => {
    status = "authenticated";
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "FORBIDDEN" }, { status: 403 }),
    );
    mount();
    await screen.findByText("errors.FORBIDDEN");
    expect(screen.queryByRole("table")).toBeNull();
  });

  it.each([false, true])(
    "Mantineのナビから未回答のお題へ移動し、本文スクロールに追従する（動きを減らす: %s）",
    async (reduced) => {
      vi.stubGlobal(
        "matchMedia",
        vi.fn().mockImplementation((query: string) => ({
          matches: reduced && query.includes("prefers-reduced-motion"),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      );
      const host = document.createElement("div");
      document.body.appendChild(host);
      const viewport = { current: host };
      const data: BestNineResults = {
        topic: {
          id: "topic",
          title: "お題へ移動",
          themes: ["出会い", "思い出", ...Array(7).fill("")],
          version: 1,
          createdAt: "2026-10-29T00:00:00Z",
          canEdit: false,
          canDelete: false,
          canViewResults: false,
        },
        responseCount: 0,
        guestCount: 0,
        accountCount: 0,
        slots: [
          { slot: 0, theme: "出会い", answerCount: 0, rankings: [] },
          { slot: 1, theme: "思い出", answerCount: 0, rankings: [] },
          { slot: 2, theme: "", answerCount: 0, rankings: [] },
        ],
      };
      let scrolled = false;
      const bounds = vi
        .spyOn(HTMLElement.prototype, "getBoundingClientRect")
        .mockImplementation(function () {
          const top =
            this === host
              ? 64
              : this.id === "best-nine-slot-0"
                ? scrolled
                  ? -700
                  : 160
                : this.id === "best-nine-slot-1"
                  ? scrolled
                    ? 152
                    : 1000
                  : 1800;
          return new DOMRect(0, top, 300, 56);
        });
      const originalScroll = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "scrollIntoView",
      );
      const scroll = vi.fn();
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value: scroll,
      });
      try {
        render(
          <MantineProvider env="test">
            <PageNavigationViewportContext.Provider value={viewport}>
              <Client id="topic" previewData={data} />
            </PageNavigationViewportContext.Provider>
          </MantineProvider>,
          { container: host },
        );
        const navigation = within(
          screen.getByRole("navigation", { name: "sectionNavigation" }),
        );
        expect(navigation.getAllByRole("button")).toHaveLength(3);
        expect(
          navigation.getByRole("button", { name: "3. freeSlot" }),
        ).toBeInTheDocument();
        const second = navigation.getByRole("button", { name: "2. 思い出" });
        expect(second).toHaveAttribute("aria-controls", "best-nine-section-1");
        fireEvent.click(second);
        const section = document.getElementById("best-nine-section-1")!;
        expect(scroll).toHaveBeenCalledWith({
          behavior: reduced ? "auto" : "smooth",
          block: "start",
        });
        expect(scroll.mock.contexts[0]).toBe(section);
        expect(document.activeElement).toBe(section);
        scrolled = true;
        fireEvent.scroll(host);
        await waitFor(() =>
          expect(second).toHaveAttribute("aria-current", "location"),
        );
        expect(fetch).not.toHaveBeenCalled();
      } finally {
        bounds.mockRestore();
        if (originalScroll)
          Object.defineProperty(
            HTMLElement.prototype,
            "scrollIntoView",
            originalScroll,
          );
        else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
      }
    },
  );

  it("全枠のグラフを円・棒・ツリーマップで切り替え、一覧と票数を維持する", () => {
    const ranks = Array.from({ length: 12 }, (_, index) => ({
      songKey: `${index}`,
      title: `曲${index}`,
      artist: "AZKi",
      count: 12 - index,
      performances: [],
    }));
    mount({
      topic: {
        id: "topic",
        title: "グラフ切り替え",
        themes: ["出会い", "思い出", ...Array(7).fill("")],
        version: 1,
        createdAt: "2026-10-29T00:00:00Z",
        canEdit: false,
        canDelete: false,
        canViewResults: false,
      },
      responseCount: 100,
      guestCount: 50,
      accountCount: 50,
      slots: [
        { slot: 0, theme: "出会い", answerCount: 78, rankings: ranks },
        { slot: 1, theme: "思い出", answerCount: 78, rankings: ranks },
      ],
    });
    const expected = screen
      .getAllByTestId("chart-bar")
      .map((chart) => chart.getAttribute("data-values"));
    const heading = screen.getByRole("heading", { name: "1. 出会い" });
    const figure = heading.closest("section")!.querySelector("figure")!;
    expect(figure.parentElement).toContainElement(heading);
    expect(figure.parentElement).not.toContainElement(
      screen.getAllByRole("table")[0],
    );
    expect(expected).toHaveLength(2);
    for (const table of screen.getAllByRole("table")) {
      expect(table.querySelector("thead")).toHaveAttribute("data-sticky");
    }
    expect(screen.getAllByRole("row")).toHaveLength(26);
    const controls = screen.getByRole("complementary", {
      name: "resultsControls",
    });
    expect(controls).toContainElement(
      screen.getByRole("navigation", { name: "sectionNavigation" }),
    );
    expect(within(controls).getAllByRole("radio")).toHaveLength(3);
    expect(within(controls).queryByRole("table")).toBeNull();
    for (const type of ["pie", "treemap", "bar"]) {
      fireEvent.click(
        within(controls).getByRole("radio", { name: `chartTypes.${type}` }),
      );
      expect(
        screen
          .getAllByTestId(`chart-${type}`)
          .map((chart) => chart.getAttribute("data-values")),
      ).toEqual(expected);
      expect(screen.getAllByRole("row")).toHaveLength(26);
    }
    expect(screen.getAllByText("chartGrouping")).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("票数に比例する背景バーをランキングごとの最多票を基準に表示する", () => {
    const rank = (title: string, count: number) => ({
      songKey: title,
      title,
      artist: "AZKi",
      count,
      performances: [],
    });
    mount({
      topic: {
        id: "topic",
        title: "票数の比較",
        themes: ["出会い", "思い出", ...Array(7).fill("")],
        version: 1,
        createdAt: "2026-10-29T00:00:00Z",
        canEdit: false,
        canDelete: false,
        canViewResults: false,
      },
      responseCount: 2000,
      guestCount: 1000,
      accountCount: 1000,
      slots: [
        {
          slot: 0,
          theme: "出会い",
          answerCount: 1250,
          rankings: [rank("最多の曲", 1000), rank("4分の1の曲", 250)],
        },
        {
          slot: 1,
          theme: "思い出",
          answerCount: 75,
          rankings: [rank("別枠の最多", 50), rank("半分の曲", 25)],
        },
      ],
    });
    for (const [title, width] of [
      ["最多の曲", "100%"],
      ["4分の1の曲", "25%"],
      ["別枠の最多", "100%"],
      ["半分の曲", "50%"],
    ]) {
      const row = screen.getByText(title).closest("tr")!;
      const bar = row.querySelector('[aria-hidden="true"]');
      expect(bar).toHaveStyle({ width });
      expect(within(row).getByText("AZKi")).toBeInTheDocument();
    }
    expect(screen.getByRole("cell", { name: "1,000" })).toBeInTheDocument();
    expect(screen.getByText("barScale")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("0票のプレビューでも背景バーの幅を0として扱う", () => {
    mount({
      topic: {
        id: "topic",
        title: "0票",
        themes: [],
        version: 1,
        createdAt: "2026-10-29T00:00:00Z",
        canEdit: false,
        canDelete: false,
        canViewResults: false,
      },
      responseCount: 1,
      guestCount: 1,
      accountCount: 0,
      slots: [
        {
          slot: 0,
          theme: "",
          answerCount: 0,
          rankings: [
            {
              songKey: "zero",
              title: "0票の曲",
              artist: "AZKi",
              count: 0,
              performances: [],
            },
          ],
        },
      ],
    });
    expect(
      screen
        .getByText("0票の曲")
        .closest("tr")!
        .querySelector('[aria-hidden="true"]'),
    ).toHaveStyle({ width: "0%" });
  });

  it("順不同は全体ランキングを1つ表示し、回答者数と選曲数を分ける", async () => {
    status = "authenticated";
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        topic: { id: "topic", title: "任意の9曲", themes: Array(9).fill("") },
        responseCount: 2,
        guestCount: 1,
        accountCount: 1,
        slots: [
          {
            slot: 0,
            theme: "",
            answerCount: 3,
            rankings: [
              {
                songKey: "key",
                title: "合算した曲",
                artist: "AZKi",
                count: 3,
                performances: [{ videoId: "video", start: "10", count: 3 }],
              },
            ],
          },
        ],
      }),
    );
    mount();
    await screen.findByText("合算した曲");
    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(
      screen.queryByRole("navigation", { name: "sectionNavigation" }),
    ).toBeNull();
    expect(
      screen.getByRole("table", { name: "combinedRanking" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "combinedRanking" }),
    ).toBeInTheDocument();
    expect(screen.getByText("selectionCount")).toBeInTheDocument();
    expect(screen.getByText("responseCounts")).toBeInTheDocument();
    expect(screen.getByText("combinedResultsHelp")).toBeInTheDocument();
    expect(screen.queryByText("slotCount")).toBeNull();
    expect(screen.queryByText(/1\. freeSlot/)).toBeNull();
    expect(screen.getByRole("cell", { name: "3" })).toBeInTheDocument();
  });

  it("許可されたユーザーに曲の回答数と歌唱別リンクを表示する", async () => {
    status = "authenticated";
    vi.mocked(fetch).mockImplementation(async () =>
      Response.json({
        topic: {
          id: "topic",
          title: "題",
          version: 1,
          themes: [...Array(8).fill(""), "歌枠"],
        },
        responseCount: 2,
        guestCount: 1,
        accountCount: 1,
        slots: [
          {
            slot: 8,
            theme: "歌枠",
            answerCount: 2,
            rankings: [
              {
                songKey: "key",
                title: "曲A",
                artist: "歌手",
                count: 2,
                performances: [{ videoId: "video", start: "10", count: 2 }],
              },
            ],
          },
        ],
      }),
    );
    mount();
    await screen.findByText("曲A");
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      "/api/share/my-best-9-songs/topics/topic/results",
      expect.any(Object),
    );
    expect(screen.getByText("9. 歌枠")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "題" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("ID: topic")).toBeNull();
    expect(
      screen.getByText("performanceDetails").closest("details"),
    ).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText("performanceDetails"));
    expect(
      screen.getByRole("link", { name: "openVideo 00:10" }),
    ).toHaveAttribute("href", "/watch?v=video&t=10");
    fireEvent.click(screen.getByRole("button", { name: "refresh" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
  it("未回答の枠番号を保ち、全体が未回答なら案内を一度だけ表示する", async () => {
    status = "authenticated";
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        topic: {
          id: "topic",
          title: "回答前のお題",
          themes: [...Array(8).fill(""), "最後のお題"],
        },
        responseCount: 0,
        guestCount: 0,
        accountCount: 0,
        slots: Array.from({ length: 9 }, (_, slot) => ({
          slot,
          theme: slot === 8 ? "最後のお題" : "",
          answerCount: 0,
          rankings: [],
        })),
      }),
    );
    mount();
    await screen.findByRole("heading", { name: "回答前のお題" });
    expect(
      screen.getByRole("heading", { name: "9. 最後のお題" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("noResponses")).toHaveLength(1);
    expect(screen.queryByText("barScale")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("長い歌唱内訳を開閉し、日時・長時間の開始位置と回答数を読める", async () => {
    status = "authenticated";
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        topic: {
          id: "topic",
          title: "内訳のあるお題",
          themes: [...Array(4).fill(""), "思い出", ...Array(4).fill("")],
        },
        responseCount: 3,
        guestCount: 1,
        accountCount: 2,
        slots: [
          {
            slot: 4,
            theme: "思い出",
            answerCount: 3,
            rankings: [
              {
                songKey: "key",
                title: "曲A",
                artist: "歌手",
                count: 3,
                performances: [
                  {
                    videoId: "first",
                    start: "3665",
                    count: 2,
                    videoTitle: "歌枠配信",
                    broadcastAt: "2026-10-27T15:30:00Z",
                  },
                  {
                    videoId: "second",
                    start: "10",
                    count: 1,
                    videoTitle: "別の歌唱",
                  },
                ],
              },
            ],
          },
        ],
      }),
    );
    mount();
    await screen.findByText("曲A");
    const summary = screen.getByText("performanceDetails");
    expect(summary.closest("details")).not.toHaveAttribute("open");
    fireEvent.click(summary);
    expect(
      screen.getByRole("link", { name: "歌枠配信 2026/10/28 / 01:01:05" }),
    ).toHaveAttribute("href", "/watch?v=first&t=3665");
    expect(
      screen.getByRole("link", { name: "別の歌唱 00:10" }),
    ).toHaveAttribute("href", "/watch?v=second&t=10");
    fireEvent.click(summary);
    expect(summary.closest("details")).not.toHaveAttribute("open");
  });
});

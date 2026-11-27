import { MantineProvider } from "@mantine/core";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  LocationRanking,
  RANKING_PAGE_SIZE,
  VisitorRanking,
  type LocationRow,
  type VisitorRow,
} from "../SeichiMapRankingLists";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;
});

const visitorRows = (count: number): VisitorRow[] =>
  Array.from({ length: count }, (_, index) => ({
    name: `開拓者${index + 1}`,
    count: 1000 - index,
    badge: null,
  }));

const locationRows = (count: number): LocationRow[] =>
  Array.from({ length: count }, (_, index) => ({
    name: `地点${index + 1}`,
    count: 500 - index,
    isVisited: index === 1,
    administrativeArea: index === 0 ? "香川県土庄町" : null,
    seichiMapUrl: `/seichi-map?location=${index}`,
    googleMapUrl: `https://www.google.com/maps/search/?api=1&query=${index}`,
  }));

const renderWithMantine = (ui: React.ReactElement) =>
  render(<MantineProvider>{ui}</MantineProvider>);

describe("VisitorRanking", () => {
  it("1〜3位をメダル付きのカードで、4位以降を行で表示する", () => {
    renderWithMantine(
      <VisitorRanking
        rows={visitorRows(5)}
        unit="件"
        empty="なし"
        showMoreLabel="さらに表示"
        formatSelfRank={(rank) => `あなた: ${rank}位`}
      />,
    );

    expect(screen.getByRole("img", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "3" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "4" })).not.toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("開拓者5")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
  });

  it("同数の順位は同じメダルにする", () => {
    renderWithMantine(
      <VisitorRanking
        rows={[
          { name: "A", count: 10, badge: null },
          { name: "B", count: 10, badge: null },
          { name: "C", count: 5, badge: null },
        ]}
        unit="件"
        empty="なし"
        showMoreLabel="さらに表示"
        formatSelfRank={(rank) => `あなた: ${rank}位`}
      />,
    );

    expect(screen.getAllByRole("img", { name: "1" })).toHaveLength(2);
    expect(screen.getByRole("img", { name: "3" })).toBeInTheDocument();
  });

  it("20件ずつ表示し、「さらに表示」で続きを出す", () => {
    renderWithMantine(
      <VisitorRanking
        rows={visitorRows(RANKING_PAGE_SIZE + 5)}
        unit="件"
        empty="なし"
        showMoreLabel="さらに表示"
        formatSelfRank={(rank) => `あなた: ${rank}位`}
      />,
    );

    expect(screen.getByText(`開拓者${RANKING_PAGE_SIZE}`)).toBeInTheDocument();
    expect(
      screen.queryByText(`開拓者${RANKING_PAGE_SIZE + 1}`),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "さらに表示" }));

    expect(
      screen.getByText(`開拓者${RANKING_PAGE_SIZE + 5}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "さらに表示" }),
    ).not.toBeInTheDocument();
  });

  it("行が無ければ空の案内だけを表示する", () => {
    renderWithMantine(
      <VisitorRanking
        rows={[]}
        unit="件"
        empty="訪問記録はまだありません。"
        showMoreLabel="さらに表示"
        formatSelfRank={(rank) => `あなた: ${rank}位`}
      />,
    );

    expect(screen.getByText("訪問記録はまだありません。")).toBeInTheDocument();
  });
});

describe("VisitorRanking（自分の行）", () => {
  it("自分の行がある場合だけ順位への案内を出し、押すと圏外の行も表示する", () => {
    const rows = visitorRows(RANKING_PAGE_SIZE + 5).map((row, index) => ({
      ...row,
      isSelf: index === RANKING_PAGE_SIZE + 2,
    }));
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    // 実際のブラウザと同じく、再描画のあとにスクロールの処理が走るようにする
    const frameCallbacks: Array<() => void> = [];
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => {
      frameCallbacks.push(callback);
      return 0;
    });

    renderWithMantine(
      <VisitorRanking
        rows={rows}
        unit="件"
        empty="なし"
        showMoreLabel="さらに表示"
        formatSelfRank={(rank) => `あなた: ${rank}位`}
      />,
    );

    const jump = screen.getByRole("button", {
      name: `あなた: ${RANKING_PAGE_SIZE + 3}位`,
    });
    expect(
      screen.queryByText(`開拓者${RANKING_PAGE_SIZE + 3}`),
    ).not.toBeInTheDocument();

    fireEvent.click(jump);
    frameCallbacks.forEach((callback) => callback());

    expect(
      screen.getByText(`開拓者${RANKING_PAGE_SIZE + 3}`),
    ).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("自分の行が無ければ案内を出さない", () => {
    renderWithMantine(
      <VisitorRanking
        rows={visitorRows(3)}
        unit="件"
        empty="なし"
        showMoreLabel="さらに表示"
        formatSelfRank={(rank) => `あなた: ${rank}位`}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /あなた/ }),
    ).not.toBeInTheDocument();
  });
});

describe("LocationRanking", () => {
  const renderLocations = (rows: LocationRow[]) =>
    renderWithMantine(
      <LocationRanking
        rows={rows}
        unit="人"
        empty="なし"
        visitedLabel="訪問済"
        seichiMapLabel="聖地マップ"
        googleMapLabel="Google Map"
        attribution="住所情報：国土地理院"
        showMoreLabel="さらに表示"
        formatSelfRank={(rank) => `あなた: ${rank}位`}
      />,
    );

  it("地点名・住所・訪問済みバッジと、地図へのリンクを表示する", () => {
    renderLocations(locationRows(3));

    expect(screen.getByText("香川県土庄町")).toBeInTheDocument();
    expect(screen.getAllByText("訪問済")).toHaveLength(1);

    const seichiMapLink = screen.getByRole("link", {
      name: "聖地マップ: 地点1",
    });
    expect(seichiMapLink).toHaveAttribute("href", "/seichi-map?location=0");
    const googleMapLink = screen.getByRole("link", {
      name: "Google Map: 地点1",
    });
    expect(googleMapLink).toHaveAttribute("target", "_blank");
    expect(googleMapLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("国土地理院の出典リンクを表示する", () => {
    renderLocations(locationRows(1));

    const attribution = screen.getByRole("link", {
      name: "住所情報：国土地理院",
    });
    expect(attribution).toHaveAttribute(
      "href",
      "https://maps.gsi.go.jp/help/termsofuse.html",
    );
  });

  it("「さらに表示」で20件ずつ追加する", () => {
    renderLocations(locationRows(RANKING_PAGE_SIZE + 1));

    const list = screen.getByText(`地点${RANKING_PAGE_SIZE}`);
    expect(list).toBeInTheDocument();
    expect(
      screen.queryByText(`地点${RANKING_PAGE_SIZE + 1}`),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "さらに表示" }));
    expect(
      screen.getByText(`地点${RANKING_PAGE_SIZE + 1}`),
    ).toBeInTheDocument();
    expect(within(document.body).queryByText("さらに表示")).toBeNull();
  });
});

describe("VisitorRanking（自分の行の案内）", () => {
  type ObserverCallback = (
    entries: Partial<IntersectionObserverEntry>[],
  ) => void;
  let notify: ObserverCallback | null = null;

  const renderWithSelf = () => {
    class IntersectionObserverMock {
      constructor(callback: ObserverCallback) {
        notify = callback;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    renderWithMantine(
      <VisitorRanking
        rows={visitorRows(5).map((row, index) => ({
          ...row,
          isSelf: index === 3,
        }))}
        unit="件"
        empty="なし"
        showMoreLabel="さらに表示"
        formatSelfRank={(rank) => `あなた: ${rank}位`}
      />,
    );
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    notify = null;
  });

  it("自分の行が画面の外にあるときだけ順位への案内を出す", () => {
    renderWithSelf();
    expect(
      screen.getByRole("button", { name: "あなた: 4位" }),
    ).toBeInTheDocument();

    act(() =>
      notify?.([
        { isIntersecting: false, boundingClientRect: { top: -50 } as DOMRect },
      ]),
    );
    expect(
      screen.getByRole("button", { name: "あなた: 4位" }),
    ).toBeInTheDocument();

    act(() => notify?.([{ isIntersecting: true }]));
    expect(
      screen.queryByRole("button", { name: "あなた: 4位" }),
    ).not.toBeInTheDocument();
  });
});

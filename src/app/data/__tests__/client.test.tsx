import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ClientTable from "../client";
import { PageNavigationViewportContext } from "../../components/PageNavigationLayoutContext";
import type { Song } from "../../types/song";

const state = vi.hoisted(() => ({
  isLoading: false,
  allSongs: Array.from({ length: 100 }, (_, index) => ({
    title: `曲${String(index).padStart(3, "0")}`,
    artist: "AZKi",
    sing: "AZKi",
    video_id: `video${index}`,
  })) as Song[],
}));

vi.mock("../../hook/useSongs", () => ({
  default: () => state,
}));

beforeEach(() => {
  state.isLoading = false;
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  // jsdomではレイアウトがないため、行の実測高だけを与える。
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
    function () {
      return this.hasAttribute("data-index") ? 86 : 0;
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderTable() {
  const viewport = document.createElement("div");
  Object.defineProperties(viewport, {
    offsetHeight: { value: 300 },
    offsetWidth: { value: 800 },
    clientHeight: { value: 300 },
    scrollHeight: { value: 9000 },
  });
  viewport.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
  viewport.scrollTo = vi.fn();
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function () {
      // 仮想行の親は本文内の400px位置から始まる。
      const isList = this.style.height && this.style.width;
      return {
        top: isList ? 500 - viewport.scrollTop : 0,
        height: this.hasAttribute("data-index") ? 86 : 0,
      } as DOMRect;
    },
  );
  const view = render(
    <MantineProvider>
      <PageNavigationViewportContext.Provider value={{ current: viewport }}>
        <ClientTable />
      </PageNavigationViewportContext.Provider>
    </MantineProvider>,
  );
  return { ...view, viewport };
}

describe("全データの本文スクロール", () => {
  it("共通の本文スクロールで表示行を切り替え、一覧開始位置を差し引いて配置する", () => {
    const { container, viewport } = renderTable();
    expect(screen.getByText("曲000")).toBeInTheDocument();
    expect(container.querySelector('[data-index="0"]')).toHaveStyle({
      transform: "translateY(0px)",
    });

    viewport.scrollTop = 400 + 86 * 50;
    fireEvent.scroll(viewport);
    expect(screen.getByText("曲050")).toBeInTheDocument();
    expect(screen.queryByText("曲000")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-index]").length).toBeLessThan(100);

    fireEvent.click(screen.getByRole("button", { name: "ページ上部へ戻る" }));
    expect(viewport.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("検索とソートを維持する", () => {
    const { container } = renderTable();
    const input =
      screen.getByPlaceholderText("曲名、アーティスト、タグなどで検索");
    fireEvent.change(input, { target: { value: "曲09" } });
    expect(screen.getByText("曲090")).toBeInTheDocument();
    expect(screen.queryByText("曲000")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("table.title"));
    const firstRowTitle = () =>
      container.querySelector('[data-index="0"] a[href^="/search?q=title:"]');
    expect(firstRowTitle()).toHaveTextContent("曲090");
    fireEvent.click(screen.getByText("table.title"));
    expect(firstRowTitle()).toHaveTextContent("曲099");
    expect(input).toHaveValue("曲09");
  });

  it("列見出しと本文の横スクロールを双方向で同期する", () => {
    const { container } = renderTable();
    const header = container.querySelector<HTMLDivElement>(
      "[data-scrollarea-viewport]",
    )!;
    const body = container.querySelector<HTMLDivElement>(".overflow-x-auto")!;
    header.scrollLeft = 600;
    fireEvent.scroll(header);
    expect(body.scrollLeft).toBe(600);

    body.scrollLeft = 1200;
    fireEvent.scroll(body);
    expect(header.scrollLeft).toBe(1200);
    expect(
      screen.getByPlaceholderText("曲名、アーティスト、タグなどで検索"),
    ).toBeInTheDocument();
  });

  it("読み込み後に共通の本文領域で仮想描画を始める", () => {
    state.isLoading = true;
    const { rerender, viewport } = renderTable();
    expect(screen.queryByText("曲000")).not.toBeInTheDocument();
    state.isLoading = false;
    rerender(
      <MantineProvider>
        <PageNavigationViewportContext.Provider value={{ current: viewport }}>
          <ClientTable />
        </PageNavigationViewportContext.Provider>
      </MantineProvider>,
    );
    expect(screen.getByText("曲000")).toBeInTheDocument();
  });
});

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import type { ComponentProps } from "react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import DiscographyClient from "../client";
import type { StatisticsItem } from "../createStatistics";
import type DiscographySongList from "../components/DiscographySongList";
import { DISCOGRAPHY_VIEW_MODE_STORAGE_KEY } from "../hooks/usePersistedDiscographyViewMode";

const mocks = vi.hoisted(() => ({
  pathname: "/discography",
  router: { push: vi.fn(), prefetch: vi.fn() },
  useDiscographyData: vi.fn(),
  renderList: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
  useRouter: () => mocks.router,
  usePathname: () => mocks.pathname,
}));

vi.mock("../hooks/useDiscographyData", () => ({
  useDiscographyData: mocks.useDiscographyData,
}));

// 一覧の表示指定をHTMLのhiddenに反映し、タイマーを進めずに操作可能か検証する。
vi.mock("../components/DiscographySongList", () => ({
  default: (props: ComponentProps<typeof DiscographySongList>) => {
    mocks.renderList(props);
    return (
      <div>
        {props.data.map((item, index) => (
          <article key={item.key} hidden={!props.visibleItems[index]}>
            {item.key}
          </article>
        ))}
      </div>
    );
  },
}));

vi.mock("../SongItem", () => ({
  default: ({
    song,
    isVisible,
  }: {
    song: StatisticsItem;
    isVisible: boolean;
  }) => <article hidden={!isVisible}>{song.key}</article>,
}));
vi.mock("../SongDetails", () => ({ default: () => null }));
vi.mock("../../components/ScrollToTopButton", () => ({
  ScrollToTopButton: () => null,
}));

const createItems = (category: string, count = 1): StatisticsItem[] =>
  Array.from({ length: count }, (_, index) => ({
    key: `${category}-${index}`,
    count: 1,
    isAlbum: false,
    song: {} as StatisticsItem["song"],
    firstVideo: {} as StatisticsItem["firstVideo"],
    lastVideo: {} as StatisticsItem["lastVideo"],
    videos: [],
  }));

function renderClient(initialTab = 0) {
  return render(
    <MantineProvider>
      <DiscographyClient initialTab={initialTab} />
    </MantineProvider>,
  );
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorage.clear();
  mocks.pathname = "/discography";
  mocks.useDiscographyData.mockReturnValue({
    loading: false,
    allSongCountsByReleaseDate: createItems("all", 100),
    originalSongCountsByReleaseDate: createItems("originals"),
    unitSongCountsByReleaseDate: createItems("unit"),
    overallSongCountsByReleaseDate: createItems("overall"),
    coverSongCountsByReleaseDate: createItems("covers", 100),
    tabCounts: { all: 100, originals: 1, unit: 1, overall: 1, covers: 100 },
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("DiscographyClientのタブ切り替え", () => {
  it("100件の一覧を待ち時間なしで表示し、時間経過で一覧を再描画しない", () => {
    renderClient();

    expect(screen.getByText("all-99")).toBeVisible();
    const renders = mocks.renderList.mock.calls.length;
    act(() => vi.advanceTimersByTime(10_000));
    expect(mocks.renderList).toHaveBeenCalledTimes(renders);
  });

  it("ページ遷移の完了を待たず、選択したタブの最後の項目まで表示する", () => {
    renderClient();
    fireEvent.click(screen.getByRole("tab", { name: "tabs.covers" }));

    expect(screen.getByRole("tab", { name: "tabs.covers" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("covers-99")).toBeVisible();
    expect(screen.queryByText("all-0")).not.toBeInTheDocument();
    expect(mocks.router.push).toHaveBeenCalledWith("/discography/covers", {
      scroll: false,
    });

    const renders = mocks.renderList.mock.calls.length;
    act(() => vi.advanceTimersByTime(10_000));
    expect(mocks.renderList).toHaveBeenCalledTimes(renders);
  });

  it("連続して切り替えても最後に選んだタブと内容が一致する", () => {
    renderClient();
    fireEvent.click(screen.getByRole("tab", { name: "tabs.covers" }));
    fireEvent.click(screen.getByRole("tab", { name: "tabs.unit" }));
    fireEvent.click(screen.getByRole("tab", { name: "tabs.overall" }));
    act(() => vi.advanceTimersByTime(10_000));

    expect(screen.getByText("overall-0")).toBeVisible();
    expect(screen.queryByText("covers-0")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "tabs.overall" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(mocks.router.push).toHaveBeenLastCalledWith("/discography/overall", {
      scroll: false,
    });
  });

  it("ホバーとキーボードフォーカスで対象タブのURLだけを先読みする", () => {
    renderClient();
    expect(mocks.router.prefetch).not.toHaveBeenCalled();

    fireEvent.mouseEnter(screen.getByRole("tab", { name: "tabs.covers" }));
    expect(mocks.router.prefetch).toHaveBeenLastCalledWith(
      "/discography/covers",
    );
    fireEvent.focus(screen.getByRole("tab", { name: "tabs.unit" }));
    expect(mocks.router.prefetch).toHaveBeenLastCalledWith(
      "/discography/collab",
    );
    expect(mocks.router.prefetch).toHaveBeenCalledTimes(2);
    expect(mocks.router.push).not.toHaveBeenCalled();
  });

  it("遷移完了前に元のタブへ戻した場合も、最後の選択で遷移先を上書きする", () => {
    renderClient();
    fireEvent.click(screen.getByRole("tab", { name: "tabs.covers" }));
    fireEvent.click(screen.getByRole("tab", { name: "tabs.all" }));

    expect(screen.getByText("all-99")).toBeVisible();
    expect(screen.queryByText("covers-0")).not.toBeInTheDocument();
    expect(mocks.router.push).toHaveBeenLastCalledWith("/discography", {
      scroll: false,
    });
  });

  it("URLから渡されたタブ変更にも同期し、保存済みのタイル表示を維持する", () => {
    localStorage.setItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY, "tile");
    const { rerender } = renderClient(1);
    expect(screen.getByText("originals-0")).toBeVisible();

    rerender(
      <MantineProvider>
        <DiscographyClient initialTab={4} />
      </MantineProvider>,
    );

    expect(screen.getByText("covers-99")).toBeVisible();
    expect(screen.getByRole("tab", { name: "tabs.covers" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("radio", { name: "controls.viewModeTile" }),
    ).toBeChecked();
    expect(mocks.router.push).not.toHaveBeenCalled();
  });
});

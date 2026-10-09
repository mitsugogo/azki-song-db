import React from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";
import { PageNavigationViewportContext } from "@/app/components/PageNavigationLayoutContext";

const mocks = vi.hoisted(() => ({
  songs: [] as Song[],
  loading: false,
  params: "",
  locale: "ja",
}));
vi.mock("@/app/hook/useSongs", () => ({
  default: () => ({ allSongs: mocks.songs, isLoading: mocks.loading }),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.params),
}));
vi.mock("next-intl", () => ({
  useLocale: () => mocks.locale,
  useTranslations:
    () =>
    (key: string, values: Record<string, unknown> = {}) => {
      const messages = mocks.locale === "en" ? en.Repertoire : ja.Repertoire;
      const text = key
        .split(".")
        .reduce((value: any, part) => value[part], messages);
      return text.replace(/\{(\w+)\}/g, (_: string, name: string) =>
        String(values[name]),
      );
    },
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ prefetch, ...props }: any) => <a {...props} />,
}));
vi.mock("@mantine/core", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
  Loader: () => null,
  Button: ({
    component: Component = "button",
    leftSection,
    variant,
    size,
    ...props
  }: any) => <Component {...props} />,
  TextInput: ({ label, leftSection, ...props }: any) => (
    <label>
      {label}
      <input {...props} />
    </label>
  ),
  Select: ({ label, data, onChange, allowDeselect, ...props }: any) => (
    <label>
      {label}
      <select {...props} onChange={(event) => onChange(event.target.value)}>
        {data.map((item: any) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  ),
  MultiSelect: ({
    label,
    data,
    onChange,
    searchable,
    clearable,
    nothingFoundMessage,
    ...props
  }: any) => (
    <label>
      {label}
      <select
        multiple
        {...props}
        onChange={(event) =>
          onChange(
            Array.from(event.target.selectedOptions, (option) => option.value),
          )
        }
      >
        {data.map((tag: string) => (
          <option key={tag}>{tag}</option>
        ))}
      </select>
    </label>
  ),
  Pagination: ({ total, onChange }: any) => (
    <button onClick={() => onChange(total)}>last page</button>
  ),
}));

vi.mock("@mantine/hooks", () => ({ useMediaQuery: () => false }));
import RepertoireClient from "../client";
const song = (title: string, overrides: Partial<Song> = {}) =>
  ({
    title,
    artist: "歌手",
    sings: ["AZKi"],
    tags: ["歌枠"],
    video_id: "abcdefghijk",
    start: 45,
    broadcast_at: "2026-01-01T15:00:00.000Z",
    video_title: "最新動画",
    ...overrides,
  }) as Song;

afterEach(() => {
  cleanup();
  mocks.params = "";
  mocks.locale = "ja";
  mocks.loading = false;
  window.history.replaceState(null, "", "/");
});

describe("RepertoireClient", () => {
  it("shows both labels, tags, JST date and latest playback links; filters and clears", () => {
    mocks.songs = [
      song("曲A", { tags: ["歌枠", "アニソン"] }),
      song("曲A", {
        video_id: "lmnopqrstuv",
        broadcast_at: "2026-02-01T15:00:00.000Z",
        tags: ["ゲスト出演"],
      }),
      song("曲B"),
    ];
    render(<RepertoireClient />);
    expect(
      screen.getByText("コラボ・ゲスト・ライブ等", { selector: "span" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2026/02/02")).toBeInTheDocument();
    expect(screen.getByLabelText("種類")).toHaveValue("");
    expect(screen.getByRole("option", { name: "すべて" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "最後の歌唱日" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "最新" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "曲Aの最新の歌唱をSongDB内で再生" }),
    ).toHaveAttribute("href", "/watch?v=lmnopqrstuv&t=45");
    expect(
      screen.getByRole("link", { name: "曲Aの最新の歌唱をSongDB内で再生" }),
    ).toHaveTextContent("再生");
    expect(
      screen.getByRole("link", { name: "曲Aの最新の歌唱をYouTubeで開く" }),
    ).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=lmnopqrstuv&t=45s",
    );
    fireEvent.click(screen.getByRole("button", { name: "アニソン" }));
    expect(
      screen.queryByRole("heading", { name: "曲B" }),
    ).not.toBeInTheDocument();
    expect(new URL(window.location.href).searchParams.getAll("tag")).toEqual([
      "アニソン",
    ]);
    fireEvent.change(screen.getByLabelText("検索"), {
      target: { value: "存在しない曲" },
    });
    expect(
      screen.getByText("条件に一致する楽曲がありません。"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "絞り込みを解除" }));
    expect(screen.getByRole("heading", { name: "曲B" })).toBeInTheDocument();
  });

  it("restores URL filters and respects the performance source", () => {
    mocks.params = "q=曲A&source=collaboration&tag=アニソン";
    mocks.songs = [
      song("曲A", { tags: ["ゲスト出演", "アニソン"] }),
      song("曲B"),
    ];
    const { rerender } = render(<RepertoireClient />);
    expect(screen.getByLabelText("検索")).toHaveValue("曲A");
    expect(
      screen.queryByRole("heading", { name: "曲B" }),
    ).not.toBeInTheDocument();
    mocks.params = "";
    rerender(<RepertoireClient />);
    expect(screen.getByRole("heading", { name: "曲B" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("種類"), {
      target: { value: "singing" },
    });
    expect(
      screen.queryByRole("heading", { name: "曲A" }),
    ).not.toBeInTheDocument();
  });

  it("defaults to a dense table in A to Z title order rather than latest performance order", () => {
    mocks.songs = [
      song("Zulu", { broadcast_at: "2026-03-01" }),
      song("Alpha", { broadcast_at: "2026-01-01" }),
    ];
    render(<RepertoireClient />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "並び順" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "曲名" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(
      screen.getAllByRole("heading").map((heading) => heading.textContent),
    ).toEqual(["Alpha", "Zulu"]);
    fireEvent.click(
      screen.getByRole("button", { name: "最後の歌唱日で並び替え" }),
    );
    expect(
      screen.getAllByRole("heading").map((heading) => heading.textContent),
    ).toEqual(["Zulu", "Alpha"]);
    fireEvent.click(screen.getByRole("button", { name: "絞り込みを解除" }));
    expect(
      screen.getAllByRole("heading").map((heading) => heading.textContent),
    ).toEqual(["Alpha", "Zulu"]);
  });

  it("toggles header sort direction, updates accessible state and keeps it in the URL", () => {
    mocks.songs = [
      song("Zulu", { artist: "A" }),
      song("Alpha", { artist: "Z" }),
    ];
    render(<RepertoireClient />);
    const titleHeader = screen.getByRole("columnheader", { name: "曲名" });
    expect(titleHeader).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(screen.getByRole("button", { name: "曲名で並び替え" }));
    expect(
      screen.getAllByRole("heading").map((node) => node.textContent),
    ).toEqual(["Zulu", "Alpha"]);
    expect(titleHeader).toHaveAttribute("aria-sort", "descending");
    expect(new URL(window.location.href).searchParams.get("order")).toBe(
      "desc",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "アーティストで並び替え" }),
    );
    expect(new URL(window.location.href).searchParams.get("sort")).toBe(
      "artist",
    );
    expect(
      screen.getByRole("columnheader", { name: "アーティスト" }),
    ).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(
      screen.getByRole("button", { name: "アーティストで並び替え" }),
    );
    expect(
      screen.getAllByRole("heading").map((node) => node.textContent),
    ).toEqual(["Alpha", "Zulu"]);
  });

  it("restores a descending sort from URL parameters", () => {
    mocks.params = "sort=title&order=desc";
    mocks.songs = [song("Alpha"), song("Zulu")];
    render(<RepertoireClient />);
    expect(
      screen.getAllByRole("heading").map((node) => node.textContent),
    ).toEqual(["Zulu", "Alpha"]);
    expect(screen.getByRole("columnheader", { name: "曲名" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  it("limits rendered records and resets pagination after a filter change", () => {
    mocks.songs = Array.from({ length: 102 }, (_, index) =>
      song(`曲${String(index).padStart(2, "0")}`),
    );
    window.scrollTo = vi.fn();
    const viewport = document.createElement("div");
    viewport.scrollTo = vi.fn();
    render(
      <PageNavigationViewportContext.Provider value={{ current: viewport }}>
        <RepertoireClient />
      </PageNavigationViewportContext.Provider>,
    );
    expect(document.querySelectorAll("tbody > tr")).toHaveLength(100);
    fireEvent.click(screen.getByText("last page"));
    expect(document.querySelectorAll("tbody > tr")).toHaveLength(2);
    expect(viewport.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
    expect(window.scrollTo).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("検索"), {
      target: { value: "曲00" },
    });
    expect(document.querySelectorAll("tbody > tr")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "曲00" })).toBeInTheDocument();
  });

  it("shows loading state and translated English controls", () => {
    mocks.loading = true;
    const { rerender } = render(<RepertoireClient />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "レパートリーを読み込み中",
    );
    mocks.loading = false;
    mocks.locale = "en";
    mocks.songs = [song("Song A")];
    rerender(<RepertoireClient />);
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.getByLabelText("Type")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "All" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Last performance date" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Latest" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Play the latest performance of Song A in SongDB",
      }),
    ).toHaveTextContent("Play");
  });
});

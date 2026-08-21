import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/app/types/song";
import { decodePlaylistUrlParam } from "@/app/lib/playlistUrl";
import {
  buildAcrosticCandidateIndex,
  type AcrosticCandidate,
} from "../acrosticSetlist";
import { ACROSTIC_SETLIST_DRAFT_KEY } from "../acrosticSetlistDraft";
import AcrosticSetlistPageClient from "../client";

const songsMock = vi.hoisted(() => ({
  allSongs: [] as Song[],
  isLoading: false,
}));
const playlistsMock = vi.hoisted(() => ({
  authenticated: true,
  ready: true,
  requestSignIn: vi.fn(),
  encodePlaylistUrlParam: vi.fn(),
}));
const clipboardMock = vi.hoisted(() => ({ writeText: vi.fn() }));

vi.mock("@/app/hook/useSongs", () => ({
  default: () => songsMock,
}));

vi.mock("@/app/hook/usePlaylists", async () => {
  const actual = await vi.importActual<typeof import("@/app/lib/playlistUrl")>(
    "@/app/lib/playlistUrl",
  );
  playlistsMock.encodePlaylistUrlParam.mockImplementation(
    actual.encodePlaylistUrlParam,
  );
  return { default: () => playlistsMock };
});

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

vi.mock("@/app/theme", () => ({
  breadcrumbClasses: { root: "", link: "", separator: "" },
  pageClasses: { shell: "", heading: "", description: "" },
}));

vi.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) => {
      if (key === "defaultPlaylistName") {
        return `縦読み「${values?.phrase ?? ""}」`;
      }
      if (values?.character) return `${key}-${values.character}`;
      return key;
    },
}));

vi.mock("@mantine/core", () => {
  const Container = ({ children }: any) => <div>{children}</div>;
  const Alert = ({ children, title }: any) => (
    <div>
      <strong>{title}</strong>
      {children}
    </div>
  );
  const Badge = ({ children, ...props }: any) => (
    <span aria-label={props["aria-label"]}>{children}</span>
  );
  const Breadcrumbs = ({ children }: any) => <nav>{children}</nav>;
  const Button = ({
    children,
    component,
    href,
    leftSection: _leftSection,
    loading: _loading,
    ...props
  }: any) => {
    if (component) {
      const resolvedHref =
        typeof href === "string"
          ? href
          : `${href.pathname}?playlist=${href.query.playlist}`;
      return (
        <a href={resolvedHref} {...props}>
          {children}
        </a>
      );
    }
    return (
      <button type="button" {...props}>
        {children}
      </button>
    );
  };
  const Select = ({
    data,
    value,
    onChange,
    error,
    label: _label,
    searchable: _searchable,
    clearable: _clearable,
    nothingFoundMessage: _nothingFoundMessage,
    comboboxProps: _comboboxProps,
    ...props
  }: any) => (
    <div>
      <select
        aria-label={props["aria-label"]}
        value={value ?? ""}
        onChange={(event) => onChange(event.currentTarget.value || null)}
      >
        <option value="" />
        {data.map((option: { value: string; label: string }) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span>{error}</span> : null}
    </div>
  );
  const Switch = ({ checked, onChange, label }: any) => (
    <label>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
  const Textarea = ({
    label,
    description: _description,
    autosize: _autosize,
    minRows: _minRows,
    maxRows: _maxRows,
    ...props
  }: any) => <textarea aria-label={label} {...props} />;
  const Skeleton = () => <div>loading</div>;
  const Text = ({ children }: any) => <p>{children}</p>;

  return {
    Alert,
    Badge,
    Breadcrumbs,
    Button,
    Group: Container,
    Paper: Container,
    Select,
    Skeleton,
    Stack: Container,
    Switch,
    Text,
    Textarea,
  };
});

vi.mock("@/app/components/CreatePlaylistModal", () => ({
  default: ({ onenModal, initialName, initialSongs }: any) => (
    <div
      data-testid="playlist-modal-props"
      data-open={String(onenModal)}
      data-name={initialName}
      data-songs={JSON.stringify(initialSongs)}
    />
  ),
}));

const makeSong = (overrides: Partial<Song>): Song => ({
  title: overrides.title ?? "Song",
  title_en: overrides.title_en,
  title_aliases: overrides.title_aliases,
  artist: overrides.artist ?? "Artist",
  hl: overrides.hl ?? {
    ja: {
      title: overrides.title ?? "Song",
      artist: overrides.artist ?? "Artist",
      artists: [overrides.artist ?? "Artist"],
    },
  },
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "AZKi",
  sings: ["AZKi"],
  video_title: "Stream",
  video_uri: "",
  video_id: overrides.video_id ?? "video",
  start: overrides.start ?? 0,
  end: 100,
  broadcast_at: overrides.broadcast_at ?? "2026-01-01T00:00:00.000Z",
  year: 2026,
  tags: [],
  milestones: [],
});

const aliasSong = makeSong({
  title: "曲A",
  title_aliases: ["Alpha", "採用しない別名"],
  video_id: "video-a",
  start: 10,
  broadcast_at: "2026-03-01T00:00:00.000Z",
});
const combinedKanaSong = makeSong({
  title: "曲J",
  title_aliases: ["じゃれあい", "採用しない別名"],
  video_id: "video-ja",
  start: 15,
  broadcast_at: "2026-02-15T00:00:00.000Z",
});
const anotherSong = makeSong({
  title: "Another",
  video_id: "video-another",
  start: 20,
  broadcast_at: "2026-02-01T00:00:00.000Z",
});
const zSong = makeSong({
  title: "Zebra",
  video_id: "video-z",
  start: 30,
  broadcast_at: "2026-01-01T00:00:00.000Z",
});

const getCandidates = (initial: string): AcrosticCandidate[] =>
  buildAcrosticCandidateIndex(songsMock.allSongs).byInitial.get(initial) ?? [];

describe("AcrosticSetlistPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    songsMock.allSongs = [aliasSong, combinedKanaSong, anotherSong, zSong];
    songsMock.isLoading = false;
    playlistsMock.authenticated = true;
    playlistsMock.ready = true;
    window.sessionStorage.clear();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: clipboardMock,
    });
    clipboardMock.writeText.mockResolvedValue(undefined);
  });

  it("自動割当した順番でコピー・再生・保存できる", async () => {
    render(<AcrosticSetlistPageClient />);

    fireEvent.change(screen.getByLabelText("input.label"), {
      target: { value: "A-Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "button.generate" }));

    expect(screen.getByLabelText("result.selectLabel-A")).toHaveValue(
      getCandidates("a")[0].key,
    );
    expect(screen.getByLabelText("result.selectLabel-Z")).toHaveValue(
      getCandidates("z")[0].key,
    );

    fireEvent.click(screen.getByRole("button", { name: "button.copy" }));
    await waitFor(() =>
      expect(clipboardMock.writeText).toHaveBeenCalledWith(
        "A｜曲A - Artist\nZ｜Zebra - Artist",
      ),
    );

    const playLink = screen.getByRole("link", { name: "button.play" });
    const encoded = new URL(
      playLink.getAttribute("href")!,
      "https://example.test",
    ).searchParams.get("playlist")!;
    expect(decodePlaylistUrlParam(encoded).songs).toEqual([
      { videoId: "video-a", start: "10" },
      { videoId: "video-z", start: "30" },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "button.save" }));
    expect(screen.getByTestId("playlist-modal-props")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(screen.getByTestId("playlist-modal-props")).toHaveAttribute(
      "data-name",
      "縦読み「A-Z」",
    );
    expect(
      JSON.parse(
        screen.getByTestId("playlist-modal-props").getAttribute("data-songs")!,
      ),
    ).toEqual([
      { videoId: "video-a", start: "10" },
      { videoId: "video-z", start: "30" },
    ]);
  });

  it("拗音を1行として表示して候補を割り当てる", () => {
    render(<AcrosticSetlistPageClient />);

    fireEvent.change(screen.getByLabelText("input.label"), {
      target: { value: "じゃZ" },
    });
    fireEvent.click(screen.getByRole("button", { name: "button.generate" }));

    const rows = screen.getAllByTestId(/acrostic-row-/);
    expect(rows).toHaveLength(2);
    rows.forEach((row) =>
      expect(row).toHaveClass("grid-cols-[4.25rem_minmax(0,1fr)]"),
    );
    expect(screen.getByLabelText("result.selectLabel-じゃ")).toHaveValue(
      getCandidates("じゃ")[0].key,
    );
    expect(screen.queryByLabelText("result.selectLabel-じ")).toBeNull();
    expect(screen.queryByLabelText("result.selectLabel-ゃ")).toBeNull();
  });

  it("候補変更と曲の再利用切替を反映する", () => {
    render(<AcrosticSetlistPageClient />);
    fireEvent.change(screen.getByLabelText("input.label"), {
      target: { value: "AA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "button.generate" }));

    const selects = screen.getAllByLabelText("result.selectLabel-A");
    expect(selects[0]).toHaveValue(getCandidates("a")[0].key);
    expect(selects[1]).toHaveValue(getCandidates("a")[1].key);

    fireEvent.click(screen.getByRole("checkbox", { name: "reuse.label" }));
    fireEvent.change(selects[1], {
      target: { value: getCandidates("a")[0].key },
    });
    expect(selects[1]).toHaveValue(getCandidates("a")[0].key);
  });

  it("入力変更後と候補なしでは完成操作を無効にする", () => {
    render(<AcrosticSetlistPageClient />);
    const input = screen.getByLabelText("input.label");
    fireEvent.change(input, { target: { value: "AZ" } });
    fireEvent.click(screen.getByRole("button", { name: "button.generate" }));
    fireEvent.change(input, { target: { value: "Q" } });

    expect(screen.getByRole("button", { name: "button.copy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "button.save" })).toBeDisabled();
    expect(screen.queryByRole("link", { name: "button.play" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "button.generate" }));
    expect(screen.getByText("status.noCandidate")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "button.copy" })).toBeDisabled();
  });

  it("未ログイン保存では作成再開情報を付けてサインインする", () => {
    playlistsMock.authenticated = false;
    render(<AcrosticSetlistPageClient />);
    fireEvent.change(screen.getByLabelText("input.label"), {
      target: { value: "AZ" },
    });
    fireEvent.click(screen.getByRole("button", { name: "button.generate" }));
    fireEvent.click(screen.getByRole("button", { name: "button.save" }));

    expect(playlistsMock.requestSignIn).toHaveBeenCalledWith({
      type: "create-playlist",
    });
  });

  it("セッションドラフトから選択曲を復元する", async () => {
    const index = buildAcrosticCandidateIndex(songsMock.allSongs);
    const aKey = index.byInitial.get("a")![1].key;
    const zKey = index.byInitial.get("z")![0].key;
    window.sessionStorage.setItem(
      ACROSTIC_SETLIST_DRAFT_KEY,
      JSON.stringify({
        version: 1,
        input: "AZ",
        generatedInput: "AZ",
        allowReuse: false,
        selectedCandidateKeys: [aKey, zKey],
      }),
    );

    render(<AcrosticSetlistPageClient />);

    await waitFor(() =>
      expect(screen.getByLabelText("result.selectLabel-A")).toHaveValue(aKey),
    );
    expect(
      JSON.parse(
        screen.getByTestId("playlist-modal-props").getAttribute("data-songs")!,
      ),
    ).toEqual([
      { videoId: "video-another", start: "20" },
      { videoId: "video-z", start: "30" },
    ]);
  });
});

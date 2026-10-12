import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import enMessages from "@/messages/en.json";
import jaMessages from "@/messages/ja.json";
import type { Song } from "../../types/song";
import { HomeLatestVideoSection } from "../HomeLatestVideoSection";

const intl = vi.hoisted(() => ({ locale: "ja" }));

vi.mock("next-intl", async (importOriginal) => {
  const original = await importOriginal<typeof import("next-intl")>();
  return {
    ...original,
    useLocale: () => intl.locale,
    useTranslations: () =>
      original.createTranslator({
        locale: intl.locale,
        messages: intl.locale === "en" ? enMessages : jaMessages,
        namespace: "Home",
      }),
  };
});

vi.mock("../../components/YoutubeThumbnail", () => ({
  default: ({ videoId, alt }: { videoId: string; alt: string }) => (
    <img src={`https://example.com/${videoId}.jpg`} alt={alt} />
  ),
}));

function createSong(overrides: Partial<Song> = {}): Song {
  return {
    video_id: "latest-video",
    video_title: "最新の歌枠",
    broadcast_at: "2026-10-07T12:00:00.000Z",
    start: 120,
    ...overrides,
  } as Song;
}

function renderSection(songs: Song[], isLoading = false) {
  return render(
    <MantineProvider>
      <HomeLatestVideoSection songs={songs} isLoading={isLoading} />
    </MantineProvider>,
  );
}

describe("HomeLatestVideoSection", () => {
  beforeEach(() => {
    intl.locale = "ja";
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("最新の動画1件を表示し、同じ動画の収録曲数をまとめる", () => {
    renderSection([
      createSong({
        video_id: "older-video",
        video_title: "以前の歌枠",
        broadcast_at: "2026-09-20T12:00:00.000Z",
      }),
      createSong(),
      createSong({ start: 240 }),
    ]);

    expect(screen.getByRole("heading", { name: "最新動画" })).toBeVisible();
    expect(screen.getByText("最新の歌枠")).toBeVisible();
    expect(screen.getByText("2026/10/07")).toBeVisible();
    expect(screen.getByText("2曲")).toBeVisible();
    expect(screen.getByRole("img", { name: "最新の歌枠" })).toHaveAttribute(
      "src",
      "https://example.com/latest-video.jpg",
    );
    expect(screen.queryByText("以前の歌枠")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("カード全体から動画を指定してサイト内プレイヤーを開く", () => {
    renderSection([createSong()]);

    const link = screen.getByRole("link", {
      name: "最新動画を再生: 最新の歌枠",
    });
    expect(link).toHaveAttribute("href", "/watch?v=latest-video");
    expect(link).not.toHaveAttribute("target", "_blank");
    expect(link).toContainElement(screen.getByRole("img"));
    expect(screen.getByText("2026/10/07")).toBeVisible();
    expect(screen.queryByText("1曲")).not.toBeInTheDocument();
  });

  it("読み込み中は動画リンクを表示しない", () => {
    renderSection([createSong()], true);

    expect(screen.getByRole("region", { name: "最新動画" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it.each([
    { songs: [] },
    { songs: [createSong({ video_id: "" })] },
    { songs: [createSong({ broadcast_at: "" })] },
  ])("表示できる動画がなければカードを表示しない: %j", ({ songs }) => {
    renderSection(songs);

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("楽曲データが更新されたら新しい動画へ切り替わる", () => {
    const { rerender } = renderSection([createSong()]);
    rerender(
      <MantineProvider>
        <HomeLatestVideoSection
          isLoading={false}
          songs={[
            createSong(),
            createSong({
              video_id: "next-video",
              video_title: "次の歌枠",
              broadcast_at: "2026-10-08T12:00:00.000Z",
            }),
          ]}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/watch?v=next-video",
    );
    expect(screen.getByText("次の歌枠")).toBeVisible();
    expect(screen.queryByText("最新の歌枠")).not.toBeInTheDocument();
  });

  it.each([
    [1, null],
    [2, "2 songs"],
  ])("英語表示で収録曲数%dの文言を表示する", (count, expected) => {
    intl.locale = "en";
    renderSection(Array.from({ length: count }, () => createSong()));

    expect(screen.getByRole("heading", { name: "Latest video" })).toBeVisible();
    if (expected) {
      expect(screen.getByText(expected)).toBeVisible();
    } else {
      expect(screen.queryByText("1 song")).not.toBeInTheDocument();
    }
    expect(screen.getByRole("link")).toHaveAccessibleName(
      "Play latest video: 最新の歌枠",
    );
  });
});

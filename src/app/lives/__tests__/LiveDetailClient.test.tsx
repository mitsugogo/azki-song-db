import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LiveTitleGroup } from "@/app/types/live";
import LiveDetailClient from "../LiveDetailClient";

const group: LiveTitleGroup = {
  canonicalId: "LIVE-018",
  title: "First Gravity",
  category: "ユニットライブ",
  latestDate: "2024-01-27",
  totalSongs: 3,
  performances: [
    {
      id: "LIVE-018",
      title: "First Gravity",
      category: "ユニットライブ",
      performance: "昼公演",
      date: "2024-01-27",
      doorsTime: "11:00",
      startTime: "12:00",
      venue: "CLUB CITTA’",
      url: "https://example.com/live",
      performers: "AZKi、ときのそら",
      ticket: "7,500円",
      note: "昼公演の備考",
      setlist: [
        {
          order: "EN",
          title: "昼の曲",
          artist: "AZKi",
          singers: "AZKi",
          note: "",
        },
      ],
    },
    {
      id: "LIVE-019",
      title: "First Gravity",
      category: "ユニットライブ",
      performance: "夜公演",
      date: "2024-01-27",
      doorsTime: "15:00",
      startTime: "16:00",
      venue: "CLUB CITTA’",
      url: "",
      performers: "AZKi、ときのそら",
      ticket: "7,500円",
      note: "",
      setlist: [
        {
          order: "02a",
          title: "夜の曲",
          artist: "AZKi",
          singers: "",
          note: "メドレーの一部",
        },
        {
          order: "01-1",
          title: "Overture",
          artist: "AZKi",
          singers: "",
          note: "",
        },
      ],
    },
  ],
};

describe("LiveDetailClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("公演タブは各URLへリンクし、URLから選択された公演の内容を表示する", () => {
    const { rerender } = render(
      <MantineProvider>
        <LiveDetailClient group={group} initialPerformanceId="LIVE-018" />
      </MantineProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "First Gravity" }),
    ).toBeVisible();
    expect(screen.getByText("昼の曲")).toBeVisible();
    expect(screen.getByText("EN")).toBeVisible();
    expect(
      screen.getByText("CLUB CITTA’").closest("div.rounded-xl"),
    ).toHaveClass("bg-white/80");
    expect(screen.getByRole("link", { name: "officialPage" })).toHaveAttribute(
      "href",
      "https://example.com/live",
    );

    expect(screen.getByRole("tab", { name: "昼公演" })).toHaveAttribute(
      "href",
      "/lives/LIVE-018",
    );
    expect(screen.getByRole("tab", { name: "夜公演" })).toHaveAttribute(
      "href",
      "/lives/LIVE-018?performance=LIVE-019",
    );
    expect(
      screen.getByRole("tab", { name: "allPerformances" }),
    ).toHaveAttribute("href", "/lives/LIVE-018/all");

    rerender(
      <MantineProvider>
        <LiveDetailClient group={group} initialPerformanceId="LIVE-019" />
      </MantineProvider>,
    );

    expect(screen.getByText("夜の曲")).toBeVisible();
    expect(screen.getByText("02a")).toBeVisible();
    expect(screen.getByText("01-1")).toBeVisible();
    expect(screen.getByText("メドレーの一部")).toBeVisible();
    expect(screen.queryByText("昼の曲")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "夜公演" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("単独公演ではタブを表示せず、任意情報を省略する", () => {
    render(
      <MantineProvider>
        <LiveDetailClient
          group={{ ...group, performances: [group.performances[1]] }}
          initialPerformanceId="LIVE-019"
        />
      </MantineProvider>,
    );

    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "officialPage" })).toBeNull();
    expect(screen.getByText("夜の曲")).toBeVisible();
  });

  it("声音エントロピーの公演タブは各sub slugへリンクする", () => {
    const entropyGroup: LiveTitleGroup = {
      ...group,
      canonicalId: "kowairo-entropy-yokohama-day",
      pageSlug: "kowairo-entropy",
      performances: [
        {
          ...group.performances[0],
          id: "kowairo-entropy-yokohama-day",
          performance: "横浜昼",
          performanceSlug: "yokohama-day",
        },
        {
          ...group.performances[1],
          id: "kowairo-entropy-yokohama-night",
          performance: "横浜夜",
          performanceSlug: "yokohama-night",
        },
        {
          ...group.performances[0],
          id: "kowairo-entropy-toyosu-day1",
          performance: "豊洲Day1",
          performanceSlug: "toyosu-day1",
        },
        {
          ...group.performances[1],
          id: "kowairo-entropy-toyosu-day2",
          performance: "豊洲Day2",
          performanceSlug: "toyosu-day2",
        },
      ],
    };
    render(
      <MantineProvider>
        <LiveDetailClient
          group={entropyGroup}
          initialPerformanceId="kowairo-entropy-yokohama-night"
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("tab", { name: "横浜昼" })).toHaveAttribute(
      "href",
      "/lives/kowairo-entropy/yokohama-day",
    );
    expect(screen.getByRole("tab", { name: "横浜夜" })).toHaveAttribute(
      "href",
      "/lives/kowairo-entropy/yokohama-night",
    );
    expect(screen.getByRole("tab", { name: "豊洲Day1" })).toHaveAttribute(
      "href",
      "/lives/kowairo-entropy/toyosu-day1",
    );
    expect(screen.getByRole("tab", { name: "豊洲Day2" })).toHaveAttribute(
      "href",
      "/lives/kowairo-entropy/toyosu-day2",
    );
    expect(
      screen.getByRole("tab", { name: "allPerformances" }),
    ).toHaveAttribute("href", "/lives/kowairo-entropy/all");
    expect(screen.getByRole("tab", { name: "横浜夜" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("夜の曲")).toBeVisible();
  });

  it("hololive 6th fes.のタブは選択先のsub slugへリンクし、クエリを混ぜない", () => {
    const festivalGroup: LiveTitleGroup = {
      ...group,
      canonicalId: "hololive-6th-fes-color-rise-harmony-stage2",
      pageSlug: "hololive-6th-fes-color-rise-harmony",
      performances: [
        {
          ...group.performances[0],
          id: "hololive-6th-fes-color-rise-harmony-stage2",
          performance: "hololive STAGE2",
          performanceSlug: "stage2",
        },
        {
          ...group.performances[1],
          id: "hololive-6th-fes-color-rise-harmony-creators",
          performance: "CREATORS’ STAGE",
          performanceSlug: "creators-stage",
        },
      ],
    };
    render(
      <MantineProvider>
        <LiveDetailClient
          group={festivalGroup}
          initialPerformanceId="hololive-6th-fes-color-rise-harmony-creators"
        />
      </MantineProvider>,
    );

    expect(
      screen.getByRole("tab", { name: "hololive STAGE2" }),
    ).toHaveAttribute(
      "href",
      "/lives/hololive-6th-fes-color-rise-harmony/stage2",
    );
    expect(
      screen.getByRole("tab", { name: "CREATORS’ STAGE" }),
    ).toHaveAttribute(
      "href",
      "/lives/hololive-6th-fes-color-rise-harmony/creators-stage",
    );
    expect(
      screen.getByRole("tab", { name: "CREATORS’ STAGE" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("夜の曲")).toBeVisible();
  });

  it("公式fesではAZKiが歌った曲名だけをprimary色・太字にする", () => {
    const officialGroup: LiveTitleGroup = {
      ...group,
      category: "公式fes",
      performances: [
        {
          ...group.performances[0],
          setlist: [
            {
              order: "01",
              title: "AZKi参加曲",
              artist: "別アーティスト",
              singers: "AZKi、星街すいせい",
              note: "",
            },
            {
              order: "02",
              title: "AZKi不参加曲",
              artist: "AZKi",
              singers: "星街すいせい",
              note: "",
            },
          ],
        },
      ],
    };
    const { rerender } = render(
      <MantineProvider>
        <LiveDetailClient
          group={officialGroup}
          initialPerformanceId="LIVE-018"
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("heading", { name: "AZKi参加曲" })).toHaveClass(
      "text-primary-700",
      "font-bold",
    );
    expect(screen.getByRole("heading", { name: "AZKi不参加曲" })).toHaveClass(
      "text-gray-900",
      "font-bold",
    );

    rerender(
      <MantineProvider>
        <LiveDetailClient
          group={{ ...officialGroup, category: "ソロライブ" }}
          initialPerformanceId="LIVE-018"
        />
      </MantineProvider>,
    );
    expect(screen.getByRole("heading", { name: "AZKi参加曲" })).toHaveClass(
      "text-gray-900",
    );
  });
});

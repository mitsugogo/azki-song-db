import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { theme } from "../../theme";
import ArchiveCollaborationRanking from "../ArchiveCollaborationRanking";

const labels = {
  title: "よくコラボしたホロメン",
  subtitle: "一緒に配信した回数",
  count: (count: number) => `${count}件`,
  itemLabel: (rank: number, name: string, count: number) =>
    `${rank}位 ${name} ${count}件`,
  noData: "表示できるコラボ情報がありません。",
  allTimeOptionLabel: "全期間",
  yearSelectAriaLabel: "表示年",
  modeSwitchAriaLabel: "コラボランキングの表示切替",
  memberModeLabel: "ホロメン別",
  combinationModeLabel: "組み合わせ別",
  noCollaboration: "未コラボ",
};

const formatDuration = (seconds: number) => `${seconds / 3_600}h`;

describe("ArchiveCollaborationRanking", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("registers the hololive image color in the Mantine theme", () => {
    expect(theme.colors?.hololive?.[2]).toBe("#a4ebf5");
  });

  it("renders ranked collaborators with avatars, counts, and gauges", () => {
    render(
      <MantineProvider theme={theme}>
        <ArchiveCollaborationRanking
          items={[
            {
              key: "UC-suisei",
              name: "星街すいせい",
              count: 8,
              totalDurationSeconds: 28_800,
              firstCollaborationDate: "2020-07-19",
              castNames: ["星街すいせい"],
              participantEntries: [
                {
                  name: "星街すいせい",
                  channel: {
                    branch: "JP",
                    generation: "0期生",
                    talentName: "星街すいせい",
                    artistName: "星街すいせい",
                    youtubeId: "UC-suisei",
                    channelName: "Suisei Channel",
                    handle: "@suisei",
                    subscriberCount: 0,
                    iconUrl: "https://example.com/suisei.png",
                  },
                },
              ],
            },
          ]}
          membersWithoutCollaboration={[
            {
              name: "風真いろは",
              channel: {
                branch: "DEV_IS",
                generation: "holoX",
                talentName: "風真いろは",
                artistName: "風真いろは",
                youtubeId: "UC-iroha",
                channelName: "Iroha Channel",
                handle: "@iroha",
                subscriberCount: 0,
                iconUrl: "https://example.com/iroha.png",
              },
            },
          ]}
          years={[2025, 2024]}
          selectedYear={null}
          mode="member"
          labels={labels}
          formatDuration={formatDuration}
          onSelectedYearChange={vi.fn()}
          onModeChange={vi.fn()}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("よくコラボしたホロメン")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "星街すいせい" })).toBeVisible();
    expect(screen.getByText("0期生")).toBeVisible();
    expect(screen.getByText("8h")).toBeVisible();
    expect(screen.getByText("8件")).toBeVisible();
    expect(screen.getByText("未コラボ")).toBeVisible();
    expect(screen.getByRole("img", { name: "風真いろは" })).toBeVisible();
    const suiseiLink = screen.getByRole("link", { name: /星街すいせい/ });
    expect(suiseiLink).toHaveAttribute(
      "href",
      "/stream-archives/list?cast=%E6%98%9F%E8%A1%97%E3%81%99%E3%81%84%E3%81%9B%E3%81%84",
    );
    expect(suiseiLink).toHaveClass("grid-cols-[1.5rem_2.5rem_minmax(0,1fr)]");
    expect(
      screen.getByRole("progressbar", { name: "1位 星街すいせい 8件" }),
    ).toHaveAttribute("aria-valuenow", "100");
  });

  it("shows graduation status beside the member name", () => {
    render(
      <MantineProvider theme={theme}>
        <ArchiveCollaborationRanking
          items={[
            {
              key: "UC-mel",
              name: "夜空メル",
              castNames: ["夜空メル"],
              count: 3,
              totalDurationSeconds: 10_800,
              firstCollaborationDate: "2020-01-01",
              participantEntries: [
                {
                  name: "夜空メル",
                  channel: {
                    branch: "JP",
                    generation: "1期生、卒業生",
                    talentName: "夜空メル",
                    artistName: "夜空メル",
                    youtubeId: "UC-mel",
                    channelName: "Mel Channel",
                    handle: "@mel",
                    subscriberCount: 0,
                    iconUrl: "https://example.com/mel.png",
                  },
                },
              ],
            },
          ]}
          membersWithoutCollaboration={[]}
          years={[2026]}
          selectedYear={null}
          mode="member"
          labels={labels}
          formatDuration={formatDuration}
          onSelectedYearChange={vi.fn()}
          onModeChange={vi.fn()}
        />
      </MantineProvider>,
    );

    const rankingLink = screen.getByRole("link", { name: /夜空メル/ });
    expect(within(rankingLink).getByText("1期生")).toBeVisible();
    expect(within(rankingLink).getByText(/卒業生/)).toBeVisible();
    expect(within(rankingLink).getByText("3h")).toBeVisible();
    expect(within(rankingLink).getByText("3件")).toBeVisible();
  });

  it("renders a named combination with member avatars and multi-cast link", () => {
    const createParticipant = (name: string, youtubeId: string) => ({
      name,
      channel: {
        branch: "JP",
        generation: "",
        talentName: name,
        artistName: name,
        youtubeId,
        channelName: `${name} Channel`,
        handle: "",
        subscriberCount: 0,
        iconUrl: `https://example.com/${youtubeId}.png`,
      },
    });

    render(
      <MantineProvider theme={theme}>
        <ArchiveCollaborationRanking
          items={[
            {
              key: "ko-z-my",
              name: "KoZMy",
              count: 5,
              totalDurationSeconds: 18_000,
              firstCollaborationDate: "2024-09-15",
              castNames: ["雪花ラミィ", "博衣こより"],
              participantEntries: [
                createParticipant("AZKi", "UC-azki"),
                createParticipant("雪花ラミィ", "UC-lamy"),
                createParticipant("博衣こより", "UC-koyori"),
              ],
            },
          ]}
          membersWithoutCollaboration={[]}
          years={[2026]}
          selectedYear={null}
          mode="combination"
          labels={labels}
          formatDuration={formatDuration}
          onSelectedYearChange={vi.fn()}
          onModeChange={vi.fn()}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("img", { name: "AZKi" })).toBeVisible();
    expect(screen.getByRole("img", { name: "雪花ラミィ" })).toBeVisible();
    expect(screen.getByRole("img", { name: "博衣こより" })).toBeVisible();
    expect(screen.getByText("5h")).toBeVisible();
    expect(screen.getByText("5件")).toBeVisible();
    const combinationLink = screen.getByRole("link", { name: /KoZMy/ });
    expect(combinationLink).toHaveAttribute(
      "href",
      "/stream-archives/list?cast=%E9%9B%AA%E8%8A%B1%E3%83%A9%E3%83%9F%E3%82%A3&cast=%E5%8D%9A%E8%A1%A3%E3%81%93%E3%82%88%E3%82%8A",
    );
    expect(combinationLink).toHaveClass(
      "grid-cols-[1.5rem_7.25rem_minmax(0,1fr)]",
    );
  });

  it("lets the user switch between all-time and a specific year", () => {
    const handleSelectedYearChange = vi.fn();
    const handleModeChange = vi.fn();

    render(
      <MantineProvider theme={theme}>
        <ArchiveCollaborationRanking
          items={[]}
          membersWithoutCollaboration={[]}
          years={[2025, 2024]}
          selectedYear={null}
          mode="member"
          labels={labels}
          formatDuration={formatDuration}
          onSelectedYearChange={handleSelectedYearChange}
          onModeChange={handleModeChange}
        />
      </MantineProvider>,
    );

    const select = screen.getByRole("combobox", { name: "表示年" });
    expect(select).toHaveValue("全期間");

    fireEvent.click(select);
    fireEvent.click(screen.getByRole("option", { name: "2025" }));
    expect(handleSelectedYearChange).toHaveBeenCalledWith("2025");

    fireEvent.click(screen.getByRole("radio", { name: "組み合わせ別" }));
    expect(handleModeChange).toHaveBeenCalledWith("combination");

    const modeSwitcher = screen.getByRole("radiogroup", {
      name: "コラボランキングの表示切替",
    });
    expect(
      modeSwitcher.compareDocumentPosition(select) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

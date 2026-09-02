import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ArchiveCollaborationRanking from "../ArchiveCollaborationRanking";

const labels = {
  title: "よくコラボしたホロメン",
  subtitle: "一緒に配信した回数",
  count: (count: number) => `${count}回`,
  itemLabel: (rank: number, name: string, count: number) =>
    `${rank}位 ${name} ${count}回`,
  noData: "表示できるコラボ情報がありません。",
  allTimeOptionLabel: "全期間",
  yearSelectAriaLabel: "表示年",
  modeSwitchAriaLabel: "コラボランキングの表示切替",
  memberModeLabel: "ホロメン別",
  combinationModeLabel: "組み合わせ別",
  firstCollaboration: (date: string, duration: string) =>
    `初コラボ ${date}・${duration}`,
};

const formatDuration = (seconds: number) => `${seconds / 3_600}h`;
const formatDate = (dateKey: string) => dateKey.replaceAll("-", "/");

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

  it("renders ranked collaborators with avatars, counts, and gauges", () => {
    render(
      <MantineProvider>
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
          years={[2025, 2024]}
          selectedYear={null}
          mode="member"
          labels={labels}
          formatDuration={formatDuration}
          formatDate={formatDate}
          onSelectedYearChange={vi.fn()}
          onModeChange={vi.fn()}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("よくコラボしたホロメン")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "星街すいせい" })).toBeVisible();
    expect(screen.getByText("8回")).toBeInTheDocument();
    expect(screen.getByText("初コラボ 2020/07/19・8h")).toBeVisible();
    expect(screen.getByRole("link", { name: /星街すいせい/ })).toHaveAttribute(
      "href",
      "/stream-archives/list?cast=%E6%98%9F%E8%A1%97%E3%81%99%E3%81%84%E3%81%9B%E3%81%84",
    );
    expect(
      screen.getByRole("progressbar", { name: "1位 星街すいせい 8回" }),
    ).toHaveAttribute("aria-valuenow", "100");
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
      <MantineProvider>
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
          years={[2026]}
          selectedYear={null}
          mode="combination"
          labels={labels}
          formatDuration={formatDuration}
          formatDate={formatDate}
          onSelectedYearChange={vi.fn()}
          onModeChange={vi.fn()}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("img", { name: "AZKi" })).toBeVisible();
    expect(screen.getByRole("img", { name: "雪花ラミィ" })).toBeVisible();
    expect(screen.getByRole("img", { name: "博衣こより" })).toBeVisible();
    expect(screen.getByText("初コラボ 2024/09/15・5h")).toBeVisible();
    expect(screen.getByRole("link", { name: /KoZMy/ })).toHaveAttribute(
      "href",
      "/stream-archives/list?cast=%E9%9B%AA%E8%8A%B1%E3%83%A9%E3%83%9F%E3%82%A3&cast=%E5%8D%9A%E8%A1%A3%E3%81%93%E3%82%88%E3%82%8A",
    );
  });

  it("lets the user switch between all-time and a specific year", () => {
    const handleSelectedYearChange = vi.fn();
    const handleModeChange = vi.fn();

    render(
      <MantineProvider>
        <ArchiveCollaborationRanking
          items={[]}
          years={[2025, 2024]}
          selectedYear={null}
          mode="member"
          labels={labels}
          formatDuration={formatDuration}
          formatDate={formatDate}
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

import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SummaryMonthClient from "../[year]/[month]/SummaryMonthClient";

vi.mock("../../hook/useSongs", () => ({
  default: () => ({ allSongs: [], isLoading: false }),
}));
vi.mock("../../hook/useArchives", () => ({
  default: () => ({ items: [], isLoading: false }),
}));
vi.mock("../../hook/useReleaseViewCounts", () => ({
  default: () => ({ data: {}, loading: false }),
}));
vi.mock("../../hook/useChannels", () => ({
  default: () => ({ channels: [] }),
}));
vi.mock("../../hook/useAnniversaries", () => ({
  default: () => ({ items: [], isLoading: false }),
}));
vi.mock("../../components/ScrollToTopButton", () => ({
  ScrollToTopButton: () => null,
}));
vi.mock("../../hook/useEvents", () => ({
  default: () => ({
    items: [
      {
        start_at: "2026-01-31T15:00:00.000Z",
        end_at: "",
        content: "予定イベント",
        place: "",
        note: "",
        url: "",
      },
      {
        start_at: "2026-02-28T15:00:00.000Z",
        end_at: "",
        content: "翌月イベント",
        place: "",
        note: "",
        url: "",
      },
    ],
    isLoading: false,
  }),
}));
vi.mock("../../hook/useMilestones", () => ({
  default: () => ({
    items: [
      { date: "2026-02-02T00:00:00.000Z", content: "予定マイルストーン" },
    ],
    isLoading: false,
  }),
}));

describe("SummaryMonthClient future calendar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-15T03:00:00.000Z"));
    global.__mockNextRouter.push = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
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
  afterEach(() => vi.useRealTimers());

  it("shows scheduled items in the future JST month and navigates through the last scheduled month", async () => {
    const { rerender } = render(
      <MantineProvider>
        <SummaryMonthClient
          activityMonth={{ year: 2026, month: 2 }}
          previousMonth={{ year: 2026, month: 1 }}
          nextMonth={{ year: 2026, month: 3 }}
        />
      </MantineProvider>,
    );
    const calendar = within(screen.getByTestId("activity-calendar"));
    expect(calendar.getByText("予定イベント")).toBeInTheDocument();
    expect(calendar.getByText("予定マイルストーン")).toBeInTheDocument();
    expect(calendar.queryByText("翌月イベント")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "nextMonth" })[0],
    ).toHaveAttribute("href", "/activity/2026/03");

    fireEvent.click(screen.getByRole("button", { name: "jumpToYear" }));
    fireEvent.click(await screen.findByText("3月"));
    expect(global.__mockNextRouter.push).toHaveBeenCalledWith(
      "/activity/2026/03",
    );

    rerender(
      <MantineProvider>
        <SummaryMonthClient
          activityMonth={{ year: 2026, month: 3 }}
          previousMonth={{ year: 2026, month: 2 }}
          nextMonth={{ year: 2026, month: 4 }}
        />
      </MantineProvider>,
    );
    expect(
      within(screen.getByTestId("activity-calendar")).getByText("翌月イベント"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "nextMonth" }),
    ).not.toBeInTheDocument();
  });
});

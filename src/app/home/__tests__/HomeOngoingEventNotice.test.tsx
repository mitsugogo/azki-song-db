import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import enMessages from "@/messages/en.json";
import jaMessages from "@/messages/ja.json";
import type { EventItem } from "../../types/eventItem";
import { HomeOngoingEventNotice } from "../HomeOngoingEventNotice";

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

function createEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    start_at: "2026-10-09",
    end_at: "2026-10-12",
    content: "開催中のライブ",
    place: "",
    note: "",
    url: "https://example.com/event",
    ...overrides,
  };
}

function renderNotice(events: EventItem[]) {
  return render(<HomeOngoingEventNotice events={events} />);
}

describe("HomeOngoingEventNotice", () => {
  beforeEach(() => {
    intl.locale = "ja";
    vi.spyOn(Date, "now").mockReturnValue(
      new Date("2026-10-10T03:00:00.000Z").getTime(),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("開催中のイベントを件数制限なくすべて列挙する", () => {
    const ongoingEvents = Array.from({ length: 5 }, (_, index) =>
      createEvent({ content: `イベント${index + 1}` }),
    );
    renderNotice([
      createEvent({ start_at: "2026-10-11", content: "開催前" }),
      ...ongoingEvents,
      createEvent({ end_at: "2026-10-09", content: "開催終了" }),
    ]);

    expect(
      screen.getByRole("region", { name: "開催中イベント" }),
    ).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(
      screen.getAllByRole("heading", { name: "開催中イベント" }),
    ).toHaveLength(1);
    for (const event of ongoingEvents) {
      expect(screen.getByText(event.content)).toBeVisible();
    }
    expect(screen.queryByText("開催前")).not.toBeInTheDocument();
    expect(screen.queryByText("開催終了")).not.toBeInTheDocument();
  });

  it("複数日開催では開始日と終了日を表示する", () => {
    renderNotice([createEvent()]);

    expect(screen.getByText("2026/10/09〜10/12")).toBeVisible();
  });

  it.each([
    { start_at: "2026-10-10", end_at: "" },
    { start_at: "2026-10-10", end_at: "2026-10-10" },
    {
      start_at: "2026-10-09T15:00:00.000Z",
      end_at: "2026-10-10T14:59:00.000Z",
    },
  ])("日本時間で単日開催なら日付を1つ表示する: %j", (dates) => {
    renderNotice([createEvent(dates)]);

    expect(screen.getByText("2026/10/10")).toBeVisible();
    expect(screen.queryByText(/〜/)).not.toBeInTheDocument();
  });

  it.each([
    ["2026-10-09T14:59:59.999Z", false],
    ["2026-10-09T15:00:00.000Z", true],
    ["2026-10-10T14:59:59.999Z", true],
    ["2026-10-10T15:00:00.000Z", false],
  ])("開始日と終了日を日本時間の日単位で判定する: %s", (now, visible) => {
    vi.mocked(Date.now).mockReturnValue(new Date(now).getTime());
    renderNotice([
      createEvent({ start_at: "2026-10-10", end_at: "2026-10-10" }),
    ]);

    expect(Boolean(screen.queryByRole("region"))).toBe(visible);
  });

  it.each([
    { events: [] },
    { events: [createEvent({ end_at: "2026-10-09" })] },
    { events: [createEvent({ start_at: "2026-10-11" })] },
    { events: [createEvent({ start_at: "invalid" })] },
    { events: [createEvent({ end_at: "invalid" })] },
  ])("開催中イベントがなければ表示しない: %j", ({ events }) => {
    renderNotice(events);

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("カード全体からイベントの外部リンクを開き、備考も表示する", () => {
    renderNotice([createEvent({ note: "特別ゲスト出演" })]);

    const link = screen.getByRole("link", { name: "開催中: 開催中のライブ" });
    expect(link).toHaveAttribute("href", "https://example.com/event");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toContainElement(screen.getByText("開催中のライブ"));
    expect(link).toContainElement(screen.getByText("2026/10/09〜10/12"));
    expect(screen.getByText("特別ゲスト出演")).toBeVisible();
  });

  it("URLのないイベントも表示する", () => {
    renderNotice([createEvent({ url: "" })]);

    expect(screen.getByText("開催中のライブ")).toBeVisible();
    expect(screen.getByText("2026/10/09〜10/12")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("英語でも開催中イベントと開催期間を表示する", () => {
    intl.locale = "en";
    renderNotice([createEvent({ content: "Live event" })]);

    expect(
      screen.getByRole("heading", { name: "Ongoing events" }),
    ).toBeVisible();
    expect(screen.getByText("Oct 9, 2026 - Oct 12")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Now: Live event" }),
    ).toHaveAttribute("href", "https://example.com/event");
  });
});

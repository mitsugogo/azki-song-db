import { describe, expect, it } from "vitest";
import { buildTimelineMilestones, getFeaturedEvents } from "../highlights";
import {
  getActivityImportanceItemClassName,
  getActivityImportanceTitleClassName,
} from "../activityImportance";
import type { EventItem } from "../../types/eventItem";

const createEvent = (
  startAt: string,
  content: string,
  importance: EventItem["importance"],
): EventItem => ({
  start_at: startAt,
  end_at: startAt,
  content,
  place: "",
  place_url: "",
  note: "",
  url: "",
  importance,
});

describe("activity highlights importance", () => {
  it("keeps the higher importance when duplicate milestones are merged", () => {
    const milestones = buildTimelineMilestones(
      [],
      [
        {
          date: "2026-07-05T00:30:00.000Z",
          content: "同じ記念日",
          importance: "high",
        },
        {
          date: "2026-07-05T09:00:00.000Z",
          content: "同じ記念日",
          importance: "extra_high",
        },
      ],
    );

    expect(milestones).toHaveLength(1);
    expect(milestones[0].importance).toBe("extra_high");
  });

  it("selects higher importance first for events on the same JST day", () => {
    const events = getFeaturedEvents(
      [
        createEvent("2026-07-02", "通常イベント", "normal"),
        createEvent("2026-07-02", "重要イベント", "extra_high"),
        createEvent("2026-07-03", "翌日イベント", "high"),
      ],
      2,
      new Date("2026-07-01T00:00:00.000Z").getTime(),
    );

    expect(events.map((event) => event.content)).toEqual([
      "重要イベント",
      "通常イベント",
    ]);
  });

  it("uses stronger classes only for higher importance", () => {
    expect(getActivityImportanceItemClassName("normal")).toBe("");
    expect(getActivityImportanceItemClassName("high")).toContain("shadow-");
    expect(getActivityImportanceItemClassName("extra_high")).toContain(
      "border-2",
    );
    expect(getActivityImportanceTitleClassName("extra_high")).toContain(
      "font-bold",
    );
  });
});

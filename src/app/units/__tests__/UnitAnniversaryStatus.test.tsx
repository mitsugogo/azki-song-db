import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "ja",
  useTranslations:
    () =>
    (key: string, values: Record<string, string | number> = {}) => {
      if (key === "anniversaryNumberJa") return `${values.number}周年`;
      if (key === "anniversaryNumberEn") return `${values.ordinal}`;
      if (key === "heroCongratulations")
        return `${values.name}${values.number}周年おめでとう！`;
      if (key === "countdownLead") return `${values.anniversary}まで`;
      return key;
    },
}));

vi.mock("@/app/fonts", () => ({
  zenMaruGothic: { className: "test-font" },
}));

import UnitAnniversaryStatus from "../components/UnitAnniversaryStatus";

const renderStatus = (initialNowIso: string) =>
  render(
    <UnitAnniversaryStatus
      formedAt="2022-09-17"
      anniversaryMonth={9}
      anniversaryDay={17}
      unitName="あずいろ"
      initialNowIso={initialNowIso}
      freezeNow
    />,
  );

describe("UnitAnniversaryStatus", () => {
  it("starts the anniversary message at 9/17 00:00 JST", () => {
    renderStatus("2026-09-16T15:00:00.000Z");

    expect(screen.getByText("あずいろ4周年おめでとう！")).toBeVisible();
  });

  it("keeps the anniversary message through 9/19 23:59 JST", () => {
    renderStatus("2026-09-19T14:59:59.999Z");

    expect(screen.getByText("あずいろ4周年おめでとう！")).toBeVisible();
  });

  it("switches to the next anniversary countdown at 9/20 00:00 JST", () => {
    renderStatus("2026-09-19T15:00:00.000Z");

    expect(
      screen.queryByText("あずいろ4周年おめでとう！"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("5周年まで")).toBeVisible();
    expect(screen.getByText("JST")).toBeVisible();
    expect(screen.getByText(/ : /)).toHaveClass("test-font");
  });

  it("counts down to the current year's anniversary before 9/17", () => {
    renderStatus("2026-09-16T14:59:59.000Z");

    expect(screen.getByText("4周年まで")).toBeVisible();
  });
});

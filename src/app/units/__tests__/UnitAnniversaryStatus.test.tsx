import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocale } from "next-intl";
import { getUnitBySlug } from "@/app/config/units";
import jaMessages from "@/messages/ja.json";
import enMessages from "@/messages/en.json";

vi.mock("next-intl", async (importOriginal) => {
  const { createTranslator } =
    await importOriginal<typeof import("next-intl")>();
  return {
    useLocale: vi.fn(() => "ja"),
    useTranslations: () => {
      const locale = useLocale();
      return createTranslator({
        locale,
        messages: locale === "ja" ? jaMessages : enMessages,
        namespace: "Units",
      });
    },
  };
});

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
  beforeEach(() => {
    vi.mocked(useLocale).mockReturnValue("ja");
  });

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
    expect(screen.getByText("5th Anniversaryまで")).toBeVisible();
    expect(screen.getByText("JST")).toBeVisible();
    expect(screen.getByText(/ : /)).toHaveClass("test-font");
  });

  it("counts down to the current year's anniversary before 9/17", () => {
    renderStatus("2026-09-16T14:59:59.000Z");

    expect(screen.getByText("4th Anniversaryまで")).toBeVisible();
  });

  it.each(["ja", "en"])(
    "formats English ordinals correctly in %s",
    (locale) => {
      vi.mocked(useLocale).mockReturnValue(locale);
      for (const [year, ordinal] of [
        [2023, "1st"],
        [2024, "2nd"],
        [2025, "3rd"],
        [2033, "11th"],
        [2034, "12th"],
        [2035, "13th"],
        [2043, "21st"],
      ] as const) {
        const { unmount } = renderStatus(`${year}-09-16T15:00:00.000Z`);
        expect(screen.getByText(`${ordinal} Anniversary`)).toBeVisible();
        unmount();
      }
    },
  );

  it.each([
    ["2026-05-18T14:59:59.000Z", "7th Anniversaryまで"],
    ["2026-05-18T15:00:00.000Z", "AS_tar7周年おめでとう！"],
    ["2026-05-21T14:59:59.999Z", "AS_tar7周年おめでとう！"],
    ["2026-05-21T15:00:00.000Z", "8th Anniversaryまで"],
    ["2026-10-29T00:00:00.000Z", "8th Anniversaryまで"],
  ])("uses AS_tar's INNK anniversary at %s", (initialNowIso, label) => {
    const unit = getUnitBySlug("as-tar")!;
    render(
      <UnitAnniversaryStatus
        formedAt={unit.formedAt}
        anniversaryStartedAt={unit.anniversary!.startedAt}
        anniversaryMonth={unit.anniversary!.month}
        anniversaryDay={unit.anniversary!.day}
        unitName={unit.name.ja}
        initialNowIso={initialNowIso}
        freezeNow
      />,
    );
    expect(screen.getByText(label)).toBeVisible();
    if (label.includes("おめでとう")) {
      expect(screen.getByText("2019.05.19 — 2026.05.19")).toBeVisible();
    }
  });
});

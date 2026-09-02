import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ArchiveTimeHeatmap from "../ArchiveTimeHeatmap";

describe("ArchiveTimeHeatmap", () => {
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

  it("lets the user select all time or a specific year", () => {
    const onSelectedYearChange = vi.fn();

    render(
      <MantineProvider>
        <ArchiveTimeHeatmap
          cells={[]}
          maxCount={0}
          years={[2026, 2025]}
          selectedYear={null}
          weekdayLabels={["日", "月", "火", "水", "木", "金", "土"]}
          labels={{
            title: "配信開始時間",
            subtitle: "JSTの曜日・2時間帯別の配信開始数",
            cell: (weekday, time, count) => `${weekday} ${time}：${count}件`,
            less: "少ない",
            more: "多い",
            allTimeOptionLabel: "全期間",
            yearSelectAriaLabel: "配信開始時間の表示期間",
          }}
          onSelectedYearChange={onSelectedYearChange}
        />
      </MantineProvider>,
    );

    const select = screen.getByRole("combobox", {
      name: "配信開始時間の表示期間",
    });
    expect(select).toHaveValue("全期間");

    fireEvent.click(select);
    fireEvent.click(screen.getByRole("option", { name: "2025" }));
    expect(onSelectedYearChange).toHaveBeenCalledWith("2025");
  });
});

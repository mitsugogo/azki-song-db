import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderViewCountCell, viewCountSortFn } from "../statisticsRenderers";
import type { ViewMilestoneInfo } from "../../types/viewMilestone";

vi.mock("next-intl", () => ({
  useLocale: () => "ja",
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) => {
      if (key === "milestoneJa") return `${values?.count}万再生達成`;
      if (key === "achievedAt") return `達成日: ${values?.date}`;
      return key;
    },
}));

const hotLimitMilestone: ViewMilestoneInfo = {
  status: "achieved",
  targetCount: 400000,
  achievedAt: "2026-07-17T00:07:10.000Z",
};

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

describe("renderViewCountCell", () => {
  it("現在値が節目から1万回以上伸びていても履歴由来の達成ラベルを表示する", () => {
    render(
      <MantineProvider>
        {renderViewCountCell(422369, hotLimitMilestone)}
      </MantineProvider>,
    );

    expect(screen.getByText("40万再生達成")).toBeInTheDocument();
    expect(screen.getByText("達成日: 2026/07/17")).toBeInTheDocument();
  });
});

describe("viewCountSortFn", () => {
  it("履歴由来の達成情報を再生回数ラベルの並び順に反映する", () => {
    const achievedRow = {
      original: {
        effectiveViewCount: 422369,
        viewMilestone: hotLimitMilestone,
      },
    };
    const unlabeledRow = {
      original: {
        effectiveViewCount: 450000,
        viewMilestone: null,
      },
    };

    expect(viewCountSortFn(achievedRow, unlabeledRow)).toBeLessThan(0);
  });
});

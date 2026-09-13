import useStatViewCount from "@/app/hook/useStatViewCount";
import { render } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import ViewStat from "../viewStat";

const { areaChartCalls } = vi.hoisted(() => ({
  areaChartCalls: [] as any[],
}));

vi.mock("@/app/hook/useStatViewCount", () => ({
  default: vi.fn(),
}));

vi.mock("@mantine/charts", () => ({
  AreaChart: (props: any) => {
    areaChartCalls.push(props);
    return <div data-testid={`chart-${props.series[0].name}`} />;
  },
  getFilteredChartTooltipPayload: vi.fn(),
}));

describe("ViewStat", () => {
  beforeEach(() => {
    areaChartCalls.length = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-13T12:00:00.000Z"));
    (useStatViewCount as Mock).mockReturnValue({
      data: {
        statistics: [
          {
            datetime: new Date("2026-08-31T00:00:00.000Z"),
            viewCount: 790_000,
            likeCount: 10_000,
            commentCount: 1_000,
          },
          {
            datetime: new Date("2026-08-31T00:01:00.000Z"),
            viewCount: 790_000,
            likeCount: 10_000,
            commentCount: 1_000,
          },
          {
            datetime: new Date("2026-09-01T00:00:00.000Z"),
            viewCount: 801_000,
            likeCount: 10_100,
            commentCount: 1_010,
          },
          {
            datetime: new Date("2026-09-02T00:00:00.000Z"),
            viewCount: 803_000,
            likeCount: 10_200,
            commentCount: 1_020,
          },
        ],
      },
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("重複日付があっても達成線を表示し、狭い幅では日付を間引く", () => {
    render(<ViewStat videoId="video-id" />);

    const viewCountChart = areaChartCalls.find(
      (props) => props.series[0].name === "viewCount",
    );

    expect(viewCountChart.xAxisProps).toMatchObject({
      allowDuplicatedCategory: false,
      interval: "preserveStartEnd",
      minTickGap: 24,
    });
    expect(viewCountChart.xAxisProps).not.toHaveProperty("ticks");
    expect(viewCountChart.referenceLines).toEqual([
      expect.objectContaining({
        label: { value: "80万再生達成", fontWeight: 600 },
        labelPosition: "insideTopLeft",
        strokeWidth: 2,
        zIndex: 1000,
      }),
    ]);
  });
});

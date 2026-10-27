import { MantineProvider } from "@mantine/core";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BestNineResultsChart from "../BestNineResultsChart";

const rankings = [
  {
    songKey: "a",
    title: "長いタイトルのオリジナル曲",
    artist: "AZKi",
    count: 400,
    performances: [],
  },
  {
    songKey: "b",
    title: "もう一曲",
    artist: "歌手",
    count: 200,
    performances: [],
  },
];

describe("集計グラフの実描画", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 600,
      height: 400,
      top: 0,
      left: 0,
      right: 600,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  it.each(["pie", "bar", "treemap"] as const)(
    "Mantineの%sに実データを渡してSVGを描画する",
    async (type) => {
      const { container } = render(
        <MantineProvider env="test">
          <BestNineResultsChart
            rankings={rankings}
            type={type}
            label="出会い"
          />
        </MantineProvider>,
      );
      await waitFor(() =>
        expect(container.querySelector("svg")).not.toBeNull(),
      );
      expect(container.querySelector("figure")).toHaveAttribute(
        "aria-label",
        "chartLabel",
      );
      if (type === "treemap") {
        expect(container.querySelector("svg")).toHaveTextContent("400");
        expect(
          [...container.querySelectorAll("svg title")].some((title) =>
            title.textContent?.includes("AZKi"),
          ),
        ).toBe(true);
      }
    },
  );
});

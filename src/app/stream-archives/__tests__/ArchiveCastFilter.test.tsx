import { MantineProvider } from "@mantine/core";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ArchiveCastFilter from "../ArchiveCastFilter";

const castOptions = [
  { name: "AZKi", channel: null },
  { name: "さくらみこ", channel: null },
  { name: "ロボ子さん", channel: null },
  { name: "星街すいせい", channel: null },
];

const renderCastFilter = ({
  value = [],
  onChange = vi.fn(),
}: {
  value?: string[];
  onChange?: (value: string[]) => void;
} = {}) =>
  render(
    <MantineProvider>
      <ArchiveCastFilter
        options={castOptions}
        value={value}
        placeholder="出演者"
        nothingFoundMessage="該当する出演者はいません"
        selectedCountLabel={`${value.length}人選択中`}
        onChange={onChange}
      />
    </MantineProvider>,
  );

describe("ArchiveCastFilter", () => {
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

  it("renders an avatar only for cast members with channel data", () => {
    render(
      <MantineProvider>
        <ArchiveCastFilter
          options={[
            {
              name: "AZKi",
              channel: {
                branch: "JP",
                generation: "0期生",
                talentName: "AZKi",
                artistName: "AZKi",
                youtubeId: "UC-azki",
                channelName: "AZKi Channel",
                handle: "@azki",
                subscriberCount: 0,
                iconUrl: "https://example.com/azki.png",
              },
            },
            { name: "ゲスト", channel: null },
          ]}
          value={[]}
          placeholder="出演者"
          nothingFoundMessage="該当する出演者はいません"
          selectedCountLabel="0人選択中"
          onChange={vi.fn()}
        />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "出演者" }));

    const knownOption = screen.getByRole("option", { name: "AZKi" });
    const unknownOption = screen.getByRole("option", { name: "ゲスト" });
    expect(knownOption.querySelector("img")).toBeVisible();
    expect(unknownOption.querySelector("img")).not.toBeInTheDocument();
  });

  it("keeps up to two selected cast members as removable pills", () => {
    renderCastFilter({ value: ["AZKi", "さくらみこ"] });

    const pillsList = screen.getByRole("combobox", {
      name: "出演者",
    }).parentElement!;
    const selectedValues = within(pillsList);

    expect(selectedValues.getByText("AZKi")).toBeVisible();
    expect(selectedValues.getByText("さくらみこ")).toBeVisible();
    expect(selectedValues.queryByText("2人選択中")).not.toBeInTheDocument();
    expect(pillsList.querySelectorAll("button")).toHaveLength(2);
  });

  it("collapses three or more selected cast members into a summary pill", async () => {
    const onChange = vi.fn();
    const selectedNames = ["AZKi", "さくらみこ", "ロボ子さん"];
    const { container } = renderCastFilter({ value: selectedNames, onChange });

    const pillsList = screen.getByRole("combobox", {
      name: "出演者",
    }).parentElement!;
    const selectedValues = within(pillsList);
    const summary = selectedValues.getByText("3人選択中");
    expect(summary).toBeVisible();
    expect(selectedValues.queryByText("AZKi")).not.toBeInTheDocument();
    expect(selectedValues.queryByText("さくらみこ")).not.toBeInTheDocument();
    expect(selectedValues.queryByText("ロボ子さん")).not.toBeInTheDocument();

    const summaryPill = summary.closest<HTMLElement>("[tabindex='0']");
    expect(summaryPill).not.toBeNull();

    const combobox = screen.getByRole("combobox", { name: "出演者" });
    fireEvent.click(combobox);
    selectedNames.forEach((name) => {
      expect(screen.getByRole("option", { name })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    fireEvent.click(screen.getByRole("option", { name: "AZKi" }));
    expect(onChange).toHaveBeenCalledWith(["さくらみこ", "ロボ子さん"]);

    const clearButton = container.querySelector<HTMLButtonElement>(
      "button[aria-hidden='true']",
    );
    expect(clearButton).not.toBeNull();
    fireEvent.click(clearButton!);
    expect(onChange).toHaveBeenCalledWith([]);

    fireEvent.change(combobox, {
      target: { value: "星街" },
    });
    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "星街すいせい" }),
      ).toBeVisible();
    });

    fireEvent.focus(summaryPill!);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("AZKi, さくらみこ, ロボ子さん");
  });
});

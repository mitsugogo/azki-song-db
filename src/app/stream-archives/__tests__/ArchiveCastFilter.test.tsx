import { MantineProvider } from "@mantine/core";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
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

  it("uses the official hololive headings in the cast combobox", () => {
    const createChannel = (branch: string, generation: string) => ({
      branch,
      generation,
      talentName: "テストメンバー",
      artistName: "テストメンバー",
      youtubeId: "UC-test",
      channelName: "Test Channel",
      handle: "@test",
      subscriberCount: 0,
      iconUrl: "",
    });

    render(
      <MantineProvider>
        <ArchiveCastFilter
          options={[
            {
              name: "ラプラス・ダークネス",
              channel: createChannel("DEV_IS", "holoX"),
            },
            {
              name: "ホロロメンバー",
              channel: createChannel("ID", "2期生"),
            },
            {
              name: "Promiseメンバー",
              channel: createChannel("hololive", "Promise"),
            },
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

    expect(screen.getByText("秘密結社holoX")).toBeVisible();
    expect(screen.getByText("holoro")).toBeVisible();
    expect(screen.getByText("Promise")).toBeVisible();
  });

  it("shows duplicate memberships in every group while selecting one cast value", () => {
    const createChannel = (branch: string, generation: string) => ({
      branch,
      generation,
      talentName: "テストメンバー",
      artistName: "テストメンバー",
      youtubeId: "UC-test",
      channelName: "Test Channel",
      handle: "@test",
      subscriberCount: 0,
      iconUrl: "",
    });
    const onChange = vi.fn();

    function ControlledArchiveCastFilter() {
      const [value, setValue] = useState<string[]>([]);

      return (
        <ArchiveCastFilter
          options={[
            {
              name: "白上フブキ",
              channel: createChannel("JP", "1期生、ゲーマーズ"),
            },
            {
              name: "オーロ・クロニー",
              channel: createChannel("hololive", "Council、Promise"),
            },
          ]}
          value={value}
          placeholder="出演者"
          nothingFoundMessage="該当する出演者はいません"
          selectedCountLabel={`${value.length}人選択中`}
          onChange={(nextValue) => {
            onChange(nextValue);
            setValue(nextValue);
          }}
        />
      );
    }

    render(
      <MantineProvider>
        <ControlledArchiveCastFilter />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "出演者" }));

    expect(screen.getByText("1期生")).toBeVisible();
    expect(screen.getByText("ホロライブゲーマーズ")).toBeVisible();
    expect(screen.getByText("Council")).toBeVisible();
    expect(screen.getByText("Promise")).toBeVisible();

    const fubukiOptions = screen.getAllByRole("option", {
      name: "白上フブキ",
    });
    const kroniiOptions = screen.getAllByRole("option", {
      name: "オーロ・クロニー",
    });
    expect(fubukiOptions).toHaveLength(2);
    expect(kroniiOptions).toHaveLength(2);

    fireEvent.click(fubukiOptions[1]);

    expect(onChange).toHaveBeenCalledWith(["白上フブキ"]);
    screen
      .getAllByRole("option", { name: "白上フブキ" })
      .forEach((option) =>
        expect(option).toHaveAttribute("aria-selected", "true"),
      );
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

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

const formatCountLabel = (count: number) => `${count}件`;

const castOptions = [
  { name: "AZKi", channel: null, count: 3 },
  { name: "さくらみこ", channel: null, count: 2 },
  { name: "ロボ子さん", channel: null, count: 1 },
  { name: "星街すいせい", channel: null, count: 1 },
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
        formatCountLabel={formatCountLabel}
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
              count: 2,
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
            { name: "ゲスト", channel: null, count: 1 },
          ]}
          value={[]}
          placeholder="出演者"
          nothingFoundMessage="該当する出演者はいません"
          selectedCountLabel="0人選択中"
          formatCountLabel={formatCountLabel}
          onChange={vi.fn()}
        />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "出演者" }));

    const knownOption = screen.getByRole("option", { name: "AZKi - 2件" });
    const unknownOption = screen.getByRole("option", { name: "ゲスト - 1件" });
    expect(knownOption.querySelector("img")).toBeVisible();
    expect(unknownOption.querySelector("img")).not.toBeInTheDocument();
    expect(within(knownOption).getByText("- 2件")).toHaveStyle({
      color: "var(--mantine-color-dimmed)",
    });
  });

  it("formats cast counts with the supplied locale label", () => {
    render(
      <MantineProvider>
        <ArchiveCastFilter
          options={[{ name: "AZKi", channel: null, count: 2 }]}
          value={[]}
          placeholder="Cast members"
          nothingFoundMessage="No matching cast members"
          selectedCountLabel="0 cast members selected"
          formatCountLabel={(count) => `${count} items`}
          onChange={vi.fn()}
        />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Cast members" }));

    const option = screen.getByRole("option", { name: "AZKi - 2 items" });
    expect(within(option).getByText("- 2 items")).toHaveStyle({
      color: "var(--mantine-color-dimmed)",
    });
  });

  it("disables cast members without matching videos", () => {
    const onChange = vi.fn();

    render(
      <MantineProvider>
        <ArchiveCastFilter
          options={[{ name: "火威青", channel: null, count: 0 }]}
          value={[]}
          placeholder="出演者"
          nothingFoundMessage="該当する出演者はいません"
          selectedCountLabel="0人選択中"
          formatCountLabel={formatCountLabel}
          onChange={onChange}
        />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "出演者" }));

    const option = screen.getByRole("option", { name: "火威青 - 0件" });
    expect(option).toHaveAttribute("data-combobox-disabled");
    expect(option).toHaveAttribute("aria-disabled", "true");

    fireEvent.click(option);
    expect(onChange).not.toHaveBeenCalled();
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
              count: 1,
              channel: createChannel("DEV_IS", "holoX"),
            },
            {
              name: "ReGLOSSメンバー",
              count: 1,
              channel: createChannel("hololive", "ReGLOSS"),
            },
            {
              name: "FLOW GLOWメンバー",
              count: 1,
              channel: createChannel("hololive", "FLOW GLOW"),
            },
            {
              name: "アソビメンバー",
              count: 1,
              channel: createChannel("hololive", "アソビ★まわり隊！"),
            },
            {
              name: "Mythメンバー",
              count: 1,
              channel: createChannel("EN", "1期生"),
            },
            {
              name: "ホロロメンバー",
              count: 1,
              channel: createChannel("ID", "2期生"),
            },
          ]}
          value={[]}
          placeholder="出演者"
          nothingFoundMessage="該当する出演者はいません"
          selectedCountLabel="0人選択中"
          formatCountLabel={formatCountLabel}
          onChange={vi.fn()}
        />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "出演者" }));

    const headings = [
      "秘密結社holoX",
      "ReGLOSS",
      "FLOW GLOW",
      "アソビ★まわり隊！",
      "Myth",
      "holoro",
    ].map((label) => screen.getByText(label));

    headings.forEach((heading) => expect(heading).toBeVisible());
    headings.slice(0, -1).forEach((heading, index) => {
      expect(
        heading.compareDocumentPosition(headings[index + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
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
              count: 1,
              channel: createChannel("JP", "1期生、ゲーマーズ"),
            },
            {
              name: "オーロ・クロニー",
              count: 1,
              channel: createChannel("hololive", "Council、Promise"),
            },
          ]}
          value={value}
          placeholder="出演者"
          nothingFoundMessage="該当する出演者はいません"
          selectedCountLabel={`${value.length}人選択中`}
          formatCountLabel={formatCountLabel}
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
    expect(screen.getByText("ゲーマーズ")).toBeVisible();
    expect(screen.getByText("Council")).toBeVisible();
    expect(screen.getByText("Promise")).toBeVisible();

    const fubukiOptions = screen.getAllByRole("option", {
      name: "白上フブキ - 1件",
    });
    const kroniiOptions = screen.getAllByRole("option", {
      name: "オーロ・クロニー - 1件",
    });
    expect(fubukiOptions).toHaveLength(2);
    expect(kroniiOptions).toHaveLength(2);

    fireEvent.click(fubukiOptions[1]);

    expect(onChange).toHaveBeenCalledWith(["白上フブキ"]);
    screen
      .getAllByRole("option", { name: "白上フブキ - 1件" })
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

    expect(selectedValues.getByText("AZKi - 3件")).toBeVisible();
    expect(selectedValues.getByText("さくらみこ - 2件")).toBeVisible();
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
      const count = castOptions.find((option) => option.name === name)?.count;
      expect(
        screen.getByRole("option", { name: `${name} - ${count}件` }),
      ).toHaveAttribute("aria-selected", "true");
    });

    fireEvent.click(screen.getByRole("option", { name: "AZKi - 3件" }));
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
        screen.getByRole("option", { name: "星街すいせい - 1件" }),
      ).toBeVisible();
    });

    fireEvent.focus(summaryPill!);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(
      "AZKi - 3件, さくらみこ - 2件, ロボ子さん - 1件",
    );
  });
});

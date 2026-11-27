import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  SeichiMapVisitFilterMenu,
  type SeichiMapBadgeFilterControls,
} from "../SeichiMapVisitFilterMenu";
import type { SeichiMapVisitFilter } from "../visitFilter";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;
});

const options = [
  { value: "all", label: "すべて" },
  { value: "unvisited", label: "未訪問 1378" },
  { value: "visited", label: "訪問済 255" },
] satisfies { value: SeichiMapVisitFilter; label: string }[];

const renderMenu = (
  value: SeichiMapVisitFilter = "all",
  badge?: SeichiMapBadgeFilterControls,
) => {
  const onChange = vi.fn();
  render(
    <MantineProvider>
      <SeichiMapVisitFilterMenu
        value={value}
        onChange={onChange}
        options={options}
        label="表示する地点"
        badge={badge}
      />
    </MantineProvider>,
  );
  return onChange;
};

describe("SeichiMapVisitFilterMenu", () => {
  it("開くと3つの選択肢を出し、選んだものを呼び出し元へ伝える", async () => {
    const onChange = renderMenu();

    fireEvent.click(screen.getByRole("button", { name: "表示する地点" }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "未訪問 1378" }),
    );

    expect(onChange).toHaveBeenCalledWith("unvisited");
    expect(screen.getByRole("button", { name: "表示する地点" })).toBeVisible();
  });

  it("選択肢には現在の絞り込みが分かる印を付ける", async () => {
    renderMenu("visited");

    fireEvent.click(screen.getByRole("button", { name: "表示する地点" }));
    const items = await screen.findAllByRole("menuitem");

    expect(items).toHaveLength(3);
    expect(items.map((item) => item.textContent)).toEqual([
      "すべて",
      "未訪問 1378",
      "訪問済 255",
    ]);
    // 現在の項目だけ右側にチェックのアイコンを持つ
    expect(items[2].querySelector("svg")).not.toBeNull();
    expect(items[0].querySelector("svg")).toBeNull();
  });

  it("バッジで絞り込む項目を出し、押すとバッジ選択を開く", async () => {
    const onPick = vi.fn();
    renderMenu("all", {
      active: false,
      pickLabel: "バッジの対象地点で絞り込む…",
      clearLabel: "バッジの絞り込みを解除",
      onPick,
      onClear: vi.fn(),
    });

    fireEvent.click(screen.getByRole("button", { name: "表示する地点" }));
    fireEvent.click(
      await screen.findByRole("menuitem", {
        name: "バッジの対象地点で絞り込む…",
      }),
    );

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("menuitem", { name: "バッジの絞り込みを解除" }),
    ).not.toBeInTheDocument();
  });

  it("バッジで絞り込み中は解除の項目を出す", async () => {
    const onClear = vi.fn();
    renderMenu("all", {
      active: true,
      pickLabel: "バッジの対象地点で絞り込む…",
      clearLabel: "バッジの絞り込みを解除",
      onClear,
    });

    fireEvent.click(screen.getByRole("button", { name: "表示する地点" }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "バッジの絞り込みを解除" }),
    );

    expect(onClear).toHaveBeenCalledTimes(1);
    // バッジの情報がまだ無い（onPick なし）ときは選ぶ項目を隠す
    expect(
      screen.queryByRole("menuitem", { name: "バッジの対象地点で絞り込む…" }),
    ).not.toBeInTheDocument();
  });
});

import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  SeichiMapLayerDialog,
  type SeichiMapLayerOption,
} from "../SeichiMapLayerDialog";

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

const layers: SeichiMapLayerOption[] = [
  { name: "ホロメンマップ", visible: true, progressLabel: "3 / 243 (1%)" },
  { name: "鉄道・青看板・道路", visible: false, progressLabel: "0 / 388 (0%)" },
];

const renderDialog = (opened = true) => {
  const handlers = {
    onClose: vi.fn(),
    onToggle: vi.fn(),
    onShowAll: vi.fn(),
    onHideAll: vi.fn(),
  };
  render(
    <MantineProvider>
      <SeichiMapLayerDialog opened={opened} layers={layers} {...handlers} />
    </MantineProvider>,
  );
  return handlers;
};

describe("SeichiMapLayerDialog", () => {
  it("レイヤーごとの表示状態と進捗を並べる", () => {
    renderDialog();

    expect(
      screen.getByRole("checkbox", { name: /ホロメンマップ/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /鉄道・青看板・道路/ }),
    ).not.toBeChecked();
    expect(screen.getByText("3 / 243 (1%)")).toBeInTheDocument();
  });

  it("チェックの切り替えと「すべてON/OFF」を呼び出し元へ伝える", () => {
    const { onToggle, onShowAll, onHideAll } = renderDialog();

    fireEvent.click(screen.getByRole("checkbox", { name: /ホロメンマップ/ }));
    expect(onToggle).toHaveBeenCalledWith("ホロメンマップ");

    fireEvent.click(screen.getByRole("button", { name: "layers.showAll" }));
    fireEvent.click(screen.getByRole("button", { name: "layers.hideAll" }));
    expect(onShowAll).toHaveBeenCalledTimes(1);
    expect(onHideAll).toHaveBeenCalledTimes(1);
  });

  it("閉じているときは何も出さない", () => {
    renderDialog(false);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});

import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SeichiMapBottomSheetHandle } from "../SeichiMapBottomSheetHandle";
import type { SeichiMapSheetSnap } from "../sheetSnap";

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

const renderHandle = (snap: SeichiMapSheetSnap) => {
  const onSnapChange = vi.fn();
  render(
    <MantineProvider>
      <SeichiMapBottomSheetHandle
        snap={snap}
        onSnapChange={onSnapChange}
        label="シートを開閉"
      />
    </MantineProvider>,
  );
  return {
    onSnapChange,
    button: screen.getByRole("button", { name: "シートを開閉" }),
  };
};

describe("SeichiMapBottomSheetHandle", () => {
  it("peek のときは閉じている状態として伝える", () => {
    const { button } = renderHandle("peek");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("half / full のときは開いている状態として伝える", () => {
    expect(renderHandle("half").button).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("タップで次の段階へ進める", () => {
    const { button, onSnapChange } = renderHandle("peek");
    fireEvent.click(button);
    expect(onSnapChange).toHaveBeenCalledWith("half");
  });

  it("上にドラッグすると1段階開き、続くクリックでは重ねて動かさない", () => {
    const { button, onSnapChange } = renderHandle("peek");

    fireEvent.pointerDown(button, { clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(button, { clientY: 240, pointerId: 1 });
    fireEvent.pointerUp(button, { clientY: 220, pointerId: 1 });
    fireEvent.click(button);

    expect(onSnapChange).toHaveBeenCalledTimes(1);
    expect(onSnapChange).toHaveBeenCalledWith("half");
  });

  it("下にドラッグすると1段階閉じる", () => {
    const { button, onSnapChange } = renderHandle("full");

    fireEvent.pointerDown(button, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(button, { clientY: 160, pointerId: 1 });
    fireEvent.pointerUp(button, { clientY: 180, pointerId: 1 });

    expect(onSnapChange).toHaveBeenCalledWith("half");
  });
});

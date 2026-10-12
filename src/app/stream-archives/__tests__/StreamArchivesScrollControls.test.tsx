import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StreamArchivesScrollControls from "../StreamArchivesScrollControls";

describe("StreamArchivesScrollControls", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("初期表示ではスクロール位置を変更しない", () => {
    render(<StreamArchivesScrollControls />);
    expect(
      screen.getByRole("button", { name: "ページ上部へ戻る" }),
    ).toBeInTheDocument();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("本文のMantineスクロールを監視し、上部へ戻る操作も本文に適用する", () => {
    const { container } = render(
      <div data-scrollarea-viewport="" style={{ overflowY: "auto" }}>
        <StreamArchivesScrollControls />
      </div>,
    );
    const viewport = container.firstElementChild as HTMLDivElement;
    viewport.scrollTo = vi.fn();
    const button = screen.getByRole("button", { name: "ページ上部へ戻る" });

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 600,
    });
    fireEvent.scroll(window);
    expect(button).toHaveClass("opacity-0", "pointer-events-none");

    viewport.scrollTop = 500;
    fireEvent.scroll(viewport);
    expect(button).toHaveClass("opacity-100", "pointer-events-auto");
    fireEvent.click(button);
    expect(viewport.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "auto",
    });
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

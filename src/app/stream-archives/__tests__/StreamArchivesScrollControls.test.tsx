import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StreamArchivesScrollControls from "../StreamArchivesScrollControls";

const pathnameMock = vi.hoisted(() => vi.fn());
let scheduledFrame: FrameRequestCallback | null = null;

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

describe("StreamArchivesScrollControls", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
    pathnameMock.mockReturnValue("/stream-archives");
    Object.defineProperty(window, "scrollTo", {
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      writable: true,
      value: vi.fn((callback: FrameRequestCallback) => {
        scheduledFrame = callback;
        return 1;
      }),
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      writable: true,
      value: vi.fn(),
    });
    scheduledFrame = null;
  });

  it("shows the back-to-top button without scrolling on the initial page", () => {
    render(<StreamArchivesScrollControls />);

    expect(
      screen.getByRole("button", { name: "ページ上部へ戻る" }),
    ).toBeInTheDocument();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls to the page top after moving between statistics and the archive list", () => {
    const { rerender } = render(<StreamArchivesScrollControls />);

    pathnameMock.mockReturnValue("/stream-archives/list");
    rerender(<StreamArchivesScrollControls />);

    expect(window.scrollTo).not.toHaveBeenCalled();
    act(() => scheduledFrame?.(0));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    pathnameMock.mockReturnValue("/stream-archives");
    rerender(<StreamArchivesScrollControls />);

    act(() => scheduledFrame?.(16));

    expect(window.scrollTo).toHaveBeenCalledTimes(2);
    expect(window.scrollTo).toHaveBeenLastCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  });

  it("keeps monitoring window scroll on the archive pages", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 500,
    });

    render(
      <div style={{ overflowY: "auto" }}>
        <StreamArchivesScrollControls />
      </div>,
    );

    act(() => window.dispatchEvent(new Event("scroll")));

    expect(
      screen.getByRole("button", { name: "ページ上部へ戻る" }),
    ).toHaveClass("opacity-100", "pointer-events-auto");
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollToTopButton } from "../ScrollToTopButton";

describe("ScrollToTopButton", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(window, "scrollTo", {
      writable: true,
      value: vi.fn(),
    });
  });

  it("can explicitly monitor window instead of a scrollable ancestor", () => {
    render(
      <div style={{ overflowY: "auto" }}>
        <ScrollToTopButton scrollTarget="window" behavior="auto" />
      </div>,
    );

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 500,
    });
    act(() => window.dispatchEvent(new Event("scroll")));

    const button = screen.getByRole("button", { name: "ページ上部へ戻る" });
    expect(button).toHaveClass("opacity-100", "pointer-events-auto");

    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "auto",
    });
  });
});

import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import TimestampComment from "../TimestampComment";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

describe("TimestampComment", () => {
  it("collapses long comments and toggles them open", () => {
    const comment = Array.from({ length: 6 }, (_, index) => {
      const lineNumber = index + 1;
      return `00:0${lineNumber} line ${lineNumber}`;
    }).join("\n");

    render(
      <MantineProvider>
        <TimestampComment comment={comment} videoId="test-video-id" />
      </MantineProvider>,
    );

    expect(screen.getByText(/line 1/)).toBeTruthy();
    expect(screen.queryByText(/line 6/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "もっと見る" }));

    expect(screen.getByText(/line 6/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));

    expect(screen.queryByText(/line 6/)).toBeNull();
  });
});

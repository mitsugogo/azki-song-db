import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderTimestampComment } from "../renderTimestampComment";

describe("renderTimestampComment", () => {
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

  it("renders each line with a line break and links the timestamps to the video", () => {
    const { container } = render(
      <div>
        {renderTimestampComment(
          "00:01 first line\n00:02 second line",
          "test-video-id",
        )}
      </div>,
    );

    expect(container.querySelectorAll("br")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "00:01" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=test-video-id&t=1",
    );
    expect(screen.getByRole("link", { name: "00:02" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=test-video-id&t=2",
    );
    expect(container.textContent).toContain("first line");
    expect(container.textContent).toContain("second line");
  });

  it("highlights search text without breaking timestamp links", () => {
    const { container } = render(
      <MantineProvider>
        <div>
          {renderTimestampComment(
            "00:01 first line\n00:02 second line",
            "test-video-id",
            "second",
          )}
        </div>
      </MantineProvider>,
    );

    expect(screen.getByRole("link", { name: "00:02" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=test-video-id&t=2",
    );
    expect(container.querySelector("mark")?.textContent).toBe("second");
  });

  it("highlights kana variants using the original comment text", () => {
    const { container } = render(
      <MantineProvider>
        <div>
          {renderTimestampComment(
            "00:01 今日はｻﾗﾐｨ回です",
            "test-video-id",
            "さらみぃ",
          )}
        </div>
      </MantineProvider>,
    );

    expect(container.querySelector("mark")?.textContent).toBe("ｻﾗﾐｨ");
  });
});

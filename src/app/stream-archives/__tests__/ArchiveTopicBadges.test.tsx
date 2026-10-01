import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ArchiveTopicBadges from "../ArchiveTopicBadges";

describe("ArchiveTopicBadges", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it("renders separate badges once per category", () => {
    render(
      <MantineProvider>
        <ArchiveTopicBadges topic="雑談、Minecraft, 雑談" />
      </MantineProvider>,
    );
    expect(screen.getAllByText("雑談")).toHaveLength(1);
    expect(screen.getByText("Minecraft")).toBeInTheDocument();
    expect(screen.queryByText("雑談、Minecraft, 雑談")).not.toBeInTheDocument();
  });

  it("displays a quoted game title in one badge without surrounding quotes", () => {
    render(
      <MantineProvider>
        <ArchiveTopicBadges topic={'"Papers, Please"、雑談'} />
      </MantineProvider>,
    );
    expect(screen.getByText("Papers, Please")).toBeInTheDocument();
    expect(screen.getByText("雑談")).toBeInTheDocument();
    expect(screen.queryByText('"Papers, Please"')).not.toBeInTheDocument();
    expect(screen.queryByText("Papers")).not.toBeInTheDocument();
    expect(screen.queryByText("Please")).not.toBeInTheDocument();
  });
});

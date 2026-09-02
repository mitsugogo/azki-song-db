import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ArchiveParticipantList from "../ArchiveParticipantList";

describe("ArchiveParticipantList", () => {
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

  it("shows known channels as avatars and unknown participants as names", () => {
    render(
      <MantineProvider>
        <ArchiveParticipantList
          participants={[
            {
              name: "AZKi",
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
            { name: "ゲスト", channel: null },
          ]}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("img", { name: "AZKi" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AZKi Channel" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/channel/UC-azki",
    );
    expect(screen.getByText("ゲスト")).toBeInTheDocument();
  });
});

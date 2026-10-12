import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import ArchiveParticipantList from "../ArchiveParticipantList";

const { localeMock } = vi.hoisted(() => ({ localeMock: vi.fn(() => "ja") }));
vi.mock("next-intl", () => ({ useLocale: localeMock }));

describe("ArchiveParticipantList", () => {
  beforeEach(() => localeMock.mockReturnValue("ja"));
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

  it.each([
    ["ja", "フワワ・アビスガード"],
    ["en", "Fuwawa Abyssgard"],
  ])("displays official participant names in %s", (locale, fuwawaName) => {
    localeMock.mockReturnValue(locale);
    render(
      <MantineProvider>
        <ArchiveParticipantList
          participants={[
            { name: "アイリス", channel: null },
            { name: "フワワアビスガード", channel: null },
          ]}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("IRyS")).toBeInTheDocument();
    expect(screen.getByText(fuwawaName)).toBeInTheDocument();
    expect(screen.queryByText("アイリス")).not.toBeInTheDocument();
  });
});

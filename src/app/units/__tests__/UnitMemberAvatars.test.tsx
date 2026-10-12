import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChannelEntry } from "../../types/api/yt/channels";
import UnitMemberAvatars from "../components/UnitMemberAvatars";

const mocks = vi.hoisted(() => ({ channels: [] as ChannelEntry[] }));

vi.mock("@/app/hook/useChannels", () => ({
  default: () => ({ channels: mocks.channels, isLoading: false }),
}));

const iconUrl = "https://yt3.ggpht.com/iroha=s800-c-k-c0x00ffffff-no-rj";

const createChannel = (
  overrides: Partial<ChannelEntry> = {},
): ChannelEntry => ({
  branch: "JP",
  generation: "holoX",
  talentName: "風真いろは",
  artistName: "風真いろは",
  youtubeId: "UC-iroha",
  channelName: "Iroha ch.",
  handle: "@kazamairoha",
  subscriberCount: 0,
  iconUrl,
  ...overrides,
});

const view = (variant: "hero" | "card" = "card") => (
  <MantineProvider>
    <UnitMemberAvatars members={["風真いろは"]} variant={variant} />
  </MantineProvider>
);

describe("UnitMemberAvatars", () => {
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

  beforeEach(() => {
    mocks.channels = [createChannel()];
  });

  it("loads a smaller card icon and recovers through the alternate host", () => {
    render(view());
    const primary = screen.getByRole("img", { name: "風真いろは" });
    expect(primary).toHaveAttribute("src", iconUrl.replace("s800", "s160"));
    expect(primary).toHaveAttribute("referrerpolicy", "no-referrer");

    fireEvent.error(primary);

    const fallback = screen.getByRole("img", { name: "風真いろは" });
    expect(fallback).toHaveAttribute(
      "src",
      iconUrl
        .replace("yt3.ggpht.com", "yt3.googleusercontent.com")
        .replace("s800", "s160"),
    );
    fireEvent.load(fallback);
    expect(screen.queryByText("風")).not.toBeInTheDocument();
  });

  it("stops after both sources fail and keeps the channel link in the hero", () => {
    render(view("hero"));
    const primary = screen.getByRole("img", { name: "風真いろは" });
    expect(primary).toHaveAttribute("src", iconUrl.replace("s800", "s320"));
    fireEvent.error(primary);
    fireEvent.error(screen.getByRole("img", { name: "風真いろは" }));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("風")).toBeVisible();
    expect(screen.getByRole("link", { name: "Iroha ch." })).toHaveAttribute(
      "href",
      "https://www.youtube.com/channel/UC-iroha",
    );
  });

  it("starts again with a new icon URL after the old sources fail", () => {
    const { rerender } = render(view());
    fireEvent.error(screen.getByRole("img"));
    fireEvent.error(screen.getByRole("img"));
    mocks.channels = [
      createChannel({ iconUrl: iconUrl.replace("iroha=", "updated=") }),
    ];

    rerender(view());

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      iconUrl.replace("iroha=", "updated=").replace("s800", "s160"),
    );
  });

  it("can fall back from googleusercontent to ggpht", () => {
    mocks.channels = [
      createChannel({
        iconUrl: iconUrl.replace("yt3.ggpht.com", "yt3.googleusercontent.com"),
      }),
    ];
    render(view());
    fireEvent.error(screen.getByRole("img"));

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      iconUrl.replace("s800", "s160"),
    );
  });

  it("preserves non-YouTube image URLs and does not rewrite their hosts", () => {
    const customUrl = "https://example.com/iroha=s800.png";
    mocks.channels = [createChannel({ iconUrl: customUrl })];
    render(view());
    expect(screen.getByRole("img")).toHaveAttribute("src", customUrl);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("風")).toBeVisible();
  });

  it("keeps the initial when channel data is missing", () => {
    mocks.channels = [];
    render(view("hero"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("風")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

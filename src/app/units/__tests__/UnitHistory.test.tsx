import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { theme } from "../../theme";
import type { UnitHistoryEntry } from "../../lib/unitHistory";

vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve("ja"),
  getTranslations: () =>
    Promise.resolve(
      (key: string, values: Record<string, string | number> = {}) => {
        const labels: Record<string, string> = {
          historyTitle: "History",
          historyDescription: "結成からこれまでの主なできごと",
          "historyType.live": "ライブ",
          "historyType.other": "トピック",
          historyThumbnailAlt: `${values.title}のYouTubeサムネイル`,
          historyThumbnailLinkLabel: `${values.title}をYouTubeで見る`,
          watchOnYouTube: "YouTubeで見る",
        };
        return labels[key] ?? key;
      },
    ),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props} />
  ),
}));

vi.mock("@/app/components/YoutubeThumbnail", () => ({
  default: ({ videoId, alt }: { videoId: string; alt: string }) => (
    <img src={`thumbnail:${videoId}`} alt={alt} data-video-id={videoId} />
  ),
}));

import UnitHistory from "../components/UnitHistory";

const entries: UnitHistoryEntry[] = [
  {
    id: "video-entry",
    date: "2024-01-27",
    type: "live",
    title: "First Gravity",
    description: "SorAZのライブ",
    youtubeHref: "https://www.youtube.com/watch?v=video-id",
    videoId: "video-id",
  },
  {
    id: "url-only-entry",
    date: "2024-01-28",
    type: "live",
    title: "動画URLのみのできごと",
    youtubeHref: "https://www.youtube.com/watch?v=url-only",
  },
  {
    id: "text-entry",
    date: "2024-02-01",
    type: "other",
    title: "動画のないできごと",
  },
];

describe("UnitHistory", () => {
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

  it("links a right-side thumbnail to YouTube only when a video exists", async () => {
    render(
      <MantineProvider theme={theme}>
        {await UnitHistory({ entries })}
      </MantineProvider>,
    );

    const thumbnailLink = screen.getByRole("link", {
      name: "First GravityをYouTubeで見る",
    });
    expect(thumbnailLink).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=video-id",
    );
    expect(thumbnailLink).toHaveAttribute("target", "_blank");
    expect(thumbnailLink).toHaveClass("justify-self-end");
    expect(
      screen.getByAltText("First GravityのYouTubeサムネイル"),
    ).toHaveAttribute("data-video-id", "video-id");
    expect(screen.getByRole("link", { name: "YouTubeで見る" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=url-only",
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});

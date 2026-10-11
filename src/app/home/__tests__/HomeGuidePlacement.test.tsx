import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ja from "@/messages/ja.json";
import ClientTop from "../../client";

vi.mock("next-intl", async (importOriginal) => {
  const original = await importOriginal<typeof import("next-intl")>();
  return {
    ...original,
    useLocale: () => "ja",
    useTranslations: () =>
      original.createTranslator({
        locale: "ja",
        messages: ja,
        namespace: "AboutAzki",
      }),
  };
});
vi.mock("../../hook/useSongs", () => ({
  default: () => ({ allSongs: [], songsFetchedAt: null, isLoading: false }),
}));
vi.mock("../../hook/useChannels", () => ({
  default: () => ({ channels: [] }),
}));
vi.mock("../../hook/useAnniversaries", () => ({
  default: () => ({ items: [], isLoading: false }),
}));
vi.mock("../../hook/useEvents", () => ({
  default: () => ({ items: [], isLoading: false }),
}));
vi.mock("../../hook/useMilestones", () => ({
  default: () => ({ items: [], isLoading: false }),
}));
vi.mock("../HomeNavigationLayout", () => ({
  HomeNavigationLayout: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../HomeHeroSection", () => ({
  HomeHeroSection: () => <section aria-label="Hero" />,
}));
vi.mock("../HomeLatestVideoSection", () => ({
  HomeLatestVideoSection: () => <section aria-label="Latest video" />,
}));
vi.mock("../HomeActivityTimelineSection", () => ({
  HomeActivityTimelineSection: () => null,
}));
vi.mock("../HomeEventsSection", () => ({ HomeEventsSection: () => null }));
vi.mock("../HomeOngoingEventNotice", () => ({
  HomeOngoingEventNotice: () => null,
}));
vi.mock("../HomeLinksAndMeta", () => ({ HomeLinksAndMeta: () => null }));
vi.mock("../HomeRecommendedSongsSection", () => ({
  HomeRecommendedSongsSection: () => null,
}));
vi.mock("../RecentUpdatesSection", () => ({
  RecentUpdatesSection: () => null,
}));
vi.mock("../HomeTimelineSection", () => ({ HomeTimelineSection: () => null }));
vi.mock("../HomeViewMilestonesSection", () => ({
  HomeViewMilestonesSection: () => null,
}));
vi.mock("../../components/AnalyticsWrapper", () => ({
  AnalyticsWrapper: () => null,
}));
vi.mock("../../components/Footer", () => ({ default: () => null }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TOP guide placement", () => {
  it("ヒーローの直後、最新動画の前に紹介リンクを表示する", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => "{}" });
    vi.stubGlobal("fetch", fetchMock);
    render(<ClientTop />);
    const hero = screen.getByRole("region", { name: "Hero" });
    const guide = screen.getByRole("link", { name: /AZKiさんってどんな人/ });
    const latest = screen.getByRole("region", { name: "Latest video" });
    expect(hero.parentElement?.children[1]).toContainElement(guide);
    expect(
      guide.compareDocumentPosition(latest) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(guide).toHaveAttribute("href", "/about-azki");
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/build-info.json"),
    );
  });
});

export type SiteAnniversaryMilestoneId =
  | "launch"
  | "database"
  | "playlist"
  | "discovery"
  | "renewal"
  | "archives"
  | "community";

export type SiteAnniversaryFeature = {
  id: string;
  href: string;
};

export type SiteAnniversaryMilestone = {
  id: SiteAnniversaryMilestoneId;
  date: string;
  version: string;
  features: SiteAnniversaryFeature[];
};

export const SITE_ANNIVERSARY_MILESTONES = [
  {
    id: "launch",
    date: "2025-08-07",
    version: "v0.1",
    features: [
      { id: "player", href: "/watch" },
      { id: "search", href: "/search" },
      { id: "statistics", href: "/statistics" },
    ],
  },
  {
    id: "database",
    date: "2025-09-01",
    version: "v1.4",
    features: [
      { id: "discography", href: "/discography" },
      { id: "allData", href: "/data" },
      { id: "viewCounts", href: "/statistics" },
    ],
  },
  {
    id: "playlist",
    date: "2025-09-23",
    version: "v1.16",
    features: [
      { id: "playlists", href: "/playlist" },
      { id: "favorites", href: "/watch" },
      { id: "pwa", href: "/" },
    ],
  },
  {
    id: "discovery",
    date: "2026-01-12",
    version: "v1.23",
    features: [
      { id: "activity", href: "/activity" },
      { id: "searchPage", href: "/search" },
      { id: "songDetails", href: "/discography" },
    ],
  },
  {
    id: "renewal",
    date: "2026-03-22",
    version: "v2.0",
    features: [
      { id: "renewal", href: "/" },
      { id: "bestNine", href: "/share/my-best-9-songs" },
      { id: "fanTimeline", href: "/share/where-my-azkichi-began" },
      { id: "anniversaries", href: "/anniversaries" },
    ],
  },
  {
    id: "archives",
    date: "2026-07-04",
    version: "v2.10",
    features: [
      { id: "streamArchives", href: "/stream-archives" },
      { id: "monthlyActivity", href: "/activity" },
      { id: "archivePlayback", href: "/stream-archives" },
    ],
  },
  {
    id: "community",
    date: "2026-07-12",
    version: "v2.15",
    features: [
      { id: "seichiMap", href: "/seichi-map" },
      { id: "signIn", href: "/seichi-map" },
      { id: "songTags", href: "/search" },
      { id: "fuzzySearch", href: "/search" },
    ],
  },
] as const satisfies readonly SiteAnniversaryMilestone[];

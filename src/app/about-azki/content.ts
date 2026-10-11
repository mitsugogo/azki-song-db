/** Editorial content: verify the linked primary sources before changing facts. */
export const guideUpdatedAt = "2026-10-11";

export const guideSources = {
  profile: "https://hololive.hololivepro.com/talents/azki/",
  debut: "https://www.jvcmusic.co.jp/-/Profile/A028340.html",
  departure: "https://hololive.hololivepro.com/events/departure/",
  greeting: "https://hololive-official-cardgame.com/news/post/56/",
  greetingAudition: "https://www.youtube.com/watch?v=OIOi62xFZzY&t=1314s",
  greetingOrigin: "https://www.youtube.com/watch?v=dbg1DbAym2o&t=181s",
  greetingMinecraft: "https://www.youtube.com/watch?v=eJZGRZsoPyU&t=67s",
  farewell: "https://pl.sega-mj.com/official_view/page?news_id=8741",
  channel: "https://www.youtube.com/@AZKi",
  stream: "https://www.youtube.com/watch?v=KPY2ervRp-0",
  geoguessr: "https://www.geoguessr.com/",
  geoStream: "https://www.youtube.com/watch?v=xbPSLesx93o",
  geoFirst: "https://www.youtube.com/watch?v=VpSHOsTeVNo",
  geoRta: "https://www.youtube.com/watch?v=4iyKOmwzCP8",
  geoVerified: "https://www.youtube.com/watch?v=Nr7zUSuDzq8&t=159s",
  geoInterview: "https://www.jvcmusic.co.jp/AZKi/37708/#interview",
  soraz: "https://www.jvcmusic.co.jp/-/Profile/A028395.html",
  nickname: "https://shop.hololivepro.com/products/azki_bd2024",
  pioneersOrigin: "https://x.com/AZKi_VDiVA/status/1063061721579839488",
  pioneersDrawing: "https://www.youtube.com/watch?v=RwU3iquAJQQ",
  pioneersVisual: "https://x.com/AZKi_VDiVA/status/1657760488783233024",
  externalLive: "https://hololive.hololivepro.com/events/3rd-live/",
  externalDuo: "https://hololive.hololivepro.com/events/last-v-standing-vol-2/",
  nonstopMusic: "https://prtimes.jp/main/html/rd/p/000000233.000030268.html",
  crossroads:
    "https://hololive.hololivepro.com/events/stand-at-the-crossroads/",
  azLocation: "https://www.youtube.com/watch?v=yFhdmAv3M0o",
  hololiveTransfer: "https://hololive.hololivepro.com/news/20211229-1-61/",
} as const;

export type GuideSourceId = keyof typeof guideSources;

type SourcedEntry = {
  id: string;
  key: string;
  sources: readonly GuideSourceId[];
  checkedAt: string;
};

export const guideSections = [
  {
    id: "introduction",
    key: "introduction",
    sources: ["profile"],
    checkedAt: guideUpdatedAt,
  },
  {
    id: "profile",
    key: "profile",
    sources: ["profile", "debut"],
    checkedAt: guideUpdatedAt,
  },
  {
    id: "enjoy",
    key: "enjoy",
    sources: [
      "profile",
      "departure",
      "geoFirst",
      "geoRta",
      "geoVerified",
      "geoInterview",
      "externalLive",
      "externalDuo",
      "nonstopMusic",
      "crossroads",
    ],
    checkedAt: guideUpdatedAt,
  },
  {
    id: "columns",
    key: "columns",
    sources: [
      "greetingAudition",
      "greetingOrigin",
      "greetingMinecraft",
      "departure",
      "profile",
    ],
    checkedAt: guideUpdatedAt,
  },
  {
    id: "glossary",
    key: "glossary",
    sources: ["profile", "stream", "departure"],
    checkedAt: guideUpdatedAt,
  },
  {
    id: "explore",
    key: "explore",
    sources: ["profile"],
    checkedAt: guideUpdatedAt,
  },
] as const satisfies readonly SourcedEntry[];

export const guideColumns = [
  {
    id: "column-microphone-map",
    key: "microphoneMap",
    sources: ["greetingAudition", "greetingOrigin", "greetingMinecraft"],
    checkedAt: guideUpdatedAt,
  },
  {
    id: "column-pioneers",
    key: "pioneers",
    sources: ["profile", "pioneersOrigin", "pioneersDrawing", "pioneersVisual"],
    checkedAt: guideUpdatedAt,
  },
  {
    id: "column-routes",
    key: "routes",
    sources: ["departure", "debut", "hololiveTransfer"],
    checkedAt: guideUpdatedAt,
  },
] as const satisfies readonly SourcedEntry[];

export const glossaryGroups = [
  {
    key: "community",
    entries: [
      {
        id: "term-pioneers",
        key: "pioneers",
        sources: ["profile", "pioneersOrigin"],
      },
      { id: "term-azukichi", key: "azukichi", sources: ["nickname", "stream"] },
      {
        id: "term-konazuki",
        key: "konazuki",
        sources: ["profile", "farewell", "greeting"],
      },
      {
        id: "term-fan-mark",
        key: "fanMark",
        sources: ["stream", "pioneersDrawing"],
      },
      { id: "term-azukinchi", key: "azukinchi", sources: ["profile"] },
      {
        id: "term-az-location",
        key: "azLocation",
        sources: ["azLocation"],
      },
      {
        id: "term-dokoaz",
        key: "dokoaz",
        sources: ["profile", "azLocation"],
      },
    ],
  },
  {
    key: "maps",
    entries: [
      {
        id: "term-geoguessr",
        key: "geoguessr",
        sources: ["geoguessr", "geoStream"],
      },
      {
        id: "term-zero-guesser",
        key: "zeroGuesser",
        sources: ["geoStream", "greetingMinecraft", "greeting"],
      },
    ],
  },
  {
    key: "history",
    entries: [
      {
        id: "term-route-alpha",
        key: "routeAlpha",
        sources: ["departure", "debut"],
      },
      {
        id: "term-route-beta",
        key: "routeBeta",
        sources: ["departure", "debut"],
      },
      {
        id: "term-route-gamma",
        key: "routeGamma",
        sources: ["departure", "debut"],
      },
    ],
  },
] as const satisfies readonly {
  key: string;
  entries: readonly Omit<SourcedEntry, "checkedAt">[];
}[];

export type GuideVideo = {
  key: string;
  videoId: string;
  startSeconds?: number;
};

/** Profile fields written in AZKi's May 14, 2023 mascot illustration on X. */
export const guidePioneerProfileRows = [
  "name",
  "reading",
  "kind",
  "classification",
  "creator",
] as const;

/** Place each group immediately after the related music or map paragraph. */
export const guideVideoGroups = [
  {
    paragraph: 1,
    videos: [
      { key: "creatingWorld", videoId: "ZkvtKUQp3nM" },
      { key: "inochi", videoId: "hQ3rYiaUsUY" },
    ],
  },
  {
    paragraph: 5,
    videos: [
      { key: "geoFirst", videoId: "VpSHOsTeVNo" },
      { key: "geoRta", videoId: "4iyKOmwzCP8" },
      { key: "geoVerified", videoId: "Nr7zUSuDzq8", startSeconds: 159 },
    ],
  },
  {
    paragraph: 6,
    videos: [{ key: "freeGeo", videoId: "ydcT5Dvs888" }],
  },
] as const satisfies readonly {
  paragraph: number;
  videos: readonly GuideVideo[];
}[];

export const guideExploreLinks = [
  { key: "history", href: "/activity" },
  { key: "discography", href: "/discography" },
  { key: "archives", href: "/stream-archives" },
  { key: "units", href: "/units" },
  { key: "map", href: "/seichi-map" },
] as const;

export const guideSourceSection = { id: "sources", key: "sources" } as const;

export const guideSourceIds = [
  ...new Set<GuideSourceId>(
    [
      ...guideSections,
      ...guideColumns,
      ...glossaryGroups.flatMap((group) => [...group.entries]),
    ].flatMap<GuideSourceId>((entry) => entry.sources),
  ),
];

export type UnitHighlightType =
  | "formation"
  | "anniversary"
  | "music"
  | "stream"
  | "live"
  | "achievement"
  | "other";

export type LocalizedText = {
  ja: string;
  en: string;
};

export type UnitHighlight = {
  date: string;
  type: UnitHighlightType;
  title: LocalizedText;
  description?: LocalizedText;
  videoId?: string;
  songId?: string;
  url?: string;
};

export type UnitDefinition = {
  slug: string;
  name: LocalizedText;
  cardBackgroundVideoId: string;
  cardBackgroundZoom?: boolean;
  members: Array<{
    name: LocalizedText;
    aliases: string[];
  }>;
  formedAt: string;
  anniversary: {
    month: number;
    day: number;
  };
  tags: string[];
  highlights: UnitHighlight[];
};

export const units: UnitDefinition[] = [
  {
    slug: "aziro",
    name: { ja: "あずいろ", en: "AZUIRO" },
    cardBackgroundVideoId: "4tOo5oRsEnc",
    cardBackgroundZoom: true,
    members: [
      { name: { ja: "AZKi", en: "AZKi" }, aliases: ["AZKi"] },
      {
        name: { ja: "風真いろは", en: "Kazama Iroha" },
        aliases: ["風真いろは", "Kazama Iroha"],
      },
    ],
    formedAt: "2022-09-17",
    anniversary: { month: 9, day: 17 },
    tags: ["あずいろ", "AZUIRO"],
    highlights: [
      {
        date: "2022-09-17",
        type: "formation",
        title: { ja: "あずいろ結成", en: "AZUIRO is formed" },
        description: {
          ja: "「アンドロイドガール」での初コラボから始まった、AZKiと風真いろはのユニット。",
          en: "AZKi and Kazama Iroha began their unit history with their first collaboration, “Android Girl.”",
        },
      },
      {
        date: "2025-09-17",
        type: "anniversary",
        title: {
          ja: "3周年3Dカラオケ",
          en: "3rd Anniversary 3D Karaoke",
        },
      },
    ],
  },
];

export const getUnitBySlug = (slug: string) =>
  units.find((unit) => unit.slug === slug) ?? null;

export const getLocalizedUnitText = (text: LocalizedText, locale: string) =>
  locale.startsWith("ja") ? text.ja : text.en;

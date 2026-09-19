export type UnitHighlightType =
  | "origin"
  | "formation"
  | "anniversary"
  | "album"
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

export type UnitMember = {
  name: LocalizedText;
  aliases: string[];
  color: string;
};

export type UnitHeroAccent = {
  start: string;
  top: string;
  end: string;
};

export type UnitDefinition = {
  slug: string;
  name: LocalizedText;
  cardBackgroundVideoId: string;
  cardBackgroundZoom?: boolean;
  members: UnitMember[];
  formedAt: string;
  legacy?: {
    name: LocalizedText;
    startedAt: string;
    endedAt: string;
  };
  anniversary: {
    month: number;
    day: number;
  };
  tags: string[];
  includeWorksInHistory?: boolean;
  highlights: UnitHighlight[];
};

const AZKI_COLOR = "#e55099";

export const units: UnitDefinition[] = [
  {
    slug: "aziro",
    name: { ja: "あずいろ", en: "AZUIRO" },
    cardBackgroundVideoId: "4tOo5oRsEnc",
    cardBackgroundZoom: true,
    members: [
      {
        name: { ja: "AZKi", en: "AZKi" },
        aliases: ["AZKi"],
        color: AZKI_COLOR,
      },
      {
        name: { ja: "風真いろは", en: "Kazama Iroha" },
        aliases: ["風真いろは", "Kazama Iroha"],
        color: "#a8d8cb",
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
      {
        date: "2026-09-17",
        type: "anniversary",
        title: {
          ja: "あずいろ4周年",
          en: "AZUIRO 4th Anniversary",
        },
        description: {
          ja: "「#あずいろ食堂」であずいろ弁当お渡し会を開催。初の記念グッズとシチュエーションボイス「あずいろルームシェアボイス」を発表。",
          en: "AZUIRO held the “AZUIRO Cafeteria” bento handoff stream and announced their first commemorative merchandise and the “AZUIRO Roommates Voice” scenario voice pack.",
        },
        videoId: "Pu1uR5DSH8o",
        url: "https://shop.hololivepro.com/products/aziro_commemorativemerch",
      },
    ],
  },
  {
    slug: "kozmy",
    name: { ja: "KoZMy", en: "KoZMy" },
    cardBackgroundVideoId: "lvgC3pW-LVA",
    members: [
      {
        name: { ja: "博衣こより", en: "Hakui Koyori" },
        aliases: ["博衣こより", "Hakui Koyori"],
        color: "#ff66aa",
      },
      {
        name: { ja: "AZKi", en: "AZKi" },
        aliases: ["AZKi"],
        color: AZKI_COLOR,
      },
      {
        name: { ja: "雪花ラミィ", en: "Yukihana Lamy" },
        aliases: ["雪花ラミィ", "Yukihana Lamy"],
        color: "#67b2e6",
      },
    ],
    formedAt: "2025-08-03",
    anniversary: { month: 8, day: 3 },
    tags: ["KoZMy"],
    highlights: [
      {
        date: "2025-08-03",
        type: "formation",
        title: { ja: "KoZMy結成", en: "KoZMy is formed" },
        description: {
          ja: "AZKi、博衣こより、雪花ラミィの3人によるマシュマロ女子会でユニット名が決定。",
          en: "AZKi, Hakui Koyori, and Yukihana Lamy chose their unit name during a marshmallow girls' talk stream.",
        },
        videoId: "lvgC3pW-LVA",
      },
    ],
  },
  {
    slug: "rosamia",
    name: { ja: "RosaMiA", en: "RosaMiA" },
    cardBackgroundVideoId: "X0wwLISllTM",
    members: [
      {
        name: { ja: "アキ・ローゼンタール", en: "Aki Rosenthal" },
        aliases: ["アキ・ローゼンタール", "Aki Rosenthal", "アキロゼ"],
        color: "#e3b364",
      },
      {
        name: { ja: "大神ミオ", en: "Ookami Mio" },
        aliases: ["大神ミオ", "Ookami Mio"],
        color: "#d95c5c",
      },
      {
        name: { ja: "AZKi", en: "AZKi" },
        aliases: ["AZKi"],
        color: AZKI_COLOR,
      },
    ],
    formedAt: "2026-02-19",
    anniversary: { month: 2, day: 19 },
    tags: ["RosaMiA", "RosaMia"],
    highlights: [
      {
        date: "2026-02-19",
        type: "formation",
        title: { ja: "RosaMiA結成", en: "RosaMiA is formed" },
        description: {
          ja: "アキ・ローゼンタール、大神ミオ、AZKiのオフコラボ歌枠で、ユニット名RosaMiAが誕生。",
          en: "The RosaMiA name was born during an offline karaoke collab with Aki Rosenthal, Ookami Mio, and AZKi.",
        },
        videoId: "jRX_EeOZc-I",
      },
      {
        date: "2026-08-13",
        type: "music",
        title: {
          ja: "Magia / RosaMiA",
          en: "Magia / RosaMiA",
        },
        description: {
          ja: "Kalafina「Magia」のカバーを公開。3D Live映像版も公開された。",
          en: "RosaMiA released a cover of Kalafina’s “Magia,” followed by a 3D live version.",
        },
        videoId: "X0wwLISllTM",
      },
      {
        date: "2026-09-20",
        type: "live",
        title: {
          ja: "RosaMiA 3Dアコースティックライブ",
          en: "RosaMiA 3D Acoustic Live",
        },
        description: {
          ja: "三人の生歌唱が重なる3Dアコースティックライブを開催。",
          en: "RosaMiA held a 3D acoustic live featuring the three members singing together.",
        },
        videoId: "PlDgodRmrn0",
      },
    ],
  },
  {
    slug: "as-tar",
    name: { ja: "AS_tar", en: "AS_tar" },
    cardBackgroundVideoId: "fVS8qkHfBOg",
    members: [
      {
        name: { ja: "AZKi", en: "AZKi" },
        aliases: ["AZKi"],
        color: AZKI_COLOR,
      },
      {
        name: { ja: "星街すいせい", en: "Hoshimachi Suisei" },
        aliases: ["星街すいせい", "Hoshimachi Suisei"],
        color: "#5b8def",
      },
    ],
    formedAt: "2024-06-02",
    legacy: {
      name: { ja: "イノナカ組", en: "INNK duo" },
      startedAt: "2019-05-19",
      endedAt: "2019-12-01",
    },
    anniversary: { month: 6, day: 2 },
    tags: ["AS_tar"],
    highlights: [
      {
        date: "2019-05-19",
        type: "origin",
        title: {
          ja: "イノナカミュージック始動",
          en: "INNK MUSIC launches",
        },
        description: {
          ja: "AZKiと星街すいせいが、ホロライブ内の音楽レーベル「イノナカミュージック」の所属アーティストとして発表された。",
          en: "AZKi and Hoshimachi Suisei were announced as artists under INNK MUSIC, hololive's music label.",
        },
        url: "https://cover-corp.com/news/detail/20190519",
      },
      {
        date: "2019-07-27",
        type: "live",
        title: { ja: "INNK EXHiBiTiON", en: "INNK EXHiBiTiON" },
        description: {
          ja: "AZKiと星街すいせいが出演し、二人で「トライアングラー」をデュエット。",
          en: "AZKi and Hoshimachi Suisei appeared together and performed a duet of “Triangler.”",
        },
        url: "https://hololive.hololivepro.com/events/a-goodday-to-die/",
      },
      {
        date: "2019-12-01",
        type: "other",
        title: {
          ja: "星街すいせいがホロライブへ転籍",
          en: "Hoshimachi Suisei transfers to hololive",
        },
        description: {
          ja: "星街すいせいがイノナカミュージックからホロライブへ転籍。二人が同じレーベルに所属した期間の区切りとなった。",
          en: "Hoshimachi Suisei transferred from INNK MUSIC to hololive, marking the end of the duo's time under the same label.",
        },
        url: "https://prtimes.jp/main/html/rd/p/000000176.000030268.html",
      },
      {
        date: "2020-10-19",
        type: "live",
        title: {
          ja: "星街すいせい50万人記念3Dライブ",
          en: "Hoshimachi Suisei 500K celebration 3D live",
        },
        description: {
          ja: "AZKiがゲスト出演し、二人で「いのち」を歌唱。",
          en: "AZKi appeared as a guest, and the pair performed “Inochi” together.",
        },
        videoId: "JNmmnB4bP0M",
      },
      {
        date: "2021-10-16",
        type: "music",
        title: { ja: "The Last Frontier", en: "The Last Frontier" },
        description: {
          ja: "AZKiが作詞・作曲し、星街すいせいが歌唱参加したデュエット曲をリリース。",
          en: "AZKi released a duet she wrote and composed, featuring vocals by Hoshimachi Suisei.",
        },
        videoId: "-9wUbw5qevU",
        url: "https://hololive.hololivepro.com/news/20211016-1-21/",
      },
      {
        date: "2021-10-21",
        type: "live",
        title: {
          ja: "STELLAR into the GALAXY",
          en: "STELLAR into the GALAXY",
        },
        description: {
          ja: "星街すいせい初のソロライブにAZKiがゲスト出演。",
          en: "AZKi appeared as a guest at Hoshimachi Suisei's first solo concert.",
        },
        url: "https://hololive.hololivepro.com/news/20210910-1-5/",
      },
      {
        date: "2022-04-01",
        type: "other",
        title: {
          ja: "イノナカミュージック終了・AZKiがホロライブへ移籍",
          en: "INNK MUSIC ends and AZKi transfers to hololive",
        },
        description: {
          ja: "サポート体制の変更に伴いイノナカミュージックが終了し、AZKiがホロライブ所属となった。",
          en: "INNK MUSIC ended following a support structure change, and AZKi became a hololive member.",
        },
        url: "https://hololive.hololivepro.com/news/20211229-1-61/",
      },
      {
        date: "2022-07-03",
        type: "live",
        title: { ja: "#AZKi生誕祭2022", en: "AZKi Birthday Live 2022" },
        description: {
          ja: "星街すいせいがゲスト出演し、二人で「The Last Frontier」を歌唱。",
          en: "Hoshimachi Suisei appeared as a guest, and the pair performed “The Last Frontier.”",
        },
        videoId: "y3Ed1eCwuOA",
      },
      {
        date: "2024-05-20",
        type: "stream",
        title: {
          ja: "イノナカ組・ホロライブ加入5周年記念コラボ",
          en: "INNK duo 5th hololive anniversary collaboration",
        },
        description: {
          ja: "イノナカミュージック始動から5年を迎え、思い出を振り返りながら二人で歌唱。",
          en: "Five years after INNK MUSIC launched, the pair looked back on their history and sang together.",
        },
        videoId: "7kS7LNMqJOY",
      },
      {
        date: "2024-06-02",
        type: "formation",
        title: { ja: "AS_tar結成", en: "AS_tar is formed" },
        description: {
          ja: "AZKiと星街すいせいの「PlateUp!」コラボ配信で、視聴者投票によりユニット名が決定。",
          en: "AZKi and Hoshimachi Suisei chose the unit name by viewer vote during their PlateUp! collaboration stream.",
        },
        videoId: "fVS8qkHfBOg",
      },
    ],
  },
  {
    slug: "soraz",
    name: { ja: "SorAZ", en: "SorAZ" },
    cardBackgroundVideoId: "6262sH3SrIU",
    members: [
      {
        name: { ja: "ときのそら", en: "Tokino Sora" },
        aliases: ["ときのそら", "Tokino Sora"],
        color: "#f25c78",
      },
      {
        name: { ja: "AZKi", en: "AZKi" },
        aliases: ["AZKi"],
        color: AZKI_COLOR,
      },
    ],
    formedAt: "2019-07-21",
    anniversary: { month: 7, day: 21 },
    tags: ["SorAZ"],
    includeWorksInHistory: false,
    highlights: [
      {
        date: "2019-07-21",
        type: "formation",
        title: { ja: "SorAZ結成", en: "SorAZ is formed" },
        description: {
          ja: "ときのそらをゲストに迎えた「AZKi生放送 #8 Talk&Live」で、SorAZのユニット名が誕生。",
          en: "The SorAZ name was born when Tokino Sora appeared as a guest on AZKi Live #8 Talk&Live.",
        },
        videoId: "_ARIWfZ3HFs",
      },
      {
        date: "2020-09-26",
        type: "live",
        title: {
          ja: "SorAZ Special Live 刹那的クロニクル",
          en: "SorAZ Special Live: Setsunateki Chronicle",
        },
        description: {
          ja: "SorAZの単独オンラインライブ。二人のオリジナル曲や互いの楽曲を交えたロングライブを開催。",
          en: "SorAZ held a standalone online concert featuring their original songs alongside music from both members.",
        },
        videoId: "6262sH3SrIU",
        url: "https://hololive.hololivepro.com/events/soraz-special-live/",
      },
      {
        date: "2021-09-07",
        type: "anniversary",
        title: {
          ja: "ときのそら4周年記念ミニライブ",
          en: "Tokino Sora 4th Anniversary Mini Live",
        },
        description: {
          ja: "AZKiがゲスト出演し、SorAZで「only my railgun」「Dream☆Story」を歌唱。",
          en: "AZKi appeared as a guest, performing “only my railgun” and “Dream Story” with Tokino Sora.",
        },
        videoId: "s7hakOSsU-I",
      },
      {
        date: "2022-07-03",
        type: "anniversary",
        title: {
          ja: "AZKi生誕祭2022",
          en: "AZKi Birthday Live 2022",
        },
        description: {
          ja: "ときのそらがゲスト出演し、SorAZで「紅藍クロニクル」などを歌唱。",
          en: "Tokino Sora appeared as a guest, joining AZKi for SorAZ performances including “Kouai Chronicle.”",
        },
        videoId: "y3Ed1eCwuOA",
      },
      {
        date: "2022-09-07",
        type: "anniversary",
        title: {
          ja: "ときのそら5周年記念3D配信",
          en: "Tokino Sora 5th Anniversary 3D Stream",
        },
        description: {
          ja: "AZKiがゲスト出演し、SorAZで「Shiny Smily Story」を歌唱。",
          en: "AZKi appeared as a guest and performed “Shiny Smily Story” with Tokino Sora as SorAZ.",
        },
        videoId: "TjGC7Jzc5ns",
      },
      {
        date: "2023-07-01",
        type: "anniversary",
        title: {
          ja: "AZKi 5th Birthday Live “DESTiNATiON”",
          en: "AZKi 5th Birthday Live “DESTiNATiON”",
        },
        description: {
          ja: "ときのそらがゲスト出演し、「Our Bright Parade」「Scale the walls」を二人で歌唱。",
          en: "Tokino Sora appeared as a guest, performing “Our Bright Parade” and “Scale the walls” with AZKi.",
        },
        videoId: "e3JBtoh9pOQ",
      },
      {
        date: "2023-10-15",
        type: "achievement",
        title: {
          ja: "SorAZメジャーデビュー発表",
          en: "SorAZ Major Debut Announcement",
        },
        description: {
          ja: "告知歌枠で、1stアルバム「Futurity Step」とメジャーデビューライブの開催を発表。",
          en: "During a special announcement stream, SorAZ revealed their first album, “Futurity Step,” and a major-debut concert.",
        },
        videoId: "FL4ZqehhBP0",
      },
      {
        date: "2023-12-20",
        type: "album",
        title: {
          ja: "1st Album「Futurity Step」",
          en: "1st Album “Futurity Step”",
        },
        description: {
          ja: "SorAZがビクターエンタテインメントからメジャーデビュー。二人の軌跡と未来を収めた全10曲のアルバムを発売。",
          en: "SorAZ made their major-label debut through Victor Entertainment with a ten-track album tracing their journey and future.",
        },
        url: "https://www.jvcmusic.co.jp/SorAZ/65908/",
      },
      {
        date: "2024-01-27",
        type: "live",
        title: {
          ja: "SorAZ Major Debut Live「First Gravity」",
          en: "SorAZ Major Debut Live “First Gravity”",
        },
        description: {
          ja: "CLUB CITTA'で昼夜2公演を開催。SorAZ初の現地会場での単独ライブとなった。",
          en: "SorAZ performed two shows at CLUB CITTA', marking their first standalone concert at a physical venue.",
        },
        url: "https://hololive.hololivepro.com/events/sorazlive/",
      },
    ],
  },
];

export const getUnitBySlug = (slug: string) =>
  units.find((unit) => unit.slug === slug) ?? null;

export const getLocalizedUnitText = (text: LocalizedText, locale: string) =>
  locale.startsWith("ja") ? text.ja : text.en;

export function getUnitHeroAccent(unit: UnitDefinition): UnitHeroAccent {
  const colors = unit.members.map((member) => member.color);
  const start = colors[0] ?? AZKI_COLOR;
  const end = colors.at(-1) ?? start;
  const top = colors.length > 2 ? (colors[1] ?? start) : start;
  return { start, top, end };
}

export function getUnitHeroFrameVars(unit: UnitDefinition) {
  const { start, top, end } = getUnitHeroAccent(unit);
  return {
    "--unit-hero-start": start,
    "--unit-hero-top": top,
    "--unit-hero-end": end,
  };
}

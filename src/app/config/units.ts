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

export type UnitIntroduction = {
  title: LocalizedText;
  paragraphs: LocalizedText[];
  links: { label: LocalizedText; url: string }[];
};

export type UnitDefinition = {
  slug: string;
  name: LocalizedText;
  description?: LocalizedText;
  introduction?: UnitIntroduction;
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
  } | null;
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
      {
        date: "2026-09-21",
        type: "music",
        title: {
          ja: "Blossom Sinfonia",
          en: "Blossom Sinfonia",
        },
        description: {
          ja: "RosaMiA初のオリジナル楽曲をリリース。前日の3Dアコースティックライブで初披露された。",
          en: "RosaMiA released their first original song, which premiered during the previous day’s 3D acoustic live.",
        },
        videoId: "F9Z39rz4XdI",
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
      {
        date: "2025-11-19",
        type: "music",
        title: {
          ja: "Going My Way 初披露",
          en: '"Going My Way" premieres',
        },
        description: {
          ja: "AZKi SOLO LiVE 2025 “Departure”に星街すいせいがゲスト出演し、AS_tarの新曲「Going My Way」をサプライズ初披露。",
          en: "Hoshimachi Suisei appeared as a guest at AZKi SOLO LiVE 2025 “Departure,” where AS_tar gave a surprise premiere of their new song, “Going My Way.”",
        },
        videoId: "7BnkrEde27E",
        url: "https://hololive.hololivepro.com/events/departure/",
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
  // See docs/units-azki-else-research.md for sources and date decisions.
  // formedAt is the earliest verified shared event; no formation anniversary is claimed.
  {
    slug: "azki-else",
    name: {
      ja: "エルあず",
      en: "El-Azu",
    },
    description: {
      ja: "2018年10月にエルセ、11月にAZKiがデビュー。約1か月違いで活動を始めた二人は、翌年の「VirtuaREAL.00」で共演し、「アズラジ」や対バン「LAST V STANDiNG vol.2」でも交流を重ねた。デビューから「mirror」、深海フェスまで、二人の音楽活動を振り返る。",
      en: "Else debuted in October 2018 and AZKi followed in November, roughly a month apart. They shared the bill at VirtuaREAL.00 the following year, then appeared together on AZ Radio and at LAST V STANDiNG vol.2. Their history traces their music from those debuts through “mirror” and SHINKAI FES.",
    },
    introduction: {
      title: {
        ja: "エルセさんについて",
        en: "About Else",
      },
      paragraphs: [
        {
          ja: "エルセはぷろぶるプロダクション所属のバーチャルシンガー。2018年10月8日に「エルセとさめのぽき」としてデビューし、YouTubeの「エルぽきちゃんねる！」で歌や配信を続けている。",
          en: "Else is a virtual singer with Puroburu Production. She debuted as part of Else & Poki on October 8, 2018, and continues to sing and stream on the duo’s YouTube channel.",
        },
        {
          ja: "相方のさめのぽきは楽曲の作詞・作曲やコーラスを担当。「mirror」や「世界は巡り、やがて君のものになる」など、AZKiの楽曲も手がけてきた。",
          en: "Her partner Poki writes lyrics and music and provides backing vocals. Poki has also written songs for AZKi, including “mirror” and “Sekai wa Meguri, Yagate Kimi no Mono ni Naru.”",
        },
        {
          ja: "二人をプロデュースしてきたのが、2018年に結成されたクリエイティブチーム「ProjectBLUE（プロジェクトブルー）」。デビュー曲「BLUE」のMVもチームで制作した。現在は株式会社ProjectBLUEが「ぷろぶるプロダクション」やバーチャルライブ制作チーム「vortex」を運営している。",
          en: "ProjectBLUE, a creative team formed in 2018, has produced the duo’s work, including the music video for their debut song, “BLUE.” Today, ProjectBLUE Inc. operates Puroburu Production and the virtual concert production team vortex.",
        },
        {
          ja: "2024年10月8日からはコンポーザーの彼方と音楽ユニット「Lir.E（リルエ）」としても活動。彼方はさめのぽきの音楽名義で、エルセがボーカル、彼方が楽曲制作を担当している。二人でアルバムの発表やワンマンライブを行っている。",
          en: "On October 8, 2024, she also began performing as Lir.E with composer Kanata. Kanata is Poki’s music alias. Else provides the vocals and Kanata creates the music; the duo releases albums and holds standalone concerts.",
        },
      ],
      links: [
        {
          label: {
            ja: "エルセ 公式プロフィール",
            en: "Else’s official profile",
          },
          url: "https://puroburu.com/talent/detail/else",
        },
        {
          label: {
            ja: "さめのぽき 公式プロフィール",
            en: "Poki’s official profile",
          },
          url: "https://puroburu.com/talent/detail/poki",
        },
        {
          label: {
            ja: "ProjectBLUE 公式サイト",
            en: "ProjectBLUE official website",
          },
          url: "https://pjblue.com/",
        },
        {
          label: { ja: "Lir.E 公式サイト", en: "Lir.E official website" },
          url: "https://lire-official.com/",
        },
      ],
    },
    cardBackgroundVideoId: "jnUo08GC11Y",
    members: [
      {
        name: {
          ja: "AZKi",
          en: "AZKi",
        },
        aliases: ["AZKi"],
        color: "#e55099",
      },
      {
        name: {
          ja: "エルセ",
          en: "Else",
        },
        aliases: [
          "エルセ",
          "Else",
          "エルセとさめのぽき",
          "Else & Poki",
          "Else with Poki the shark",
        ],
        color: "#47b9dd",
      },
    ],
    formedAt: "2019-06-23",
    anniversary: null,
    tags: ["エルあず", "AZKi・エルセ"],
    includeWorksInHistory: false,
    highlights: [
      {
        date: "2018-10-08",
        type: "origin",
        title: {
          ja: "エルセとさめのぽきがデビュー",
          en: "Else & Poki debut",
        },
        description: {
          ja: "オリジナル曲「BLUE」のMVを公開し、エルセとさめのぽきが活動を開始。エルセの歌とさめのぽきの音楽を海の底を舞台にした映像とともに届けた。",
          en: "Else & Poki began their activities with the music video for their original song “BLUE,” pairing Else’s vocals and Poki’s music with an undersea setting.",
        },
        videoId: "t3vPbSx2RgQ",
      },
      {
        date: "2018-11-15",
        type: "origin",
        title: {
          ja: "AZKiがデビュー",
          en: "AZKi debuts",
        },
        description: {
          ja: "「Just Be Friends -piano.ver-」の歌ってみた動画でAZKiが活動を開始。エルセとさめのぽきのデビューから約1か月後、AZKiもYouTubeで歌声を届け始めた。",
          en: "AZKi began her activities with a cover of “Just Be Friends -piano.ver-,” sharing her singing on YouTube roughly a month after Else & Poki’s debut.",
        },
        videoId: "SdgFVX0FsgE",
      },
      {
        date: "2019-06-23",
        type: "live",
        title: {
          ja: "VirtuaREAL.00 大阪公演で共演",
          en: "Sharing the bill at VirtuaREAL.00 in Osaka",
        },
        description: {
          ja: "デビューから1年足らずのAZKiとエルセとさめのぽきが、大阪・TSUTAYA EBISUBASHIで開催された「VirtuaREAL.00」のリリース記念イベントで共演。",
          en: "AZKi and Else & Poki appeared at the VirtuaREAL.00 release event at TSUTAYA EBISUBASHI in Osaka, both less than a year after their debuts.",
        },
        url: "https://www.virtuareal.net/00/index.html",
      },
      {
        date: "2019-06-26",
        type: "live",
        title: {
          ja: "VirtuaREAL.00 東京公演",
          en: "VirtuaREAL.00 in Tokyo",
        },
        description: {
          ja: "大阪公演に続き、タワーレコード渋谷店 B1F CUTUP STUDIOで開催された東京公演でも共演。",
          en: "Both acts also appeared at the Tokyo event at Tower Records Shibuya’s B1F CUTUP STUDIO, following their appearances in Osaka.",
        },
        url: "https://www.virtuareal.net/00/index.html",
      },
      {
        date: "2019-10-30",
        type: "stream",
        title: {
          ja: "アズラジ #17にエルセとさめのぽきがゲスト出演",
          en: "AZ Radio #17 welcomes Else & Poki",
        },
        description: {
          ja: "AZKiのラジオにエルセとさめのぽきがゲスト出演。ライブイベントに続き、配信でも音楽について語り合った。",
          en: "Else & Poki joined AZKi’s radio show to talk about music, extending their connection from live events to a shared broadcast.",
        },
        videoId: "k4MWg_6_vuU",
      },
      {
        date: "2019-10-30",
        type: "music",
        title: {
          ja: "世界は巡り、やがて君のものになる",
          en: "Sekai wa Meguri, Yagate Kimi no Mono ni Naru",
        },
        description: {
          ja: "さめのぽきが作詞・作曲・編曲を手がけたAZKiの楽曲を先行公開。1stアルバム「without U」に収録され、のちの対バンではAZKiとエルセが二人で歌った。",
          en: "AZKi previewed a song written, composed and arranged by Poki the Shark for her first album, without U. AZKi and Else would later perform it together at LAST V STANDiNG vol.2.",
        },
        videoId: "EAQASQOWCX8",
      },
      {
        date: "2019-11-25",
        type: "music",
        title: {
          ja: "IMAGINATION vol.2「帰りたくなったよ」Short MV",
          en: "IMAGINATION vol.2: “Kaeritaku Natta yo” short MV",
        },
        description: {
          ja: "AZKiとエルセとさめのぽきを含む参加者全員で歌う集合曲のShort MVをRK Musicが公開。11月27日発売のCDにボーナストラックとして収録された。",
          en: "RK Music released the short MV for an ensemble song featuring all IMAGINATION vol.2 participants, including AZKi and Else & Poki. It was included as a bonus track on the CD released November 27.",
        },
        videoId: "PfffHh-IOpE",
      },
      {
        date: "2020-03-15",
        type: "music",
        title: {
          ja: "二人のために作られた楽曲「mirror」",
          en: "“mirror”: a song written for the pair",
        },
        description: {
          ja: "さめのぽきが対バンに向けて「mirror」を書き下ろした。AZKi版とエルセとさめのぽき版のソロ音源がそれぞれ用意され、ライブでは二人がデュエットした。",
          en: "Poki the Shark wrote “mirror” for the upcoming joint concert. It has separate AZKi and Else & Poki solo versions, as well as the duet performed by AZKi and Else on stage.",
        },
        url: "https://hololive.hololivepro.com/music/mirror/",
      },
      {
        date: "2020-03-22",
        type: "live",
        title: {
          ja: "LAST V STANDiNG vol.2",
          en: "LAST V STANDiNG vol.2",
        },
        description: {
          ja: "秋葉原エンタスで、AZKiとエルセとさめのぽきの対バンを開催。「星詠みの唄」で幕を開け、終盤には「世界は巡り、やがて君のものになる」と「mirror」をAZKiとエルセがデュエットした。",
          en: "AZKi and Else & Poki held a joint concert at Akihabara ENTAS. It opened with “Hoshiyomi no Uta” and closed with AZKi and Else singing “Sekai wa Meguri, Yagate Kimi no Mono ni Naru” and “mirror” together.",
        },
        url: "https://hololive.hololivepro.com/events/last-v-standing-vol-2/",
      },
      {
        date: "2020-06-24",
        type: "stream",
        title: {
          ja: "予測不能女子会",
          en: "Unpredictable Girls’ Talk",
        },
        description: {
          ja: "エルセの「予測不能女子会」にAZKiと鈴鳴すばるがゲスト出演。音楽ライブに加え、トーク配信でも交流を重ねた。",
          en: "AZKi and Suzuna Subaru joined Else’s Unpredictable Girls’ Talk, continuing their friendship through conversation as well as music.",
        },
        videoId: "gBKFd7GEVMs",
      },
      {
        date: "2020-12-19",
        type: "live",
        title: {
          ja: "初回 SHINKAI FES（深海フェス）",
          en: "The first SHINKAI FES",
        },
        description: {
          ja: "エルセとさめのぽきが初めて主催したオンラインライブに、AZKiがゲスト出演。海の底のステージで、二人の対バン「LAST V STANDiNG vol.2」に向けて作られた「mirror」を歌った。",
          en: "AZKi appeared as a guest at Else & Poki’s first self-hosted online music festival. On its undersea stage, she sang “mirror,” written for their joint concert, LAST V STANDiNG vol.2.",
        },
        videoId: "Bizxhyzdx78",
      },
      {
        date: "2021-08-24",
        type: "music",
        title: {
          ja: "9人で「夏色えがおで1,2,Jump!」",
          en: "“Natsuiro Egao de 1,2,Jump!” with nine singers",
        },
        description: {
          ja: "MaiR、朝ノ瑠璃、AZKi、戌亥とこ、エルセ、かしこまり、奏天まひろ、宗谷いちか、花鋏キョウによるカバーを公開。",
          en: "MaiR released a nine-singer cover featuring Asano Ruri, AZKi, Inui Toko, Else, Kashiko Mari, Kanade Mahiro, Souya Ichika and Hanabasami Kyo alongside herself.",
        },
        videoId: "F0hEfm_Bnkg",
      },
      {
        date: "2021-08-29",
        type: "live",
        title: {
          ja: "TUBEOUT!FES -2021 SUMMER-",
          en: "TUBEOUT!FES -2021 SUMMER-",
        },
        description: {
          ja: "エルセとさめのぽきのステージにAZKiが参加し、二人で「mirror」を歌唱。対バンで生まれた二人の楽曲を夏のオンラインフェスでも届けた。",
          en: "AZKi joined Else & Poki’s stage for a performance of “mirror,” bringing the song from their joint concert to the summer online festival.",
        },
        url: "https://spwn.jp/events/210829-TOFES",
      },
      {
        date: "2022-04-29",
        type: "live",
        title: {
          ja: "VTuber Fes Japan 2022で「Snow halation」を歌唱",
          en: "VTuber Fes Japan 2022: “Snow halation”",
        },
        description: {
          ja: "DAY1に出演。MaiR、朝ノ瑠璃、AZKi、戌亥とこ、エルセ、かしこまり、宗谷いちか、花鋏キョウの8人で「Snow halation」を歌唱した。",
          en: "On Day 1, AZKi and Else performed “Snow halation” in an eight-singer collaboration with MaiR, Asano Ruri, Inui Toko, Kashiko Mari, Souya Ichika and Hanabasami Kyo.",
        },
        url: "https://vtuberfesjapan.jp/2022/report/",
      },
      {
        date: "2022-05-11",
        type: "music",
        title: {
          ja: "チューリングラブ / エルセ & AZKi",
          en: "Turing Love / Else & AZKi",
        },
        description: {
          ja: "以前の配信で交わした「一緒に歌いたい」という話がカバーMVとして実現。合いの手をHACHIと奏みみ、Mixをさめのぽきが担当した。",
          en: "A wish to sing together, discussed during an earlier stream, became a cover MV. HACHI and Kanade Mimi provided the chants, and Poki the Shark handled the mix.",
        },
        videoId: "jnUo08GC11Y",
      },
      {
        date: "2022-05-11",
        type: "stream",
        title: {
          ja: "エルセの部屋で背中合わせの女子会",
          en: "Else’s Room: a back-to-back girls’ talk",
        },
        description: {
          ja: "同日の「チューリングラブ」公開に続き、AZKiが「エルセの部屋」にゲスト出演。対バンや深海フェスで一緒に歌ってきた仲間として、二人で女子会を開いた。",
          en: "After the release of Turing Love that day, AZKi joined Else’s Room for a girls’ talk between singers who had shared joint concerts and SHINKAI FES.",
        },
        videoId: "UV0nhTm7-vM",
      },
      {
        date: "2022-09-11",
        type: "stream",
        title: {
          ja: "深海から一緒に歌うエルあず3D歌枠",
          en: "El-Azu 3D karaoke from the deep sea",
        },
        description: {
          ja: "AZKiが深海のステージを訪れ、エルセと3Dコラボ歌枠を開催。夏の曲や互いのオリジナル曲を交えて歌った。",
          en: "AZKi visited the undersea stage for a 3D karaoke collaboration with Else, featuring summer songs and songs from their own repertoires.",
        },
        videoId: "TmmDZj2Wpqc",
      },
      {
        date: "2022-10-07",
        type: "live",
        title: {
          ja: "vortex オープニングイベント Day4",
          en: "vortex opening event: Day 4",
        },
        description: {
          ja: "新しいバーチャルライブ空間「vortex」のこけら落としに、AZKi、獅子神レオナ、エルセとさめのぽきが出演。AZKiとエルセは「mirror」を再び二人で歌った。",
          en: "AZKi, Shishigami Leona and Else & Poki appeared on Day 4 of the new virtual venue vortex’s opening event. AZKi and Else performed “mirror” together again.",
        },
        url: "https://pjblue.zaiko.io/e/vortexOP",
      },
      {
        date: "2024-04-22",
        type: "stream",
        title: {
          ja: "AZKi・エルセ・HACHIのDAMカラオケ女子会 第4回",
          en: "DAM Karaoke Girls’ Party #4: AZKi, Else and HACHI",
        },
        description: {
          ja: "エルセがAZKiとHACHIを招き、vortexでカラオケ女子会を開催。同会場のオープニングイベントに出演した仲間が、再び歌で集まった。",
          en: "Else welcomed AZKi and HACHI to a DAM karaoke party at vortex, reuniting artists who had performed at the venue’s opening events.",
        },
        videoId: "bbBsLapZtpc",
      },
      {
        date: "2026-10-18",
        type: "live",
        title: {
          ja: "深海フェス2026「超・深海」で「mirror」を再びデュエット",
          en: "SHINKAI FES 2026: together again for “mirror”",
        },
        description: {
          ja: "渋谷ストリーム ホールのDAY2・グランドステージでAZKiがトリを担当。「Intersection」「Fake.Fake.Fake」「世界は巡り、やがて君のものになる」「いのち（2024 ver.）」「エンドロールは終わらない」を歌い、最後はエルセと「mirror」をデュエット。二人の対バンに向けて作られ、2020年の初回にもAZKiが歌った曲を、約6年ぶりの深海フェス出演で再び披露した。",
          en: "AZKi closed Day 2’s Grand Stage at Shibuya Stream Hall. After Intersection, Fake.Fake.Fake, Sekai wa Meguri, Yagate Kimi no Mono ni Naru, Inochi (2024 ver.) and Endroll wa Owaranai, she sang the final song, “mirror,” as a duet with Else. Returning to SHINKAI FES roughly six years after her first appearance in 2020, she revisited the song written for their joint concert and performed at that first festival.",
        },
        url: "https://x.com/AZKi_VDiVA/status/2111769333496176927",
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

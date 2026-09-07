// `getCollabUnitName` must not call React hooks (must be usable outside components).

// コラボユニット通称定義
export interface CollabUnit {
  members: string[]; // メンバー名配列（ソート順は問わない）
  unitName: string; // 通称

  hl?: {
    en: {
      unitName: string; // 英語表記（任意）
      members: string[]; // メンバー配列（英語表記用、任意）
    };
  };
}

// あいうえお順ソート関数
const sortJapaneseAndEnglish = (a: string, b: string): number => {
  return a.localeCompare(b, "ja");
};

// コラボユニット定義
export const collabUnits: CollabUnit[] = [
  {
    members: ["AZKi", "星街すいせい"],
    unitName: "AS_tar",
    hl: {
      en: { unitName: "AS_tar", members: ["AZKi", "Hoshimachi Suisei"] },
    },
  },
  {
    members: ["AZKi", "風真いろは"],
    unitName: "あずいろ",
    hl: {
      en: { unitName: "AZUIRO", members: ["AZKi", "Kazama Iroha"] },
    },
  },
  {
    members: ["AZKi", "ときのそら", "ロボ子さん", "さくらみこ", "星街すいせい"],
    unitName: "0期生",
    hl: {
      en: {
        unitName: "0th Generation",
        members: [
          "Tokino Sora",
          "Robocosan",
          "Sakura Miko",
          "Hoshimachi Suisei",
          "AZKi",
        ],
      },
    },
  },
  // hololive の公式タレント期・ユニット
  {
    members: ["アキ・ローゼンタール", "赤井はあと", "白上フブキ", "夏色まつり"],
    unitName: "1期生",
    hl: {
      en: {
        unitName: "Gen 1",
        members: [
          "Aki Rosenthal",
          "Akai Haato",
          "Shirakami Fubuki",
          "Natsuiro Matsuri",
        ],
      },
    },
  },
  {
    members: [
      "百鬼あやめ",
      "癒月ちょこ",
      "大空スバル",
      "湊あくあ",
      "紫咲シオン",
    ],
    unitName: "2期生",
    hl: {
      en: {
        unitName: "Gen 2",
        members: [
          "Nakiri Ayame",
          "Yuzuki Choco",
          "Oozora Subaru",
          "Minato Aqua",
          "Murasaki Shion",
        ],
      },
    },
  },
  {
    members: ["白上フブキ", "大神ミオ", "猫又おかゆ", "戌神ころね"],
    unitName: "ホロライブゲーマーズ",
    hl: {
      en: {
        unitName: "hololive GAMERS",
        members: [
          "Shirakami Fubuki",
          "Ookami Mio",
          "Nekomata Okayu",
          "Inugami Korone",
        ],
      },
    },
  },
  {
    members: ["兎田ぺこら", "不知火フレア", "白銀ノエル", "宝鐘マリン"],
    unitName: "3期生",
    hl: {
      en: {
        unitName: "Gen 3",
        members: [
          "Usada Pekora",
          "Shiranui Flare",
          "Shirogane Noel",
          "Houshou Marine",
        ],
      },
    },
  },
  {
    members: ["角巻わため", "常闇トワ", "姫森ルーナ", "天音かなた", "桐生ココ"],
    unitName: "4期生",
    hl: {
      en: {
        unitName: "Gen 4",
        members: [
          "Tsunomaki Watame",
          "Tokoyami Towa",
          "Himemori Luna",
          "Amane Kanata",
          "Kiryu Coco",
        ],
      },
    },
  },
  {
    members: ["雪花ラミィ", "桃鈴ねね", "獅白ぼたん", "尾丸ポルカ"],
    unitName: "5期生",
    hl: {
      en: {
        unitName: "Gen 5",
        members: [
          "Yukihana Lamy",
          "Momosuzu Nene",
          "Shishiro Botan",
          "Omaru Polka",
        ],
      },
    },
  },
  {
    members: [
      "ラプラス・ダークネス",
      "鷹嶺ルイ",
      "博衣こより",
      "風真いろは",
      "沙花叉クロヱ",
    ],
    unitName: "秘密結社holoX",
    hl: {
      en: {
        unitName: "Secret Society holoX",
        members: [
          "La+ Darknesss",
          "Takane Lui",
          "Hakui Koyori",
          "Kazama Iroha",
          "Sakamata Chloe",
        ],
      },
    },
  },
  {
    members: [
      "アユンダ・リス",
      "ムーナ・ホシノヴァ",
      "アイラニ・イオフィフティーン",
    ],
    unitName: "AREA15",
    hl: {
      en: {
        unitName: "AREA15",
        members: ["Ayunda Risu", "Moona Hoshinova", "Airani Iofifteen"],
      },
    },
  },
  {
    members: [
      "クレイジー・オリー",
      "アーニャ・メルフィッサ",
      "パヴォリア・レイネ",
    ],
    unitName: "holoro",
    hl: {
      en: {
        unitName: "holoro",
        members: ["Kureiji Ollie", "Anya Melfissa", "Pavolia Reine"],
      },
    },
  },
  {
    members: ["ベスティア・ゼータ", "カエラ・コヴァルスキア", "こぼ・かなえる"],
    unitName: "holoh3ro",
    hl: {
      en: {
        unitName: "holoh3ro",
        members: ["Vestia Zeta", "Kaela Kovalskia", "Kobo Kanaeru"],
      },
    },
  },
  {
    members: [
      "森カリオペ",
      "小鳥遊キアラ",
      "一伊那尓栖",
      "ワトソン・アメリア",
      "がうる・ぐら",
    ],
    unitName: "Myth",
    hl: {
      en: {
        unitName: "Myth",
        members: [
          "Mori Calliope",
          "Takanashi Kiara",
          "Ninomae Ina'nis",
          "Watson Amelia",
          "Gawr Gura",
        ],
      },
    },
  },
  {
    members: [
      "オーロ・クロニー",
      "ハコス・ベールズ",
      "九十九佐命",
      "セレス・ファウナ",
      "七詩ムメイ",
    ],
    unitName: "Council",
    hl: {
      en: {
        unitName: "Council",
        members: [
          "Ouro Kronii",
          "Hakos Baelz",
          "Tsukumo Sana",
          "Ceres Fauna",
          "Nanashi Mumei",
        ],
      },
    },
  },
  {
    members: [
      "IRyS",
      "オーロ・クロニー",
      "ハコス・ベールズ",
      "セレス・ファウナ",
      "七詩ムメイ",
    ],
    unitName: "Promise",
    hl: {
      en: {
        unitName: "Promise",
        members: [
          "IRyS",
          "Ouro Kronii",
          "Hakos Baelz",
          "Ceres Fauna",
          "Nanashi Mumei",
        ],
      },
    },
  },
  {
    members: [
      "シオリ・ノヴェラ",
      "古石ビジュー",
      "ネリッサ・レイヴンクロフト",
      "フワワ・アビスガード",
      "モココ・アビスガード",
    ],
    unitName: "Advent",
    hl: {
      en: {
        unitName: "Advent",
        members: [
          "Shiori Novella",
          "Koseki Bijou",
          "Nerissa Ravencroft",
          "Fuwawa Abyssgard",
          "Mococo Abyssgard",
        ],
      },
    },
  },
  {
    members: [
      "エリザベス・ローズ・ブラッドフレイム",
      "ジジ・ムリン",
      "セシリア・イマーグリーン",
      "ラオーラ・パンテーラ",
    ],
    unitName: "Justice",
    hl: {
      en: {
        unitName: "Justice",
        members: [
          "Elizabeth Rose Bloodflame",
          "Gigi Murin",
          "Cecilia Immergreen",
          "Raora Panthera",
        ],
      },
    },
  },
  {
    members: ["音乃瀬奏", "一条莉々華", "儒烏風亭らでん", "轟はじめ", "火威青"],
    unitName: "ReGLOSS",
    hl: {
      en: {
        unitName: "ReGLOSS",
        members: [
          "Otonose Kanade",
          "Ichijou Ririka",
          "Juufuutei Raden",
          "Todoroki Hajime",
          "Hiodoshi Ao",
        ],
      },
    },
  },
  {
    members: [
      "響咲リオナ",
      "虎金妃笑虎",
      "水宮枢",
      "輪堂千速",
      "綺々羅々ヴィヴィ",
    ],
    unitName: "FLOW GLOW",
    hl: {
      en: {
        unitName: "FLOW GLOW",
        members: [
          "Isaki Riona",
          "Koganei Niko",
          "Mizumiya Su",
          "Rindo Chihaya",
          "Kikirara Vivi",
        ],
      },
    },
  },
  {
    members: ["ときのそら", "AZKi"],
    unitName: "SorAZ",
    hl: {
      en: { unitName: "SorAZ", members: ["Tokino Sora", "AZKi"] },
    },
  },
  {
    members: ["天音かなた", "沙花叉クロヱ", "AZKi"],
    unitName: "かなけん",
    hl: {
      en: {
        unitName: "KANAKEN",
        members: ["Amane Kanata", "Sakamata Chloe", "AZKi"],
      },
    },
  },
  {
    members: ["AZKi", "天音かなた"],
    unitName: "かなあず",
    hl: {
      en: { unitName: "KanaAZ", members: ["AZKi", "Amane Kanata"] },
    },
  },
  {
    members: ["AZKi", "沙花叉クロヱ"],
    unitName: "さかずき",
    hl: {
      en: { unitName: "Sakazuki", members: ["AZKi", "Sakamata Chloe"] },
    },
  },
  {
    members: ["AZKi", "春先のどか"],
    unitName: "あずのど",
    hl: {
      en: { unitName: "AZNODO", members: ["AZKi", "Harusaki Nodoka"] },
    },
  },
  {
    members: ["AZKi", "雪花ラミィ", "博衣こより"],
    unitName: "KoZMy",
    hl: {
      en: {
        unitName: "KoZMy",
        members: ["AZKi", "Yukihana Lamy", "Hakui Koyori"],
      },
    },
  },
  {
    members: ["AZKi", "音乃瀬奏"],
    unitName: "あずのせ",
    hl: {
      en: { unitName: "AZNOSE", members: ["AZKi", "Otonose Kanade"] },
    },
  },
  {
    members: ["AZKi", "兎田ぺこら"],
    unitName: "ぺこあず",
    hl: {
      en: { unitName: "PEKOAZ", members: ["AZKi", "Usada Pekora"] },
    },
  },
  {
    members: ["AZKi", "ロボ子さん"],
    unitName: "ろぼあず",
    hl: {
      en: { unitName: "RoboAZ", members: ["AZKi", "Robocosan"] },
    },
  },
  {
    members: ["桃鈴ねね", "AZKi"],
    unitName: "ねねあず",
    hl: {
      en: { unitName: "NeneAZ", members: ["Momosuzu Nene", "AZKi"] },
    },
  },
  {
    members: ["AZKi", "白上フブキ"],
    unitName: "フブあず",
    hl: {
      en: { unitName: "FubuAZ", members: ["AZKi", "Shirakami Fubuki"] },
    },
  },
  {
    members: ["AZKi", "大神ミオ"],
    unitName: "あずみぉーん",
    hl: {
      en: { unitName: "AZMioon", members: ["AZKi", "Ookami Mio"] },
    },
  },
  {
    members: ["AZKi", "Hakos Baelz"],
    unitName: "AZBae",
    hl: {
      en: { unitName: "AZBae", members: ["AZKi", "Hakos Baelz"] },
    },
  },
  {
    members: ["AZKi", "IRyS"],
    unitName: "AZRyS",
    hl: {
      en: { unitName: "AZRyS", members: ["AZKi", "IRyS"] },
    },
  },
  {
    members: ["AZKi", "博衣こより"],
    unitName: "こよあず",
    hl: {
      en: { unitName: "KoyoAZ", members: ["AZKi", "Hakui Koyori"] },
    },
  },
  {
    members: ["AZKi", "角巻わため"],
    unitName: "わたあず",
    hl: {
      en: { unitName: "WataAZ", members: ["AZKi", "Tsunomaki Watame"] },
    },
  },
  {
    members: ["さくらみこ", "星街すいせい"],
    unitName: "miComet",
    hl: {
      en: {
        unitName: "miComet",
        members: ["Sakura Miko", "Hoshimachi Suisei"],
      },
    },
  },
  {
    members: ["兎田ぺこら", "宝鐘マリン"],
    unitName: "ぺこマリ",
    hl: {
      en: {
        unitName: "PekoMari",
        members: ["Usada Pekora", "Houshou marine"],
      },
    },
  },
  {
    members: ["AZKi", "水科葵"],
    unitName: "あずみず",
    hl: {
      en: { unitName: "AZMIZU", members: ["AZKi", "Aoi Mizushina"] },
    },
  },
  {
    members: ["星街すいせい", "AZKi", "Moona Hoshinova", "IRyS"],
    unitName: "Star Flower",
    hl: {
      en: {
        unitName: "Star Flower",
        members: ["Hoshimachi Suisei", "AZKi", "Moona Hoshinova", "IRyS"],
      },
    },
  },
  {
    members: ["AZKi", "天音かなた", "雪花ラミィ"],
    unitName: "KALAZ",
    hl: {
      en: {
        unitName: "KALAZ",
        members: ["AZKi", "Amane Kanata", "Yukihana Lamy"],
      },
    },
  },
  {
    members: ["大神ミオ", "白上フブキ"],
    unitName: "フブミオ",
    hl: {
      en: { unitName: "FubuMio", members: ["Ookami Mio", "Shirakami Fubuki"] },
    },
  },
  {
    members: ["角巻わため", "白上フブキ", "不知火フレア", "尾丸ポルカ"],
    unitName: "バカタレサーカス",
    hl: {
      en: {
        unitName: "BAKATARE CIRCUS",
        members: [
          "Tsunomaki Watame",
          "Shirakami Fubuki",
          "Shiranui Flare",
          "Omaru Polka",
        ],
      },
    },
  },
  {
    members: ["AZKi", "ロボ子さん", "水宮枢", "響咲リオナ"],
    unitName: "RoARiS",
    hl: {
      en: {
        unitName: "RoARiS",
        members: ["AZKi", "Robocosan", "Mizumiya Su", "Isaki Riona"],
      },
    },
  },
  {
    members: ["AZKi", "アキ・ローゼンタール", "大神ミオ"],
    unitName: "RosaMiA",
    hl: {
      en: {
        unitName: "RosaMiA",
        members: ["AZKi", "Aki Rosenthal", "Ookami Mio"],
      },
    },
  },
  {
    members: ["AZKi", "響咲リオナ"],
    unitName: "RiONAZKi",
    hl: {
      en: { unitName: "RiONAZKi", members: ["AZKi", "Isaki Riona"] },
    },
  },
];

// メンバー配列を正規化（ソート）
export const normalizeMemberNames = (members: string[]): string[] => {
  return [...members].sort((a, b) => sortJapaneseAndEnglish(a, b));
};

// コラボメンバーから通称を取得
export const getCollabUnitName = (
  members: string[],
  locale: string = "ja",
): string | null => {
  const sortedMembers = normalizeMemberNames(members);
  const unit = collabUnits.find((u) => {
    const sortedUnitMembers = normalizeMemberNames(u.members);
    const sortedEnMembers =
      u.hl && u.hl.en ? normalizeMemberNames(u.hl.en.members) : null;
    return (
      (sortedUnitMembers.length === sortedMembers.length &&
        sortedUnitMembers.every((m, i) => m === sortedMembers[i])) ||
      (sortedEnMembers &&
        sortedEnMembers.length === sortedMembers.length &&
        sortedEnMembers.every((m, i) => m === sortedMembers[i]))
    );
  });
  if (unit) {
    return locale === "ja"
      ? unit.unitName
      : unit.hl?.en?.unitName || unit.unitName;
  }
  return null;
};

// 通称からメンバー配列を取得（大文字小文字を区別しない）
export const getCollabMembers = (
  unitName: string,
  locale: string = "ja",
): string[] | null => {
  const normalize = (s: string) => s.replace(/[\s_-]+/g, "").toLowerCase();
  const target = normalize(unitName);
  const unit = collabUnits.find((u) => {
    if (normalize(u.unitName) === target) return true;
    if (u.hl && u.hl.en && normalize(u.hl.en.unitName) === target) return true;
    return false;
  });
  if (unit) {
    return locale === "ja"
      ? unit.members
      : unit.hl?.en?.members || unit.members;
  }
  return null;
};

// ユニット通称かどうかを判定（大文字小文字を区別しない）
export const isCollabUnit = (unitName: string): boolean => {
  const normalize = (s: string) => s.replace(/[\s_-]+/g, "").toLowerCase();
  const target = normalize(unitName);
  return collabUnits.some((u) => {
    if (normalize(u.unitName) === target) return true;
    if (u.hl && u.hl.en && normalize(u.hl.en.unitName) === target) return true;
    return false;
  });
};

// コラボユニット通称定義
export interface CollabUnit {
  members: string[]; // メンバー名配列（ソート順は問わない）
  unitName: string; // 通称

  hl?: {
    en: string; // 英語表記（任意）
  };

  // 結成に関する情報
  formationDate?: string; // 結成日（ユニット名の初出）
  formationExtraInfo?: string; // 結成に関する追加情報（例: 配信内容の説明）
  formationExtraURL?: string; // 結成に関するURL（例: Xの投稿や配信URL）

  // 活動開始日（ユニット名結成前からの活動）
  activityStartDate?: string; // 活動開始日（ユニット名の初出より前に曲を出したりした場合）
  activityStartExtraInfo?: string; // 活動開始に関する追加情報
  activityStartExtraURL?: string; // 活動開始に関するURL
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
      en: "AS_tar",
    },
    formationDate: "2024-06-02",
    formationExtraInfo:
      "PlateUp!配信にてアンケートをしてユニット名が正式に決定。",
    formationExtraURL: "https://youtu.be/fVS8qkHfBOg?t=8254",
  },
  {
    members: ["AZKi", "風真いろは"],
    unitName: "あずいろ",
    hl: {
      en: "AZUIRO",
    },
    formationDate: "2022-09-07",
    formationExtraInfo: "アンドロイドガールのカバーがあずいろの初出。",
    formationExtraURL: "https://www.youtube.com/watch?v=_NC_pqMt5rY",
  },
  {
    members: ["AZKi", "ときのそら", "ロボ子さん", "さくらみこ", "星街すいせい"],
    unitName: "0期生",
    hl: {
      en: "0th Generation",
    },
  },
  {
    members: ["ときのそら", "AZKi"],
    unitName: "SorAZ",
    hl: {
      en: "SorAZ",
    },
    formationDate: "2019-07-27",
    formationExtraInfo:
      "「【SPライブゲスト：ときのそら】AZKi生放送 #8　Talk&Live」の配信内で、SorAZのユニット名が決定。「そらちゃん」と呼び始めたのもここから。",
    formationExtraURL: "https://www.youtube.com/watch?v=flbnSvDohAA",
  },
  {
    members: ["天音かなた", "沙花叉クロヱ", "AZKi"],
    unitName: "かなけん",
    hl: {
      en: "KANAKEN",
    },
  },
  {
    members: ["AZKi", "天音かなた"],
    unitName: "かなあず",
    hl: {
      en: "KanaAZ",
    },
  },
  {
    members: ["AZKi", "沙花叉クロヱ"],
    unitName: "さかずき",
    hl: {
      en: "Sakazuki",
    },
  },
  {
    members: ["AZKi", "春先のどか"],
    unitName: "あずのど",
    hl: {
      en: "AZNODO",
    },
  },
  {
    members: ["AZKi", "雪花ラミィ", "博衣こより"],
    unitName: "KoZMy",
    hl: {
      en: "KoZMy",
    },
    formationDate: "2025-08-03",
    formationExtraInfo:
      "2025/08/03、3人によるマシュマロ雑談配信の告知でKoZMyが初めて使用された。",
    formationExtraURL: "https://x.com/hakuikoyori/status/1951661145338896855",
  },
  {
    members: ["AZKi", "音乃瀬奏"],
    unitName: "あずのせ",
    hl: {
      en: "AZNOSE",
    },
  },
  {
    members: ["AZKi", "兎田ぺこら"],
    unitName: "ぺこあず",
    hl: {
      en: "PEKOAZ",
    },
  },
  {
    members: ["AZKi", "ロボ子さん"],
    unitName: "ロボあず",
  },
  {
    members: ["桃鈴ねね", "AZKi"],
    unitName: "ねねあず",
  },
  {
    members: ["AZKi", "白上フブキ"],
    unitName: "フブあず",
  },
  {
    members: ["AZKi", "大神ミオ"],
    unitName: "あずみぉーん",
  },
  {
    members: ["AZKi", "Hakos Baelz"],
    unitName: "AZBae",
  },
  {
    members: ["AZKi", "IRyS"],
    unitName: "AZRyS",
  },
  {
    members: ["AZKi", "博衣こより"],
    unitName: "こよあず",
  },
  {
    members: ["AZKi", "角巻わため"],
    unitName: "わたあず",
  },
  {
    members: ["さくらみこ", "星街すいせい"],
    unitName: "miComet",
  },
  {
    members: ["AZKi", "水科葵"],
    unitName: "あずみず",
  },
  {
    members: ["星街すいせい", "AZKi", "Moona Hoshinova", "IRyS"],
    unitName: "Star Flower",
    hl: {
      en: "Star Flower",
    },
  },
  {
    members: ["AZKi", "天音かなた", "雪花ラミィ"],
    unitName: "KALAZ",
    hl: {
      en: "KALAZ",
    },
  },
  {
    members: ["大神ミオ", "白上フブキ"],
    unitName: "フブミオ",
  },
  {
    members: ["AZKi", "ロボ子さん", "水宮枢", "響咲リオナ"],
    unitName: "RoARiS",
  },
  {
    members: ["AZKi", "アキ・ローゼンタール", "大神ミオ"],
    unitName: "RosaMia",
    formationDate: "2026-02-19",
    formationExtraInfo:
      "オフコラボで行われたカラオケ配信にてユニット名が決定。",
    formationExtraURL: "https://www.youtube.com/watch?v=jRX_EeOZc-I&t=2588s",
  },
  {
    members: ["AZKi", "響咲リオナ"],
    unitName: "RiONAZKi",
  },
];

// メンバー配列を正規化（ソート）
export const normalizeMemberNames = (members: string[]): string[] => {
  return [...members].sort((a, b) => sortJapaneseAndEnglish(a, b));
};

// コラボメンバーから通称を取得
export const getCollabUnitName = (members: string[]): string | null => {
  const sortedMembers = normalizeMemberNames(members);
  const unit = collabUnits.find((u) => {
    const sortedUnitMembers = normalizeMemberNames(u.members);
    return (
      sortedUnitMembers.length === sortedMembers.length &&
      sortedUnitMembers.every((m, i) => m === sortedMembers[i])
    );
  });
  return unit ? unit.unitName : null;
};

// 通称からメンバー配列を取得（大文字小文字を区別しない）
export const getCollabMembers = (unitName: string): string[] | null => {
  const normalize = (s: string) => s.replace(/[\s_-]+/g, "").toLowerCase();
  const target = normalize(unitName);
  const unit = collabUnits.find((u) => {
    if (normalize(u.unitName) === target) return true;
    if (u.hl && u.hl.en && normalize(u.hl.en) === target) return true;
    return false;
  });
  return unit ? unit.members : null;
};

// ユニット通称かどうかを判定（大文字小文字を区別しない）
export const isCollabUnit = (unitName: string): boolean => {
  const normalize = (s: string) => s.replace(/[\s_-]+/g, "").toLowerCase();
  const target = normalize(unitName);
  return collabUnits.some((u) => {
    if (normalize(u.unitName) === target) return true;
    if (u.hl && u.hl.en && normalize(u.hl.en) === target) return true;
    return false;
  });
};

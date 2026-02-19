// コラボユニット通称定義
export interface CollabUnit {
  members: string[]; // メンバー名配列（ソート順は問わない）
  unitName: string; // 通称
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
  },
  {
    members: ["AZKi", "風真いろは"],
    unitName: "あずいろ",
  },
  {
    members: ["AZKi", "ときのそら", "ロボ子さん", "さくらみこ", "星街すいせい"],
    unitName: "0期生",
  },
  {
    members: ["ときのそら", "AZKi"],
    unitName: "SorAZ",
  },
  {
    members: ["天音かなた", "沙花叉クロヱ", "AZKi"],
    unitName: "かなけん",
  },
  {
    members: ["AZKi", "天音かなた"],
    unitName: "かなあず",
  },
  {
    members: ["AZKi", "沙花叉クロヱ"],
    unitName: "さかずき",
  },
  {
    members: ["AZKi", "春先のどか"],
    unitName: "あずのど",
  },
  {
    members: ["AZKi", "雪花ラミィ", "博衣こより"],
    unitName: "KoZMy",
  },
  {
    members: ["AZKi", "音乃瀬奏"],
    unitName: "あずのせ",
  },
  {
    members: ["AZKi", "兎田ぺこら"],
    unitName: "ぺこあず",
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
  },
  {
    members: ["AZKi", "天音かなた", "雪花ラミィ"],
    unitName: "KALAZ",
  },
  {
    members: ["大神ミオ", "白上フブキ"],
    unitName: "フブミオ",
  },
  {
    members: ["AZKi", "アキ・ローゼンタール", "大神ミオ"],
    unitName: "RosaMia",
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
  const unit = collabUnits.find(
    (u) => u.unitName.toLowerCase() === unitName.toLowerCase(),
  );
  return unit ? unit.members : null;
};

// ユニット通称かどうかを判定（大文字小文字を区別しない）
export const isCollabUnit = (unitName: string): boolean => {
  return collabUnits.some(
    (u) => u.unitName.toLowerCase() === unitName.toLowerCase(),
  );
};

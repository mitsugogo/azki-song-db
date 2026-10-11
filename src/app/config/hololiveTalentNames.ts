// Official talent names checked on 2026-10-11.
// https://hololive.hololivepro.com/talents/
// https://hololive.hololivepro.com/en/talents/
export const hololiveTalentNames: readonly (readonly [
  ja: string,
  en: string,
  ...aliases: string[],
])[] = [
  ["ときのそら", "Tokino Sora"],
  ["ロボ子さん", "Robocosan"],
  ["アキ・ローゼンタール", "Aki Rosenthal"],
  ["赤井はあと", "Akai Haato"],
  ["白上フブキ", "Shirakami Fubuki"],
  ["夏色まつり", "Natsuiro Matsuri"],
  ["百鬼あやめ", "Nakiri Ayame"],
  ["癒月ちょこ", "Yuzuki Choco"],
  ["大空スバル", "Oozora Subaru"],
  ["AZKi", "AZKi"],
  ["大神ミオ", "Ookami Mio"],
  ["さくらみこ", "Sakura Miko"],
  ["猫又おかゆ", "Nekomata Okayu"],
  ["戌神ころね", "Inugami Korone"],
  ["星街すいせい", "Hoshimachi Suisei"],
  ["兎田ぺこら", "Usada Pekora"],
  ["不知火フレア", "Shiranui Flare"],
  ["白銀ノエル", "Shirogane Noel"],
  ["宝鐘マリン", "Houshou Marine"],
  ["角巻わため", "Tsunomaki Watame"],
  ["常闇トワ", "Tokoyami Towa"],
  ["姫森ルーナ", "Himemori Luna"],
  ["雪花ラミィ", "Yukihana Lamy"],
  ["桃鈴ねね", "Momosuzu Nene"],
  ["獅白ぼたん", "Shishiro Botan"],
  ["尾丸ポルカ", "Omaru Polka"],
  ["ラプラス・ダークネス", "La+ Darknesss"],
  ["鷹嶺ルイ", "Takane Lui"],
  ["博衣こより", "Hakui Koyori"],
  ["風真いろは", "Kazama Iroha"],
  ["沙花叉クロヱ", "Sakamata Chloe"],
  ["アユンダ・リス", "Ayunda Risu"],
  ["ムーナ・ホシノヴァ", "Moona Hoshinova"],
  [
    "アイラニ・イオフィフティーン",
    "Airani Iofifteen",
    "アイラニ・イオフイフティーン",
  ],
  ["クレイジー・オリー", "Kureiji Ollie"],
  ["アーニャ・メルフィッサ", "Anya Melfissa"],
  ["パヴォリア・レイネ", "Pavolia Reine"],
  ["ベスティア・ゼータ", "Vestia Zeta"],
  ["カエラ・コヴァルスキア", "Kaela Kovalskia"],
  ["こぼ・かなえる", "Kobo Kanaeru"],
  ["森カリオペ", "Mori Calliope"],
  ["小鳥遊キアラ", "Takanashi Kiara"],
  ["一伊那尓栖", "Ninomae Ina’nis"],
  ["ワトソン・アメリア", "Watson Amelia"],
  ["IRyS", "IRyS", "アイリス"],
  ["オーロ・クロニー", "Ouro Kronii"],
  ["ハコス・ベールズ", "Hakos Baelz"],
  ["シオリ・ノヴェラ", "Shiori Novella"],
  ["古石ビジュー", "Koseki Bijou"],
  ["ネリッサ・レイヴンクロフト", "Nerissa Ravencroft"],
  ["フワワ・アビスガード", "Fuwawa Abyssgard", "フワワアビスガード"],
  ["モココ・アビスガード", "Mococo Abyssgard", "モココアビスガード"],
  ["エリザベス・ローズ・ブラッドフレイム", "Elizabeth Rose Bloodflame"],
  ["ジジ・ムリン", "Gigi Murin"],
  ["セシリア・イマーグリーン", "Cecilia Immergreen"],
  ["ラオーラ・パンテーラ", "Raora Panthera"],
  ["音乃瀬奏", "Otonose Kanade"],
  ["一条莉々華", "Ichijou Ririka"],
  ["儒烏風亭らでん", "Juufuutei Raden"],
  ["轟はじめ", "Todoroki Hajime"],
  ["響咲リオナ", "Isaki Riona"],
  ["虎金妃笑虎", "Koganei Niko"],
  ["水宮枢", "Mizumiya Su"],
  ["輪堂千速", "Rindo Chihaya"],
  ["綺々羅々ヴィヴィ", "Kikirara Vivi"],
  ["熱千めら", "Achichi Mela"],
  ["宙科そぴあ", "Sorashina Sopia"],
  ["鈴鳴つづり", "Suzuna Tsuzuri"],
  ["百灯キョーコ", "Hyakuto Kyoko"],
  ["井月みちる", "Izuki Michiru"],
  ["花園さやか", "Hanazono Sayaka"],
  ["風白ゆき", "Kazeshiro Yuki"],
  ["湊あくあ", "Minato Aqua"],
  ["紫咲シオン", "Murasaki Shion"],
  ["天音かなた", "Amane Kanata"],
  ["桐生ココ", "Kiryu Coco"],
  ["がうる・ぐら", "Gawr Gura"],
  ["九十九佐命", "Tsukumo Sana"],
  ["セレス・ファウナ", "Ceres Fauna"],
  ["七詩ムメイ", "Nanashi Mumei"],
  ["火威青", "Hiodoshi Ao"],
  ["春先のどか", "Harusaki Nodoka"],
  ["友人A（えーちゃん）", "Friend A (A-chan)"],
  // Former talents absent from the current talent list.
  // https://cover-corp.com/en/news/detail/20240116
  ["夜空メル", "Yozora Mel"],
  // https://cover-corp.com/en/news/detail/20220224b
  ["潤羽るしあ", "Uruha Rushia"],
];

const normalizeName = (value: string) =>
  value
    .normalize("NFKC")
    .replaceAll("’", "'")
    .trim()
    .toLocaleLowerCase("ja-JP");

const talentNamesByAlias = new Map(
  hololiveTalentNames.flatMap(([ja, en, ...aliases]) =>
    [ja, en, ...aliases].map(
      (name) => [normalizeName(name), { ja, en }] as const,
    ),
  ),
);

export const getOfficialHololiveTalentName = (
  value: string,
  locale: string,
) => {
  const names = talentNamesByAlias.get(normalizeName(value));
  return locale.startsWith("ja") ? names?.ja : names?.en;
};

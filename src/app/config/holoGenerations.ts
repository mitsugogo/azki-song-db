import type { ChannelEntry } from "../types/api/yt/channels";

// ホロライブの「期生」グループ定義。並び順はデビュー順（0期生→…→EN4期生→HOLOSTARS→公式→その他）
export type HoloGenerationGroup = {
  key: string;
  label: string;
};

const OTHER_GROUP: HoloGenerationGroup = { key: "other", label: "その他" };

type HoloGenerationGroupDefinition = HoloGenerationGroup & {
  matches: (branch: string, generation: string) => boolean;
};

// branch/generation はスプレッドシート由来の自由記述（複数タグをカンマ区切りで含む）のため部分一致で判定する
// 並び順: JP -> ReGLOSS/FLOW GLOW -> EN -> ID の順にブランチをまとめ、各ブランチ内はデビュー順
const HOLO_GENERATION_GROUPS: HoloGenerationGroupDefinition[] = [
  {
    key: "jp-0",
    label: "0期生",
    matches: (branch, generation) =>
      branch === "JP" && generation.includes("0期生"),
  },
  {
    key: "jp-1",
    label: "1期生",
    matches: (branch, generation) =>
      branch === "JP" && generation.includes("1期生"),
  },
  {
    key: "jp-2",
    label: "2期生",
    matches: (branch, generation) =>
      branch === "JP" && generation.includes("2期生"),
  },
  {
    key: "jp-gamers",
    label: "ゲーマーズ",
    matches: (branch, generation) =>
      branch === "JP" && generation.includes("ゲーマーズ"),
  },
  {
    key: "jp-3",
    label: "3期生",
    matches: (branch, generation) =>
      branch === "JP" && generation.includes("3期生"),
  },
  {
    key: "jp-4",
    label: "4期生",
    matches: (branch, generation) =>
      branch === "JP" && generation.includes("4期生"),
  },
  {
    key: "jp-5",
    label: "5期生",
    matches: (branch, generation) =>
      branch === "JP" && generation.includes("5期生"),
  },
  {
    key: "jp-6",
    label: "holoX(6期生)",
    matches: (branch, generation) =>
      branch === "JP" &&
      (generation.includes("6期生") || generation.includes("holoX")),
  },
  {
    key: "devis-regloss",
    label: "ReGLOSS",
    matches: (branch, generation) =>
      branch === "DEV_IS" && generation.includes("ReGLOSS"),
  },
  {
    key: "devis-flowglow",
    label: "FLOW GLOW",
    matches: (branch, generation) =>
      branch === "DEV_IS" && generation.includes("FLOW GLOW"),
  },
  {
    key: "en-1",
    label: "EN1期生",
    matches: (branch, generation) =>
      branch === "EN" && generation.includes("1期生"),
  },
  {
    key: "en-2",
    label: "EN2期生",
    matches: (branch, generation) =>
      branch === "EN" && generation.includes("2期生"),
  },
  {
    key: "en-3",
    label: "EN3期生",
    matches: (branch, generation) =>
      branch === "EN" && generation.includes("3期生"),
  },
  {
    key: "en-4",
    label: "EN4期生",
    matches: (branch, generation) =>
      branch === "EN" && generation.includes("4期生"),
  },
  {
    key: "id-1",
    label: "ID1期生",
    matches: (branch, generation) =>
      branch === "ID" && generation.includes("1期生"),
  },
  {
    key: "id-2",
    label: "ID2期生",
    matches: (branch, generation) =>
      branch === "ID" && generation.includes("2期生"),
  },
  {
    key: "id-3",
    label: "ID3期生",
    matches: (branch, generation) =>
      branch === "ID" && generation.includes("3期生"),
  },
  {
    key: "holostars",
    label: "HOLOSTARS",
    matches: (branch) => branch === "HOLOSTARS",
  },
  {
    key: "official",
    label: "公式",
    matches: (branch) => branch === "公式",
  },
];

export const holoGenerationGroupOrder: string[] = [
  ...HOLO_GENERATION_GROUPS.map((group) => group.key),
  OTHER_GROUP.key,
];

export const resolveHoloGenerationGroup = (
  channel: Pick<ChannelEntry, "branch" | "generation"> | null | undefined,
): HoloGenerationGroup => {
  if (!channel) {
    return OTHER_GROUP;
  }

  const matched = HOLO_GENERATION_GROUPS.find((group) =>
    group.matches(channel.branch, channel.generation),
  );

  return matched ? { key: matched.key, label: matched.label } : OTHER_GROUP;
};

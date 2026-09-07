import type { ChannelEntry } from "../types/api/yt/channels";

// hololive 公式サイトの所属タレント区分。公式サイトと同じ順序で表示する。
export type HoloGenerationGroup = {
  key: string;
  label: string;
};

const OTHER_GROUP: HoloGenerationGroup = { key: "other", label: "その他" };

type HoloGenerationGroupDefinition = HoloGenerationGroup & {
  matches: (branch: string, generation: string) => boolean;
};

// channels シートは移行前の JP / EN / ID と、移行後の統合された hololive の
// どちらの表記も含み得る。世代は自由記述で複数のタグを含むため、正規化した部分一致で扱う。
const normalizeValue = (value: string) =>
  value.normalize("NFKC").trim().toLocaleLowerCase("ja-JP");

const normalizeBranch = (value: string) =>
  normalizeValue(value).replace(/[\s_'’-]+/gu, "");

const normalizeGeneration = (value: string) =>
  normalizeValue(value).replace(/[\s:_'’-]+/gu, "");

const hasGeneration = (generation: string, ...values: string[]) => {
  const normalizedGeneration = normalizeGeneration(generation);

  return values.some((value) =>
    normalizedGeneration.includes(normalizeGeneration(value)),
  );
};

const isHololiveBranch = (branch: string) => {
  const normalizedBranch = normalizeBranch(branch);

  return (
    ["jp", "en", "id", "devis", "hololive", "ホロライブ"].includes(
      normalizedBranch,
    ) || normalizedBranch.includes("hololive")
  );
};

const isJapaneseBranch = (branch: string) => {
  const normalizedBranch = normalizeBranch(branch);

  return ["jp", "hololive", "ホロライブ", "hololivejp"].includes(
    normalizedBranch,
  );
};

const isIndonesianBranch = (branch: string) => {
  const normalizedBranch = normalizeBranch(branch);

  return (
    normalizedBranch === "id" ||
    normalizedBranch === "hololiveid" ||
    normalizedBranch.includes("indonesia")
  );
};

const isEnglishBranch = (branch: string) => {
  const normalizedBranch = normalizeBranch(branch);

  return (
    normalizedBranch === "en" ||
    normalizedBranch === "hololiveen" ||
    normalizedBranch.includes("english")
  );
};

const isDevIsBranch = (branch: string) =>
  normalizeBranch(branch).includes("devis");

const HOLO_GENERATION_GROUPS: HoloGenerationGroupDefinition[] = [
  {
    key: "hololive-0",
    label: "0期生",
    matches: (branch, generation) =>
      isJapaneseBranch(branch) && hasGeneration(generation, "0期生"),
  },
  {
    key: "hololive-1",
    label: "1期生",
    matches: (branch, generation) =>
      isJapaneseBranch(branch) && hasGeneration(generation, "1期生"),
  },
  {
    key: "hololive-2",
    label: "2期生",
    matches: (branch, generation) =>
      isJapaneseBranch(branch) && hasGeneration(generation, "2期生"),
  },
  {
    key: "hololive-gamers",
    label: "ホロライブゲーマーズ",
    matches: (branch, generation) =>
      isJapaneseBranch(branch) &&
      hasGeneration(generation, "ホロライブゲーマーズ", "ゲーマーズ"),
  },
  {
    key: "hololive-3",
    label: "3期生",
    matches: (branch, generation) =>
      isJapaneseBranch(branch) && hasGeneration(generation, "3期生"),
  },
  {
    key: "hololive-4",
    label: "4期生",
    matches: (branch, generation) =>
      isJapaneseBranch(branch) && hasGeneration(generation, "4期生"),
  },
  {
    key: "hololive-5",
    label: "5期生",
    matches: (branch, generation) =>
      isJapaneseBranch(branch) && hasGeneration(generation, "5期生"),
  },
  {
    key: "hololive-holox",
    label: "秘密結社holoX",
    matches: (branch, generation) =>
      isHololiveBranch(branch) &&
      (hasGeneration(generation, "秘密結社holoX", "holoX") ||
        ((isJapaneseBranch(branch) || isDevIsBranch(branch)) &&
          hasGeneration(generation, "6期生"))),
  },
  {
    key: "area15",
    label: "AREA15",
    matches: (branch, generation) =>
      isHololiveBranch(branch) &&
      (hasGeneration(generation, "AREA15") ||
        (isIndonesianBranch(branch) && hasGeneration(generation, "1期生"))),
  },
  {
    key: "holoro",
    label: "holoro",
    matches: (branch, generation) =>
      isHololiveBranch(branch) &&
      (hasGeneration(generation, "holoro") ||
        (isIndonesianBranch(branch) && hasGeneration(generation, "2期生"))),
  },
  {
    key: "holoh3ro",
    label: "holoh3ro",
    matches: (branch, generation) =>
      isHololiveBranch(branch) &&
      (hasGeneration(generation, "holoh3ro", "holo3ro") ||
        (isIndonesianBranch(branch) && hasGeneration(generation, "3期生"))),
  },
  {
    key: "myth",
    label: "Myth",
    matches: (branch, generation) =>
      isHololiveBranch(branch) &&
      (hasGeneration(generation, "Myth") ||
        (isEnglishBranch(branch) && hasGeneration(generation, "1期生"))),
  },
  {
    key: "project-hope",
    label: "Project: HOPE",
    matches: (branch, generation) =>
      isHololiveBranch(branch) &&
      (hasGeneration(generation, "Project: HOPE", "1.5期生") ||
        (isEnglishBranch(branch) && hasGeneration(generation, "HOPE"))),
  },
  {
    key: "council",
    label: "Council",
    matches: (branch, generation) =>
      isHololiveBranch(branch) &&
      (hasGeneration(generation, "Council") ||
        (isEnglishBranch(branch) && hasGeneration(generation, "2期生"))),
  },
  {
    key: "promise",
    label: "Promise",
    matches: (branch, generation) =>
      isHololiveBranch(branch) && hasGeneration(generation, "Promise"),
  },
  {
    key: "advent",
    label: "Advent",
    matches: (branch, generation) =>
      isHololiveBranch(branch) &&
      (hasGeneration(generation, "Advent") ||
        (isEnglishBranch(branch) && hasGeneration(generation, "3期生"))),
  },
  {
    key: "justice",
    label: "Justice",
    matches: (branch, generation) =>
      isHololiveBranch(branch) &&
      (hasGeneration(generation, "Justice") ||
        (isEnglishBranch(branch) && hasGeneration(generation, "4期生"))),
  },
  {
    key: "regloss",
    label: "ReGLOSS",
    matches: (branch, generation) =>
      isHololiveBranch(branch) && hasGeneration(generation, "ReGLOSS"),
  },
  {
    key: "flow-glow",
    label: "FLOW GLOW",
    matches: (branch, generation) =>
      isHololiveBranch(branch) && hasGeneration(generation, "FLOW GLOW"),
  },
  {
    key: "graduates",
    label: "卒業生",
    matches: (branch, generation) =>
      isHololiveBranch(branch) && hasGeneration(generation, "卒業生"),
  },
  {
    key: "holoan",
    label: "holoAN",
    matches: (branch, generation) =>
      isHololiveBranch(branch) && hasGeneration(generation, "holoAN"),
  },
  {
    key: "office-staff",
    label: "事務所スタッフ",
    matches: (branch, generation) =>
      isHololiveBranch(branch) && hasGeneration(generation, "事務所スタッフ"),
  },
  {
    key: "holostars",
    label: "HOLOSTARS",
    matches: (branch) => normalizeBranch(branch) === "holostars",
  },
  {
    key: "official",
    label: "公式",
    matches: (branch) => normalizeBranch(branch) === "公式",
  },
];

export const holoGenerationGroupOrder: string[] = [
  ...HOLO_GENERATION_GROUPS.map((group) => group.key),
  OTHER_GROUP.key,
];

const toHoloGenerationGroup = (
  group: HoloGenerationGroup,
): HoloGenerationGroup => ({
  key: group.key,
  label: group.label,
});

export const resolveHoloGenerationGroups = (
  channel: Pick<ChannelEntry, "branch" | "generation"> | null | undefined,
): HoloGenerationGroup[] => {
  if (!channel) {
    return [toHoloGenerationGroup(OTHER_GROUP)];
  }

  const matched = HOLO_GENERATION_GROUPS.filter((group) =>
    group.matches(channel.branch, channel.generation),
  );

  return matched.length > 0
    ? matched.map(toHoloGenerationGroup)
    : [toHoloGenerationGroup(OTHER_GROUP)];
};

export const resolveHoloGenerationGroup = (
  channel: Pick<ChannelEntry, "branch" | "generation"> | null | undefined,
): HoloGenerationGroup => {
  return (
    resolveHoloGenerationGroups(channel)[0] ??
    toHoloGenerationGroup(OTHER_GROUP)
  );
};

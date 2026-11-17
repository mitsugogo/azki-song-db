export type BestNineSettings = {
  songCount?: number;
  allowedLiveIds?: string[];
  hashtags?: string[];
};

export const normalizeBestNineSettings = (
  value: BestNineSettings | Record<string, unknown>,
) => {
  const count = value.songCount ?? 9;
  if (
    typeof count !== "number" ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 9
  )
    return null;
  const ids = value.allowedLiveIds ?? [];
  const tags = value.hashtags ?? [];
  if (
    !Array.isArray(ids) ||
    ids.length > 100 ||
    ids.some((id) => typeof id !== "string" || !id.trim() || id.length > 200) ||
    !Array.isArray(tags) ||
    tags.length > 5 ||
    tags.some((tag) => typeof tag !== "string" || tag.length > 50)
  )
    return null;
  const hashtags = [
    ...new Set(
      tags
        .map((tag: string) => tag.trim().replace(/^[#＃]+/, ""))
        .filter(Boolean),
    ),
  ];
  if (
    hashtags.some(
      (tag) => !/^[\p{L}\p{M}\p{N}_]+$/u.test(tag) || !/[\p{L}_]/u.test(tag),
    )
  )
    return null;
  return {
    songCount: count,
    allowedLiveIds: [...new Set(ids.map((id: string) => id.trim()))],
    hashtags,
  };
};

export const bestNineSettingsSnapshot = (value: BestNineSettings) => ({
  ...(value.songCount !== undefined ? { songCount: value.songCount } : {}),
  ...(value.allowedLiveIds?.length
    ? { allowedLiveIds: value.allowedLiveIds }
    : {}),
  ...(value.hashtags?.length ? { hashtags: value.hashtags } : {}),
});

export const bestNineColumns = (count: number) =>
  count === 1 ? 1 : count <= 4 ? 2 : 3;

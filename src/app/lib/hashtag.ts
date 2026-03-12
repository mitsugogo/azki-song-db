export type HashtagPlatform = "youtube" | "x" | "self";

export const HASHTAG_CANDIDATE_PATTERN = String.raw`[#\uFF03][\p{L}\p{N}_\.\-&\uFF06\u3040-\u309f\u30a0-\u30ff\u3130-\u318f\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAff\uFE00-\uFEff\uFF10-\uFF19]+`;

const xHashtagRegex = /^#[\p{L}\p{N}_\uFF10-\uFF19]+$/u;
const xAllDigitsRegex = /^#[\p{N}\uFF10-\uFF19]+$/u;
const youtubeHashtagRegex =
  /^[#\uFF03][\p{L}\p{N}_\.\-&\uFF06\u3040-\u309f\u30a0-\u30ff\u3130-\u318f\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAff\uFE00-\uFEff\uFF10-\uFF19]+$/u;

export function sanitizeHashtagToken(hashtag: string) {
  return hashtag.trim().replace(/[.,!?:;\]\)】）]+$/gu, "");
}

export function isValidHashtagForPlatform(
  hashtag: string,
  platform: HashtagPlatform,
) {
  if (platform === "x") {
    return xHashtagRegex.test(hashtag) && !xAllDigitsRegex.test(hashtag);
  }

  return youtubeHashtagRegex.test(hashtag);
}

export function extractHashtagBodiesFromText(
  text: string,
  {
    platform = "youtube",
    max,
  }: {
    platform?: HashtagPlatform;
    max?: number;
  } = {},
) {
  if (!text) return [];

  const seen = new Set<string>();
  const tags: string[] = [];
  const candidateRegex = new RegExp(HASHTAG_CANDIDATE_PATTERN, "gu");

  for (const match of text.matchAll(candidateRegex)) {
    const candidate = sanitizeHashtagToken(match[0] ?? "");
    if (!candidate) continue;
    if (!isValidHashtagForPlatform(candidate, platform)) continue;

    const body = candidate.slice(1);
    if (!body) continue;

    const key = body.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(body);

    if (typeof max === "number" && tags.length >= max) {
      break;
    }
  }

  return tags;
}

export function getYoutubeVisibleHashtagBodies(
  title: string,
  description: string,
  max = 3,
) {
  const titleTags = extractHashtagBodiesFromText(title, {
    platform: "youtube",
  });
  if (titleTags.length > 0) {
    return [];
  }

  return extractHashtagBodiesFromText(description, {
    platform: "youtube",
    max,
  });
}

import { emptyThemes, normalizeThemes } from "./myBestNineSongs";
import {
  normalizeSlotCategories,
  type BestNineCategory,
} from "./bestNineCategories";

export type BestNineTopicDefinition = {
  title: string;
  themes: string[];
  slotCategories?: BestNineCategory[][];
};

export type BestNineTopicView = {
  id: string;
  title: string;
  themes: string[];
  slotCategories?: BestNineCategory[][];
  version: number;
  createdAt: string;
  canEdit: boolean;
  canDelete: boolean;
  canViewResults: boolean;
};
export const BEST_NINE_TOPICS_PAGE_SIZE = 20;
export type BestNineTopicPage = {
  topics: BestNineTopicView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
export type BestNineResults = {
  topic: BestNineTopicView;
  responseCount: number;
  guestCount: number;
  accountCount: number;
  slots: {
    slot: number;
    theme: string;
    answerCount: number;
    rankings: {
      songKey: string;
      title: string;
      artist: string;
      count: number;
      performances: {
        videoId: string;
        start: string;
        count: number;
        videoTitle?: string;
        broadcastAt?: string;
      }[];
    }[];
  }[];
};

export class BestNineError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}
const errorCodes = new Set([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "INVALID_TOPIC",
  "INVALID_PAGE",
  "INVALID_RESPONSE",
  "PARTICIPANT_REQUIRED",
  "TOPIC_CHANGED",
  "SONG_NOT_FOUND",
  "SONG_CATEGORY_NOT_ALLOWED",
  "SERVICE_UNAVAILABLE",
]);
export const bestNineErrorCode = (error: unknown) => {
  const code = error instanceof Error ? error.message : error;
  return typeof code === "string" && errorCodes.has(code)
    ? code
    : "SERVICE_UNAVAILABLE";
};
export const validTopicId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export const validateTopicInput = (input: unknown) => {
  if (!input || typeof input !== "object")
    throw new BestNineError("INVALID_TOPIC", 400);
  const value = input as Record<string, unknown>;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const themes = normalizeThemes(value.themes ?? emptyThemes());
  const slotCategories = normalizeSlotCategories(value.slotCategories);
  if (!title || title.length > 50 || !themes || !slotCategories)
    throw new BestNineError("INVALID_TOPIC", 400);
  return { title, themes, slotCategories };
};

export const canonicalSongKey = (title: string, artist: string) =>
  JSON.stringify(
    [title, artist].map((value) =>
      value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " "),
    ),
  );

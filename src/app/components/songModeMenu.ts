import type { IconType } from "react-icons";
import {
  LuCrown,
  LuDatabase,
  LuLibrary,
  LuMicVocal,
  LuMusic,
  LuUsers,
} from "react-icons/lu";

export type SongMode =
  | ""
  | "original-songs"
  | "cover-songs"
  | "collaboration-songs"
  | "tag:歌枠"
  | "tag:楽曲紹介shorts";

export type SongModeGroup = "mode" | "theme";

export type SongModeMenuItem = {
  mode: SongMode;
  label: string;
  icon: IconType;
  buttonClassName: string;
  group?: SongModeGroup;
};

const SONG_MODE_TRIGGER_BUTTON_BASE_CLASS_NAME =
  "px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0";

export const SONG_MODE_MENU_ITEMS: SongModeMenuItem[] = [
  {
    mode: "",
    label: "全曲",
    icon: LuDatabase,
    buttonClassName:
      "bg-indigo-400 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600",
  },
  {
    mode: "original-songs",
    label: "オリ曲",
    icon: LuCrown,
    buttonClassName:
      "bg-tan-400 hover:bg-tan-500 dark:bg-tan-700 dark:hover:bg-tan-600",
    group: "mode",
  },
  {
    mode: "cover-songs",
    label: "カバー曲",
    icon: LuMusic,
    buttonClassName:
      "bg-sky-400 hover:bg-sky-500 dark:bg-sky-700 dark:hover:bg-sky-600",
    group: "mode",
  },
  {
    mode: "collaboration-songs",
    label: "コラボ曲",
    icon: LuUsers,
    buttonClassName:
      "bg-green-400 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-500",
    group: "mode",
  },
  {
    mode: "tag:歌枠",
    label: "歌枠",
    icon: LuMicVocal,
    buttonClassName:
      "bg-violet-400 hover:bg-violet-500 dark:bg-violet-700 dark:hover:bg-violet-600",
    group: "theme",
  },
  {
    mode: "tag:楽曲紹介shorts",
    label: "楽曲紹介shorts",
    icon: LuLibrary,
    buttonClassName:
      "bg-lime-500 hover:bg-lime-600 dark:bg-lime-700 dark:hover:bg-lime-600",
    group: "theme",
  },
];

export const SONG_MODE_TRIGGER_BUTTON_CLASS_NAME = `${SONG_MODE_TRIGGER_BUTTON_BASE_CLASS_NAME} ${
  SONG_MODE_MENU_ITEMS.find((item) => item.mode === "")?.buttonClassName ??
  "bg-tan-400 hover:bg-tan-500 dark:bg-tan-500 dark:hover:bg-tan-600"
}`;

export const SONG_MODE_GROUP_LABELS: Record<SongModeGroup, string> = {
  mode: "モード",
  theme: "テーマ",
};

export const getSongMode = (term: string): SongMode => {
  const tokens = term
    .split("|")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.includes("tag:歌枠")) {
    return "tag:歌枠";
  }
  if (tokens.includes("tag:楽曲紹介shorts")) {
    return "tag:楽曲紹介shorts";
  }
  if (tokens.includes("collaboration-songs")) {
    return "collaboration-songs";
  }
  if (tokens.includes("cover-songs")) {
    return "cover-songs";
  }
  if (tokens.includes("original-songs") || tokens.includes("sololive2025")) {
    return "original-songs";
  }

  return "";
};

export const getSongModeLabel = (term: string) => {
  const currentMode = getSongMode(term);
  return (
    SONG_MODE_MENU_ITEMS.find((item) => item.mode === currentMode)?.label ??
    "全曲"
  );
};

export const getSongModeIcon = (term: string): IconType => {
  const currentMode = getSongMode(term);
  return (
    SONG_MODE_MENU_ITEMS.find((item) => item.mode === currentMode)?.icon ??
    LuDatabase
  );
};

export const getSongModeTriggerButtonClassName = (term: string) => {
  const currentMode = getSongMode(term);
  return `${SONG_MODE_TRIGGER_BUTTON_BASE_CLASS_NAME} ${
    SONG_MODE_MENU_ITEMS.find((item) => item.mode === currentMode)
      ?.buttonClassName ??
    SONG_MODE_MENU_ITEMS.find((item) => item.mode === "")?.buttonClassName
  }`;
};

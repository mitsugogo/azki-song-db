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
  | "tag:コラボ|tag:歌枠"
  | "tag:楽曲紹介shorts";

export type SongModeGroup = "mode" | "theme";

export type SongModeMenuItem = {
  mode: SongMode;
  labelKey:
    | "all"
    | "original"
    | "cover"
    | "collaboration"
    | "karaoke"
    | "collabKaraoke"
    | "shorts";
  icon: IconType;
  buttonClassName: string;
  group?: SongModeGroup;
};

type Translator = (key: string) => string;

const SONG_MODE_TRIGGER_BUTTON_BASE_CLASS_NAME =
  "px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-gray-400/20 dark:shadow-none ring-0 focus:ring-0";

export const SONG_MODE_MENU_ITEMS: SongModeMenuItem[] = [
  {
    mode: "",
    labelKey: "all",
    icon: LuDatabase,
    buttonClassName:
      "bg-indigo-400 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600",
  },
  {
    mode: "original-songs",
    labelKey: "original",
    icon: LuCrown,
    buttonClassName:
      "bg-tan-400 hover:bg-tan-500 dark:bg-tan-700 dark:hover:bg-tan-600",
    group: "mode",
  },
  {
    mode: "cover-songs",
    labelKey: "cover",
    icon: LuMusic,
    buttonClassName:
      "bg-sky-400 hover:bg-sky-500 dark:bg-sky-700 dark:hover:bg-sky-600",
    group: "mode",
  },
  {
    mode: "collaboration-songs",
    labelKey: "collaboration",
    icon: LuUsers,
    buttonClassName:
      "bg-green-400 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-500",
    group: "mode",
  },
  {
    mode: "tag:歌枠",
    labelKey: "karaoke",
    icon: LuMicVocal,
    buttonClassName:
      "bg-violet-400 hover:bg-violet-500 dark:bg-violet-700 dark:hover:bg-violet-600",
    group: "theme",
  },
  {
    mode: "tag:コラボ|tag:歌枠",
    labelKey: "collabKaraoke",
    icon: LuUsers,
    buttonClassName:
      "bg-pink-400 hover:bg-pink-500 dark:bg-pink-700 dark:hover:bg-pink-600",
    group: "theme",
  },
  {
    mode: "tag:楽曲紹介shorts",
    labelKey: "shorts",
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

export const getSongModeGroupLabels = (
  t: Translator,
): Record<SongModeGroup, string> => ({
  mode: t("groupMode"),
  theme: t("groupTheme"),
});

export const getSongMode = (term: string): SongMode => {
  const tokens = term
    .split("|")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.includes("tag:コラボ") && tokens.includes("tag:歌枠")) {
    return "tag:コラボ|tag:歌枠";
  }
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

export const getSongModeLabel = (term: string, t: Translator) => {
  const currentMode = getSongMode(term);
  return SONG_MODE_MENU_ITEMS.find((item) => item.mode === currentMode)
    ? t(
        SONG_MODE_MENU_ITEMS.find((item) => item.mode === currentMode)!
          .labelKey,
      )
    : t("all");
};

export const getSongModeItemLabel = (item: SongModeMenuItem, t: Translator) =>
  t(item.labelKey);

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

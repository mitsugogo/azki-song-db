import type { ButtonProps } from "@mantine/core";
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
  color: ButtonProps["color"];
  group?: SongModeGroup;
};

type Translator = (key: string) => string;

export const SONG_MODE_MENU_ITEMS: SongModeMenuItem[] = [
  {
    mode: "",
    labelKey: "all",
    icon: LuDatabase,
    color: "indigo",
  },
  {
    mode: "original-songs",
    labelKey: "original",
    icon: LuCrown,
    color: "tan",
    group: "mode",
  },
  {
    mode: "cover-songs",
    labelKey: "cover",
    icon: LuMusic,
    color: "blue",
    group: "mode",
  },
  {
    mode: "collaboration-songs",
    labelKey: "collaboration",
    icon: LuUsers,
    color: "green",
    group: "mode",
  },
  {
    mode: "tag:歌枠",
    labelKey: "karaoke",
    icon: LuMicVocal,
    color: "violet",
    group: "theme",
  },
  {
    mode: "tag:コラボ|tag:歌枠",
    labelKey: "collabKaraoke",
    icon: LuUsers,
    color: "pink",
    group: "theme",
  },
  {
    mode: "tag:楽曲紹介shorts",
    labelKey: "shorts",
    icon: LuLibrary,
    color: "lime",
    group: "theme",
  },
];

export const getSongModeGroupLabels = (
  t: Translator,
): Record<SongModeGroup, string> => ({
  mode: t("groupMode"),
  theme: t("groupTheme"),
});

export const getSongMode = (term?: string | null): SongMode => {
  const tokens = (term ?? "")
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

export const getSongModeTriggerButtonColor = (term: string) => {
  const currentMode = getSongMode(term);
  return (
    SONG_MODE_MENU_ITEMS.find((item) => item.mode === currentMode)?.color ??
    SONG_MODE_MENU_ITEMS.find((item) => item.mode === "")?.color ??
    "indigo"
  );
};

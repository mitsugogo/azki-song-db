import type { ButtonProps } from "@mantine/core";
import { cloneElement, createElement, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import type { IconType } from "react-icons";
import { FaPlay, FaSnowman, FaUmbrellaBeach } from "react-icons/fa6";
import { IoFlowerOutline } from "react-icons/io5";
import {
  LuCrown,
  LuDatabase,
  LuFlower,
  LuHeart,
  LuLibrary,
  LuMicVocal,
  LuMusic,
  LuPartyPopper,
  LuUsers,
} from "react-icons/lu";

export type SongMode =
  | ""
  | "original-songs"
  | "cover-songs"
  | "collaboration-songs"
  | "singing-stream"
  | "collab-singing-stream"
  | "special-live"
  | "song-introduction-shorts"
  | "ballad"
  | "spring-song"
  | "summer-song"
  | "winter-song"
  | "anime-songs"
  | "hololive-songs"
  | "vocaloid-songs";

export type SongModeGroup = "mode" | "theme" | "scene" | "genre";

export type SongModeIcon = IconType | ReactElement<{ className?: string }>;

export type SongModeMenuItem = {
  mode: SongMode;
  searchTerm: string;
  labelKey:
    | "all"
    | "original"
    | "cover"
    | "collaboration"
    | "karaoke"
    | "collabKaraoke"
    | "specialLive"
    | "shorts"
    | "ballad"
    | "springSongs"
    | "summerSongs"
    | "winterSongs"
    | "animeSongs"
    | "hololiveSongs"
    | "vocaloidSongs";
  icon: SongModeIcon;
  color: ButtonProps["color"];
  group?: SongModeGroup;
};

type Translator = (key: string) => string;

export const SONG_MODE_MENU_ITEMS: SongModeMenuItem[] = [
  {
    mode: "",
    searchTerm: "",
    labelKey: "all",
    icon: LuDatabase,
    color: "indigo",
  },
  {
    mode: "original-songs",
    searchTerm: "original-songs",
    labelKey: "original",
    icon: LuCrown,
    color: "tan",
    group: "mode",
  },
  {
    mode: "cover-songs",
    searchTerm: "cover-songs",
    labelKey: "cover",
    icon: LuMusic,
    color: "blue",
    group: "mode",
  },
  {
    mode: "collaboration-songs",
    searchTerm: "collaboration-songs",
    labelKey: "collaboration",
    icon: LuUsers,
    color: "green",
    group: "mode",
  },
  {
    mode: "singing-stream",
    searchTerm: "tag:歌枠",
    labelKey: "karaoke",
    icon: LuMicVocal,
    color: "violet",
    group: "theme",
  },
  {
    mode: "special-live",
    searchTerm: "tag:記念ライブ OR tag:企画ライブ",
    labelKey: "specialLive",
    icon: LuPartyPopper,
    color: "magenta",
    group: "theme",
  },
  {
    mode: "collab-singing-stream",
    searchTerm: "tag:コラボ|tag:歌枠",
    labelKey: "collabKaraoke",
    icon: LuUsers,
    color: "pink",
    group: "theme",
  },
  {
    mode: "song-introduction-shorts",
    searchTerm: "tag:楽曲紹介shorts",
    labelKey: "shorts",
    icon: LuLibrary,
    color: "lime",
    group: "theme",
  },
  {
    mode: "ballad",
    searchTerm: "tag:しっとり OR tag:バラード",
    labelKey: "ballad",
    icon: LuHeart,
    color: "blue",
    group: "scene",
  },
  {
    mode: "spring-song",
    searchTerm: "tag:春ソング",
    labelKey: "springSongs",
    icon: LuFlower,
    color: "pink",
    group: "scene",
  },
  {
    mode: "summer-song",
    searchTerm: "tag:夏ソング",
    labelKey: "summerSongs",
    icon: FaUmbrellaBeach,
    color: "red",
    group: "scene",
  },
  {
    mode: "winter-song",
    searchTerm: "tag:冬ソング",
    labelKey: "winterSongs",
    icon: FaSnowman,
    color: "cyan",
    group: "scene",
  },
  {
    mode: "anime-songs",
    searchTerm: "tag:アニソン",
    labelKey: "animeSongs",
    icon: LuMicVocal,
    color: "palePurple",
    group: "genre",
  },
  {
    mode: "hololive-songs",
    searchTerm: "tag:ホロライブ楽曲",
    labelKey: "hololiveSongs",
    icon: createElement(FaPlay),
    color: "hololive",
    group: "genre",
  },
  {
    mode: "vocaloid-songs",
    searchTerm: "tag:VOCALOID",
    labelKey: "vocaloidSongs",
    icon: LuMicVocal,
    color: "miku",
    group: "genre",
  },
];

export const getSongModeGroupLabels = (
  t: Translator,
): Record<SongModeGroup, string> => ({
  mode: t("groupMode"),
  theme: t("groupTheme"),
  scene: t("groupScene"),
  genre: t("groupGenre"),
});

export const getSongMode = (term?: string | null): SongMode => {
  const tokens = (term ?? "")
    .split(/\||\s+or\s+/i)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.includes("tag:コラボ") && tokens.includes("tag:歌枠")) {
    return "collab-singing-stream";
  }
  if (tokens.includes("tag:記念ライブ") && tokens.includes("tag:企画ライブ")) {
    return "special-live";
  }
  if (tokens.includes("tag:歌枠")) {
    return "singing-stream";
  }
  if (tokens.includes("tag:楽曲紹介shorts")) {
    return "song-introduction-shorts";
  }
  if (tokens.includes("tag:しっとり") && tokens.includes("tag:バラード")) {
    return "ballad";
  }
  if (tokens.includes("tag:春ソング")) {
    return "spring-song";
  }
  if (tokens.includes("tag:夏ソング")) {
    return "summer-song";
  }
  if (tokens.includes("tag:冬ソング")) {
    return "winter-song";
  }
  if (tokens.includes("tag:アニソン")) {
    return "anime-songs";
  }
  if (tokens.includes("tag:ホロライブ楽曲")) {
    return "hololive-songs";
  }
  if (tokens.includes("tag:vocaloid")) {
    return "vocaloid-songs";
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

export const getSongModeSearchTerm = (mode: SongMode) =>
  SONG_MODE_MENU_ITEMS.find((item) => item.mode === mode)?.searchTerm ?? "";

export const renderSongModeIcon = (
  icon: SongModeIcon,
  className: string,
): ReactNode => {
  if (isValidElement(icon)) {
    return cloneElement(icon, {
      className: [icon.props.className, className].filter(Boolean).join(" "),
    });
  }

  return createElement(icon, { className });
};

export const getSongModeIcon = (term: string): SongModeIcon => {
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

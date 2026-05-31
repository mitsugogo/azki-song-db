"use client";

import { Button, Menu, Tooltip } from "@mantine/core";
import { useTranslations } from "next-intl";
import { LuChevronDown } from "react-icons/lu";
import usePlaylists from "../hook/usePlaylists";
import {
  getSongModeGroupLabels,
  getSongModeItemLabel,
  SONG_MODE_MENU_ITEMS,
  type SongModeGroup,
  type SongModeMenuItem,
  type SongMode,
} from "./songModeMenu";

type SongModeControlsProps = {
  currentSongMode: SongMode;
  onSelectSongMode: (mode: SongMode) => void;
  onSurprise: () => void;
  onPlaylist: () => void;
  variant?: "desktop" | "mobile";
  sizeClassName?: string;
  songModeMenuItems?: SongModeMenuItem[];
};

export default function SongModeControls({
  currentSongMode,
  onSelectSongMode,
  onSurprise,
  onPlaylist,
  variant = "desktop",
  sizeClassName,
  songModeMenuItems = SONG_MODE_MENU_ITEMS,
}: SongModeControlsProps) {
  const t = useTranslations("Watch.searchAndSongList");
  const tSongMode = useTranslations("Watch.songMode");
  const { isNowPlayingPlaylist } = usePlaylists();
  const textClassName =
    sizeClassName ?? (variant === "mobile" ? "text-xs" : "text-sm");
  const rowMarginClassName = variant === "mobile" ? "mt-1" : "mt-2";
  const buttonBaseClassName =
    "px-3 py-1 h-8 cursor-pointer rounded transition shadow-md ring-0 focus:ring-0";
  const neutralButtonClassName =
    variant === "mobile"
      ? "bg-light-gray-200 hover:bg-light-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-foreground dark:text-white"
      : "bg-light-gray-300 hover:bg-light-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-foreground dark:text-white";
  const allSongModeItem =
    songModeMenuItems.find((item) => item.mode === "") ?? songModeMenuItems[0];
  const groupedSongModeMenuItems = songModeMenuItems.filter(
    (item) => item.mode !== "",
  );
  const songModeGroupedItems = {
    mode: groupedSongModeMenuItems.filter((item) => item.group === "mode"),
    theme: groupedSongModeMenuItems.filter((item) => item.group === "theme"),
  } as const;
  const songModeGroupLabels = getSongModeGroupLabels(tSongMode);
  const currentSongModeItem =
    songModeMenuItems.find((item) => item.mode === currentSongMode) ??
    allSongModeItem;
  const CurrentSongModeIcon = currentSongModeItem.icon;

  return (
    <div className={`flex flex-col gap-1.25 ${rowMarginClassName}`}>
      <Menu withinPortal={false} width={220} position="bottom-start" withArrow>
        <Menu.Target>
          <Button
            aria-label={`${tSongMode("selectMode")}: ${getSongModeItemLabel(currentSongModeItem, tSongMode)}`}
            className={`${buttonBaseClassName} w-full min-w-0 text-white shadow-gray-400/20 dark:shadow-none ${currentSongModeItem.buttonClassName} ${textClassName}`}
            leftSection={<CurrentSongModeIcon className="h-4 w-4" />}
            rightSection={<LuChevronDown className="h-4 w-4" />}
            justify="space-between"
          >
            <span className="truncate">
              {getSongModeItemLabel(currentSongModeItem, tSongMode)}
            </span>
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            leftSection={<allSongModeItem.icon className="h-4 w-4" />}
            onClick={() => onSelectSongMode(allSongModeItem.mode)}
          >
            {getSongModeItemLabel(allSongModeItem, tSongMode)}
          </Menu.Item>
          <Menu.Divider />
          {(Object.keys(songModeGroupedItems) as SongModeGroup[]).map(
            (group) => {
              const items = songModeGroupedItems[group];
              if (items.length === 0) {
                return null;
              }

              return (
                <div key={group}>
                  <Menu.Label>{songModeGroupLabels[group]}</Menu.Label>
                  {items.map((item) => {
                    const ModeIcon = item.icon;

                    return (
                      <Menu.Item
                        key={item.mode}
                        leftSection={<ModeIcon className="h-4 w-4" />}
                        onClick={() => onSelectSongMode(item.mode)}
                      >
                        {getSongModeItemLabel(item, tSongMode)}
                      </Menu.Item>
                    );
                  })}
                  {group === "mode" && songModeGroupedItems.theme.length > 0 ? (
                    <Menu.Divider />
                  ) : null}
                </div>
              );
            },
          )}
        </Menu.Dropdown>
      </Menu>

      <div className="flex gap-1.25">
        <Tooltip label={t("surpriseTooltip")} withArrow position="bottom">
          <Button
            onClick={onSurprise}
            className={`${buttonBaseClassName} min-w-0 flex-1 bg-primary hover:bg-primary-600 dark:bg-primary-900 text-white shadow-black/20 dark:shadow-none ${textClassName}`}
          >
            <span className="truncate">{t("randomOtherSong")}</span>
          </Button>
        </Tooltip>

        <Button
          className={`${buttonBaseClassName} min-w-0 flex-1 text-white shadow-gray-400/20 dark:shadow-none ${textClassName} ${
            isNowPlayingPlaylist()
              ? "bg-green-400 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-600"
              : neutralButtonClassName
          }`}
          onClick={onPlaylist}
        >
          <span className="truncate">{t("playlist")}</span>
        </Button>
      </div>
    </div>
  );
}

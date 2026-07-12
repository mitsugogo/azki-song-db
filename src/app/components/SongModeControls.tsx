"use client";

import { Button, Menu, Tooltip } from "@mantine/core";
import { useTranslations } from "next-intl";
import { LuChevronDown, LuSparkles } from "react-icons/lu";
import usePlaylists from "../hook/usePlaylists";
import {
  getSongModeGroupLabels,
  getSongModeItemLabel,
  getSongModeSearchTerm,
  renderSongModeIcon,
  SONG_MODE_MENU_ITEMS,
  type SongModeGroup,
  type SongModeMenuItem,
  type SongMode,
} from "./songModeMenu";

type SongModeControlsProps = {
  currentSongMode: SongMode;
  onSelectSongMode: (searchTerm: string) => void;
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
  const { isNowPlayingPlaylist, authenticated } = usePlaylists();
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
    scene: groupedSongModeMenuItems.filter((item) => item.group === "scene"),
    genre: groupedSongModeMenuItems.filter((item) => item.group === "genre"),
  } as const;
  const songModeGroupLabels = getSongModeGroupLabels(tSongMode);
  const currentSongModeItem =
    songModeMenuItems.find((item) => item.mode === currentSongMode) ??
    allSongModeItem;

  return (
    <div className={`flex flex-col gap-1.25 ${rowMarginClassName}`}>
      <Menu
        withinPortal={false}
        width={variant === "mobile" ? 320 : 440}
        position="bottom-end"
        withArrow
        shadow="md"
      >
        <Menu.Target>
          <Button
            aria-label={`${tSongMode("selectMode")}: ${getSongModeItemLabel(currentSongModeItem, tSongMode)}`}
            className={`${buttonBaseClassName} w-full min-w-0 shadow-gray-400/20 dark:shadow-none ${textClassName}`}
            color={currentSongModeItem.color}
            leftSection={renderSongModeIcon(
              currentSongModeItem.icon,
              "h-4 w-4",
            )}
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
            leftSection={renderSongModeIcon(allSongModeItem.icon, "h-4 w-4")}
            onClick={() =>
              onSelectSongMode(getSongModeSearchTerm(allSongModeItem.mode))
            }
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
                  <div className="grid grid-cols-2">
                    {items.map((item) => {
                      return (
                        <Menu.Item
                          key={item.mode}
                          leftSection={renderSongModeIcon(item.icon, "h-4 w-4")}
                          onClick={() =>
                            onSelectSongMode(getSongModeSearchTerm(item.mode))
                          }
                        >
                          {getSongModeItemLabel(item, tSongMode)}
                        </Menu.Item>
                      );
                    })}
                  </div>
                  {group !== "genre" &&
                  songModeGroupedItems.genre.length > 0 ? (
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
            <>
              <LuSparkles className="mr-1" />
              <span className="truncate">{t("randomOtherSong")}</span>
            </>
          </Button>
        </Tooltip>

        <Tooltip
          label={authenticated ? undefined : t("signInRequired")}
          disabled={authenticated}
          withArrow
          position="bottom"
        >
          <span className="min-w-0 flex-1">
            <Button
              disabled={!authenticated}
              className={`${buttonBaseClassName} w-full text-white shadow-gray-400/20 dark:shadow-none ${textClassName} ${
                isNowPlayingPlaylist()
                  ? "bg-green-400 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                  : neutralButtonClassName
              }`}
              onClick={onPlaylist}
            >
              <span className="truncate">{t("playlist")}</span>
            </Button>
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button, Grid, Menu } from "@mantine/core";
import { useTranslations } from "next-intl";
import { LuChevronDown, LuSparkles } from "react-icons/lu";
import usePlaylists from "../hook/usePlaylists";
import {
  getSongMode,
  getSongModeGroupLabels,
  getSongModeIcon,
  getSongModeItemLabel,
  getSongModeTriggerButtonClassName,
  SONG_MODE_MENU_ITEMS,
  type SongMode,
  type SongModeGroup,
  type SongModeMenuItem,
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
  const [isSongModeMenuOpen, setIsSongModeMenuOpen] = useState(false);
  const textClassName =
    sizeClassName ?? (variant === "mobile" ? "text-xs" : "text-sm");
  const rowMarginClassName = variant === "mobile" ? "mt-1" : "mt-2";
  const inactiveButtonClassName =
    variant === "mobile"
      ? "bg-light-gray-200 hover:bg-light-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-foreground dark:text-white"
      : "bg-light-gray-300 hover:bg-light-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-foreground dark:text-white";
  const inactiveOtherButtonClassName =
    variant === "mobile"
      ? "px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-gray-400/20 dark:shadow-none ring-0 focus:ring-0 bg-light-gray-200 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-500"
      : `px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-gray-400/20 dark:shadow-none ring-0 focus:ring-0 bg-light-gray-300 hover:bg-light-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 ${textClassName}`;
  const allSongModeItem =
    songModeMenuItems.find((item) => item.mode === "") ?? songModeMenuItems[0];
  const originalSongModeItem =
    songModeMenuItems.find((item) => item.mode === "original-songs") ??
    songModeMenuItems[0];
  const karaokeSongModeItem =
    songModeMenuItems.find((item) => item.mode === "tag:歌枠") ??
    songModeMenuItems[0];
  const otherSongModeMenuItems = songModeMenuItems.filter(
    (item) => item.mode !== "" && item.mode !== "original-songs",
  );
  const songModeGroupedItems = {
    mode: otherSongModeMenuItems.filter((item) => item.group === "mode"),
    theme: otherSongModeMenuItems.filter((item) => item.group === "theme"),
  } as const;
  const songModeGroupLabels = getSongModeGroupLabels(tSongMode);
  const isOtherModeActive =
    currentSongMode !== "" && currentSongMode !== "original-songs";
  const currentOtherSongModeItem = isOtherModeActive
    ? otherSongModeMenuItems.find(
        (item) => item.mode === getSongMode(currentSongMode),
      )
    : undefined;

  const renderSongModeMenuItems = () =>
    songModeMenuItems.map((item) => {
      const SongModeIcon = item.icon;

      return (
        <Menu.Item
          key={item.mode || "all-songs"}
          leftSection={<SongModeIcon className="w-4 h-4" />}
          onClick={() => {
            onSelectSongMode(item.mode);
            setIsSongModeMenuOpen(false);
          }}
        >
          {getSongModeItemLabel(item, tSongMode)}
        </Menu.Item>
      );
    });

  const renderSongModeButton = (item: SongModeMenuItem) => {
    const isActive = currentSongMode === item.mode;
    const SongModeIcon = getSongModeIcon(item.mode);
    const button = (
      <Button
        onClick={() => {
          if (isActive) {
            setIsSongModeMenuOpen((current) => !current);
            return;
          }

          onSelectSongMode(item.mode);
        }}
        aria-haspopup={isActive ? "menu" : undefined}
        aria-expanded={isActive ? isSongModeMenuOpen : undefined}
        leftSection={SongModeIcon ? <SongModeIcon className="w-4 h-4" /> : null}
        rightSection={<span />}
        justify="space-between"
        fullWidth
        className={`px-3 py-1 h-8 w-full cursor-pointer rounded transition shadow-md ring-0 focus:ring-0 ${textClassName} ${
          isActive
            ? `text-white shadow-gray-400/20 dark:shadow-none ${item.buttonClassName}`
            : inactiveButtonClassName
        }`}
      >
        <span className={textClassName}>
          {getSongModeItemLabel(item, tSongMode)}
        </span>
      </Button>
    );

    if (!isActive) {
      return button;
    }

    return (
      <Menu
        withinPortal={false}
        opened={isSongModeMenuOpen}
        onChange={setIsSongModeMenuOpen}
        width={220}
        position="bottom-start"
        withArrow
      >
        <Menu.Target>{button}</Menu.Target>
        <Menu.Dropdown>{renderSongModeMenuItems()}</Menu.Dropdown>
      </Menu>
    );
  };

  return (
    <div>
      <Grid grow gap={{ base: 5 }} className={rowMarginClassName}>
        <Grid.Col span={3}>{renderSongModeButton(allSongModeItem)}</Grid.Col>
        <Grid.Col span={3}>
          {renderSongModeButton(originalSongModeItem)}
        </Grid.Col>
        <Grid.Col span={3}>
          <Menu width={180} position="bottom-start" withArrow>
            <Menu.Target>
              <Button
                className={
                  isOtherModeActive
                    ? `${getSongModeTriggerButtonClassName(currentSongMode)} ${variant === "mobile" ? "text-xs" : textClassName}`
                    : inactiveOtherButtonClassName
                }
                leftSection={
                  currentOtherSongModeItem ? (
                    <currentOtherSongModeItem.icon className="w-4 h-4" />
                  ) : (
                    <span />
                  )
                }
                rightSection={<LuChevronDown />}
                fullWidth
                justify="space-between"
              >
                {currentOtherSongModeItem
                  ? getSongModeItemLabel(currentOtherSongModeItem, tSongMode)
                  : tSongMode("selectMode")}
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
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
                            leftSection={<ModeIcon className="w-4 h-4" />}
                            onClick={() => onSelectSongMode(item.mode)}
                          >
                            {getSongModeItemLabel(item, tSongMode)}
                          </Menu.Item>
                        );
                      })}
                      {group === "mode" &&
                      songModeGroupedItems.theme.length > 0 ? (
                        <Menu.Divider />
                      ) : null}
                    </div>
                  );
                },
              )}
            </Menu.Dropdown>
          </Menu>
        </Grid.Col>
      </Grid>
      <Grid grow gap={{ base: 5 }} className={rowMarginClassName}>
        <Grid.Col span={6}>
          <Button
            onClick={onSurprise}
            leftSection={variant === "mobile" ? <LuSparkles /> : undefined}
            rightSection={variant === "mobile" ? <span /> : undefined}
            fullWidth={variant === "mobile"}
            justify={variant === "mobile" ? "space-between" : undefined}
            className={`px-3 py-1 h-8 w-full bg-primary hover:bg-primary-600 dark:bg-primary-900 cursor-pointer text-white rounded transition shadow-md shadow-black/20 dark:shadow-none ring-0 focus:ring-0 ${
              variant === "mobile" ? "text-xs" : ""
            }`}
          >
            <span className={textClassName}>
              {variant === "desktop" ? (
                <LuSparkles className="mr-1 inline" />
              ) : null}
              {t("randomOtherSong")}
            </span>
          </Button>
        </Grid.Col>
        <Grid.Col span={6}>
          <Button
            className={`px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-gray-400/20 dark:shadow-none ring-0 focus:ring-0 ${textClassName} ${
              isNowPlayingPlaylist()
                ? "bg-green-400 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                : "bg-light-gray-500 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
            }`}
            onClick={onPlaylist}
          >
            {t("playlist")}
          </Button>
        </Grid.Col>
      </Grid>
    </div>
  );
}

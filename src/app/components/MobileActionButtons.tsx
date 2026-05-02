"use client";

import { useState } from "react";
import { Grid, Menu, Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import { LuChevronDown, LuSparkles } from "react-icons/lu";
import usePlaylists from "../hook/usePlaylists";
import {
  getSongModeIcon,
  getSongMode,
  getSongModeGroupLabels,
  getSongModeItemLabel,
  SONG_MODE_MENU_ITEMS,
  type SongMode,
  type SongModeGroup,
  type SongModeMenuItem,
} from "./songModeMenu";

type Props = {
  onSurprise: () => void;
  onSelectSongMode: (mode: SongMode) => void;
  currentSongMode: SongMode;
  songModeMenuItems?: SongModeMenuItem[];
  onPlaylist: () => void;
};

export default function MobileActionButtons({
  onSurprise,
  onSelectSongMode,
  currentSongMode,
  songModeMenuItems = SONG_MODE_MENU_ITEMS,
  onPlaylist,
}: Props) {
  const t = useTranslations("Watch.searchAndSongList");
  const tSongMode = useTranslations("Watch.songMode");
  const [isSongModeMenuOpen, setIsSongModeMenuOpen] = useState(false);
  const { isNowPlayingPlaylist } = usePlaylists();
  const allSongModeItem =
    songModeMenuItems.find((item) => item.mode === "") ?? songModeMenuItems[0];
  const originalSongModeItem =
    songModeMenuItems.find((item) => item.mode === "original-songs") ??
    songModeMenuItems[0];
  const karaokeSongModeItem =
    songModeMenuItems.find((item) => item.mode === "tag:歌枠") ??
    songModeMenuItems[0];
  const otherSongModeMenuItems = songModeMenuItems.filter(
    (item) =>
      item.mode !== "" &&
      item.mode !== "original-songs" &&
      item.mode !== "tag:歌枠",
  );
  const songModeGroupedItems = {
    mode: otherSongModeMenuItems.filter((item) => item.group === "mode"),
    theme: otherSongModeMenuItems.filter((item) => item.group === "theme"),
  } as const;
  const songModeGroupLabels = getSongModeGroupLabels(tSongMode);
  const isOtherModeActive =
    currentSongMode !== "" &&
    currentSongMode !== "original-songs" &&
    currentSongMode !== "tag:歌枠";
  const currentOtherSongModeItem = isOtherModeActive
    ? otherSongModeMenuItems.find(
        (item) => item.mode === getSongMode(currentSongMode),
      )
    : undefined;
  const otherButtonClassName = isOtherModeActive
    ? `px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-gray-400/20 dark:shadow-none ring-0 focus:ring-0 ${currentOtherSongModeItem?.buttonClassName}`
    : "px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-gray-400/20 dark:shadow-none ring-0 focus:ring-0 bg-light-gray-200 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-500";

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
        className={`px-3 py-1 h-8 w-full cursor-pointer rounded transition shadow-md ring-0 focus:ring-0 text-xs ${
          isActive
            ? `text-white shadow-gray-400/20 dark:shadow-none ${item.buttonClassName}`
            : "bg-light-gray-200 hover:bg-light-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-foreground dark:text-white"
        }`}
      >
        <span className="text-xs">{getSongModeItemLabel(item, tSongMode)}</span>
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
        <Menu.Dropdown>
          {songModeMenuItems.map((menuItem) => {
            const ModeIcon = menuItem.icon;

            return (
              <Menu.Item
                key={menuItem.mode || "all-songs"}
                leftSection={<ModeIcon className="w-4 h-4" />}
                onClick={() => {
                  onSelectSongMode(menuItem.mode);
                  setIsSongModeMenuOpen(false);
                }}
              >
                {getSongModeItemLabel(menuItem, tSongMode)}
              </Menu.Item>
            );
          })}
        </Menu.Dropdown>
      </Menu>
    );
  };

  return (
    <div>
      <Grid grow gap={{ base: 5 }}>
        <Grid.Col span={4}>{renderSongModeButton(allSongModeItem)}</Grid.Col>
        <Grid.Col span={4}>
          {renderSongModeButton(originalSongModeItem)}
        </Grid.Col>
        <Grid.Col span={4}>
          {renderSongModeButton(karaokeSongModeItem)}
        </Grid.Col>
      </Grid>
      <Grid grow gap={{ base: 5 }} className="mt-1">
        <Grid.Col span={12}>
          <Menu width={180} position="bottom-start" withArrow>
            <Menu.Target>
              <Button
                className={`${otherButtonClassName} text-xs`}
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
                  : tSongMode("other")}
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
      <Grid grow gap={{ base: 5 }} className="mt-1">
        <Grid.Col span={6}>
          <Button
            onClick={() => onSurprise()}
            leftSection={<LuSparkles />}
            rightSection={<span />}
            fullWidth
            justify="space-between"
            className="px-3 py-1 h-8 w-full bg-primary hover:bg-primary-600 dark:bg-primary-900 cursor-pointer text-white rounded transition shadow-md shadow-black/20 dark:shadow-none ring-0 focus:ring-0"
          >
            <span className="text-xs">Surprise me</span>
          </Button>
        </Grid.Col>
        <Grid.Col span={6}>
          <Button
            className={`px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-gray-400/20 dark:shadow-none ring-0 focus:ring-0 text-xs  ${
              isNowPlayingPlaylist()
                ? "bg-green-400 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                : "bg-light-gray-500 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
            }`}
            onClick={() => {
              onPlaylist();
            }}
          >
            {t("playlist")}
          </Button>
        </Grid.Col>
      </Grid>
    </div>
  );
}

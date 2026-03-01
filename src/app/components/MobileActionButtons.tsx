"use client";

import { Fragment } from "react";
import { Grid } from "@mantine/core";
import { Menu } from "@mantine/core";
import { Button } from "flowbite-react";
import type { IconType } from "react-icons";
import { LuChevronDown, LuSparkles } from "react-icons/lu";
import usePlaylists from "../hook/usePlaylists";
import {
  SONG_MODE_GROUP_LABELS,
  SONG_MODE_MENU_ITEMS,
  SONG_MODE_TRIGGER_BUTTON_CLASS_NAME,
  type SongMode,
  type SongModeGroup,
  type SongModeMenuItem,
} from "./songModeMenu";

type Props = {
  onSurprise: () => void;
  onSelectSongMode: (mode: SongMode) => void;
  currentSongModeLabel?: string;
  currentSongModeIcon?: IconType;
  currentSongModeButtonClassName?: string;
  songModeMenuItems?: SongModeMenuItem[];
  onPlaylist: () => void;
};

export default function MobileActionButtons({
  onSurprise,
  onSelectSongMode,
  currentSongModeLabel,
  currentSongModeIcon,
  currentSongModeButtonClassName,
  songModeMenuItems = SONG_MODE_MENU_ITEMS,
  onPlaylist,
}: Props) {
  const { isNowPlayingPlaylist } = usePlaylists();
  const defaultModeIcon = songModeMenuItems[0]?.icon;
  const CurrentSongModeIcon = currentSongModeIcon ?? defaultModeIcon;
  const songModeUngroupedItems = songModeMenuItems.filter(
    (item) => !item.group,
  );
  const songModeGroupedItems = {
    mode: songModeMenuItems.filter((item) => item.group === "mode"),
    theme: songModeMenuItems.filter((item) => item.group === "theme"),
  } as const;
  return (
    <div>
      <Grid grow gutter={{ base: 5 }}>
        <Grid.Col span={4}>
          <Button
            onClick={() => onSurprise()}
            className="px-3 py-1 h-8 w-full bg-primary hover:bg-primary-600 dark:bg-primary-900 cursor-pointer text-white rounded transition shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0"
          >
            <span className="text-xs">
              <LuSparkles className="mr-1 inline" />
              Surprise<span className="hidden lg:inline"> Me</span>
            </span>
          </Button>
        </Grid.Col>
      </Grid>
      <Grid grow gutter={{ base: 5 }} className="mt-0.5">
        <Grid.Col span={4}>
          <Menu width={170} position="bottom-start" withArrow>
            <Menu.Target>
              <Button
                className={
                  currentSongModeButtonClassName ??
                  SONG_MODE_TRIGGER_BUTTON_CLASS_NAME
                }
              >
                <span className="text-xs w-full grid grid-cols-[1rem_1fr_1rem] items-center">
                  {CurrentSongModeIcon && (
                    <CurrentSongModeIcon className="w-4 h-4 justify-self-center" />
                  )}
                  <span className="text-center">
                    {currentSongModeLabel ?? "全曲"}
                  </span>
                  <LuChevronDown className="w-4 h-4 justify-self-center" />
                </span>
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              {songModeUngroupedItems.map((item) => {
                const ModeIcon = item.icon;
                return (
                  <Menu.Item
                    key={item.mode}
                    leftSection={<ModeIcon className="w-4 h-4" />}
                    onClick={() => onSelectSongMode(item.mode)}
                  >
                    {item.label}
                  </Menu.Item>
                );
              })}

              {(Object.keys(songModeGroupedItems) as SongModeGroup[]).map(
                (group) => {
                  const items = songModeGroupedItems[group];
                  if (items.length === 0) {
                    return null;
                  }

                  return (
                    <Fragment key={group}>
                      <Menu.Divider />
                      <Menu.Label>{SONG_MODE_GROUP_LABELS[group]}</Menu.Label>
                      {items.map((item) => {
                        const ModeIcon = item.icon;
                        return (
                          <Menu.Item
                            key={item.mode}
                            leftSection={<ModeIcon className="w-4 h-4" />}
                            onClick={() => onSelectSongMode(item.mode)}
                          >
                            {item.label}
                          </Menu.Item>
                        );
                      })}
                    </Fragment>
                  );
                },
              )}
            </Menu.Dropdown>
          </Menu>
        </Grid.Col>
        <Grid.Col span={4}>
          <Button
            className={`px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0 text-xs  ${
              isNowPlayingPlaylist()
                ? "bg-green-400 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                : "bg-light-gray-500 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
            }`}
            onClick={() => {
              onPlaylist();
            }}
          >
            プレイリスト
          </Button>
        </Grid.Col>
      </Grid>
    </div>
  );
}

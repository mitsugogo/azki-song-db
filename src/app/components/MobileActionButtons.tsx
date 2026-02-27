"use client";

import { Grid } from "@mantine/core";
import { Menu } from "@mantine/core";
import { Button } from "flowbite-react";
import type { IconType } from "react-icons";
import {
  LuChevronDown,
  LuCrown,
  LuMusic,
  LuSparkles,
  LuUsers,
} from "react-icons/lu";
import usePlaylists from "../hook/usePlaylists";

type SongMode =
  | ""
  | "original-songs"
  | "cover-songs"
  | "collaboration-songs"
  | "tag:歌枠";

type Props = {
  onSurprise: () => void;
  onSelectSongMode: (mode: SongMode) => void;
  currentSongModeLabel?: string;
  onPlaylist: () => void;
};

export default function MobileActionButtons({
  onSurprise,
  onSelectSongMode,
  currentSongModeLabel,
  onPlaylist,
}: Props) {
  const { isNowPlayingPlaylist } = usePlaylists();

  const currentSongModeIcon: IconType =
    currentSongModeLabel === "カバー曲"
      ? LuMusic
      : currentSongModeLabel === "コラボ曲"
        ? LuUsers
        : currentSongModeLabel === "歌枠"
          ? LuMusic
          : LuCrown;
  const CurrentSongModeIcon = currentSongModeIcon;

  const modeMenuItems: { mode: SongMode; label: string; icon: IconType }[] = [
    { mode: "", label: "全曲", icon: LuCrown },
    { mode: "original-songs", label: "オリ曲", icon: LuCrown },
    { mode: "cover-songs", label: "カバー曲", icon: LuMusic },
    { mode: "collaboration-songs", label: "コラボ曲", icon: LuUsers },
    { mode: "tag:歌枠", label: "歌枠", icon: LuMusic },
  ];
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
        <Grid.Col span={4}>
          <Menu width={170} position="bottom-start" withArrow>
            <Menu.Target>
              <Button className="px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0 bg-tan-400 hover:bg-tan-500 dark:bg-tan-500 dark:hover:bg-tan-600">
                <span className="text-xs w-full grid grid-cols-[1rem_1fr_1rem] items-center">
                  <CurrentSongModeIcon className="w-4 h-4 justify-self-center" />
                  <span className="text-center">
                    {currentSongModeLabel ?? "全曲"}
                  </span>
                  <LuChevronDown className="w-4 h-4 justify-self-center" />
                </span>
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              {modeMenuItems.map((item) => {
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

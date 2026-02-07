"use client";

import { Grid } from "@mantine/core";
import { Button } from "flowbite-react";
import { LuCrown, LuSparkles } from "react-icons/lu";
import usePlaylists from "../hook/usePlaylists";

type Props = {
  onSurprise: () => void;
  onOriginal: () => void;
  onPlaylist: () => void;
};

export default function MobileActionButtons({
  onSurprise,
  onOriginal,
  onPlaylist,
}: Props) {
  const { isNowPlayingPlaylist } = usePlaylists();
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
          <Button
            onClick={() => {
              onOriginal();
            }}
            className="px-3 py-1 h-8 w-full cursor-pointer text-white rounded transition shadow-md shadow-primary-400/20 dark:shadow-none ring-0 focus:ring-0 bg-tan-400 hover:bg-tan-500 dark:bg-tan-500 dark:hover:bg-tan-600"
          >
            <LuCrown className="mr-1" />
            <span className="text-xs">オリ曲</span>
          </Button>
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

"use client";

import { useEffect, useRef, useState, useMemo, useDeferredValue } from "react";
import { Song } from "../types/song";
import { TabItem, Tabs, TabsRef } from "flowbite-react";

import { FaDatabase, FaYoutube } from "react-icons/fa6";
import Link from "next/link";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import Loading from "../loading";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

type StatisticsItem = {
  key: string;
  count: number;
  song: Song;
  firstVideo: Song;
  lastVideo: Song;
};

const createStatistics = <T extends StatisticsItem>(
  songs: Song[],
  keyFn: (song: Song) => string | string[],
  sortFn?: (a: T, b: T) => number
) => {
  const countsMap = songs.reduce((map: Map<string, T>, song: Song) => {
    const keys = Array.isArray(keyFn(song))
      ? (keyFn(song) as string[])
      : [keyFn(song) as string];
    keys.forEach((key) => {
      map.set(key, {
        key,
        count: (map.get(key)?.count || 0) + 1,
        song,
        firstVideo:
          (map.get(key)?.firstVideo?.broadcast_at ?? 0) < song.broadcast_at
            ? map.get(key)?.firstVideo
            : song,
        lastVideo:
          (map.get(key)?.lastVideo?.broadcast_at ?? 0) > song.broadcast_at
            ? map.get(key)?.lastVideo
            : song,
      } as T & StatisticsItem);
    });
    return map;
  }, new Map<string, T & StatisticsItem>());

  const sortedData = Array.from(countsMap.values()).sort(
    sortFn || ((a, b) => b.count - a.count)
  );
  return sortedData as Array<T & StatisticsItem>;
};

const renderLastVideoCell = (lastVideo: Song | null, hiddenTitle = false) => {
  if (!lastVideo) return <span className="text-sm">なし</span>;
  const videoUrl = `${lastVideo.video_uri}`;
  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
    >
      <div className="md:flex md:items-center md:gap-2 flex flex-col md:flex-row">
        <div className="flex w-full lg:w-24 max-w-[120px]">
          <YoutubeThumbnail
            videoId={lastVideo.video_id}
            alt={lastVideo.video_title}
            fill={true}
          />
        </div>
        <div className="flex flex-grow flex-col w-full gap-1 lg:gap-0">
          <span className={`text-xs ${hiddenTitle ? "hidden" : ""} md:inline`}>
            <span className="">{lastVideo.video_title}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(lastVideo.broadcast_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </a>
  );
};

// SongItemコンポーネントにアニメーション用のpropsを追加
const SongItem = ({
  song,
  isVisible,
}: {
  song: StatisticsItem;
  isVisible: boolean;
}) => {
  return (
    <div
      className={`group relative cursor-pointer shadow-lg transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
      title={`${song.firstVideo.video_title} (${new Date(
        song.firstVideo.broadcast_at
      ).toLocaleDateString()})`}
    >
      <YoutubeThumbnail
        videoId={song.firstVideo.video_id}
        alt={song.firstVideo.video_title}
        fill={true}
      />
      <div
        className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20 opacity-0 group-hover:opacity-80 transition-opacity duration-300"
        onClick={() => {
          // YouTubeを開く
          window.open(
            `https://www.youtube.com/watch?v=${song.firstVideo.video_id}`,
            "_blank"
          );
        }}
      >
        <div className="flex items-center justify-center h-full text-white text-center">
          <div className="flex-row text-sm">
            <div>
              {song.song.title} - {song.song.artist}
              <br />
              {new Date(song.firstVideo.broadcast_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="absolute bottom-2 right-1 flex gap-x-2">
          <Link
            href={`https://www.youtube.com/watch?v=${song.firstVideo.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white"
            title={`${song.firstVideo.video_title}`}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <FaYoutube className="w-4 h-4 mr-1" />
          </Link>
          <Link
            href={`/?q=title:${song.song.title}+tag:オリ曲`}
            className="text-white"
            title={`${song.song.title}を再生`}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <FaDatabase className="w-4 h-4 mr-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function DosographyPage() {
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);

  const tabsRef = useRef<TabsRef>(null);
  const [activeTab, setActiveTab] = useState(0);

  // 各タブのアイテムの表示状態を管理するstate
  const [visibleItems, setVisibleItems] = useState<boolean[][]>([[], [], []]);
  const deferredActiveTab = useDeferredValue(activeTab);

  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => {
        setSongs(data);
        setLoading(false);
      });
  }, []);

  // AZKiさんとしての楽曲
  const originalSongCountsByReleaseDate = useMemo(() => {
    const originals = songs.filter(
      (s) =>
        (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")) &&
        (s.artist.includes("AZKi") ||
          s.artist.includes("瀬名航") ||
          s.artist.includes("Star Flower"))
    );
    return createStatistics(
      originals,
      (s) => s.title,
      (a, b) =>
        new Date(b.firstVideo.broadcast_at).getTime() -
        new Date(a.firstVideo.broadcast_at).getTime()
    );
  }, [songs]);

  // SorAZとしての楽曲
  const sorazSongCountsByReleaseDate = useMemo(() => {
    const sorazs = songs.filter(
      (s) =>
        (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")) &&
        s.artist.includes("SorAZ")
    );
    return createStatistics(
      sorazs,
      (s) => s.title,
      (a, b) =>
        new Date(b.firstVideo.broadcast_at).getTime() -
        new Date(a.firstVideo.broadcast_at).getTime()
    );
  }, [songs]);

  const coverSongCountsByReleaseDate = useMemo(() => {
    const covers = songs.filter((s) => s.tags.includes("カバー曲"));
    return createStatistics(
      covers,
      (s) => s.title,
      (a, b) =>
        new Date(b.firstVideo.broadcast_at).getTime() -
        new Date(a.firstVideo.broadcast_at).getTime()
    );
  }, [songs]);

  // スタッガードアニメーション
  useEffect(() => {
    // 最初にすべてのアイテムを非表示にする
    const newVisibleItems: boolean[][] = [[], [], []];
    newVisibleItems[activeTab] = new Array(
      [
        originalSongCountsByReleaseDate,
        sorazSongCountsByReleaseDate,
        coverSongCountsByReleaseDate,
      ][activeTab].length
    ).fill(false);
    setVisibleItems(newVisibleItems);

    // 遅延をいれつつアニメーション
    setTimeout(() => {
      const itemsToAnimate = [
        originalSongCountsByReleaseDate,
        sorazSongCountsByReleaseDate,
        coverSongCountsByReleaseDate,
      ][activeTab];
      itemsToAnimate.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => {
            const next = [...prev];
            next[activeTab] = [...next[activeTab]];
            next[activeTab][index] = true;
            return next;
          });
        }, index * 50);
      });
    }, 100);
  }, [
    activeTab,
    originalSongCountsByReleaseDate,
    sorazSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  ]);

  const renderContent = (data: StatisticsItem[], tabIndex: number) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1 lg:gap-4">
        {data.map((song, index) => (
          <SongItem
            key={song.key}
            song={song}
            isVisible={visibleItems[tabIndex]?.[index] || false}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center w-full justify-center h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <OverlayScrollbarsComponent
      element="div"
      className="lg:p-6 flex flex-col w-full h-full"
      options={{ scrollbars: { autoHide: "leave" } }}
      defer
    >
      <h1 className="font-extrabold text-2xl p-3 mb-2 dark:text-gray-200">
        Discography
      </h1>

      <Tabs variant="fullWidth" ref={tabsRef} onActiveTabChange={setActiveTab}>
        <TabItem
          title={`オリジナル楽曲 (AZKi) (${originalSongCountsByReleaseDate.length})`}
        >
          {renderContent(originalSongCountsByReleaseDate, 0)}
        </TabItem>
        <TabItem
          title={`オリジナル楽曲 (SorAZ) (${sorazSongCountsByReleaseDate.length})`}
        >
          {renderContent(sorazSongCountsByReleaseDate, 1)}
        </TabItem>
        <TabItem title={`カバー楽曲 (${coverSongCountsByReleaseDate.length})`}>
          {renderContent(coverSongCountsByReleaseDate, 2)}
        </TabItem>
      </Tabs>
    </OverlayScrollbarsComponent>
  );
}

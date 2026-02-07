import { useDisclosure } from "@mantine/hooks";
import { Song } from "../types/song";
import { useLayoutEffect, useRef, useState } from "react";
import NowPlayingSongInfoDetail from "./NowPlayingSongInfoDetail";
import MilestoneBadge from "./MilestoneBadge";

interface NowPlayingSongInfoProps {
  currentSong: Song | null;
  allSongs: Song[];
  searchTerm: string;
  isPlaying: boolean;
  hideFutureSongs: boolean;
  setHideFutureSongs: (value: boolean) => void;
  setSearchTerm: (value: string) => void;
  setOpenShereModal: (value: boolean) => void;
  changeCurrentSong: (
    song: Song | null,
    videoId?: string,
    startTime?: number,
  ) => void;
}

/**
 * 再生中の曲情報を表示するコンポーネント
 */
const NowPlayingSongInfo = ({
  currentSong,
  allSongs,
  searchTerm,
  isPlaying,
  hideFutureSongs,
  setHideFutureSongs,
  setSearchTerm,
  setOpenShereModal,
  changeCurrentSong,
}: NowPlayingSongInfoProps) => {
  const [opened, { open, close }] = useDisclosure(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    // ResizeObserverを使用してサイズ変化を検知
    const observer = new ResizeObserver(() => {
      if (!containerRef.current || !textRef.current) return;

      // requestAnimationFrameでレイアウト計算をバッチ処理
      requestAnimationFrame(() => {
        if (!containerRef.current || !textRef.current) return;

        const containerWidth = Math.max(
          0,
          containerRef.current.clientWidth - 25, // CDのアイコン分
        );
        const textWidth = textRef.current.scrollWidth;

        setIsOverflowing(textWidth > containerWidth);
      });
    });

    observer.observe(containerRef.current);
    if (textRef.current) {
      observer.observe(textRef.current);
    }

    return () => observer.disconnect();
  }, [currentSong]);

  return (
    <>
      <div className="flex mt-2 flex-col py-2 pt-0 px-2 lg:p-0 lg:pt-1 text-sm text-foreground">
        {currentSong && (
          <div className="song-info">
            <div className="hidden lg:flex items-center gap-2 pb-2">
              <div className="w-full flex-auto self-baseline">
                {currentSong.milestones && (
                  <div className="flex items-center gap-1">
                    <MilestoneBadge
                      song={currentSong}
                      onClick={(event, song, milestone) => {
                        setSearchTerm(`milestone:${milestone}`);
                      }}
                    />
                  </div>
                )}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white m-0 line-clamp-2">
                  {currentSong.video_title}
                </h2>
              </div>
            </div>

            <div>
              <NowPlayingSongInfoDetail
                currentSong={currentSong}
                allSongs={allSongs}
                searchTerm={searchTerm}
                isPlaying={isPlaying}
                hideFutureSongs={hideFutureSongs}
                setSearchTerm={setSearchTerm}
                changeCurrentSong={changeCurrentSong}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NowPlayingSongInfo;

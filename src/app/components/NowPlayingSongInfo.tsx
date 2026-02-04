import { Button, Group, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Song } from "../types/song";
import { FaCompactDisc, FaShare } from "react-icons/fa6";
import Marquee from "react-fast-marquee";
import { useLayoutEffect, useRef, useState } from "react";
import NowPlayingSongInfoDetail from "./NowPlayingSongInfoDetail";
import { FaTimes } from "react-icons/fa";
import MilestoneBadge from "./MilestoneBadge";
import PlayerSettings from "./PlayerSettings";

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
      <div className="flex sm:mt-2 flex-col py-2 pt-0 px-2 lg:p-0 lg:pt-1 text-sm text-foreground">
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

            <div ref={containerRef} className="lg:hidden md:pb-3">
              <div
                className="text-xs text-muted-foreground w-full pt-2 cursor-pointer line-clamp-1"
                onClick={open}
              >
                {currentSong && (
                  <span>
                    {currentSong.broadcast_at
                      ? new Date(currentSong.broadcast_at).toLocaleDateString(
                          "ja-JP",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          },
                        ) + "配信 - "
                      : ""}
                    {currentSong.video_title}
                  </span>
                )}
              </div>
            </div>

            <div className="hidden md:block foldable:block">
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
      <Modal
        opened={opened}
        onClose={close}
        title="楽曲情報"
        size="2xl"
        centered
      >
        {currentSong && (
          <>
            <div className="mb-2 relative">
              <span className="font-semibold">{currentSong.title}</span>
              {currentSong.artist && (
                <span className="text-gray-500 dark:text-gray-200 text-sm">
                  {" "}
                  - {currentSong.artist}
                </span>
              )}
            </div>
            <NowPlayingSongInfoDetail
              currentSong={currentSong}
              allSongs={allSongs}
              searchTerm={searchTerm}
              isPlaying={isPlaying}
              hideFutureSongs={hideFutureSongs}
              setSearchTerm={setSearchTerm}
              changeCurrentSong={changeCurrentSong}
            />
            <hr className="my-4" />
            <Group className="flex items-center">
              <Button
                color="pink"
                onClick={close}
                className="bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary text-white transition text-sm cursor-pointer"
              >
                <FaTimes />
                &nbsp;閉じる
              </Button>
              <Button
                color="pink"
                onClick={() => setOpenShereModal(true)}
                className="bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary text-white transition text-sm cursor-pointer"
              >
                <FaShare />
                &nbsp;Share
              </Button>
            </Group>
          </>
        )}
      </Modal>
    </>
  );
};

export default NowPlayingSongInfo;

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
  currentSongInfo: Song | null;
  allSongs: Song[];
  searchTerm: string;
  isPlaying: boolean;
  hideFutureSongs: boolean;
  setHideFutureSongs: (value: boolean) => void;
  setSearchTerm: (value: string) => void;
  setOpenShereModal: (value: boolean) => void;
  changeCurrentSong: (
    song: Song | null,
    isInfoOnly?: boolean,
    videoId?: string,
    startTime?: number,
  ) => void;
}

/**
 * 再生中の曲情報を表示するコンポーネント
 */
const NowPlayingSongInfo = ({
  currentSongInfo,
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
  }, [currentSongInfo]);

  return (
    <>
      <div className="flex sm:mt-2 flex-col py-2 pt-0 px-2 lg:p-0 lg:pt-1 text-sm text-foreground">
        {currentSongInfo && (
          <div className="song-info">
            <div className="hidden lg:flex items-center gap-2 mb-1 border-b border-primary-600">
              <div className="w-full flex-auto self-baseline">
                {currentSongInfo.milestones && (
                  <div className="flex items-center gap-1">
                    <MilestoneBadge
                      song={currentSongInfo}
                      onClick={(event, song, milestone) => {
                        setSearchTerm(`milestone:${milestone}`);
                      }}
                    />
                  </div>
                )}
                <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white m-0">
                  <FaCompactDisc
                    className={`relative mr-2 inline ${
                      isPlaying ? "animate-spin" : ""
                    }`}
                    style={{
                      top: "-2px",
                      animationDuration: "3s",
                    }}
                  />
                  {currentSongInfo.title}

                  {currentSongInfo.artist && (
                    <>
                      <span className="font-normal text-lg">
                        {" "}
                        - {currentSongInfo.artist}
                      </span>
                    </>
                  )}
                </h2>
              </div>
              <PlayerSettings
                currentSongInfo={currentSongInfo}
                hideFutureSongs={hideFutureSongs}
                setHideFutureSongs={setHideFutureSongs}
                setOpenShereModal={setOpenShereModal}
              />
            </div>

            <div ref={containerRef} className="lg:hidden md:pb-3">
              <div
                className="text-xs text-muted-foreground truncate w-full pt-2 cursor-pointer"
                onClick={open}
              >
                {currentSongInfo && (
                  <span>
                    {currentSongInfo.broadcast_at
                      ? new Date(
                          currentSongInfo.broadcast_at,
                        ).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }) + "配信 - "
                      : ""}
                    {currentSongInfo.video_title}
                  </span>
                )}
              </div>
            </div>

            <div className="hidden md:block foldable:block">
              <NowPlayingSongInfoDetail
                currentSongInfo={currentSongInfo}
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
      <Modal opened={opened} onClose={close} title="楽曲情報">
        {currentSongInfo && (
          <>
            <div className="mb-2 relative">
              <span className="font-semibold">{currentSongInfo.title}</span>
              {currentSongInfo.artist && (
                <span className="text-gray-500 dark:text-gray-200 text-sm">
                  {" "}
                  - {currentSongInfo.artist}
                </span>
              )}
            </div>
            <NowPlayingSongInfoDetail
              currentSongInfo={currentSongInfo}
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
                onClick={close}
                className="bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary text-white transition text-sm cursor-pointer mr-3"
              >
                <FaTimes />
                &nbsp;Close
              </Button>
              <Button
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

import { Button, Modal, ModalBody, ModalHeader } from "flowbite-react";
import { Song } from "../types/song";
import { FaCompactDisc, FaShare } from "react-icons/fa6";
import Marquee from "react-fast-marquee";
import { useEffect, useRef, useState } from "react";
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
  changeCurrentSong: (song: Song, isInfoOnly?: boolean) => void;
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
  const [showModal, setShowModal] = useState(false);

  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const containerElement = containerRef.current as HTMLElement;
      const containerWidth = Math.max(
        0,
        (containerElement.clientWidth ?? 0) - 25, // CDのアイコン分
      );
      const textWidth = (textRef.current as HTMLElement).scrollWidth ?? 0;

      // コンテナの幅よりもテキストの幅が大きい場合にオーバーフローと判断
      setIsOverflowing(textWidth > containerWidth);
    }
  }, [currentSongInfo]);

  return (
    <>
      <div className="flex sm:mt-2 flex-col py-2 pt-0 px-2 lg:p-0 lg:pt-1 text-sm text-foreground dark:text-gray-300">
        {currentSongInfo && (
          <div className="song-info">
            <div className="hidden lg:flex items-center gap-2 mb-1">
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
                <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
                  <FaCompactDisc
                    className={`relative mr-2 inline ${
                      isPlaying ? "fa-spin" : ""
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
                hideFutureSongs={hideFutureSongs}
                setHideFutureSongs={setHideFutureSongs}
                setOpenShereModal={setOpenShereModal}
              />
            </div>

            <div ref={containerRef} className="lg:hidden p-1">
              <div
                className="flex items-center cursor-pointer text-lg"
                onClick={() => setShowModal(true)}
              >
                <div className="flex-none">
                  <FaCompactDisc
                    className={`${isPlaying ? "fa-spin" : ""} mr-2`}
                    style={{ animationDuration: "3s" }}
                  />
                </div>
                <div className="w-64 flex-auto">
                  {isOverflowing ? (
                    <Marquee
                      className="flex-1"
                      key={`${currentSongInfo.title}-${currentSongInfo.artist}-${currentSongInfo.video_id}`}
                    >
                      <span
                        className="text-nowrap inline-block pr-6"
                        ref={textRef}
                      >
                        <span className="font-semibold">
                          {currentSongInfo.title}
                        </span>{" "}
                        <span className="text-gray-500 text-sm">
                          - {currentSongInfo.artist}
                        </span>
                      </span>
                    </Marquee>
                  ) : (
                    <span
                      className="text-nowrap inline-block flex-1"
                      ref={textRef}
                    >
                      <span className="font-semibold">
                        {currentSongInfo.title}
                      </span>{" "}
                      <span className="text-gray-500 text-sm">
                        - {currentSongInfo.artist}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground truncate w-full">
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

            <div className="hidden md:block">
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
      <Modal show={showModal} size="" onClose={() => setShowModal(false)}>
        <ModalHeader className="border-b-gray-300">楽曲情報</ModalHeader>
        <ModalBody className="bg-white dark:bg-gray-800 dark:text-white rounded py-6 px-3">
          {currentSongInfo && (
            <>
              <div className="mb-2 relative">
                <span className="font-semibold">{currentSongInfo.title}</span>
                {currentSongInfo.artist && (
                  <span className="text-gray-500 text-sm">
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
              <div className="flex items-center">
                <Button
                  onClick={() => setShowModal(false)}
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
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default NowPlayingSongInfo;

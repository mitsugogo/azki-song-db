import {
  Button,
  Checkbox,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  TextInput,
} from "flowbite-react";
import { Song } from "../types/song";
import { FaCompactDisc, FaShare } from "react-icons/fa6";
import Marquee from "react-fast-marquee";
import { useEffect, useRef, useState } from "react";
import NowPlayingSongInfoDetail from "./NowPlayingSongInfoDetail";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaTimes } from "react-icons/fa";

interface NowPlayingSongInfoProps {
  currentSongInfo: Song | null;
  allSongs: Song[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  setOpenShereModal: (value: boolean) => void;
  changeCurrentSong: (song: Song, isInfoOnly?: boolean) => void;
}

const NowPlayingSongInfo = ({
  currentSongInfo,
  allSongs,
  searchTerm,
  setSearchTerm,
  setOpenShereModal,
  changeCurrentSong,
}: NowPlayingSongInfoProps) => {
  const [showModal, setShowModal] = useState(false);

  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // スマホ時に表示する曲タイトル部分
  const text = currentSongInfo
    ? `${currentSongInfo.title} - ${currentSongInfo.artist}`
    : "";

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const containerElement = containerRef.current as HTMLElement;
      const containerWidth = containerElement.clientWidth ?? 0;
      const textWidth = (textRef.current as HTMLElement).scrollWidth ?? 0;

      // コンテナの幅よりもテキストの幅が大きい場合にオーバーフローと判断
      setIsOverflowing(textWidth > containerWidth);
    }
  }, [text]); // テキストが変更されたときに再評価

  return (
    <>
      <div className="flex g:h-full sm:mt-2 flex-col py-2 pt-0 px-2 lg:p-0 lg:pt-1 text-sm text-foreground dark:text-gray-300">
        {currentSongInfo && (
          <div className="song-info">
            <div className="hidden lg:flex items-center gap-2 mb-3">
              <div className="w-full flex-auto self-baseline border-b border-gray-200 pb-2">
                <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
                  <FaCompactDisc
                    className="relative fa-spin mr-2 inline"
                    style={{ top: "-1px" }}
                  />
                  {currentSongInfo.title}
                  <span className="font-normal text-lg">
                    {" "}
                    - {currentSongInfo.artist}
                  </span>
                </h2>
              </div>
              <div className="hidden lg:block text-right">
                <Button
                  onClick={() => setOpenShereModal(true)}
                  className="bg-primary hover:bg-primary dark:hover:bg-primary dark:bg-primary-900 text-white transition text-sm"
                >
                  <FaShare />
                  &nbsp;Share
                </Button>
              </div>
            </div>

            <div ref={containerRef} className="lg:hidden p-1">
              <div
                className="flex items-center cursor-pointer text-lg"
                onClick={() => setShowModal(true)}
              >
                <div className="flex-none">
                  <FaCompactDisc className="fa-spin mr-2" />
                </div>
                <div className="w-64 flex-auto">
                  {isOverflowing ? (
                    <Marquee className="flex-1">
                      <span
                        className="text-nowrap inline-block pr-6"
                        ref={textRef}
                      >
                        <span className="font-semibold">
                          {currentSongInfo.title}
                        </span>{" "}
                        - {currentSongInfo.artist}
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
                      - {currentSongInfo.artist}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground truncate w-full">
                {currentSongInfo && (
                  <span>
                    {currentSongInfo.broadcast_at
                      ? new Date(
                          currentSongInfo.broadcast_at
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

            <div className="hidden md:block lg:block">
              <NowPlayingSongInfoDetail
                currentSongInfo={currentSongInfo}
                allSongs={allSongs}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                changeCurrentSong={changeCurrentSong}
              />
            </div>
          </div>
        )}
      </div>
      <Modal show={showModal} size="" onClose={() => setShowModal(false)} popup>
        <ModalHeader />
        <ModalBody className="bg-white dark:bg-gray-800 dark:text-white rounded py-6">
          {currentSongInfo && (
            <>
              <div className="mb-2 relative">
                <FaCompactDisc
                  className="fa-spin mr-2 inline relative"
                  style={{ top: "-1px" }}
                />
                <span className="font-semibold">{currentSongInfo.title}</span>
              </div>
              <NowPlayingSongInfoDetail
                currentSongInfo={currentSongInfo}
                allSongs={allSongs}
                searchTerm={searchTerm}
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

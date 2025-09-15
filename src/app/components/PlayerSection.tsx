import { Song } from "../types/song";
import YouTubePlayer from "./YouTubePlayer";
import NowPlayingSongInfo from "./NowPlayingSongInfo";
import YoutubeThumbnail from "./YoutubeThumbnail";
import { Button, ButtonGroup, ToggleSwitch } from "flowbite-react";
import { GiPreviousButton, GiNextButton } from "react-icons/gi";
import { FaShare, FaShuffle } from "react-icons/fa6";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { RiPlayListFill } from "react-icons/ri";
import { YouTubeEvent } from "react-youtube";
import PlayerSettings from "./PlayerSettings";
import { LuCrown } from "react-icons/lu";

// Propsの型定義
type PlayerSectionProps = {
  currentSong: Song | null;
  currentSongInfo: Song | null;
  previousSong: Song | null;
  nextSong: Song | null;
  allSongs: Song[];
  songs: Song[];
  searchTerm: string;
  isPlaying: boolean;
  playerKey: number;
  hideFutureSongs: boolean;
  handleStateChange: (event: YouTubeEvent) => void;
  changeCurrentSong: (song: Song | null, keepCurrentList?: boolean) => void;
  playRandomSong: (songList: Song[]) => void;
  setSongsToCurrentVideo: () => void;
  setOpenShareModal: (isOpen: boolean) => void;
  setSearchTerm: (term: string) => void;
  setHideFutureSongs: (value: boolean) => void;
};

export default function PlayerSection({
  currentSong,
  currentSongInfo,
  previousSong,
  nextSong,
  allSongs,
  songs,
  searchTerm,
  isPlaying,
  playerKey,
  hideFutureSongs,
  handleStateChange,
  changeCurrentSong,
  playRandomSong,
  setSongsToCurrentVideo,
  setOpenShareModal,
  setSearchTerm,
  setHideFutureSongs,
}: PlayerSectionProps) {
  return (
    <aside className="flex md:w-8/12 lg:w-2/3 xl:w-9/12 sm:w-full pr-0">
      <OverlayScrollbarsComponent
        options={{ scrollbars: { autoHide: "leave" } }}
        element="div"
        className="flex flex-col h-full w-full bg-background pr-0 lg:pr-3"
        defer
      >
        {/* YouTube Player */}
        <div className="relative aspect-video w-full bg-black">
          <div className="absolute top-0 left-0 w-full h-full">
            {currentSong && (
              <YouTubePlayer
                key={`youtube-player-${playerKey}`}
                song={currentSong}
                onStateChange={handleStateChange}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col p-2 pl-2 pb-0 lg:px-0 text-sm text-foreground">
          {/* Previous/Next Song Display (Desktop) */}
          <div className="hidden lg:flex justify-between gap-2 flex-nowrap">
            {/* Previous Song */}
            <div
              className="h-14 flex-1 min-w-0 p-0 rounded bg-gray-50/50 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 cursor-pointer hover:bg-gray-50"
              onClick={() => changeCurrentSong(previousSong)}
            >
              {previousSong && (
                <div className="flex items-center h-14">
                  <div className="flex flex-1 w-25 aspect-video min-w-25 max-w-25 align-middle shrink-0">
                    <YoutubeThumbnail
                      videoId={previousSong.video_id}
                      alt={previousSong.video_title}
                      fill={true}
                    />
                  </div>
                  <div className="flex flex-1 flex-col px-2 min-w-0">
                    <div className="text-left font-bold line-clamp-1">
                      {previousSong.title}
                    </div>
                    <div className="text-left text-xs text-muted line-clamp-1">
                      {previousSong.artist}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Current Video Playlist */}
            <div
              className="relative h-14 flex-1 min-w-0 p-0 rounded bg-primary-300 hover:bg-primary-400 dark:inset-ring dark:inset-ring-primary dark:bg-gray-700 dark:hover:bg-primary-600/40 dark:shadow-lg dark:shadow-primary-500/50 cursor-pointer transition-colors duration-200"
              onClick={setSongsToCurrentVideo}
            >
              {currentSongInfo && (
                <div className="flex items-center h-14">
                  <div className="flex flex-1 w-25 aspect-video min-w-25 max-w-25 align-middle shrink-0">
                    <YoutubeThumbnail
                      videoId={currentSongInfo.video_id}
                      alt={currentSongInfo.video_title}
                      fill={true}
                    />
                  </div>
                  <div className="flex flex-1 flex-col px-2 min-w-0">
                    <div className="text-left font-bold line-clamp-1">
                      {currentSongInfo.title}
                    </div>
                    <span className="text-left text-xs text-muted line-clamp-1">
                      {currentSongInfo.artist}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {/* Next Song */}
            <div
              className={`h-14 flex-1 min-w-0 p-0 rounded bg-gray-50/50 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 cursor-pointer hover:bg-gray-50`}
              onClick={() => changeCurrentSong(nextSong)}
            >
              {nextSong && (
                <div className="flex items-center h-14">
                  <div className="flex flex-1 w-25 aspect-video min-w-25 max-w-25 align-middle shrink-0">
                    <YoutubeThumbnail
                      videoId={nextSong.video_id}
                      alt={nextSong.video_title}
                      fill={true}
                    />
                  </div>
                  <div className={`flex flex-1 flex-col px-2 min-w-0`}>
                    <div className="line-clamp-1 truncate">
                      <span
                        className={`font-bold truncate ${
                          hideFutureSongs &&
                          nextSong.video_id === currentSongInfo?.video_id
                            ? "h-4 bg-gray-300 rounded-lg dark:bg-gray-700 inline-block max-w-full"
                            : ""
                        }`}
                      >
                        <span
                          className={
                            hideFutureSongs &&
                            nextSong.video_id === currentSongInfo?.video_id
                              ? "opacity-0"
                              : ""
                          }
                        >
                          {nextSong.title}
                        </span>
                      </span>
                    </div>
                    <div className="line-clamp-1 truncate">
                      <span
                        className={`text-xs text-muted ${
                          hideFutureSongs &&
                          nextSong.video_id === currentSongInfo?.video_id
                            ? "h-3 bg-gray-300 rounded-lg dark:bg-gray-700 inline-block max-w-full"
                            : ""
                        }`}
                      >
                        <span
                          className={
                            hideFutureSongs &&
                            nextSong.video_id === currentSongInfo?.video_id
                              ? "opacity-0"
                              : ""
                          }
                        >
                          {nextSong.artist}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Player Controls (Mobile) */}
          <div className="flex lg:hidden justify-between w-full">
            <ButtonGroup className="shadow-none rounded-md ">
              <Button
                onClick={() => changeCurrentSong(previousSong)}
                disabled={!previousSong}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary border-none text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer px-4 py-2 text-xs border-r-2 border-r-gray-300 ring-0 focus:ring-0 focus:outline-none"
              >
                <GiPreviousButton />
              </Button>
              <Button
                onClick={() => changeCurrentSong(nextSong)}
                disabled={!nextSong}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer px-4 py-2 text-xs ring-0 focus:ring-0 focus:outline-none"
              >
                <GiNextButton />
              </Button>
            </ButtonGroup>
            <div className="flex flex-row gap-2 flex-1 ml-2">
              {/* 連続再生ボタン */}
              <Button
                onClick={setSongsToCurrentVideo}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition text-sm cursor-pointer truncate px-3 py-2 items-center justify-between ring-0 focus:ring-0 focus:outline-none"
              >
                <div className="flex-shrink-0">
                  <RiPlayListFill />
                </div>
                <div
                  className="flex-1 text-center"
                  style={{ lineHeight: "1.1em" }}
                ></div>
                <div className="flex-shrink-0 w-0 sm:w-4"></div>
              </Button>

              {/* ランダム再生ボタン */}
              <Button
                onClick={() => playRandomSong(songs)}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition cursor-pointer truncate px-3 py-2 text-xs items-center justify-between ring-0 focus:ring-0 focus:outline-none"
              >
                <span className="text-xs">
                <FaShuffle className="mr-2 inline" />
                ランダム
                </span>
              </Button>

              {/* ソロライブ予習モード */}
              <Button
                onClick={() => {
                  // ソロライブ用のプレイリストをセットしてCreating worldを再生
                  setSearchTerm("sololive2025");
                  const song = songs.find(
                    (song) => song.video_id === "ZkvtKUQp3nM",
                  );
                  if (!song) return;
                  changeCurrentSong(song);
                }}
                className="text-white transition cursor-pointer truncate px-3 py-2 text-xs flex-1 flex items-center justify-between ring-0 focus:ring-0 focus:outline-none bg-tan-400 hover:bg-tan-500 dark:bg-tan-500 dark:hover:bg-tan-600"
              >
                <div className="flex-shrink-0 text-xs">
                  <LuCrown className="mr-2" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs">ソロライブ</span>
                </div>
              </Button>
            </div>
            <div className="flex justify-end">
              <PlayerSettings
                hideFutureSongs={hideFutureSongs}
                setHideFutureSongs={setHideFutureSongs}
                setOpenShereModal={setOpenShareModal}
              />
            </div>
          </div>
        </div>

        {/* Now Playing Song Info */}
        <NowPlayingSongInfo
          currentSongInfo={currentSongInfo}
          allSongs={allSongs}
          searchTerm={searchTerm}
          isPlaying={isPlaying}
          hideFutureSongs={hideFutureSongs}
          setSearchTerm={setSearchTerm}
          setOpenShereModal={setOpenShareModal}
          changeCurrentSong={changeCurrentSong}
          setHideFutureSongs={setHideFutureSongs}
        />
      </OverlayScrollbarsComponent>
    </aside>
  );
}

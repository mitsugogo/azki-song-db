import { Song } from "../types/song";
import YouTubePlayer from "./YouTubePlayer";
import NowPlayingSongInfo from "./NowPlayingSongInfo";
import YoutubeThumbnail from "./YoutubeThumbnail";
import { Button, ButtonGroup } from "flowbite-react";
import { GiPreviousButton, GiNextButton } from "react-icons/gi";
import { FaShare, FaShuffle } from "react-icons/fa6";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { RiPlayListFill } from "react-icons/ri";
import { YouTubeEvent } from "react-youtube";

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
  handleStateChange: (event: YouTubeEvent) => void;
  changeCurrentSong: (song: Song | null, keepCurrentList?: boolean) => void;
  playRandomSong: (songList: Song[]) => void;
  setSongsToCurrentVideo: () => void;
  setOpenShareModal: (isOpen: boolean) => void;
  setSearchTerm: (term: string) => void;
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
  handleStateChange,
  changeCurrentSong,
  playRandomSong,
  setSongsToCurrentVideo,
  setOpenShareModal,
  setSearchTerm,
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
                key="youtube-player"
                song={currentSong}
                onStateChange={handleStateChange}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col p-2 pl-2 lg:px-0 text-sm text-foreground">
          {/* Previous/Next Song Display (Desktop) */}
          <div className="hidden lg:flex w-full justify-between gap-2">
            {/* Previous Song */}
            <div
              className="h-14 w-2/6 p-0 truncate rounded bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer hover:bg-gray-300"
              onClick={() => changeCurrentSong(previousSong)}
            >
              {previousSong && (
                <div className="flex items-center h-14">
                  <div className="flex w-24 aspect-video min-w-24 max-w-24 align-middle">
                    <YoutubeThumbnail
                      videoId={previousSong.video_id}
                      alt={previousSong.video_title}
                      fill={true}
                    />
                  </div>
                  <div className="flex flex-auto flex-col px-2 truncate">
                    <span className="text-left font-bold truncate">
                      {previousSong.title}
                    </span>
                    <span className="text-left text-xs text-muted truncate">
                      {previousSong.artist}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {/* Current Video Playlist */}
            <div
              className="relative h-14 w-2/6 p-0 truncate rounded bg-primary-300 dark:bg-primary-900 dark:text-gray-300 border-0 shadow-none cursor-pointer hover:bg-primary-400"
              onClick={setSongsToCurrentVideo}
            >
              {currentSongInfo && (
                <div className="flex items-center h-14">
                  <div className="flex w-24 aspect-video min-w-24 max-w-24 align-middle">
                    <YoutubeThumbnail
                      videoId={currentSongInfo.video_id}
                      alt={currentSongInfo.video_title}
                      fill={true}
                    />
                  </div>
                  <div className="flex flex-auto flex-col px-2 truncate">
                    <span className="text-left font-bold truncate">
                      {currentSongInfo.title}
                    </span>
                    <span className="text-left text-xs text-muted truncate">
                      {currentSongInfo.artist}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {/* Next Song */}
            <div
              className="h-14 w-2/6 p-0 truncate rounded bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer hover:bg-gray-300"
              onClick={() => changeCurrentSong(nextSong)}
            >
              {nextSong && (
                <div className="flex items-center h-14">
                  <div className="flex w-24 aspect-video min-w-24 max-w-24 align-middle">
                    <YoutubeThumbnail
                      videoId={nextSong.video_id}
                      alt={nextSong.video_title}
                      fill={true}
                    />
                  </div>
                  <div className="flex flex-col px-2 truncate">
                    <span className="text-left font-bold truncate">
                      {nextSong.title}
                    </span>
                    <span className="text-left text-xs text-muted truncate">
                      {nextSong.artist}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Player Controls (Mobile) */}
          <div className="flex lg:hidden justify-between">
            <ButtonGroup className="shadow-none">
              <Button
                onClick={() => changeCurrentSong(previousSong)}
                disabled={!previousSong}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary border-none text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <GiPreviousButton />
              </Button>
              <Button
                onClick={() => changeCurrentSong(nextSong)}
                disabled={!nextSong}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <GiNextButton />
              </Button>
            </ButtonGroup>
            <Button
              onClick={setSongsToCurrentVideo}
              className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition text-sm cursor-pointer truncate"
            >
              <RiPlayListFill />
              &nbsp;
              <span className="text-xs">
                この歌枠を
                <br />
                連続再生
              </span>
            </Button>
            <Button
              onClick={() => playRandomSong(songs)}
              className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition text-sm  cursor-pointer truncate"
            >
              <FaShuffle />
              &nbsp;<span className="text-xs">ランダム</span>
            </Button>
            <div className="flex justify-end">
              <Button
                onClick={() => setOpenShareModal(true)}
                className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition text-sm cursor-pointer"
              >
                <FaShare />
              </Button>
            </div>
          </div>
        </div>

        {/* Now Playing Song Info */}
        <NowPlayingSongInfo
          currentSongInfo={currentSongInfo}
          allSongs={allSongs}
          searchTerm={searchTerm}
          isPlaying={isPlaying}
          setSearchTerm={setSearchTerm}
          setOpenShereModal={setOpenShareModal}
          changeCurrentSong={changeCurrentSong}
        />
      </OverlayScrollbarsComponent>
    </aside>
  );
}

import { Badge } from "flowbite-react";
import { Song } from "../types/song";
import {
  FaBook,
  FaCalendar,
  FaCompactDisc,
  FaTag,
  FaUser,
  FaYoutube,
} from "react-icons/fa6";
import { PiMicrophoneStageFill } from "react-icons/pi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import { IoAlbums, IoTime } from "react-icons/io5";
import Link from "next/link";
import { useState } from "react";
import { HiChevronDown } from "react-icons/hi";
import MilestoneBadge from "./MilestoneBadge";

interface NowPlayingSongInfoDetailProps {
  currentSongInfo: Song;
  allSongs: Song[];
  searchTerm: string;
  isPlaying: boolean;
  hideFutureSongs: boolean;
  setSearchTerm: (value: string) => void;
  changeCurrentSong: (song: Song, isInfoOnly?: boolean) => void;
}

const NowPlayingSongInfoDetail = ({
  currentSongInfo,
  allSongs,
  searchTerm,
  isPlaying,
  hideFutureSongs,
  setSearchTerm,
  changeCurrentSong,
}: NowPlayingSongInfoDetailProps) => {
  const [isTimestampExpand, setIsTimestampExpand] = useState(false);

  // タイムスタンプ
  const videoTimestamps = allSongs
    .filter((song) => song.video_id === currentSongInfo?.video_id)
    .sort((a, b) => (parseInt(a.start) || 0) - (parseInt(b.start) || 0));

  return (
    <>
      {currentSongInfo && (
        <div className="flex-grow">
          <dl className="grid grid-cols-12 gap-x-4 gap-y-2">
            {currentSongInfo.artist && (
              <>
                <div className="col-span-1 lg:col-span-2 flex items-baseline">
                  <dt className="text-muted-foreground flex items-baseline">
                    <FaUser />
                    <span className="hidden text-nowrap lg:inline ml-1">
                      アーティスト:
                    </span>
                  </dt>
                </div>
                <div className="col-span-11 lg:col-span-10">
                  <dd className="flex flex-wrap gap-1">
                    {currentSongInfo.artist.split("、").map((artist, index) => {
                      const existsSameArtist = searchTerm.includes(
                        `artist:${artist}`,
                      );
                      return (
                        <Badge
                          key={index}
                          onClick={() => {
                            if (existsSameArtist) {
                              setSearchTerm(
                                searchTerm
                                  .replace(`artist:${artist}`, "")
                                  .trim(),
                              );
                            } else {
                              setSearchTerm(
                                `${
                                  searchTerm ? `${searchTerm} ` : ""
                                }artist:${artist}`,
                              );
                            }
                          }}
                          className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-800 dark:hover:bg-cyan-700 dark:text-gray-200 ${
                            existsSameArtist
                              ? "bg-cyan-300 dark:bg-cyan-600"
                              : ""
                          }`}
                        >
                          {artist}
                        </Badge>
                      );
                    })}
                  </dd>
                </div>
              </>
            )}

            {currentSongInfo.album && (
              <>
                <div className="col-span-1 lg:col-span-2 flex items-baseline">
                  <dt className="text-muted-foreground flex items-baseline">
                    <IoAlbums />
                    <span className="hidden text-nowrap lg:inline ml-1">
                      アルバム:
                    </span>
                  </dt>
                </div>
                <div className="col-span-11 lg:col-span-10">
                  <dd className="flex flex-wrap gap-1">
                    {currentSongInfo.album.split("、").map((album, index) => {
                      const existsSameAlbum = searchTerm.includes(
                        `album:${album}`,
                      );
                      return (
                        <Badge
                          key={index}
                          onClick={() => {
                            if (existsSameAlbum) {
                              setSearchTerm(
                                searchTerm.replace(`album:${album}`, "").trim(),
                              );
                            } else {
                              setSearchTerm(
                                `${
                                  searchTerm ? `${searchTerm} ` : ""
                                }album:${album}`,
                              );
                            }
                          }}
                          className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-800 dark:hover:bg-cyan-700 dark:text-gray-200 ${
                            existsSameAlbum
                              ? "bg-cyan-300 dark:bg-cyan-600"
                              : ""
                          }`}
                        >
                          {album}
                        </Badge>
                      );
                    })}
                  </dd>
                </div>
              </>
            )}

            <div className="col-span-1 lg:col-span-2 flex items-baseline">
              <dt className="text-muted-foreground flex items-baseline">
                <PiMicrophoneStageFill />
                <span className="hidden text-nowrap lg:inline ml-1">
                  歌った人:
                </span>
              </dt>
            </div>
            <div className="col-span-11 lg:col-span-10">
              <dd className="flex flex-wrap gap-1">
                {currentSongInfo.sing.split("、").map((sing, index) => {
                  const existsSameSing = searchTerm.includes(`sing:${sing}`);
                  return (
                    <Badge
                      key={index}
                      onClick={() => {
                        if (existsSameSing) {
                          setSearchTerm(
                            searchTerm.replace(`sing:${sing}`, "").trim(),
                          );
                        } else {
                          setSearchTerm(
                            `${searchTerm ? `${searchTerm} ` : ""}sing:${sing}`,
                          );
                        }
                      }}
                      className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-800 dark:hover:bg-cyan-700 dark:text-gray-200  ${
                        existsSameSing ? "bg-cyan-300 dark:bg-cyan-600" : ""
                      }`}
                    >
                      {sing}
                    </Badge>
                  );
                })}
              </dd>
            </div>

            <div className="col-span-1 lg:col-span-2 flex items-baseline">
              <dt className="text-muted-foreground flex items-baseline">
                <FaYoutube />
                <span className="hidden text-nowrap lg:inline ml-1">
                  動画タイトル:
                </span>
              </dt>
            </div>
            <div className="col-span-11 lg:col-span-10">
              <dd>
                <a
                  href={`${currentSongInfo.video_uri}&t=${
                    currentSongInfo.start || 0
                  }s`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline justify-self-start font-semibold dark:text-primary-300"
                >
                  <FontAwesomeIcon icon={faYoutube} />{" "}
                  {currentSongInfo.video_title}
                </a>
              </dd>
            </div>

            <div className="col-span-1 lg:col-span-2 flex items-baseline">
              <dt className="text-muted-foreground flex items-baseline">
                <FaCalendar />
                <span className="hidden text-nowrap lg:inline ml-1">
                  配信日:
                </span>
              </dt>
            </div>
            <div className="col-span-11 lg:col-span-10">
              <dd className="flex flex-wrap gap-1">
                <Badge
                  className={`text-xs cursor-pointer dark:bg-cyan-800 dark:hover:bg-cyan-700 dark:text-gray-200 ${
                    searchTerm.includes(
                      `date:${new Date(
                        currentSongInfo.broadcast_at,
                      ).toLocaleDateString()}`,
                    )
                      ? "bg-cyan-300 dark:bg-cyan-600"
                      : ""
                  }`}
                  onClick={() => {
                    const broadcastDate = new Date(
                      currentSongInfo.broadcast_at,
                    ).toLocaleDateString();
                    const existsSameDate = searchTerm.includes(
                      `date:${broadcastDate}`,
                    );
                    if (existsSameDate) {
                      setSearchTerm(
                        searchTerm.replace(`date:${broadcastDate}`, "").trim(),
                      );
                    } else {
                      setSearchTerm(
                        `${
                          searchTerm ? `${searchTerm} ` : ""
                        }date:${broadcastDate}`,
                      );
                    }
                  }}
                >
                  {new Date(currentSongInfo.broadcast_at).toLocaleDateString()}
                </Badge>
              </dd>
            </div>

            <div className="col-span-1 lg:col-span-2 flex items-baseline">
              <dt className="text-muted-foreground flex items-baseline">
                <FaTag />
                <span className="hidden text-nowrap lg:inline ml-1">タグ:</span>
              </dt>
            </div>
            <div className="col-span-11 lg:col-span-10">
              <dd className="flex flex-wrap gap-1">
                {currentSongInfo.tags.map((tag) => {
                  const existsSameTag = searchTerm.includes(`tag:${tag}`);
                  return (
                    <Badge
                      key={tag}
                      className={`text-xs cursor-pointer dark:bg-cyan-800 dark:hover:bg-cyan-700 dark:text-gray-200 ${
                        existsSameTag ? "bg-cyan-300 dark:bg-cyan-600" : ""
                      }`}
                      onClick={() => {
                        if (existsSameTag) {
                          setSearchTerm(
                            searchTerm.replace(`tag:${tag}`, "").trim(),
                          );
                        } else {
                          setSearchTerm(
                            `${searchTerm ? `${searchTerm} ` : ""}tag:${tag}`,
                          );
                        }
                      }}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </dd>
            </div>

            {currentSongInfo && currentSongInfo.extra && (
              <>
                <div className="col-span-1 lg:col-span-2 flex items-baseline">
                  <dt className="text-muted-foreground flex items-baseline">
                    <FaBook />
                    <span className="hidden text-nowrap lg:inline ml-1">
                      追加情報:
                    </span>
                  </dt>
                </div>
                <div className="col-span-11 lg:col-span-10">
                  <dd
                    dangerouslySetInnerHTML={{
                      __html: currentSongInfo.extra
                        .replace(
                          /(https?:\/\/[\w\d./=?#-\u3000-\u303f\u3040-\u309f\u3130-\u318f\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAff\uFE00-\uFEff]+)/g,
                          (url) =>
                            `<a href="${url}" target="_blank" class="text-primary hover:underline dark:text-primary-300" rel="noopener noreferrer">${url}</a>`,
                        )
                        .replace(/\n/g, "<br />"),
                    }}
                  />
                </div>
              </>
            )}

            {videoTimestamps.length > 1 && (
              <>
                <div className="col-span-1 lg:col-span-2 flex items-baseline">
                  <dt className="text-muted-foreground flex items-baseline">
                    <IoTime />
                    <span className="hidden text-nowrap lg:inline ml-1">
                      セトリ:
                    </span>
                  </dt>
                </div>
                <div className="col-span-11 lg:col-span-10">
                  <dd className="grid grid-cols-1 gap-1 text-xs lg:text-sm relative">
                    {!isTimestampExpand && (
                      <button
                        type="button"
                        className="w-full text-center bg-gray-200 dark:bg-gray-800 text-xs py-1 px-2 cursor-pointer rounded"
                        onClick={() => setIsTimestampExpand(!isTimestampExpand)}
                      >
                        クリックして展開&nbsp;
                        <HiChevronDown className="inline" />
                      </button>
                    )}
                    {isTimestampExpand && (
                      <div className="pb-2">
                        {videoTimestamps.map((song, index) => {
                          const isHide =
                            hideFutureSongs &&
                            index >
                              videoTimestamps.findIndex(
                                (song) =>
                                  currentSongInfo?.title === song.title &&
                                  currentSongInfo.video_id === song.video_id &&
                                  currentSongInfo.start === song.start,
                              );

                          return (
                            <div key={song.start} className="w-full">
                              <div className="flex">
                                <div className="flex tabular-nums">
                                  <Link
                                    href={`?v=${song.video_id}&t=${song.start}`}
                                    className="text-primary hover:underline dark:text-primary-300"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      changeCurrentSong(song);
                                    }}
                                  >
                                    {new Date(parseInt(song.start) * 1000)
                                      .toISOString()
                                      .substring(11, 19)}
                                  </Link>
                                </div>
                                <div className="flex ml-3">
                                  {currentSongInfo === song && (
                                    <FaCompactDisc
                                      className={`relative inline ${
                                        isPlaying ? "fa-spin" : ""
                                      }`}
                                      style={{
                                        top: "2px",
                                        marginRight: "3px",
                                        animationDuration: "3s",
                                      }}
                                    />
                                  )}
                                  <span
                                    className={`${
                                      // 現在再生中の曲以降は隠す
                                      isHide
                                        ? "h-4.5 bg-gray-300 rounded-lg dark:bg-gray-700"
                                        : ""
                                    }`}
                                  >
                                    <span
                                      className={`${isHide ? "opacity-0" : ""}`}
                                    >
                                      {song.title}
                                      &nbsp;-&nbsp;
                                      <span className="text-gray-500 dark:text-gray-600">
                                        {song.artist}
                                      </span>
                                    </span>
                                  </span>
                                  {song.milestones && (
                                    <>
                                      <MilestoneBadge
                                        song={song}
                                        outClassName="ml-1"
                                        inline
                                        onClick={(event, song, milestone) => {
                                          setSearchTerm(
                                            `milestone:${milestone}`,
                                          );
                                        }}
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      )}
    </>
  );
};

export default NowPlayingSongInfoDetail;

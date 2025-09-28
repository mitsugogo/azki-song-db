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
import { IoAlbums, IoTime } from "react-icons/io5";
import Link from "next/link";
import { useState } from "react";
import { HiChevronDown } from "react-icons/hi";
import MilestoneBadge from "./MilestoneBadge";
import { MdSpeakerNotes } from "react-icons/md";
import { Tooltip } from "@mantine/core";
import { FaInfoCircle } from "react-icons/fa";

interface NowPlayingSongInfoDetailProps {
  currentSongInfo: Song;
  allSongs: Song[];
  searchTerm: string;
  isPlaying: boolean;
  hideFutureSongs: boolean;
  setSearchTerm: (value: string) => void;
  changeCurrentSong: (
    song: Song | null,
    isInfoOnly?: boolean,
    videoId?: string,
    startTime?: number
  ) => void;
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

  function timeToSeconds(timeString: string): number {
    const parts = timeString.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  return (
    <>
      {currentSongInfo && (
        <div className="flex-grow mb-5 bg-gray-50/20 dark:bg-gray-800 rounded-sm p-4 inset-shadow-sm dark:text-gray-50">
          <dl className="flex flex-col gap-3 lg:gap-1">
            {currentSongInfo.artist && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 flex-shrink-0">
                  <span className="inline-flex items-center">
                    <FaUser className="text-base" />
                    <span className="ml-1">アーティスト:</span>
                  </span>
                </dt>
                <dd className="flex flex-wrap gap-1">
                  {currentSongInfo.artist.split("、").map((artist, index) => {
                    const existsSameArtist = searchTerm.includes(
                      `artist:${artist}`
                    );
                    return (
                      <Badge
                        key={index}
                        onClick={() => {
                          if (existsSameArtist) {
                            setSearchTerm(
                              searchTerm.replace(`artist:${artist}`, "").trim()
                            );
                          } else {
                            setSearchTerm(
                              `${
                                searchTerm ? `${searchTerm}|` : ""
                              }artist:${artist}`
                            );
                          }
                        }}
                        className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-800 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                          existsSameArtist ? "bg-cyan-300 dark:bg-cyan-600" : ""
                        }`}
                      >
                        {artist}
                      </Badge>
                    );
                  })}
                </dd>
              </div>
            )}

            {currentSongInfo.album && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 flex-shrink-0">
                  <span className="inline-flex items-center">
                    <IoAlbums className="text-base" />
                    <span className="ml-1">アルバム:</span>
                  </span>
                </dt>
                <dd className="flex flex-wrap gap-1">
                  {currentSongInfo.album.split("、").map((album, index) => {
                    const existsSameAlbum = searchTerm.includes(
                      `album:${album}`
                    );
                    return (
                      <Badge
                        key={index}
                        onClick={() => {
                          if (existsSameAlbum) {
                            setSearchTerm(
                              searchTerm.replace(`album:${album}`, "").trim()
                            );
                          } else {
                            setSearchTerm(
                              `${
                                searchTerm ? `${searchTerm}|` : ""
                              }album:${album}`
                            );
                          }
                        }}
                        className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-800 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                          existsSameAlbum ? "bg-cyan-300 dark:bg-cyan-600" : ""
                        }`}
                      >
                        {album}
                      </Badge>
                    );
                  })}
                </dd>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
              <dt className="text-muted-foreground flex items-start w-full lg:w-48 flex-shrink-0">
                <span className="inline-flex items-center">
                  <PiMicrophoneStageFill className="text-base" />
                  <span className="ml-1">歌った人:</span>
                </span>
              </dt>
              <dd className="flex flex-wrap gap-1">
                {currentSongInfo.sing.split("、").map((sing, index) => {
                  const existsSameSing = searchTerm.includes(`sing:${sing}`);
                  return (
                    <Badge
                      key={index}
                      onClick={() => {
                        if (existsSameSing) {
                          setSearchTerm(
                            searchTerm.replace(`sing:${sing}`, "").trim()
                          );
                        } else {
                          setSearchTerm(
                            `${searchTerm ? `${searchTerm}|` : ""}sing:${sing}`
                          );
                        }
                      }}
                      className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-800 dark:hover:bg-cyan-700 dark:text-gray-50  ${
                        existsSameSing ? "bg-cyan-300 dark:bg-cyan-600" : ""
                      }`}
                    >
                      {sing}
                    </Badge>
                  );
                })}
              </dd>
            </div>

            <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
              <dt className="text-muted-foreground flex items-start w-full lg:w-48 flex-shrink-0">
                <span className="inline-flex items-center">
                  <FaYoutube className="text-base" />
                  <span className="ml-1">動画タイトル:</span>
                </span>
              </dt>
              <dd>
                <a
                  href={`${currentSongInfo.video_uri}&t=${
                    currentSongInfo.start || 0
                  }s`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline justify-self-start font-semibold dark:text-primary-300 text-sm"
                >
                  <FaYoutube className="inline" /> {currentSongInfo.video_title}
                </a>
              </dd>
            </div>

            <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
              <dt className="text-muted-foreground flex items-start w-full lg:w-48 flex-shrink-0">
                <span className="inline-flex items-center">
                  <FaCalendar className="text-base" />
                  <span className="ml-1">配信日:</span>
                </span>
              </dt>
              <dd className="flex flex-wrap gap-1">
                <Badge
                  className={`text-xs cursor-pointer dark:bg-cyan-800 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                    searchTerm.includes(
                      `date:${new Date(
                        currentSongInfo.broadcast_at
                      ).toLocaleDateString()}`
                    )
                      ? "bg-cyan-300 dark:bg-cyan-600"
                      : ""
                  }`}
                  onClick={() => {
                    const broadcastDate = new Date(
                      currentSongInfo.broadcast_at
                    ).toLocaleDateString();
                    const existsSameDate = searchTerm.includes(
                      `date:${broadcastDate}`
                    );
                    if (existsSameDate) {
                      setSearchTerm(
                        searchTerm.replace(`date:${broadcastDate}`, "").trim()
                      );
                    } else {
                      setSearchTerm(
                        `${
                          searchTerm ? `${searchTerm}|` : ""
                        }date:${broadcastDate}`
                      );
                    }
                  }}
                >
                  {new Date(currentSongInfo.broadcast_at).toLocaleDateString()}
                </Badge>
              </dd>
            </div>

            <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
              <dt className="text-muted-foreground flex items-start w-full lg:w-48 flex-shrink-0">
                <span className="inline-flex items-center">
                  <FaTag className="text-base" />
                  <span className="ml-1">タグ:</span>
                </span>
              </dt>
              <dd className="flex flex-wrap gap-1">
                {currentSongInfo.tags.map((tag) => {
                  const existsSameTag = searchTerm.includes(`tag:${tag}`);
                  return (
                    <Badge
                      key={tag}
                      className={`text-xs cursor-pointer dark:bg-cyan-800 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                        existsSameTag ? "bg-cyan-300 dark:bg-cyan-600" : ""
                      }`}
                      onClick={() => {
                        if (existsSameTag) {
                          setSearchTerm(
                            searchTerm.replace(`tag:${tag}`, "").trim()
                          );
                        } else {
                          setSearchTerm(
                            `${searchTerm ? `${searchTerm}|` : ""}tag:${tag}`
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

            {videoTimestamps.length > 1 && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 flex-shrink-0">
                  <span className="inline-flex items-center">
                    <IoTime className="text-base" />
                    <span className="ml-1">セトリ:</span>
                  </span>
                </dt>
                <dd className="flex-grow flex flex-col gap-1 text-xs lg:text-sm relative">
                  {!isTimestampExpand && (
                    <button
                      type="button"
                      className="w-full text-center bg-gray-50/50 dark:bg-gray-900 text-xs py-1 px-2 cursor-pointer rounded"
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
                                currentSongInfo.start === song.start
                            );

                        return (
                          <div key={song.start} className="w-full flex">
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
                                    isPlaying ? "animate-spin" : ""
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
                                  <span className="text-gray-500 dark:text-gray-300">
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
                                      setSearchTerm(`milestone:${milestone}`);
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </dd>
              </div>
            )}

            {currentSongInfo && currentSongInfo.live_call && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1 mt-2 pt-2 border-t border-gray-300/70 select-none">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 flex-shrink-0">
                  <span className="inline-flex items-center">
                    <MdSpeakerNotes className="text-base" />
                    <span className="ml-1">コーレス:</span>
                    <Tooltip
                      label="コール＆レスポンスは「+αで覚えたら楽しいよ！」というものです。ライブは楽しむことが最優先ですので、無理に覚える必要はありません！"
                      w={300}
                      multiline
                      withArrow
                    >
                      <FaInfoCircle className="inline ml-1 text-light-gray-200 dark:text-gray-300" />
                    </Tooltip>
                  </span>
                </dt>
                <dd className="text-xs lg:text-sm">
                  {currentSongInfo.live_call
                    .split(/[\r\n]/)
                    .map((call, index) => {
                      const match = call.match(
                        /^(\d{1,2}:\d{2}:\d{2})\s*-\s*(\d{1,2}:\d{2}:\d{2})(.*)$/
                      );

                      let callstart = "";
                      let callend = "";
                      let calltext = "";

                      if (match) {
                        callstart = match[1];
                        callend = match[2];
                        calltext = match[3];
                      } else {
                        return (
                          <div
                            key={index}
                            className="flex flex-col lg:flex-row border-t border-light-gray-200 dark:border-gray-600 my-2"
                          ></div>
                        );
                      }
                      return (
                        <div
                          key={index}
                          className="flex flex-col lg:flex-row gap-0 lg:gap-1"
                        >
                          <span className="text-nowrap inline">
                            <Link
                              href={`?v=${
                                currentSongInfo.video_id
                              }&t=${Math.max(0, timeToSeconds(callstart) - 2)}`}
                              className="text-primary hover:underline dark:text-primary-300"
                              onClick={(e) => {
                                e.preventDefault();
                                changeCurrentSong(
                                  currentSongInfo,
                                  false,
                                  currentSongInfo.video_id,
                                  Math.max(0, timeToSeconds(callstart) - 2)
                                );
                              }}
                            >
                              {callstart}
                            </Link>{" "}
                            -{" "}
                            <Link
                              href={`?v=${
                                currentSongInfo.video_id
                              }&t=${timeToSeconds(callend)}`}
                              className="text-primary hover:underline dark:text-primary-300"
                              onClick={(e) => {
                                e.preventDefault();
                                changeCurrentSong(
                                  currentSongInfo,
                                  false,
                                  currentSongInfo.video_id,
                                  timeToSeconds(callend)
                                );
                              }}
                            >
                              {callend}
                            </Link>
                          </span>
                          <span
                            className="break-words break-all"
                            dangerouslySetInnerHTML={{
                              __html: calltext.replace(/\\n/g, "<br>"),
                            }}
                          ></span>
                        </div>
                      );
                    })}
                </dd>
              </div>
            )}

            {currentSongInfo && currentSongInfo.live_note && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1 mt-2 pt-2">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 flex-shrink-0">
                  <span className="inline-flex items-center">
                    <MdSpeakerNotes className="text-base" />
                    <span className="ml-1">ライブノート:</span>
                  </span>
                </dt>
                <dd>
                  <div
                    className="break-words break-all"
                    dangerouslySetInnerHTML={{
                      __html: currentSongInfo.live_note
                        .replace(
                          /(https?:\/\/[\w\d./=?#-\u3000-\u303f\u3040-\u309f\u3130-\u318f\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAff\uFE00-\uFEff]+)/g,
                          (url) =>
                            `<a href="${url}" target="_blank" class="text-primary hover:underline dark:text-primary-300" rel="noopener noreferrer">${url}</a>`
                        )
                        .replace(/\n/g, "<br />"),
                    }}
                  ></div>
                </dd>
              </div>
            )}

            {currentSongInfo && currentSongInfo.extra && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1 mt-2 pt-2 border-t border-gray-300/70">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 flex-shrink-0">
                  <span className="inline-flex items-center">
                    <FaBook className="text-base" />
                    <span className="ml-1">追加情報:</span>
                  </span>
                </dt>
                <dd
                  className="break-words break-all"
                  dangerouslySetInnerHTML={{
                    __html: currentSongInfo.extra
                      .replace(
                        /(https?:\/\/[\w\d./=?#-\u3000-\u303f\u3040-\u309f\u3130-\u318f\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAff\uFE00-\uFEff]+)/g,
                        (url) =>
                          `<a href="${url}" target="_blank" class="text-primary hover:underline dark:text-primary-300" rel="noopener noreferrer">${url}</a>`
                      )
                      .replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            )}
          </dl>
        </div>
      )}
    </>
  );
};

export default NowPlayingSongInfoDetail;

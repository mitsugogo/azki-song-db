import { Badge } from "flowbite-react";
import { Song } from "../types/song";
import {
  FaBook,
  FaCalendar,
  FaCompactDisc,
  FaRepeat,
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
import { getCollabUnitName } from "../config/collabUnits";

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
    startTime?: number,
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
        <div className="grow mb-5 bg-gray-50/20 dark:bg-gray-800 rounded-sm p-4 inset-shadow-sm dark:text-gray-50">
          <dl className="flex flex-col gap-3 lg:gap-1">
            {currentSongInfo.title && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <FaCompactDisc className="text-base" />
                    <span className="ml-1">タイトル:</span>
                  </span>
                </dt>
                <dd className="flex flex-wrap gap-1">
                  <Badge
                    onClick={() => {
                      setSearchTerm(`title:${currentSongInfo.title}`);
                    }}
                    className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-900 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                      searchTerm.includes(`title:${currentSongInfo.title}`)
                        ? "bg-cyan-300 dark:bg-cyan-800"
                        : ""
                    }`}
                  >
                    {currentSongInfo.title}
                  </Badge>
                </dd>
              </div>
            )}

            {currentSongInfo.artist && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <FaUser className="text-base" />
                    <span className="ml-1">アーティスト:</span>
                  </span>
                </dt>
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
                              searchTerm.replace(`artist:${artist}`, "").trim(),
                            );
                          } else {
                            setSearchTerm(
                              `${
                                searchTerm ? `${searchTerm}|` : ""
                              }artist:${artist}`,
                            );
                          }
                        }}
                        className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-900 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                          existsSameArtist ? "bg-cyan-300 dark:bg-cyan-800" : ""
                        }`}
                      >
                        {artist}
                      </Badge>
                    );
                  })}
                </dd>
              </div>
            )}

            {currentSongInfo.lyricist && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <FaUser className="text-base" />
                    <span className="ml-1">作詞:</span>
                  </span>
                </dt>
                <dd className="flex flex-wrap gap-1">
                  {currentSongInfo.lyricist
                    .split("、")
                    .map((lyricist, index) => {
                      const existsSameLyricist = searchTerm.includes(
                        `lyricist:${lyricist}`,
                      );
                      return (
                        <Badge
                          key={index}
                          onClick={() => {
                            if (existsSameLyricist) {
                              setSearchTerm(
                                searchTerm
                                  .replace(`lyricist:${lyricist}`, "")
                                  .trim(),
                              );
                            } else {
                              setSearchTerm(
                                `${
                                  searchTerm ? `${searchTerm}|` : ""
                                }lyricist:${lyricist}`,
                              );
                            }
                          }}
                          className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-900 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                            existsSameLyricist
                              ? "bg-cyan-300 dark:bg-cyan-800"
                              : ""
                          }`}
                        >
                          {lyricist}
                        </Badge>
                      );
                    })}
                </dd>
              </div>
            )}

            {currentSongInfo.composer && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <FaUser className="text-base" />
                    <span className="ml-1">作曲:</span>
                  </span>
                </dt>
                <dd className="flex flex-wrap gap-1">
                  {currentSongInfo.composer
                    .split("、")
                    .map((composer, index) => {
                      const existsSameComposer = searchTerm.includes(
                        `composer:${composer}`,
                      );
                      return (
                        <Badge
                          key={index}
                          onClick={() => {
                            if (existsSameComposer) {
                              setSearchTerm(
                                searchTerm
                                  .replace(`composer:${composer}`, "")
                                  .trim(),
                              );
                            } else {
                              setSearchTerm(
                                `${
                                  searchTerm ? `${searchTerm}|` : ""
                                }composer:${composer}`,
                              );
                            }
                          }}
                          className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-900 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                            existsSameComposer
                              ? "bg-cyan-300 dark:bg-cyan-800"
                              : ""
                          }`}
                        >
                          {composer}
                        </Badge>
                      );
                    })}
                </dd>
              </div>
            )}

            {currentSongInfo.arranger && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <FaUser className="text-base" />
                    <span className="ml-1">編曲:</span>
                  </span>
                </dt>
                <dd className="flex flex-wrap gap-1">
                  {currentSongInfo.arranger

                    .split("、")
                    .map((arranger, index) => {
                      const existsSameArranger = searchTerm.includes(
                        `arranger:${arranger}`,
                      );
                      return (
                        <Badge
                          key={index}
                          onClick={() => {
                            if (existsSameArranger) {
                              setSearchTerm(
                                searchTerm
                                  .replace(`arranger:${arranger}`, "")
                                  .trim(),
                              );
                            } else {
                              setSearchTerm(
                                `${
                                  searchTerm ? `${searchTerm}|` : ""
                                }arranger:${arranger}`,
                              );
                            }
                          }}
                          className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-900 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                            existsSameArranger
                              ? "bg-cyan-300 dark:bg-cyan-800"
                              : ""
                          }`}
                        >
                          {arranger}
                        </Badge>
                      );
                    })}
                </dd>
              </div>
            )}

            {currentSongInfo.album && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <IoAlbums className="text-base" />
                    <span className="ml-1">アルバム:</span>
                  </span>
                </dt>
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
                                searchTerm ? `${searchTerm}|` : ""
                              }album:${album}`,
                            );
                          }
                        }}
                        className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-900 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                          existsSameAlbum ? "bg-cyan-300 dark:bg-cyan-800" : ""
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
              <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
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
                            searchTerm.replace(`sing:${sing}`, "").trim(),
                          );
                        } else {
                          setSearchTerm(
                            `${searchTerm ? `${searchTerm}|` : ""}sing:${sing}`,
                          );
                        }
                      }}
                      className={`cursor-pointer inline-flex whitespace-nowrap dark:bg-cyan-900 dark:hover:bg-cyan-700 dark:text-gray-50  ${
                        existsSameSing ? "bg-cyan-300 dark:bg-cyan-800" : ""
                      }`}
                    >
                      {sing}
                    </Badge>
                  );
                })}
                {(() => {
                  const members = currentSongInfo.sing.split("、");
                  const unitName = getCollabUnitName(members);
                  if (!unitName) return null;

                  const existsSameUnit = searchTerm.includes(
                    `unit:${unitName}`,
                  );
                  return (
                    <>
                      {" - "}
                      <Badge
                        onClick={() => {
                          if (existsSameUnit) {
                            setSearchTerm(
                              searchTerm.replace(`unit:${unitName}`, "").trim(),
                            );
                          } else {
                            setSearchTerm(
                              `${searchTerm ? `${searchTerm}|` : ""}unit:${unitName}`,
                            );
                          }
                        }}
                        className={`cursor-pointer dark:bg-purple-900 dark:text-gray-50 dark:hover:bg-purple-700 bg-purple-200 hover:bg-purple-300 ${
                          existsSameUnit
                            ? "bg-purple-500 text-white dark:bg-purple-700"
                            : ""
                        }`}
                      >
                        {unitName}
                      </Badge>
                    </>
                  );
                })()}
              </dd>
            </div>

            <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
              <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
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
              <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                <span className="inline-flex items-center">
                  <FaCalendar className="text-base" />
                  <span className="ml-1">配信日:</span>
                </span>
              </dt>
              <dd className="flex flex-wrap gap-1">
                <Badge
                  className={`text-xs cursor-pointer dark:bg-cyan-900 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                    searchTerm.includes(
                      `date:${new Date(
                        currentSongInfo.broadcast_at,
                      ).toLocaleDateString()}`,
                    )
                      ? "bg-cyan-300 dark:bg-cyan-800"
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
                          searchTerm ? `${searchTerm}|` : ""
                        }date:${broadcastDate}`,
                      );
                    }
                  }}
                >
                  {new Date(currentSongInfo.broadcast_at).toLocaleDateString()}
                </Badge>
              </dd>
            </div>

            <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
              <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
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
                      className={`text-xs cursor-pointer dark:bg-cyan-900 dark:hover:bg-cyan-700 dark:text-gray-50 ${
                        existsSameTag ? "bg-cyan-300 dark:bg-cyan-800" : ""
                      }`}
                      onClick={() => {
                        if (existsSameTag) {
                          setSearchTerm(
                            searchTerm.replace(`tag:${tag}`, "").trim(),
                          );
                        } else {
                          setSearchTerm(
                            `${searchTerm ? `${searchTerm}|` : ""}tag:${tag}`,
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

            {/** マイルストーン */}
            {currentSongInfo.milestones &&
              currentSongInfo.milestones.length > 0 && (
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                  <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                    <span className="inline-flex items-center">
                      <FaBook className="text-base" />
                      <span className="ml-1">マイルストーン:</span>
                    </span>
                  </dt>
                  <dd className="flex flex-wrap gap-1">
                    {currentSongInfo.milestones.map((milestone) => (
                      <Badge
                        key={milestone}
                        className="text-xs bg-primary text-white dark:text-white hover:bg-primary-500 cursor-pointer dark:bg-primary-700 dark:hover:bg-primary-600"
                        onClick={() => {
                          const existsSameMilestone = searchTerm.includes(
                            `milestone:${milestone}`,
                          );
                          if (existsSameMilestone) {
                            setSearchTerm(
                              searchTerm
                                .replace(`milestone:${milestone}`, "")
                                .trim(),
                            );
                          } else {
                            setSearchTerm(
                              `${
                                searchTerm ? `${searchTerm}|` : ""
                              }milestone:${milestone}`,
                            );
                          }
                        }}
                        title={milestone}
                        aria-label={milestone}
                      >
                        {milestone}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}

            {videoTimestamps.length > 1 && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <IoTime className="text-base" />
                    <span className="ml-1">セトリ:</span>
                  </span>
                </dt>
                <dd className="grow flex flex-col gap-1 text-xs lg:text-sm relative">
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
                                currentSongInfo.start === song.start,
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
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
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
                        /^(\d{1,2}:\d{2}:\d{2})\s*-\s*(\d{1,2}:\d{2}:\d{2})(.*)$/,
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
                                  Math.max(0, timeToSeconds(callstart) - 2),
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
                                  timeToSeconds(callend),
                                );
                              }}
                            >
                              {callend}
                            </Link>
                          </span>
                          <span
                            className="wrap-break-word break-all"
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
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <MdSpeakerNotes className="text-base" />
                    <span className="ml-1">ライブノート:</span>
                  </span>
                </dt>
                <dd>
                  <div
                    className="wrap-break-word break-all"
                    dangerouslySetInnerHTML={{
                      __html: currentSongInfo.live_note
                        .replace(
                          /(https?:\/\/[\w\d./=?#-\u3000-\u303f\u3040-\u309f\u3130-\u318f\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAff\uFE00-\uFEff]+)/g,
                          (url) =>
                            `<a href="${url}" target="_blank" class="text-primary hover:underline dark:text-primary-300" rel="noopener noreferrer">${url}</a>`,
                        )
                        .replace(/\n/g, "<br />"),
                    }}
                  ></div>
                </dd>
              </div>
            )}

            {currentSongInfo && currentSongInfo.extra && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1 mt-2 pt-2 border-t border-gray-300/70">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <FaBook className="text-base" />
                    <span className="ml-1">追加情報:</span>
                  </span>
                </dt>
                <dd
                  className="wrap-break-word break-all"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    const a = target.closest(
                      "a[data-t]",
                    ) as HTMLAnchorElement | null;
                    if (a && currentSongInfo) {
                      e.preventDefault();
                      const t = parseInt(a.getAttribute("data-t") || "0", 10);
                      changeCurrentSong(
                        currentSongInfo,
                        false,
                        currentSongInfo.video_id,
                        t,
                      );
                    }
                  }}
                  dangerouslySetInnerHTML={{
                    __html: currentSongInfo.extra
                      .replace(
                        /(https?:\/\/[\w\d./=?#-\u3000-\u303f\u3040-\u309f\u3130-\u318f\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAff\uFE00-\uFEff]+)/g,
                        (url) =>
                          `<a href="${url}" target="_blank" class="text-primary hover:underline dark:text-primary-300" rel="noopener noreferrer">${url}</a>`,
                      )
                      .replace(/\n/g, "<br />")
                      // hh:mm:ss 形式のタイムスタンプを data-t 属性付きのリンクに置換
                      .replace(/(\d{1,2}:\d{2}:\d{2})/g, (timestamp) => {
                        const seconds = timeToSeconds(timestamp);
                        return `<a href="#" data-t="${seconds}" class="timestamp-link text-primary hover:underline dark:text-primary-300">${timestamp}</a>`;
                      }),
                  }}
                />
              </div>
            )}

            <hr className="my-2 border-gray-300/70" />

            {/* 歌った回数 */}
            <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
              <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                <span className="inline-flex items-center">
                  <FaRepeat className="text-base" />
                  <span className="ml-1">歌った回数:</span>
                </span>
              </dt>
              <dd className="flex flex-wrap gap-1">
                <Badge className="text-xs cursor-pointer dark:bg-cyan-900 dark:hover:bg-cyan-700 dark:text-gray-50">
                  {
                    allSongs.filter(
                      (song) => song.title === currentSongInfo.title,
                    ).length
                  }{" "}
                  回
                </Badge>
              </dd>
            </div>

            {/* 歌った歌枠の動画リンク */}
            <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
              <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                <span className="inline-flex items-center">
                  <FaYoutube className="text-base" />
                  <span className="ml-1">この曲を歌った枠:</span>
                </span>
              </dt>
              <dd className="flex flex-col gap-1">
                {allSongs
                  .filter((song) => song.title === currentSongInfo.title)
                  .sort(
                    (a, b) =>
                      new Date(b.broadcast_at).getTime() -
                      new Date(a.broadcast_at).getTime(),
                  )
                  .map((song, index) => (
                    <div key={index}>
                      {" "}
                      <span className="text-xs">
                        {new Date(song.broadcast_at).toLocaleDateString(
                          "ja-JP",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          },
                        )}{" "}
                        -{" "}
                        <Link
                          key={index}
                          href={`/?v=${song.video_id}&t=${song.start}s`}
                          rel="noopener noreferrer"
                          className="text-primary hover:underline justify-self-start font-semibold dark:text-primary-300"
                          onClick={(e) => {
                            e.preventDefault();
                            changeCurrentSong(song);
                          }}
                        >
                          {song.video_title}
                        </Link>
                        <a
                          key={`${index}-${song.video_id}`}
                          href={`${song.video_uri}&t=${song.start}s`}
                          target="_blank"
                          className="text-primary hover:underline justify-self-start font-semibold dark:text-primary-300 ml-1"
                        >
                          <FaYoutube className="inline" />
                        </a>
                      </span>
                    </div>
                  ))}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </>
  );
};

export default NowPlayingSongInfoDetail;

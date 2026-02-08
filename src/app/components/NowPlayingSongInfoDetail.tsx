import { Badge } from "@mantine/core";
import { Song } from "../types/song";
import {
  FaBook,
  FaCalendar,
  FaCompactDisc,
  FaRepeat,
  FaTag,
  FaUser,
  FaUsers,
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
  currentSong: Song;
  allSongs: Song[];
  searchTerm: string;
  isPlaying: boolean;
  hideFutureSongs: boolean;
  setSearchTerm: (value: string) => void;
  changeCurrentSong: (
    song: Song | null,
    videoId?: string,
    startTime?: number,
  ) => void;
}

const NowPlayingSongInfoDetail = ({
  currentSong,
  allSongs,
  searchTerm,
  isPlaying,
  hideFutureSongs,
  setSearchTerm,
  changeCurrentSong,
}: NowPlayingSongInfoDetailProps) => {
  const [isTimestampExpand, setIsTimestampExpand] = useState(false);
  const [isSangFrameExpand, setIsSangFrameExpand] = useState(false);

  // タイムスタンプ
  const videoTimestamps = allSongs
    .filter((song) => song.video_id === currentSong?.video_id)
    .sort((a, b) => (parseInt(a.start) || 0) - (parseInt(b.start) || 0));

  const sameTitleSongs = allSongs
    .filter((song) => song.title === currentSong?.title)
    .sort(
      (a, b) =>
        new Date(b.broadcast_at).getTime() - new Date(a.broadcast_at).getTime(),
    );
  const hasMoreSangFrames = sameTitleSongs.length > 3;
  const visibleSangFrames = isSangFrameExpand
    ? sameTitleSongs
    : sameTitleSongs.slice(0, 3);

  function timeToSeconds(timeString: string): number {
    const parts = timeString.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  return (
    <>
      {currentSong && (
        <div className="grow mb-5 bg-gray-50/20 dark:bg-gray-800 rounded-sm p-4 inset-shadow-sm dark:text-gray-50">
          <dl className="flex flex-col gap-3 lg:gap-1">
            {currentSong.title && (
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
                      setSearchTerm(`title:${currentSong.title}`);
                    }}
                    color={
                      searchTerm.includes(`title:${currentSong.title}`)
                        ? "blue"
                        : "gray"
                    }
                    radius="sm"
                    style={{ cursor: "pointer" }}
                  >
                    {currentSong.title}
                  </Badge>
                </dd>
              </div>
            )}

            {currentSong.artist && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <FaUser className="text-base" />
                    <span className="ml-1">アーティスト:</span>
                  </span>
                </dt>
                <dd className="flex flex-wrap gap-1">
                  {currentSong.artist.split("、").map((artist, index) => {
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
                              `${searchTerm ? `${searchTerm}|` : ""}artist:${artist}`,
                            );
                          }
                        }}
                        color={`${existsSameArtist ? "blue" : "gray"}`}
                        radius="sm"
                        style={{ cursor: "pointer" }}
                      >
                        {artist}
                      </Badge>
                    );
                  })}
                </dd>
              </div>
            )}

            {(currentSong.lyricist ||
              currentSong.composer ||
              currentSong.arranger) && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <FaUser className="text-base" />
                    <span className="ml-1">作詞/作曲/編曲:</span>
                  </span>
                </dt>
                <dd className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:gap-3">
                  {currentSong.lyricist && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-muted-foreground text-sm">
                        作詞
                      </span>
                      {currentSong.lyricist
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
                                    `${searchTerm ? `${searchTerm}|` : ""}lyricist:${lyricist}`,
                                  );
                                }
                              }}
                              color={`${existsSameLyricist ? "blue" : "gray"}`}
                              radius="sm"
                              style={{ cursor: "pointer" }}
                            >
                              {lyricist}
                            </Badge>
                          );
                        })}
                    </div>
                  )}

                  {currentSong.composer && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-muted-foreground text-sm">
                        作曲
                      </span>
                      {currentSong.composer
                        .split("、")
                        .map((composer, index) => {
                          const existsSameComposer = searchTerm.includes(
                            `composer:${composer}`,
                          );
                          return (
                            <Badge
                              key={index}
                              color={`${existsSameComposer ? "blue" : "gray"}`}
                              radius="sm"
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                if (existsSameComposer) {
                                  setSearchTerm(
                                    searchTerm
                                      .replace(`composer:${composer}`, "")
                                      .trim(),
                                  );
                                } else {
                                  setSearchTerm(
                                    `${searchTerm ? `${searchTerm}|` : ""}composer:${composer}`,
                                  );
                                }
                              }}
                            >
                              {composer}
                            </Badge>
                          );
                        })}
                    </div>
                  )}

                  {currentSong.arranger && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-muted-foreground text-sm">
                        編曲
                      </span>
                      {currentSong.arranger
                        .split("、")
                        .map((arranger, index) => {
                          const existsSameArranger = searchTerm.includes(
                            `arranger:${arranger}`,
                          );
                          return (
                            <Badge
                              key={index}
                              color={`${existsSameArranger ? "blue" : "gray"}`}
                              radius="sm"
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                if (existsSameArranger) {
                                  setSearchTerm(
                                    searchTerm
                                      .replace(`arranger:${arranger}`, "")
                                      .trim(),
                                  );
                                } else {
                                  setSearchTerm(
                                    `${searchTerm ? `${searchTerm}|` : ""}arranger:${arranger}`,
                                  );
                                }
                              }}
                            >
                              {arranger}
                            </Badge>
                          );
                        })}
                    </div>
                  )}
                </dd>
              </div>
            )}

            {currentSong.album && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <IoAlbums className="text-base" />
                    <span className="ml-1">アルバム:</span>
                  </span>
                </dt>
                <dd className="flex flex-wrap gap-1">
                  {currentSong.album.split("、").map((album, index) => {
                    const existsSameAlbum = searchTerm.includes(
                      `album:${album}`,
                    );
                    return (
                      <Badge
                        key={index}
                        color={`${existsSameAlbum ? "blue" : "gray"}`}
                        radius="sm"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          if (existsSameAlbum) {
                            setSearchTerm(
                              searchTerm.replace(`album:${album}`, "").trim(),
                            );
                          } else {
                            setSearchTerm(
                              `${searchTerm ? `${searchTerm}|` : ""}album:${album}`,
                            );
                          }
                        }}
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
                {currentSong.sing.split("、").map((sing, index) => {
                  const existsSameSing = searchTerm.includes(`sing:${sing}`);
                  return (
                    <Badge
                      key={index}
                      color={`${existsSameSing ? "blue" : "gray"}`}
                      radius="sm"
                      style={{ cursor: "pointer" }}
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
                    >
                      {sing}
                    </Badge>
                  );
                })}
                {(() => {
                  const members = currentSong.sing.split("、");
                  const unitName = getCollabUnitName(members);
                  if (!unitName) return null;

                  const existsSameUnit = searchTerm.includes(
                    `unit:${unitName}`,
                  );
                  return (
                    <>
                      {" - "}
                      <Badge
                        key={unitName}
                        leftSection={<FaUsers className="mt-0.5" />}
                        color={`${existsSameUnit ? "blue" : "indigo"}`}
                        radius="sm"
                        style={{ cursor: "pointer" }}
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
                  href={`${currentSong.video_uri}&t=${currentSong.start || 0}s`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline justify-self-start font-semibold dark:text-primary-300 text-sm"
                >
                  {currentSong.video_title}
                </a>
                &nbsp;
                <Badge
                  radius="sm"
                  size="xs"
                  color="red"
                  style={{ cursor: "pointer" }}
                  target="_blank"
                  component={Link}
                  href={`${currentSong.video_uri}&t=${currentSong.start || 0}s`}
                  leftSection={<FaYoutube />}
                >
                  YouTube
                </Badge>
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
                  radius="sm"
                  color={`${
                    searchTerm.includes(
                      `date:${new Date(currentSong.broadcast_at).toLocaleDateString()}`,
                    )
                      ? "blue"
                      : "gray"
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    const broadcastDate = new Date(
                      currentSong.broadcast_at,
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
                        `${searchTerm ? `${searchTerm}|` : ""}date:${broadcastDate}`,
                      );
                    }
                  }}
                >
                  {new Date(currentSong.broadcast_at).toLocaleDateString()}
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
                {currentSong.tags.map((tag) => {
                  const existsSameTag = searchTerm.includes(`tag:${tag}`);
                  return (
                    <Badge
                      key={tag}
                      radius="sm"
                      color={`${existsSameTag ? "blue" : "gray"}`}
                      style={{ cursor: "pointer" }}
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
            {currentSong.milestones && currentSong.milestones.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-1">
                <dt className="text-muted-foreground flex items-start w-full lg:w-48 shrink-0">
                  <span className="inline-flex items-center">
                    <FaBook className="text-base" />
                    <span className="ml-1">マイルストーン:</span>
                  </span>
                </dt>
                <dd className="flex flex-wrap gap-1">
                  {currentSong.milestones.map((milestone) => (
                    <Badge
                      key={milestone}
                      radius="sm"
                      color={`${searchTerm.includes(`milestone:${milestone}`) ? "pink" : "gray"}`}
                      style={{ cursor: "pointer" }}
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
                            `${searchTerm ? `${searchTerm}|` : ""}milestone:${milestone}`,
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
                                currentSong?.title === song.title &&
                                currentSong.video_id === song.video_id &&
                                currentSong.start === song.start,
                            );

                        // 今再生中の曲かどうか
                        const isCurrentSong = song === currentSong;

                        return (
                          <div
                            key={song.start}
                            className={`w-full flex rounded px-1 border  text-xs ${
                              isCurrentSong
                                ? "bg-blue-50/70 dark:bg-blue-900/40 border-blue-300/70 dark:border-blue-700/60 py-0.5"
                                : "border-transparent"
                            }`}
                          >
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
                              <span
                                className={`${
                                  isHide
                                    ? "h-4 bg-gray-300 rounded-sm dark:bg-gray-700"
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

            {currentSong && currentSong.live_call && (
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
                  {currentSong.live_call.split(/[\r\n]/).map((call, index) => {
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
                            href={`?v=${currentSong.video_id}&t=${Math.max(0, timeToSeconds(callstart) - 2)}`}
                            className="text-primary hover:underline dark:text-primary-300"
                            onClick={(e) => {
                              e.preventDefault();
                              changeCurrentSong(
                                currentSong,
                                currentSong.video_id,
                                Math.max(0, timeToSeconds(callstart) - 2),
                              );
                            }}
                          >
                            {callstart}
                          </Link>{" "}
                          -{" "}
                          <Link
                            href={`?v=${currentSong.video_id}&t=${timeToSeconds(callend)}`}
                            className="text-primary hover:underline dark:text-primary-300"
                            onClick={(e) => {
                              e.preventDefault();
                              changeCurrentSong(
                                currentSong,
                                currentSong.video_id,
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

            {currentSong && currentSong.live_note && (
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
                      __html: currentSong.live_note
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

            {currentSong && currentSong.extra && (
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
                    if (a && currentSong) {
                      e.preventDefault();
                      const t = parseInt(a.getAttribute("data-t") || "0", 10);
                      changeCurrentSong(currentSong, currentSong.video_id, t);
                    }
                  }}
                  dangerouslySetInnerHTML={{
                    __html: currentSong.extra
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
                <Badge radius="sm">
                  {
                    allSongs.filter((song) => song.title === currentSong.title)
                      .length
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
                {visibleSangFrames.map((song, index) => {
                  const isCurrentSangFrame =
                    song.video_id === currentSong.video_id &&
                    song.start === currentSong.start;

                  return (
                    <div key={`${song.video_id}-${song.start}-${index}`}>
                      <span
                        className={`text-xs inline-flex flex-wrap items-center gap-1 rounded px-1 py-0.5 border ${
                          isCurrentSangFrame
                            ? "bg-blue-50/70 dark:bg-blue-900/40 border-blue-300/70 dark:border-blue-700/60"
                            : "border-transparent"
                        }`}
                      >
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
                        <Badge
                          color="gray"
                          size="xs"
                          radius="sm"
                          leftSection={<FaYoutube />}
                          style={{ cursor: "pointer" }}
                          component={Link}
                          href={`${song.video_uri}&t=${song.start}s`}
                          target="_blank"
                        >
                          YouTube
                        </Badge>
                      </span>
                    </div>
                  );
                })}
                {!isSangFrameExpand && hasMoreSangFrames && (
                  <button
                    type="button"
                    className="w-full text-center bg-gray-50/50 dark:bg-gray-900 text-xs py-1 px-2 cursor-pointer rounded"
                    onClick={() => setIsSangFrameExpand(true)}
                  >
                    クリックして展開&nbsp;
                    <HiChevronDown className="inline" />
                  </button>
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </>
  );
};

export default NowPlayingSongInfoDetail;

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@mantine/hooks";
import { Song } from "../types/song";
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
import { GlobalPlayerContextType } from "./useGlobalPlayer";
import type { YouTubeVideoData } from "../types/youtube";
import useYoutubeVideoInfo from "./useYoutubeVideoInfo";
import { siteConfig } from "../config/siteConfig";
import historyHelper from "../lib/history";

// YouTubePlayer に getVideoData メソッドを追加した拡張型
type YouTubePlayerWithVideoData = YouTubePlayer & {
  getVideoData: () => YouTubeVideoData;
};

/**
 * プレイヤーの再生ロジックを管理するカスタムフック
 *
 * 責務:
 * - 現在/次/前の曲の状態管理
 * - 曲の切り替えロジック
 * - YouTube プレイヤーのイベントハンドリング
 * - 再生状態の管理
 *
 * @param songs - 表示中の曲リスト（フィルタ後）
 * @param allSongs - 全ての曲のリスト
 * @param globalPlayer - グローバルプレイヤーコンテキスト
 */
const usePlayerControls = (
  songs: Song[],
  allSongs: Song[],
  globalPlayer: GlobalPlayerContextType,
) => {
  // === 曲の状態管理 ===
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const currentSongRef = useRef(currentSong);
  const [previousSong, setPreviousSong] = useState<Song | null>(null);
  const [nextSong, setNextSong] = useState<Song | null>(null);

  // === 再生制御 ===
  const [videoId, setVideoId] = useState("");
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<YouTubeVideoData | null>(null);
  const videoTitleRef = useRef<string | null>(null);
  const videoDataRef = useRef<YouTubeVideoData | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [playerKey, setPlayerKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // === セトリネタバレ防止モード ===
  const [hideFutureSongs, setHideFutureSongs] = useLocalStorage<boolean>({
    key: "hideFutureSongs",
    defaultValue: false,
  });

  // === 内部参照 ===
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const youtubeVideoIdRef = useRef("");
  // 履歴更新フラグは集中管理する helper を使う
  // (see src/app/lib/history.ts)
  const lastManualChangeRef = useRef<number>(0);
  const isManualChangeInProgressRef = useRef<boolean>(false);
  const lastEndClampRef = useRef<number>(0);

  // === ライブコール関連 ===
  const [timedLiveCallText, setTimedLiveCallText] = useState<string | null>(
    null,
  );
  const [timedMessages, setTimedMessages] = useState<
    { start: number; end: number; text: string }[]
  >([]);
  const timedMessagesRef = useRef(timedMessages);

  // songs配列とnextSongの最新値をrefで保持
  const songsRef = useRef(songs);
  const nextSongRef = useRef(nextSong);
  // changeCurrentSongの最新値をrefで保持（setInterval内で使用）
  const changeCurrentSongRef = useRef<
    (
      song: Song | null,
      explicitVideoId?: string,
      explicitStartTime?: number,
      options?: { skipSeek?: boolean },
    ) => void
  >(() => {});

  // === ref同期 ===
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  useEffect(() => {
    nextSongRef.current = nextSong;
  }, [nextSong]);

  // === 前後の曲を計算・設定 ===
  const setPreviousAndNextSongs = useCallback(
    (song: Song, songsList: Song[]) => {
      const currentIndex = songsList.findIndex(
        (s) => s.video_id === song.video_id && s.start === song.start,
      );

      const prev = currentIndex > 0 ? songsList[currentIndex - 1] : null;
      const next =
        currentIndex < songsList.length - 1
          ? songsList[currentIndex + 1]
          : null;
      setPreviousSong(prev);
      setNextSong(next);
    },
    [],
  );

  // URL操作ヘルパは外部ライブラリに移譲

  // URL の検索パラメータを構築するヘルパ。
  // 常に `v` を先頭、次に `t`、その後に既存のその他の検索パラメータを元の順序で追加する。
  const buildSearchParamsWithVtFirst = (
    url: URL,
    vVal?: string | null,
    tVal?: string | null,
  ) => {
    const existing = url.searchParams;
    const newParams = new URLSearchParams();
    if (vVal) {
      newParams.append("v", vVal);
    }
    if (tVal) {
      newParams.append("t", tVal);
    }
    for (const [key, value] of existing) {
      if (key === "v" || key === "t") continue;
      newParams.append(key, value);
    }
    url.search = newParams.toString();
  };

  // 動画IDが変わったらURLのv=xxxを更新
  useEffect(() => {
    const url = new URL(window.location.href);
    if (videoId) {
      const existingT = url.searchParams.get("t");
      buildSearchParamsWithVtFirst(url, videoId, existingT);
      historyHelper.replaceUrlIfDifferent(url.toString());
    }
  }, [videoId]);

  // songsが変わったら前後の楽曲を再計算
  useEffect(() => {
    if (!currentSong) return;

    // もし現在の楽曲がリストにない場合は先頭を再生しはじめる
    const isExists = songs.some(
      (song) =>
        song.video_id === currentSong?.video_id &&
        song.start === currentSong?.start,
    );
    if (!isExists && songs.length > 0) {
      changeCurrentSong(songs[0]);
      return;
    }

    if (currentSong && songs.length > 0) {
      setPreviousAndNextSongs(currentSong, songs);
    }
  }, [songs, currentSong, setPreviousAndNextSongs]);

  // 現在の楽曲が変わったらtitleを変更する
  useEffect(() => {
    const title =
      isPlaying && currentSong
        ? `♪${currentSong.title} / ${currentSong.artist} | ${siteConfig.siteName}`
        : siteConfig.siteName;
    document.title = title;
  }, [currentSong, isPlaying]);

  // 全曲をstart降順でソート（曲検索用）
  const sortedAllSongs = useMemo(() => {
    return [...allSongs].sort((a, b) => parseInt(b.start) - parseInt(a.start));
  }, [allSongs]);

  const songsByVideo = useMemo(() => {
    const map = new Map<string, Song[]>();
    sortedAllSongs.forEach((song) => {
      if (!song.video_id) return;
      const list = map.get(song.video_id) ?? [];
      list.push(song);
      map.set(song.video_id, list);
    });
    map.forEach((list) => {
      list.sort((a, b) => Number(a.start) - Number(b.start));
    });
    return map;
  }, [sortedAllSongs]);

  const getSongKey = useCallback((song: Song) => {
    if (song.slug) return song.slug;
    return `${song.title}::${song.artist}`;
  }, []);

  const isSameSong = useCallback(
    (a: Song | null | undefined, b: Song | null | undefined) => {
      if (!a || !b) return false;
      return a.video_id === b.video_id && a.start === b.start;
    },
    [],
  );

  const isSongInList = useCallback(
    (song: Song | null | undefined, list: Song[]) => {
      if (!song) return false;
      return list.some(
        (item) => item.video_id === song.video_id && item.start === song.start,
      );
    },
    [],
  );

  // 強制的にPlayerをリセットする
  const resetPlayer = useCallback(() => {
    setPlayerKey((prevKey) => prevKey + 1);
  }, []);

  // ライブコールメッセージを設定
  const setLivecallTimedMessages = useCallback(
    (messages: { start: number; end: number; text: string }[]) => {
      setTimedMessages(messages);
      timedMessagesRef.current = messages;
    },
    [],
  );

  // ライブコールをパースするヘルパー関数
  const parseLiveCallMessages = useCallback((liveCall: string) => {
    return liveCall
      .split(/[\r\n]/)
      .map((line) => line.match(/(\d+):(\d+):(\d+) - (\d+):(\d+):(\d+)(.*)$/))
      .filter((match) => !!match)
      .map((match) => {
        const startHours = parseInt(match![1]);
        const startMinutes = parseInt(match![2]);
        const startSeconds = parseInt(match![3]);
        const startInSeconds =
          startHours * 3600 + startMinutes * 60 + startSeconds;

        const endHours = parseInt(match![4]);
        const endMinutes = parseInt(match![5]);
        const endSeconds = parseInt(match![6]);
        const endInSeconds = endHours * 3600 + endMinutes * 60 + endSeconds;

        return {
          start: startInSeconds,
          end: endInSeconds,
          text: match![7].trim(),
        };
      });
  }, []);

  // === 曲を変更する ===
  const changeCurrentSong = useCallback(
    (
      song: Song | null,
      explicitVideoId?: string,
      explicitStartTime?: number,
      options?: { skipSeek?: boolean },
    ) => {
      const targetVideoId = explicitVideoId ?? song?.video_id;
      if (!targetVideoId) return;

      const targetStartTime =
        explicitStartTime ?? (song ? Number(song.start) : 0);

      // 曲が指定されていない場合、videoIdとstartTimeからsongを特定
      if (!song && targetVideoId) {
        const targetSongs = sortedAllSongs
          .slice()
          .filter((s) => s.video_id === targetVideoId)
          .sort((a, b) => parseInt(b.start) - parseInt(a.start));
        song =
          targetSongs.find((s) => parseInt(s.start) <= targetStartTime) ?? null;
      }
      if (!song) return;

      // 同一再生中の曲が渡された場合は変更を無視する
      const isSameAsPlaying =
        currentSong?.video_id === song?.video_id &&
        currentSong?.start === song?.start;

      if (
        isSameAsPlaying &&
        !explicitVideoId &&
        typeof explicitStartTime !== "number"
      ) {
        return;
      }

      // ライブコール場所を秒数に変換しながらパース
      setTimedLiveCallText(null);
      if (song.live_call) {
        const timedMessagesParsed = parseLiveCallMessages(song.live_call);
        setTimedMessages(timedMessagesParsed);
        timedMessagesRef.current = timedMessagesParsed;
      }

      // 前後の曲をセット
      setPreviousAndNextSongs(song, songs);

      // === 同一動画内での曲変更 ===
      const isSameVideo =
        Boolean(youtubeVideoIdRef.current) &&
        youtubeVideoIdRef.current === targetVideoId;
      const isSameAsCurrentSong =
        currentSong?.video_id && currentSong.video_id === targetVideoId;
      const isSameAsVideoIdState = videoId && videoId === targetVideoId;

      if (isSameVideo || isSameAsCurrentSong || isSameAsVideoIdState) {
        youtubeVideoIdRef.current = targetVideoId;
        if (!options?.skipSeek) {
          isManualChangeInProgressRef.current = true;
          lastManualChangeRef.current = Date.now();
          setStartTime(targetStartTime);
        }
        setVideoId(targetVideoId);
        setCurrentSong(song);
        // 再生中の場合は現在の再生位置を示す t パラメータを更新する
        try {
          const url = new URL(window.location.href);
          const songStart = Number(song?.start ?? targetStartTime);
          const tVal = songStart > 0 ? `${songStart}s` : null;
          buildSearchParamsWithVtFirst(url, targetVideoId, tVal);
          historyHelper.replaceUrlIfDifferent(url.toString());
        } catch (_) {}
        // skipSeekオプションがない場合はシークを行う
        // 自動遷移時のみskipSeek: trueで呼び出される
        if (!options?.skipSeek) {
          const seekTime =
            typeof explicitStartTime === "number"
              ? explicitStartTime
              : Number(song.start);
          globalPlayer.seekTo(seekTime);
        }
        return;
      }

      // === 異なる動画への切り替え ===
      // URL 表示や Player リセットが必要な場合のみ履歴操作を行う
      const url = new URL(window.location.href);
      // 新しい動画に切り替える際は、ターゲットの開始時刻に合わせて t を設定する。
      // 通常は曲の定義された start を優先して URL に反映する。
      const songStart = Number(song?.start ?? targetStartTime);
      const tVal = songStart > 0 ? `${songStart}s` : null;
      buildSearchParamsWithVtFirst(url, targetVideoId, tVal);
      // Headerなどに通知（差分があれば履歴更新）
      historyHelper.replaceUrlIfDifferent(url.toString());

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      // 動画IDが変わった場合はフラグを立てる
      isManualChangeInProgressRef.current = true;
      youtubeVideoIdRef.current = targetVideoId || "";

      // 手動で曲を変更したことを記録
      lastManualChangeRef.current = Date.now();

      // 新しい動画を読み込む
      setVideoId(targetVideoId || "");
      setVideoTitle(null);
      videoTitleRef.current = null;
      setVideoData(null);
      videoDataRef.current = null;
      setStartTime(targetStartTime);
      setCurrentSong(song);
    },
    [
      songs,
      setPreviousAndNextSongs,
      currentSong,
      sortedAllSongs,
      parseLiveCallMessages,
    ],
  );

  // changeCurrentSong の ref 同期（setInterval 内で最新の関数を使うため）
  useEffect(() => {
    changeCurrentSongRef.current = changeCurrentSong;
  }, [changeCurrentSong]);

  const playRandomSong = useCallback(
    (songsList: Song[]) => {
      if (songsList.length === 0) return;
      const randomSong =
        songsList[Math.floor(Math.random() * songsList.length)];
      changeCurrentSong(randomSong);
    },
    [changeCurrentSong],
  );

  const searchCurrentSongOnVideo = useCallback(
    (video_id: string, currentTime: number) => {
      return sortedAllSongs.find(
        (s) => s.video_id === video_id && parseInt(s.start) <= currentTime,
      );
    },
    [allSongs],
  );

  const getNextSongInVideo = useCallback(
    (song: Song | null) => {
      if (!song?.video_id) return null;
      const list = songsByVideo.get(song.video_id);
      if (!list) return null;
      const currentIndex = list.findIndex(
        (s) => s.video_id === song.video_id && s.start === song.start,
      );
      if (currentIndex < 0) return null;
      const currentKey = getSongKey(song);
      for (let i = currentIndex + 1; i < list.length; i += 1) {
        const candidate = list[i];
        if (getSongKey(candidate) !== currentKey) {
          return candidate;
        }
      }
      return null;
    },
    [songsByVideo, getSongKey],
  );

  const handleStateChange = useCallback(
    (event: YouTubeEvent<number> & { target: YouTubePlayerWithVideoData }) => {
      const player = event.target;
      const fetchedVideoData = player.getVideoData?.() ?? null;
      const videoId = fetchedVideoData?.video_id;
      const title = fetchedVideoData?.title ?? null;

      // 比較ヘルパー（最低限のフィールドで判定）
      const isVideoDataEqual = (
        a: YouTubeVideoData | null,
        b: YouTubeVideoData | null,
      ) => {
        if (a === b) return true;
        if (!a || !b) return false;
        return a.video_id === b.video_id && a.title === b.title;
      };

      if (title && title !== videoTitleRef.current) {
        setVideoTitle(title);
        videoTitleRef.current = title;
      }

      if (!isVideoDataEqual(fetchedVideoData, videoDataRef.current)) {
        setVideoData(fetchedVideoData);
        videoDataRef.current = fetchedVideoData;
      }

      const clearMonitorInterval = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      if (youtubeVideoIdRef.current !== videoId) {
        clearMonitorInterval();
        // 動画IDが変わったら youtubeVideoIdRef を更新
        if (videoId) {
          youtubeVideoIdRef.current = videoId;
        }
      }

      const handlePlayingState = () => {
        if (intervalRef.current) return;

        // ループ内でtimedMessagesをチェック
        const sortedTimedMessages = [...timedMessagesRef.current].sort(
          (a, b) => a.start - b.start,
        );

        // 再生中の監視タイマー
        intervalRef.current = setInterval(() => {
          const currentTime = Number(player.getCurrentTime());
          const currentVideoId = player.getVideoData()?.video_id;

          if (!currentVideoId) {
            return;
          }

          const videoSongs = songsByVideo.get(currentVideoId);
          const lastEnd = videoSongs
            ? videoSongs.reduce(
                (max, song) => Math.max(max, Number(song.end || 0)),
                0,
              )
            : 0;
          if (lastEnd > 0 && currentTime > lastEnd + 0.5) {
            const now = Date.now();
            if (now - lastEndClampRef.current > 1000) {
              lastEndClampRef.current = now;
              try {
                if (typeof player.seekTo === "function") {
                  player.seekTo(lastEnd, true);
                }
                if (typeof player.pauseVideo === "function") {
                  player.pauseVideo();
                }
              } catch (_) {}
            }
            return;
          }

          const nextMessage = sortedTimedMessages.find(
            (msg) => currentTime + 1 >= msg.start && currentTime < msg.end,
          );

          if (nextMessage) {
            setTimedLiveCallText(nextMessage.text);
          } else {
            setTimedLiveCallText(null);
          }

          const foundSong = searchCurrentSongOnVideo(
            currentVideoId,
            currentTime,
          );
          const currentSongForNext =
            currentSongRef.current ?? foundSong ?? null;
          const nextSongInVideo = getNextSongInVideo(currentSongForNext);
          // フィルタ済みの songs を優先して次曲を決定する（検索フィルタが有効な場合の同期問題対策）
          let autoNextSong: Song | null = null;
          // まず同一動画内での次曲を優先
          if (
            nextSongInVideo &&
            !isSameSong(nextSongInVideo, currentSongRef.current) &&
            isSongInList(nextSongInVideo, songsRef.current)
          ) {
            autoNextSong = nextSongInVideo;
          } else {
            // filtered songs（songsRef）上での現在位置に基づいて次曲を探す
            const list = songsRef.current;
            if (currentSongForNext) {
              const idx = list.findIndex(
                (s) =>
                  s.video_id === currentSongForNext.video_id &&
                  s.start === currentSongForNext.start,
              );
              if (idx >= 0 && idx < list.length - 1) {
                const candidate = list[idx + 1];
                if (!isSameSong(candidate, currentSongRef.current))
                  autoNextSong = candidate;
              }
            }
            // まだ見つからない場合は nextSongRef をフォールバック（ただし現在の曲と同一でないこと）
            if (
              !autoNextSong &&
              nextSongRef.current &&
              !isSameSong(nextSongRef.current, currentSongRef.current)
            ) {
              autoNextSong = nextSongRef.current;
            }
          }
          const isFoundSongInList = songsRef.current.some(
            (s) =>
              s.video_id === foundSong?.video_id &&
              s.start === foundSong?.start,
          );

          try {
            if (
              document.documentElement.getAttribute("data-seek-dragging") ===
              "1"
            ) {
              return;
            }
          } catch (_) {}

          // 自動切替: 同一動画内で再生位置が次の曲に移った場合、曲名を自動で更新する
          const currentPlayingVideoId = currentSongRef.current?.video_id;
          const isSameVideoPlaying =
            currentPlayingVideoId && currentVideoId === currentPlayingVideoId;
          if (
            foundSong &&
            isFoundSongInList &&
            isSameVideoPlaying &&
            (foundSong.start !== currentSongRef.current?.start ||
              foundSong.video_id !== currentSongRef.current?.video_id) &&
            !isManualChangeInProgressRef.current
          ) {
            // 自動的な切り替えは ref 経由で最新の changeCurrentSong を呼ぶ
            // 自動遷移なのでシークはスキップ（表示のみ更新）
            isManualChangeInProgressRef.current = true;
            lastManualChangeRef.current = Date.now();
            changeCurrentSongRef.current(
              foundSong,
              foundSong.video_id,
              Number(foundSong.start),
              {
                skipSeek: true,
              },
            );
            return;
          }

          // 手動変更中フラグのチェック
          const now = Date.now();
          const elapsed = now - lastManualChangeRef.current;
          const shouldBlockAutoChange =
            isManualChangeInProgressRef.current && elapsed <= 3000;

          // 手動変更の猶予時間が過ぎたらフラグをクリア
          if (isManualChangeInProgressRef.current && elapsed > 3000) {
            isManualChangeInProgressRef.current = false;
          }

          // 曲の自動変更はフラグ中はブロック
          if (shouldBlockAutoChange) {
            return;
          }

          if (!isFoundSongInList && autoNextSong) {
            changeCurrentSongRef.current(autoNextSong);
            return;
          }

          if (foundSong?.end && Number(foundSong.end ?? 0) < currentTime) {
            clearMonitorInterval();
            if (autoNextSong) {
              changeCurrentSongRef.current(autoNextSong);
            }
          } else if (!foundSong && autoNextSong) {
            changeCurrentSongRef.current(autoNextSong);
          }
        }, 500);
      };

      const handleEndedState = () => {
        clearMonitorInterval();
        const nextSongInVideo = getNextSongInVideo(currentSongRef.current);
        // ended 時はまず同一動画内の次曲を探し、なければ filtered songs の次、最後に全体の先頭を再生
        let autoNextSong: Song | null = null;
        if (
          nextSongInVideo &&
          !isSameSong(nextSongInVideo, currentSongRef.current) &&
          isSongInList(nextSongInVideo, songsRef.current)
        ) {
          autoNextSong = nextSongInVideo;
        } else if (currentSongRef.current) {
          const list = songsRef.current;
          const idx = list.findIndex(
            (s) =>
              s.video_id === currentSongRef.current?.video_id &&
              s.start === currentSongRef.current?.start,
          );
          if (idx >= 0 && idx < list.length - 1) {
            const candidate = list[idx + 1];
            if (!isSameSong(candidate, currentSongRef.current)) {
              autoNextSong = candidate;
            }
          }
        }
        if (autoNextSong) {
          changeCurrentSongRef.current(autoNextSong);
        } else if (songsRef.current.length > 0) {
          // songsRef の先頭が現在の曲でない場合のみ先頭へ移動
          const first = songsRef.current[0];
          if (first && !isSameSong(first, currentSongRef.current)) {
            changeCurrentSongRef.current(first);
          }
        }
        // 再生終了時にメッセージをリセット
        setTimedLiveCallText(null);
      };
      switch (event.data) {
        case YouTube.PlayerState.UNSTARTED:
        case YouTube.PlayerState.PAUSED:
        case YouTube.PlayerState.BUFFERING:
          clearMonitorInterval();
          setIsPlaying(false);
          break;
        case YouTube.PlayerState.PLAYING:
          handlePlayingState();
          setIsPlaying(true);
          break;
        case YouTube.PlayerState.ENDED:
          handleEndedState();
          setIsPlaying(false);
          break;
      }
    },
    [
      songs,
      nextSong,
      playRandomSong,
      searchCurrentSongOnVideo,
      timedMessages,
      getNextSongInVideo,
      isSameSong,
      isSongInList,
    ],
  );

  const { videoInfo } = useYoutubeVideoInfo(videoId);

  const handlePlayerOnReady = useCallback(
    (event: YouTubeEvent<number> & { target: YouTubePlayerWithVideoData }) => {
      const player = event.target;
      const fetchedVideoData = player.getVideoData?.() ?? null;
      const title = fetchedVideoData?.title ?? null;

      const isVideoDataEqual = (
        a: YouTubeVideoData | null,
        b: YouTubeVideoData | null,
      ) => {
        if (a === b) return true;
        if (!a || !b) return false;
        return a.video_id === b.video_id && a.title === b.title;
      };

      if (title && title !== videoTitleRef.current) {
        setVideoTitle(title);
        videoTitleRef.current = title;
      }

      if (!isVideoDataEqual(fetchedVideoData, videoDataRef.current)) {
        setVideoData(fetchedVideoData);
        videoDataRef.current = fetchedVideoData;
      }

      player.playVideo();
      setIsPlaying(true);

      // 再生開始時は URL の既存パラメータを変更しない（外部から渡された v/t を保持）
    },
    [],
  );

  return {
    currentSong,
    setCurrentSong,
    currentSongRef,
    previousSong,
    nextSong,
    isPlaying,
    playerKey,
    hideFutureSongs,
    videoId,
    videoTitle,
    videoData,
    videoInfo,
    startTime,
    timedLiveCallText,
    setHideFutureSongs,
    changeCurrentSong,
    playRandomSong,
    handlePlayerOnReady,
    handleStateChange,
    setPreviousAndNextSongs,
  };
};

export default usePlayerControls;
export type { YouTubePlayerWithVideoData };

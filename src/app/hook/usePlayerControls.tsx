import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Song } from "../types/song";
import YouTube, { YouTubeEvent } from "react-youtube";
import { GlobalPlayerContextType } from "./useGlobalPlayer";

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
  const [startTime, setStartTime] = useState(0);
  const [playerKey, setPlayerKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // === セトリネタバレ防止モード ===
  const [hideFutureSongs, setHideFutureSongs] = useState(false);

  // === 内部参照 ===
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const youtubeVideoIdRef = useRef("");
  const lastManualChangeRef = useRef<number>(0);
  const isManualChangeInProgressRef = useRef<boolean>(false);

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

  // changeCurrentSong の ref 同期は後で定義

  // === セトリネタバレ防止モードのlocalStorage同期 ===
  useEffect(() => {
    const hideFutureSongs = localStorage.getItem("hideFutureSongs");
    if (hideFutureSongs === "true") {
      setHideFutureSongs(true);
    }
  }, []);

  useEffect(() => {
    if (hideFutureSongs) {
      localStorage.setItem("hideFutureSongs", "true");
    } else {
      localStorage.removeItem("hideFutureSongs");
    }
  }, [hideFutureSongs]);

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
        ? `♪${currentSong.title} / ${currentSong.artist} - AZKi Song Database`
        : "AZKi Song Database";
    document.title = title;
  }, [currentSong, isPlaying]);

  // 全曲をstart降順でソート（曲検索用）
  const sortedAllSongs = useMemo(() => {
    return [...allSongs].sort((a, b) => parseInt(b.start) - parseInt(a.start));
  }, [allSongs]);

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
      if (!song && !explicitVideoId) return;

      const targetVideoId = explicitVideoId ?? song?.video_id;
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
      if (
        youtubeVideoIdRef.current &&
        targetVideoId &&
        youtubeVideoIdRef.current === targetVideoId
      ) {
        setCurrentSong(song);
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
      url.searchParams.delete("v");
      url.searchParams.delete("t");
      // Headerなどに通知
      window.dispatchEvent(new Event("replacestate"));

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      // 動画IDが変わった場合はフラグを立てる
      isManualChangeInProgressRef.current = true;
      youtubeVideoIdRef.current = targetVideoId || "";

      // 手動で曲を変更したことを記録
      lastManualChangeRef.current = Date.now();

      // 新しい動画を読み込む
      setVideoId(targetVideoId || "");
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

  const handleStateChange = useCallback(
    (event: YouTubeEvent<number>) => {
      const player = event.target;
      const videoData = player.getVideoData();
      const videoId = videoData?.video_id;

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
          const currentTime = player.getCurrentTime();
          const currentVideoId = player.getVideoData()?.video_id;

          if (!currentVideoId) {
            return;
          }

          // 現在時刻が指定秒数を超えて、かつ未表示のメッセージを探す
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
          const isFoundSongInList = songsRef.current.some(
            (s) =>
              s.video_id === foundSong?.video_id &&
              s.start === foundSong?.start,
          );

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
            changeCurrentSongRef.current(foundSong, undefined, undefined, {
              skipSeek: true,
            });
            return;
          }

          // 手動変更中フラグのチェック
          const shouldBlockAutoChange =
            isManualChangeInProgressRef.current &&
            Date.now() - lastManualChangeRef.current <= 3000;

          // 一定時間経過したらフラグをクリア
          if (
            shouldBlockAutoChange &&
            Date.now() - lastManualChangeRef.current > 300
          ) {
            isManualChangeInProgressRef.current = false;
          }

          // 曲の自動変更はフラグ中はブロック
          if (shouldBlockAutoChange) {
            return;
          }

          if (!isFoundSongInList && nextSongRef.current) {
            changeCurrentSongRef.current(nextSongRef.current);
            return;
          }

          if (foundSong?.end && foundSong.end < currentTime) {
            clearMonitorInterval();
            changeCurrentSongRef.current(nextSongRef.current);
          } else if (!foundSong && nextSongRef.current) {
            changeCurrentSongRef.current(nextSongRef.current);
          }
        }, 500);
      };

      const handleEndedState = () => {
        clearMonitorInterval();
        if (nextSongRef.current) {
          changeCurrentSongRef.current(nextSongRef.current);
        } else if (songsRef.current.length > 0) {
          changeCurrentSongRef.current(songsRef.current[0]);
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
    [songs, nextSong, playRandomSong, searchCurrentSongOnVideo, timedMessages],
  );

  const handlePlayerOnReady = useCallback((event: YouTubeEvent<number>) => {
    const player = event.target;
    player.playVideo();
    setIsPlaying(true);

    // URLに「v」と「t」が存在する場合、再生開始後にパラメータを削除
    const url = new URL(window.location.href);
    if (url.searchParams.has("v") || url.searchParams.has("t")) {
      url.searchParams.delete("v");
      url.searchParams.delete("t");
      window.history.replaceState(null, "", url.toString());
      window.dispatchEvent(new Event("replacestate"));
    }
  }, []);

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

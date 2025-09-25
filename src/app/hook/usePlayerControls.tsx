import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Song } from "../types/song";
import YouTube, { YouTubeEvent } from "react-youtube";
import { time } from "console";

/**
 * プレイヤーの再生ロジックを管理するカスタムフック
 * @param songs - 表示中の曲リスト
 * @param allSongs - 全ての曲のリスト
 * @param timedMessages - 指定秒数で表示するメッセージのリスト
 */
const usePlayerControls = (songs: Song[], allSongs: Song[]) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentSongInfo, setCurrentSongInfo] = useState<Song | null>(null);
  const [previousSong, setPreviousSong] = useState<Song | null>(null);
  const [nextSong, setNextSong] = useState<Song | null>(null);

  // videoIdとstartTimeを直指定で再生する場合
  const [videoId, setVideoId] = useState("");
  const [startTime, setStartTime] = useState(0);

  const [playerKey, setPlayerKey] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);

  // セトリのネタバレを回避するモード
  const [hideFutureSongs, setHideFutureSongs] = useState(false);

  const currentSongInfoRef = useRef(currentSongInfo);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const youtubeVideoIdRef = useRef("");

  // ライブのコール指南メッセージ
  const [timedLiveCallText, setTimedLiveCallText] = useState<string | null>(
    null
  );
  const [timedMessages, setTimedMessages] = useState<
    { start: number; end: number; text: string }[]
  >([]);
  const timedMessagesRef = useRef(timedMessages);

  useEffect(() => {
    currentSongInfoRef.current = currentSongInfo;
  }, [currentSongInfo]);

  // セトリネタバレ防止モードをlocalStorageに保存する
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

  // songsが変わったら前後の楽曲をセットする
  useEffect(() => {
    // もし現在の楽曲がリストにない場合は先頭を再生しはじめる
    const isExists = songs.some(
      (song) =>
        song.video_id === currentSongInfo?.video_id &&
        song.start === currentSongInfo?.start
    );
    if (!isExists) {
      changeCurrentSong(songs[0]);
      return;
    }

    if (currentSongInfo && songs.length > 0) {
      setPreviousAndNextSongs(currentSongInfo, songs);
    }
  }, [songs, currentSongInfo]);

  const setPreviousAndNextSongs = useCallback(
    (song: Song, songsList: Song[]) => {
      const currentIndex = songsList.findIndex(
        (s) => s.video_id === song.video_id && s.start === song.start
      );

      const previousSong =
        currentIndex > 0 ? songsList[currentIndex - 1] : null;
      const nextSong =
        currentIndex < songsList.length - 1
          ? songsList[currentIndex + 1]
          : null;
      setPreviousSong(previousSong);
      setNextSong(nextSong);
    },
    []
  );

  // 現在の楽曲が変わったらtitleを変更する
  useEffect(() => {
    const title =
      isPlaying && currentSongInfo
        ? `♪${currentSongInfo.title} / ${currentSongInfo.artist} - AZKi Song Database`
        : "AZKi Song Database";

    document.title = title;
  }, [currentSongInfo, isPlaying]);

  const sortedAllSongs = useMemo(() => {
    return [...allSongs].sort((a, b) => parseInt(b.start) - parseInt(a.start));
  }, [allSongs]);

  // 強制的にPlayerをリセットする
  const resetPlayer = useCallback(() => {
    setPlayerKey((prevKey) => prevKey + 1);
  }, []);

  const scrollToTargetSong = (song: Song | null) => {
    if (!song) return;
    const element = document.querySelector(
      `[data-video-id="${song.video_id}"][data-start-time="${song.start}"]`
    );
    element?.scrollIntoView({ block: "center" });
  };

  const changeCurrentSong = useCallback(
    (
      song: Song | null,
      infoOnly?: boolean,
      videoId?: string,
      startTime?: number
    ) => {
      if (!song) {
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("v");
      url.searchParams.delete("t");
      history.replaceState(null, "", url);

      if (youtubeVideoIdRef.current !== song?.video_id) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      youtubeVideoIdRef.current = song?.video_id || "";

      if (song) {
        setPreviousAndNextSongs(song, songs);
      }

      setCurrentSongInfo(song);
      scrollToTargetSong(song);

      // 曲が変わったらメッセージと表示済みリストをリセット
      setTimedLiveCallText(null);

      if (song && song.live_call) {
        // ライブコール場所を秒数に変換しながらパース
        const timedMessages = song.live_call
          .split(/[\r\n]/)
          .map((line) =>
            line.match(/(\d+):(\d+):(\d+) - (\d+):(\d+):(\d+)(.*)$/)
          )
          .filter((match) => !!match) // nullを除外
          .map((match) => {
            // 開始時間を秒に変換
            const startHours = parseInt(match![1]);
            const startMinutes = parseInt(match![2]);
            const startSeconds = parseInt(match![3]);
            const startInSeconds =
              startHours * 3600 + startMinutes * 60 + startSeconds;

            // 終了時間を秒に変換
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
        setTimedMessages(timedMessages);
        timedMessagesRef.current = timedMessages;
      }

      if (!infoOnly) {
        if (videoId && startTime) {
          setVideoId(videoId);
          setStartTime(startTime);

          // videoIdとstartTimeを直指定で再生する場合、指定からsongを推定する
          const targetSongs = sortedAllSongs
            .slice()
            .filter((s) => s.video_id === videoId)
            .sort((a, b) => parseInt(b.start) - parseInt(a.start));
          song =
            targetSongs.find((s) => parseInt(s.start) <= startTime) ?? null;
        } else {
          setVideoId("");
          setStartTime(0);
        }
        if (currentSong === song) {
          resetPlayer();
        }
        setCurrentSong(song);
      }
    },
    [songs, setPreviousAndNextSongs, currentSong, resetPlayer]
  );

  const playRandomSong = useCallback(
    (songsList: Song[]) => {
      if (songsList.length === 0) return;
      const randomSong =
        songsList[Math.floor(Math.random() * songsList.length)];
      changeCurrentSong(randomSong);
    },
    [changeCurrentSong]
  );

  const searchCurrentSongOnVideo = useCallback(
    (video_id: string, currentTime: number) => {
      return sortedAllSongs.find(
        (s) => s.video_id === video_id && parseInt(s.start) <= currentTime
      );
    },
    [allSongs]
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
      }

      const handlePlayingState = () => {
        if (intervalRef.current) return;
        changeCurrentSong(currentSongInfoRef.current, true);

        // ループ内でtimedMessagesをチェック
        const sortedTimedMessages = [...timedMessagesRef.current].sort(
          (a, b) => a.start - b.start
        );

        intervalRef.current = setInterval(() => {
          const currentTime = player.getCurrentTime();
          const currentVideoId = player.getVideoData()?.video_id;

          if (!currentVideoId) {
            return;
          }

          // 現在時刻が指定秒数を超えて、かつ未表示のメッセージを探す
          const nextMessage = sortedTimedMessages.find(
            (msg) =>
              currentTime + 1 >= msg.start && // 1秒前にメッセージを表示する
              currentTime < msg.end
          );

          if (nextMessage) {
            setTimedLiveCallText(nextMessage.text);
          } else {
            setTimedLiveCallText(null);
          }

          const foundSong = searchCurrentSongOnVideo(
            currentVideoId,
            currentTime
          );
          const isFoundSongInList = songs.some(
            (s) =>
              s.video_id === foundSong?.video_id && s.start === foundSong?.start
          );

          if (!isFoundSongInList && nextSong) {
            changeCurrentSong(nextSong);
            return;
          }

          if (foundSong) {
            if (
              foundSong.video_id !== currentSongInfoRef.current?.video_id ||
              foundSong.title !== currentSongInfoRef.current?.title
            ) {
              changeCurrentSong(foundSong, true);
            }
          } else if (nextSong) {
            changeCurrentSong(nextSong);
          }

          if (foundSong?.end && foundSong.end < currentTime) {
            clearMonitorInterval();
            changeCurrentSong(nextSong);
          }
        }, 500);
      };

      const handleEndedState = () => {
        clearMonitorInterval();
        if (nextSong) {
          changeCurrentSong(nextSong);
        } else if (songs.length > 0) {
          changeCurrentSong(songs[0]);
        }
        // 再生終了時にメッセージをリセット
        setTimedLiveCallText(null);
      };

      switch (event.data) {
        case YouTube.PlayerState.UNSTARTED:
        case YouTube.PlayerState.PAUSED:
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
      changeCurrentSong,
      playRandomSong,
      searchCurrentSongOnVideo,
      timedMessages,
    ]
  );

  return {
    currentSong,
    setCurrentSong,
    currentSongInfo,
    setCurrentSongInfo,
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
    handleStateChange,
    setPreviousAndNextSongs,
  };
};

export default usePlayerControls;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Song } from "../types/song";
import YouTube, { YouTubeEvent } from "react-youtube";

/**
 * プレイヤーの再生ロジックを管理するカスタムフック
 * @param songs - 表示中の曲リスト
 * @param allSongs - 全ての曲のリスト
 */
const usePlayerControls = (songs: Song[], allSongs: Song[]) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentSongInfo, setCurrentSongInfo] = useState<Song | null>(null);
  const [previousSong, setPreviousSong] = useState<Song | null>(null);
  const [nextSong, setNextSong] = useState<Song | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const currentSongInfoRef = useRef(currentSongInfo);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const youtubeVideoIdRef = useRef("");
  const changeVideoIdCountRef = useRef(0);

  useEffect(() => {
    currentSongInfoRef.current = currentSongInfo;
  }, [currentSongInfo]);

  const setPreviousAndNextSongs = useCallback(
    (song: Song, songsList: Song[]) => {
      const currentIndex = songsList.findIndex(
        (s) => s.video_id === song.video_id && s.start === song.start
      );
      setPreviousSong(currentIndex > 0 ? songsList[currentIndex - 1] : null);
      setNextSong(
        currentIndex < songsList.length - 1 ? songsList[currentIndex + 1] : null
      );
    },
    []
  );

  const sortedAllSongs = useMemo(() => {
    return [...allSongs].sort((a, b) => parseInt(b.start) - parseInt(a.start));
  }, [allSongs]);

  const scrollToTargetSong = (song: Song | null) => {
    if (!song) return;
    const element = document.querySelector(
      `[data-video-id="${song.video_id}"][data-start-time="${song.start}"]`
    );
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const changeCurrentSong = useCallback(
    (song: Song | null, infoOnly: boolean = false) => {
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

      if (!infoOnly) {
        setCurrentSong(song);
      }
    },
    [songs, setPreviousAndNextSongs]
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

        intervalRef.current = setInterval(() => {
          const currentTime = player.getCurrentTime();
          const currentVideoId = player.getVideoData()?.video_id;

          if (!currentVideoId) {
            return;
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
              changeVideoIdCountRef.current++;
              if (changeVideoIdCountRef.current > 1) {
                changeCurrentSong(foundSong, true);
                changeVideoIdCountRef.current = 0;
              }
            }
          } else if (nextSong) {
            changeCurrentSong(nextSong);
          }

          if (foundSong?.end && foundSong.end < currentTime) {
            clearMonitorInterval();
            changeCurrentSong(nextSong);
          }
        }, 1000);
      };

      const handleEndedState = () => {
        clearMonitorInterval();
        if (nextSong) {
          changeCurrentSong(nextSong);
        } else {
          playRandomSong(songs);
        }
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
    changeCurrentSong,
    playRandomSong,
    handleStateChange,
    setPreviousAndNextSongs,
  };
};

export default usePlayerControls;

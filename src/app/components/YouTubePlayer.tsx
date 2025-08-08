import React, { useState, useRef } from 'react';
import { Song } from "../types/song";
import YouTube from 'react-youtube';

interface YouTubePlayerProps {
  song: Song;
  allSongs: Song[];
}

export default function YouTubePlayer({ song, allSongs }: YouTubePlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef(null);
  let intervalId = useRef(null);


  // startがない場合はvideo_idの先頭から再生
  const start = song.start ? song.start : 0;
  // endがない場合はvideo_idの最後まで再生
  const end = song.end ? song.end : 0;

  const onReady = (event: { target: null; }) => {
    // playerRef にプレイヤーインスタンスを格納
    playerRef.current = event.target;
  };


  // プレイヤーの状態が変更されたときに呼び出される関数
  const onStateChange = (event: { data: number; }) => {
    // 再生中 (1) の状態になったら、再生時間の監視を開始
    if (event.data === 1) {
      // 既にタイマーが動いていなければ、新しいタイマーを開始
      if (!intervalId.current) {
        intervalId.current = setInterval(() => {
          // getCurrentTime() で現在の再生時間を取得
          setCurrentTime(playerRef.current?.getCurrentTime());
        }, 1000); // 1秒ごとに更新
      }
    } else {
      // 再生中でない場合は、タイマーを停止
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  };

  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,
      start: start,
      end: end
    },
  }

  return (
    <>
      <YouTube
        videoId={song.video_id}
        className='w-full h-full'
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
      />
      <p>現在の再生時間: {currentTime.toFixed(0)}秒</p>
    </>
  );
}
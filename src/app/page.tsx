"use client";

import { useState, useEffect } from 'react';
import YouTubePlayer from './components/YouTubePlayer';
import './globals.css'; // スタイルシートをインポート

interface Song {
  title: string;
  artist: string;
  sing: string;
  video_title: string;
  video_uri: string;
  video_id: string;
  start: string;
  end: string;
  broadcast_at: string;
  tags: string[];
  extra?: string;
}

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  useEffect(() => {
    fetch('/api/songs')
      .then((res) => res.json())
      .then((data: Song[]) => {
        setSongs(data);
        playRandomSong(data);
      });
  }, []);

  const playRandomSong = (songsList: Song[]) => {
    if (songsList.length === 0) return;
    const randomSong = songsList[Math.floor(Math.random() * songsList.length)];
    setCurrentSong(randomSong);
  };


  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mb-6">AZKi Song Player</h1>
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => playRandomSong(songs)}
          className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          ランダム
        </button>
      </div>
      {currentSong && (
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <YouTubePlayer song={currentSong} />
          <div className="song-info mt-4">
            <h2 className="text-3xl font-semibold mb-2">{currentSong.title}</h2>
            <p className="mb-1">アーティスト: <span className="font-medium">{currentSong.artist}</span></p>
            <p className="mb-1">歌: <span className="font-medium">{currentSong.sing}</span></p>
            <p className="mb-1">
              動画タイトル: 
              <a
                href={`${currentSong.video_uri}&start=${currentSong.start}&end=${currentSong.end}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-500 hover:underline"
              >
                {currentSong.video_title}
              </a>
            </p>
            <p className="mb-1">放送日時: {currentSong.broadcast_at}</p>
            <p className="mb-1">タグ: {currentSong.tags.join(', ')}</p>
            {currentSong.extra && <p className="mt-2">追加情報: {currentSong.extra}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
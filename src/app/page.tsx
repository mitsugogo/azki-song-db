"use client";

import { useState, useEffect } from 'react';
import { Song } from './types/song'; // 型定義をインポート
import MainPlayer from './layout/MainPlayer';
import YouTubePlayer from './components/YouTubePlayer';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css'; // スタイルシートをインポート


export default function Home() {
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/songs')
      .then((res) => res.json())
      .then((data: Song[]) => {
        setAllSongs(data);
        setSongs(data);
        playRandomSong(data);
      });
  }, []);

  useEffect(() => {
    if (searchTerm) {
      // スペースで区切って検索語を分割
      const searchWords = searchTerm.split(' ').map(word => word.trim()).filter(word => word.length > 0);
      if (searchWords.length === 0) {
        setSongs(allSongs); // 検索語が空の場合は全曲を表示
        return;
      }
      // 検索語を小文字に変換してフィルタリング
      // 曲名、アーティスト、歌った人、タグ、動画タイトル、追加情報のいずれかに全ての検索語が含まれる曲をフィルタリング
      const filteredSongs = allSongs.filter(song => {
        return searchWords.every(word => {
          const lowerWord = word.toLowerCase();
          return (
            song.title.toLowerCase().includes(lowerWord) ||
            song.artist.toLowerCase().includes(lowerWord) ||
            song.sing.toLowerCase().includes(lowerWord) ||
            song.tags.some(tag => tag.toLowerCase().includes(lowerWord)) ||
            song.video_title.toLowerCase().includes(lowerWord) ||
            (song.extra && song.extra.toLowerCase().includes(lowerWord))
          );
        });
      });
      setSongs(filteredSongs);
    } else {
      setSongs(allSongs); // 検索語が空の場合は全曲を表示
    }
  }, [searchTerm, songs]);

  const playRandomSong = (songsList: Song[]) => {
    if (songsList.length === 0) return;
    const randomSong = songsList[Math.floor(Math.random() * songsList.length)];
    setCurrentSong(randomSong);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className='flex-shrink-0 bg-background bg-primary text-white py-2 px-2'>
        <h1 className="text-lg lg:text-3xl font-bold">AZKi Song Database</h1>
      </header>
      <MainPlayer />
      <footer className='flex-shrink-0 bg-gray-800 text-white py-2 px-4 text-center'>
        <p className="text-xs">本サイトは有志による非公式のファンサイトです。<span className="hidden lg:inline">動画はホロライブプロダクション様及びAZKi様が制作したものです。</span>動画の権利は制作者に帰属します。</p>
        <p className="text-xs hidden lg:inline">© 2025 AZKi Song Database</p>
      </footer>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
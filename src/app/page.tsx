"use client";

import { useState, useEffect } from 'react';
import { Song } from './types/song'; // 型定義をインポート
import YouTubePlayer from './components/YouTubePlayer';
import { Analytics } from "@vercel/analytics/next"
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
        <h1 className="text-4xl font-bold">AZKi Song Database</h1>
      </header>
      <main className='flex flex-col lg:flex-row flex-grow overflow-hidden p-4'>
        <aside className='flex lg:w-2/3 sm:w-full'>
          <div className="flex flex-col h-full w-full bg-background">
            <div className="relative aspect-video w-full bg-black">
              <div className="absolute top-0 left-0 w-full h-full">
                <div className='w-full h-full'>
                  {currentSong && (
                    <YouTubePlayer song={currentSong} />
                  )}
                </div>
              </div>
            </div>
            <div className='flex h-full flex-col p-4 text-sm text-foreground'>
              {currentSong && (
                <div className="song-info">
                  <h2 className="text-3xl font-semibold mb-3">{currentSong.title}</h2>
                  <div className="flex-grow space-y-2">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      <dt className="text-muted-foreground truncate">アーティスト:</dt>
                      <dd className="col-span-3 sm:col-span-5">{currentSong.artist}</dd>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      <dt className="text-muted-foreground truncate">歌った人:</dt>
                      <dd className="col-span-3 sm:col-span-5">{currentSong.sing}</dd>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      <dt className="text-muted-foreground truncate">動画タイトル:</dt>
                      <dd className="col-span-3 sm:col-span-5">
                        <a
                          href={`${currentSong.video_uri}&t=${currentSong.start || 0}s`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-500 hover:underline justify-self-start"
                        >
                          {currentSong.video_title}
                        </a>
                        <a
                          href={currentSong.video_uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 px-3 py-1 bg-primary text-white rounded hover:bg-primary transition"
                        >
                          YouTubeで見る
                        </a>
                      </dd>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      <dt className="text-muted-foreground truncate">配信日:</dt>
                      <dd className="col-span-3 sm:col-span-5">{(new Date(currentSong.broadcast_at)).toLocaleDateString()}</dd>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      <dt className="text-muted-foreground truncate">タグ:</dt>
                      <dd className="col-span-3 sm:col-span-5">{currentSong.tags.join(', ')}</dd>
                    </div>
                    {currentSong.extra &&
                      <>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          <dt className="text-muted-foreground truncate">追加情報:</dt>
                          <dd className="col-span-3 sm:col-span-5">{currentSong.extra}</dd>
                        </div>
                      </>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
        
        <section className='flex lg:w-1/3 sm:w-full flex-col min-h-0 lg:ml-3 sm:mx-0'>
          <div className="flex flex-col h-full bg-background p-6 py-0">
            <button
              onClick={() => playRandomSong(songs)}
              className="px-3 py-2 bg-primary hover:bg-primary text-white rounded transition cursor-pointer mb-2"
            >
              ランダムで他の曲にする
            </button>
            <h2 className="text-2xl font-semibold mb-4">曲一覧</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="検索"
                className="px-3 py-2 border border-gray-300 rounded w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ul className="space-y-2 overflow-y-auto flex-grow">
              {songs.map((song, index) => (
                <li
                  key={index}
                  className="p-3 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
                  onClick={() => setCurrentSong(song)}
                >
                  <div className="w-full text-sm font-semibold">{song.title}</div>
                  <div className="w-full text-xs text-muted-foreground">{song.artist} - {song.sing}</div>
                  <div className="w-full text-xs text-muted-foreground text-gray-400 pt-1">{song.video_title}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <footer className='flex-shrink-0 bg-gray-800 text-white py-2 px-4 text-center'>
        <p className="text-sm">本サイトは有志による非公式のファンサイトです。動画はホロライブプロダクション様及びAZKi様が制作したものです。動画の権利は制作者に帰属します。</p>
        <p className="text-sm">© 2025 AZKi Song Database</p>
      </footer>
      <Analytics />
    </div>
  );
}
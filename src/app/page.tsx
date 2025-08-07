"use client";

import { useState, useEffect } from 'react';
import { Song } from './types/song'; // 型定義をインポート
import YouTubePlayer from './components/YouTubePlayer';
import './globals.css'; // スタイルシートをインポート


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
    <div className="h-screen flex flex-col">
      
      <header className='flex-shrink-0 bg-background mb-3'>
        <h1 className="text-4xl font-bold mb-6">AZKi Song Player</h1>
        <button
          onClick={() => playRandomSong(songs)}
          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          ランダムで他の曲にする
        </button>
      </header>
      <main className='flex-1 flex flex-col flex-row min-h-0'>
        <aside className='flex lg:w-2/3'>
          <div className="flex flex-col h-full w-full bg-background">
            <div className="relative aspect-video w-full bg-black">
              <div className="absolute top-0 left-0 w-full h-full">
                <div className='w-full h-full'>
                  {currentSong && (
                    <YouTubePlayer song={currentSong} />
                  )}
                </div>

                <div className='p-6'>
                  {currentSong && (
                    <div className="song-info mt-4">
                      <h2 className="text-3xl font-semibold mb-3">{currentSong.title}</h2>
                      <div className="flex-grow space-y-2">
                        <div className="grid grid-cols-4 gap-2">
                          <dt className="text-muted-foreground truncate">アーティスト:</dt>
                          <dd className="col-span-3">{currentSong.artist}</dd>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <dt className="text-muted-foreground truncate">歌った人:</dt>
                          <dd className="col-span-3">{currentSong.sing}</dd>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <dt className="text-muted-foreground truncate">動画タイトル:</dt>
                          <dd className="col-span-3">
                            <a
                              href={`${currentSong.video_uri}&t=${currentSong.start || 0}s`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-500 hover:underline justify-self-start"
                            >
                              {currentSong.video_title}
                            </a>
                          </dd>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <dt className="text-muted-foreground truncate">配信日:</dt>
                          <dd className="col-span-3">{(new Date(currentSong.broadcast_at)).toLocaleDateString()}</dd>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <dt className="text-muted-foreground truncate">タグ:</dt>
                          <dd className="col-span-3">{currentSong.tags.join(', ')}</dd>
                        </div>
                        {currentSong.extra &&
                          <>
                            <div className="grid grid-cols-4 gap-2">
                              <dt className="text-muted-foreground truncate">追加情報:</dt>
                              <dd className="col-span-3">{currentSong.extra}</dd>
                            </div>
                          </>
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
        
        <section className='flex w-1/3 flex-col min-h-0 ml-3'>
          playlistになる予定
        </section>
      </main>
      
    </div>
  );
}
"use client";

import { useState, useEffect } from 'react';
import { Song } from '../types/song'; // 型定義をインポート
import YouTubePlayer from '../components/YouTubePlayer';
import next from 'next';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { clear } from 'console';


export default function MainPlayer() {
    const [allSongs, setAllSongs] = useState<Song[]>([]);
    const [songs, setSongs] = useState<Song[]>([]);

    // 現在再生中の曲
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    // 現在の曲情報
    const [currentSongInfo, setCurrentSongInfo] = useState<Song | null>(null);

    const [previousSong, setPreviousSong] = useState<Song | null>(null);
    const [nextSong, setNextSong] = useState<Song | null>(null);

    const [lastSearchTerm, setLastSearchTerm] = useState('');
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
        setLastSearchTerm(searchTerm);

        if (lastSearchTerm == searchTerm) {
            return;
        }

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
        changeCurrentSong(randomSong);
        setPreviousAndNextSongs(randomSong, songsList);
    };

    const setPreviousAndNextSongs = (currentSong: Song, songs: Song[]) => {
        // 今再生している曲の1つ前
        const currentSongIndex = songs.findIndex(song => song.video_id === currentSong.video_id && song.title === currentSong.title);
        const previousSong = currentSongIndex > 0 ? songs[currentSongIndex - 1] : null;
        // 今再生している曲の1つ後
        const nextSong = currentSongIndex < songs.length - 1 ? songs[currentSongIndex + 1] : null;

        setPreviousSong(previousSong);
        setNextSong(nextSong);
    }

    // 対象の曲にスクロール
    const scrollToTargetSong = (crtSong: Song|null) => {
        if (!crtSong) {
            crtSong = currentSong;
        }
        const currentSongElement = document.querySelector(`[data-video-id="${crtSong?.video_id}"][data-title="${crtSong?.title}"]`);
        if (currentSongElement) {
            currentSongElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const changeCurrentSong = (song: Song | null, infoOnly: boolean = false) => {
        // 前の曲・次の曲を抽出
        if (song) {
            setPreviousAndNextSongs(song, songs);
        } 
        setCurrentSongInfo(song);
        scrollToTargetSong(song);
        if (infoOnly) {
            return;
        }
        setCurrentSong(song);
    };

    const searchCurrentSong = (video_id: string, currentTime: number) => {
        const song = songs.slice().sort((a, b) => (parseInt(b.start) || 0) - (parseInt(a.start) || 0))
        .find(s => s.video_id === video_id
            && (parseInt(s.start) || 0) <= currentTime);
        // console.log('searchCurrentSong', video_id, currentTime, song);
        return song || null;
    }

    // YouTubeの状態変更イベントハンドラ
    const handleStateChange = (event: YouTubeEvent<number>) => {
        if (event.data === YouTube.PlayerState.PLAYING) {
            console.log('曲が再生されました:', currentSongInfo?.title);
            // 曲が再生されたときの処理
            
            // 曲の変更検知するためのタイマーを起動
            const timer = setInterval(() => {
                // 再生位置から現在の曲を推定
                const currentTime = event.target.getCurrentTime();
                const currentVideoId = event.target.getVideoData().video_id;

                const curSong = searchCurrentSong(currentVideoId, currentTime);
                if (curSong && (curSong.video_id !== currentSongInfo?.video_id || curSong.title !== currentSongInfo?.title)) {
                    // 現在の曲が変わった場合、状態を更新
                    changeCurrentSong(curSong, true);
                    clearInterval(timer); // タイマーをクリア
                }
            }, 1000); // 1秒ごとにチェック

        } else if (event.data === YouTube.PlayerState.PAUSED) {
        } else if (event.data === YouTube.PlayerState.ENDED) {
            // 曲が終了したときの処理
            if (nextSong) {
                changeCurrentSong(nextSong);
            } else {
                playRandomSong(songs);
            }
        }
    }

    return (
        <main className='flex flex-col lg:flex-row flex-grow overflow-hidden p-4'>
            <aside className='flex lg:w-2/3 sm:w-full'>
                <div className="flex flex-col h-full w-full bg-background">
                    <div className="relative aspect-video w-full bg-black">
                        <div className="absolute top-0 left-0 w-full h-full">
                            <div className='w-full h-full'>
                                {currentSong && (
                                    <YouTubePlayer song={currentSong} onStateChange={handleStateChange} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='flex lg:h-full flex-col p-4 lg:px-0 text-sm text-foreground'>
                        <div className="flex justify-between mb-4">
                            <button
                                onClick={() => changeCurrentSong(previousSong)}
                                disabled={!previousSong}
                                className="px-3 py-2 bg-primary hover:bg-primary text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                前の曲 ({previousSong ? previousSong.title : 'なし'})
                            </button>
                            <button
                                onClick={() => changeCurrentSong(nextSong)}
                                disabled={!nextSong}
                                className="px-3 py-2 bg-primary hover:bg-primary text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                次の曲 ({nextSong ? nextSong.title : 'なし'})
                            </button>
                        </div>
                    </div>
                    <div className='flex lg:h-full flex-col p-4 lg:pl-0 text-sm text-foreground'>
                        {currentSongInfo && (
                            <div className="song-info">
                                <h2 className="text-xl lg:text-3xl font-semibold mb-3">{currentSongInfo.title}</h2>
                                <div className="flex-grow space-y-1 lg:space-y-2">
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">アーティスト:</dt>
                                        <dd className="col-span-3 sm:col-span-5">{currentSongInfo.artist}</dd>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">歌った人:</dt>
                                        <dd className="col-span-3 sm:col-span-5">{currentSongInfo.sing}</dd>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">動画タイトル:</dt>
                                        <dd className="col-span-3 sm:col-span-5">
                                            <span className='hidden lg:inline'>
                                                <a
                                                    href={`${currentSongInfo.video_uri}&t=${currentSongInfo.start || 0}s`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-red-500 hover:underline justify-self-start"
                                                >
                                                    {currentSongInfo.video_title}
                                                </a>
                                            </span>
                                            <a
                                                href={currentSongInfo.video_uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-2 px-3 py-1 bg-primary text-white rounded hover:bg-primary transition white-space-nowrap"
                                            >
                                                YouTubeで見る
                                            </a>
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">配信日:</dt>
                                        <dd className="col-span-3 sm:col-span-5">{(new Date(currentSongInfo.broadcast_at)).toLocaleDateString()}</dd>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">タグ:</dt>
                                        <dd className="col-span-3 sm:col-span-5">{currentSongInfo.tags.join(', ')}</dd>
                                    </div>
                                    {currentSongInfo.extra &&
                                        <>
                                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                                <dt className="text-muted-foreground truncate">追加情報:</dt>
                                                <dd className="col-span-3 sm:col-span-5">{currentSongInfo.extra}</dd>
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
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="検索"
                            className="px-3 py-2 border border-gray-300 rounded w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ul className="song-list space-y-2 overflow-y-auto flex-grow">
                        {songs.map((song, index) => (
                            <li
                                key={index}
                                className={`p-3 rounded cursor-pointer ${currentSongInfo?.title === song.title && currentSongInfo.video_id === song.video_id ? 'bg-primary-light hover:bg-primary-light' : 'bg-gray-200 hover:bg-gray-300'}`}
                                onClick={() => changeCurrentSong(song)}
                                data-video-id={song.video_id}
                                data-title={song.title}
                            >
                                <div className='w-full'>
                                    <div className="w-full text-sm font-semibold">{song.title}</div>
                                    <div className="w-full text-xs text-muted-foreground">{song.artist} - {song.sing}</div>
                                </div>
                                <div className='hidden lg:flex gap-x-2 mt-2'>
                                    <div className='w-1/6'>
                                        <img src={`https://img.youtube.com/vi/${song.video_id}/maxresdefault.jpg`} />
                                    </div>
                                    <div className='w-5/6'>
                                        <div className="w-full text-xs text-muted-foreground text-gray-700 pt-1 hidden lg:block">{song.video_title} ({(new Date(song.broadcast_at)).toLocaleDateString()})</div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </main>
    );
}
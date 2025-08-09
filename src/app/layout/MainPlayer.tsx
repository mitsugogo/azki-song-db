"use client";

import { useState, useEffect, useRef } from 'react';
import { Song } from '../types/song'; // 型定義をインポート
import YouTubePlayer from '../components/YouTubePlayer';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faShareNodes } from '@fortawesome/free-solid-svg-icons';
import ToastNotification from '../components/ToastNotification';
import { Badge, ClipboardWithIcon, Spinner, TextInput } from 'flowbite-react';
import { HiSearch, HiX } from 'react-icons/hi';

let detectedChangeSongTimer: NodeJS.Timeout | undefined; // 状態変更を検知するためのタイマー

export default function MainPlayer() {
    const [isLoading, setIsLoading] = useState(true);

    const [allSongs, setAllSongs] = useState<Song[]>([]);
    const [songs, setSongs] = useState<Song[]>([]);

    // 現在再生中の曲
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    // 現在の曲情報
    const [currentSongInfo, setCurrentSongInfo] = useState<Song | null>(null);
    const currentSongInfoRef = useRef(currentSongInfo);

    const [previousSong, setPreviousSong] = useState<Song | null>(null);
    const [nextSong, setNextSong] = useState<Song | null>(null);

    const [lastSearchTerm, setLastSearchTerm] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [urlWithSearchTerm, setUrlWithSearchTerm] = useState('');

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");


    useEffect(() => {
        fetch('/api/songs')
            .then((res) => res.json())
            .then((data: Song[]) => {
                setAllSongs(data);
                // queryがある場合は、検索結果を反映させる
                const urlParams = new URLSearchParams(window.location.search);
                const query = urlParams.get('q');
                const video_id = urlParams.get('v');
                const start_time = urlParams.get('t')?.replace('s', '');

                let filteredSongs = data;
                if (query) {
                    setSearchTerm(query);
                    filteredSongs = searchSongs(data, query);
                    setSongs(filteredSongs);
                }
                if (video_id && start_time) {
                    // 前後2秒の誤差は許容する
                    const currentSong = filteredSongs.find(song => song.video_id === video_id
                        && Math.abs(parseInt(song.start) - parseInt(start_time || '0')) <= 2);
                    if (currentSong) {
                        changeCurrentSong(currentSong);
                        setPreviousAndNextSongs(currentSong, filteredSongs);
                    } else {
                        playRandomSong(filteredSongs);
                    }
                } else {
                    playRandomSong(filteredSongs);
                }
                setSongs(data);
                setIsLoading(false);
            });
    }, []);

    // インクリメンタルサーチ
    useEffect(() => {
        setLastSearchTerm(searchTerm);

        if (lastSearchTerm == searchTerm) {
            return;
        }
        // URLをq=xxxに更新.空ならqパラメータを削除
        const url = new URL(window.location.href);
        if (searchTerm) {
            url.searchParams.set('q', searchTerm);
        } else {
            url.searchParams.delete('q');
        }
        window.history.replaceState({}, '', url);

        if (searchTerm) {
            // スペースで区切って検索語を分割
            const searchWords = searchTerm.split(/\s+/).map(word => word.trim()).filter(word => word.length > 0);
            console.log(searchWords);
            if (searchWords && searchWords.length === 0) {
                setSongs(allSongs); // 検索語が空の場合は全曲を表示
                return;
            }
            // 検索語を小文字に変換してフィルタリング
            // 曲名、アーティスト、歌った人、タグ、動画タイトル、追加情報のいずれかに全ての検索語が含まれる曲をフィルタリング
            const filteredSongs = searchSongs(allSongs, searchTerm);
            console.debug('Filtered songs:', filteredSongs);
            setSongs(filteredSongs);
        } else {
            setSongs(allSongs); // 検索語が空の場合は全曲を表示
        }
    }, [searchTerm, songs]);


    const searchSongs = (songs: Song[], term: string) => {
        // スペースで区切って検索語を分割
        const searchWords = term.split(/\s+/).map(word => word.trim()).filter(word => word.length > 0);
        const filteredSongs = songs.filter(song => {
            return searchWords.every(word => {
                const lowerWord = word.toLowerCase();

                // title:{value} artist:{value} のように指定して検索できるようにする
                if (lowerWord.startsWith('title:') && song.title.toLowerCase().includes(lowerWord.substring(6).toLowerCase())) {
                    return true;
                }
                if (lowerWord.startsWith('artist:') && song.artist.toLowerCase().includes(lowerWord.substring(7).toLowerCase())) {
                    return true;
                }
                if (lowerWord.startsWith('sing:')) {
                    const sings = song.sing.toLowerCase().split('、');
                    return sings.some(sing => sing.includes(lowerWord.substring(5).toLowerCase()));
                }
                if (lowerWord.startsWith('tag:')) {
                    const tags = song.tags.join(',').toLowerCase().split(',');
                    return tags.some(tag => tag.includes(lowerWord.substring(5).toLowerCase()));
                }
                if (lowerWord.startsWith('video_title:') && song.video_title.toLowerCase().includes(lowerWord.substring(12).toLowerCase())) {
                    return true;
                }
                if (lowerWord.startsWith('extra:') && song.extra && song.extra.toLowerCase().includes(lowerWord.substring(6).toLowerCase())) {
                    return true;
                }

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

        return filteredSongs;
    };

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
    const scrollToTargetSong = (crtSong: Song | null) => {
        if (!crtSong) {
            crtSong = currentSong;
        }
        const currentSongElement = document.querySelector(`[data-video-id="${crtSong?.video_id}"][data-start-time="${crtSong?.start}"]`);
        if (currentSongElement) {
            currentSongElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const changeCurrentSong = (song: Song | null, infoOnly: boolean = false, force: boolean = false) => {
        console.debug('changeCurrentSong', song, force);
        // URLのvとtを消す
        const url = new URL(window.location.href);
        url.searchParams.delete('v');
        url.searchParams.delete('t');
        history.replaceState(null, '', url);


        if (force) {
            clearInterval(detectedChangeSongTimer);
            detectedChangeSongTimer = undefined;
        }
        // 前の曲・次の曲を抽出
        if (song) {
            setPreviousAndNextSongs(song, songs);
        }
        currentSongInfoRef.current = song;
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
        return song || null;
    }

    // 曲をシェア
    const shereSong = (song: Song) => {
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/?v=${song.video_id}&t=${song.start}s`;

        try {
            navigator.clipboard.writeText(shareUrl);
            setToastMessage("URLをコピーしました");
            setShowToast(true);
        } catch (err) {
            setToastMessage("コピーに失敗しました");
            setShowToast(true);
        }
    }

    const changeSearchTerm = (term: string) => {
        setSearchTerm(term);
        if (term) {
            setUrlWithSearchTerm(`${window.location.origin}/?q=${term}`);
        } else {
            setUrlWithSearchTerm(`${window.location.origin}`);
        }
    }

    // YouTubeの状態変更イベントハンドラ

    const handleStateChange = (event: YouTubeEvent<number>) => {
        if (event.data === YouTube.PlayerState.PLAYING || event.data === YouTube.PlayerState.BUFFERING) {
            clearInterval(detectedChangeSongTimer);
            detectedChangeSongTimer = undefined;

            changeCurrentSong(currentSong, true);
            // 曲が再生されたときの処理
            if (detectedChangeSongTimer) return;

            // 曲の変更検知するためのタイマーを起動
            detectedChangeSongTimer = setInterval(() => {
                // YouTubeのgetCurrentTimeが安定しないのでちょっと待ってから反映する
                setTimeout(() => {
                    const currentTime = event.target.getCurrentTime();
                    const currentVideoId = event.target.getVideoData().video_id;
                    const curSong = searchCurrentSong(currentVideoId, currentTime);
                    if (curSong && (curSong.video_id !== currentSongInfoRef.current?.video_id || curSong.title !== currentSongInfoRef.current?.title)) {
                        // 現在の曲が変わった場合、状態を更新
                        changeCurrentSong(curSong, true);
                    }
                }, 500);
            }, 1000); // 1秒ごとにチェック

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
        <main className='flex flex-col lg:flex-row flex-grow overflow-hidden p-0 lg:p-4 bg-background'>
            <aside className='flex lg:w-2/3 sm:w-full'>
                <div className="flex flex-col h-full w-full bg-background overflow-auto">
                    <div className="relative aspect-video w-full bg-black">
                        <div className="absolute top-0 left-0 w-full h-full">
                            <div className='w-full h-full shadow-md'>
                                {currentSong && (
                                    <YouTubePlayer song={currentSong} onStateChange={handleStateChange} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col p-2 px-2 lg:px-0 text-sm text-foreground'>
                        <div className="flex justify-between">
                            <button
                                onClick={() => changeCurrentSong(previousSong)}
                                disabled={!previousSong}
                                className="px-3 py-2 bg-primary hover:bg-primary cursor-pointer text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                前の曲<span className="hidden lg:inline"> ({previousSong ? previousSong.title : 'なし'})</span>
                            </button>
                            <button
                                onClick={() => playRandomSong(songs)}
                                className="inline-block lg:hidden px-3 py-2 bg-primary hover:bg-primary cursor-pointer text-white rounded transition"
                            >
                                ランダム選曲
                            </button>
                            <button
                                onClick={() => changeCurrentSong(nextSong)}
                                disabled={!nextSong}
                                className="px-3 py-2 bg-primary hover:bg-primary cursor-pointer text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                次の曲<span className="hidden lg:inline"> ({nextSong ? nextSong.title : 'なし'})</span>
                            </button>
                        </div>
                    </div>
                    <div className='flex lg:h-full flex-col py-2 pt-0 px-2 lg:p-4 lg:pl-0 text-sm text-foreground'>
                        {currentSongInfo && (
                            <div className="song-info">
                                <h2 className="text-xl lg:text-2xl font-semibold mb-3 cursor-pointer" onClick={() => shereSong(currentSongInfo)}>
                                    {currentSongInfo.title} <span className='text-gray-400 text-sm'><FontAwesomeIcon icon={faShareNodes} /></span></h2>
                                <div className="flex-grow space-y-1">
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">アーティスト:</dt>
                                        <dd className="col-span-3 sm:col-span-5 flex flex-wrap gap-1">
                                            <Badge onClick={() => {
                                                const existsSameArtist = searchTerm.startsWith(`artist:${currentSongInfo.artist}`);
                                                if (!existsSameArtist) {
                                                    setSearchTerm(`${searchTerm ? `${searchTerm} ` : ''}artist:${currentSongInfo.artist}`);
                                                }
                                            }} className="cursor-pointer inline-flex whitespace-nowrap">
                                                {currentSongInfo.artist}
                                            </Badge>
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">歌った人:</dt>
                                        <dd className="col-span-3 sm:col-span-5 flex flex-wrap gap-1">
                                            {currentSongInfo.sing.split('、').map((sing, index) => {
                                                const existsSameSing = searchTerm.startsWith(`sing:${sing}`);
                                                return (
                                                    <Badge key={index} onClick={() => {
                                                        if (!existsSameSing) {
                                                            setSearchTerm(`${searchTerm ? `${searchTerm} ` : ''}sing:${sing}`);
                                                        }
                                                    }} className="cursor-pointer inline-flex whitespace-nowrap">
                                                        {sing}
                                                    </Badge>
                                                );
                                            })}
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">動画タイトル:</dt>
                                        <dd className="col-span-3 sm:col-span-5">
                                            <span className='hidden lg:inline'>
                                                <a
                                                    href={`${currentSongInfo.video_uri}&t=${currentSongInfo.start || 0}s`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline justify-self-start font-semibold"
                                                >
                                                    <FontAwesomeIcon icon={faYoutube} /> {currentSongInfo.video_title}
                                                </a>
                                            </span>
                                            <a
                                                href={currentSongInfo.video_uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs ml-2 px-3 py-1 bg-primary text-white rounded hover:bg-primary transition white-space-nowrap inline-block lg:hidden"
                                            >
                                                <FontAwesomeIcon icon={faYoutube} /> YouTube
                                            </a>
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">配信日:</dt>
                                        <dd className="col-span-3 sm:col-span-5">{(new Date(currentSongInfo.broadcast_at)).toLocaleDateString()}</dd>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">タグ:</dt>
                                        <dd className="col-span-3 sm:col-span-5 flex flex-wrap gap-1">
                                            {currentSongInfo.tags.map(tag => {
                                                const existsSameTag = searchTerm.startsWith(`tag:${tag}`);
                                                return (
                                                    <Badge
                                                        key={tag}
                                                        color="gray"
                                                        className="text-xs cursor-pointer"
                                                        onClick={() => {
                                                            if (!existsSameTag) {
                                                                setSearchTerm(`${searchTerm ? `${searchTerm} ` : ''}tag:${tag}`);
                                                            }
                                                        }}
                                                    >
                                                        {tag}
                                                    </Badge>
                                                );
                                            })}
                                        </dd>
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
                {isLoading ? (
                    <div className="text-center h-full"><Spinner size="xl" /></div>
                ) : (
                    <div className="flex flex-col h-full bg-background px-2 py-0 lg:px-6">
                        <button
                            onClick={() => playRandomSong(songs)}
                            className="hidden lg:block px-3 py-2 bg-primary hover:bg-primary cursor-pointer text-white rounded transition mb-2"
                        >
                            ランダムで他の曲にする
                        </button>
                        <div className="mb-4">
                            <div className="relative">
                                <TextInput value={searchTerm} onChange={(e) => changeSearchTerm(e.target.value)} placeholder='検索' icon={HiSearch} />
                                {searchTerm &&<button
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
                                    onClick={() => changeSearchTerm('')}
                                >
                                    <HiX className="w-4 h-4" />
                                </button>}
                                {/* <ClipboardWithIcon valueToCopy={urlWithSearchTerm} /> */}
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <p className="text-xs text-muted-foreground dark:text-white mb-2">楽曲一覧 ({songs.length}曲/{allSongs.length}曲)</p>
                        </div>
                        <ul className="song-list space-y-2 overflow-y-auto flex-grow">
                            {songs.map((song, index) => (
                                <li
                                    key={index}
                                    className={`p-3 rounded relative cursor-pointer ${currentSongInfo?.title === song.title && currentSongInfo.video_id === song.video_id ? 'bg-primary-light hover:bg-primary-light dark:text-white' : 'bg-gray-200 dark:bg-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-800'}`}
                                    onClick={() => changeCurrentSong(song, false, true)}
                                    data-video-id={song.video_id}
                                    data-start-time={song.start}
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
                                            <div className="w-full text-xs text-muted-foreground text-gray-700 dark:text-gray-400 pt-1 hidden lg:block">{song.video_title} ({(new Date(song.broadcast_at)).toLocaleDateString()})</div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>
            {showToast && (
                <ToastNotification
                    message={toastMessage}
                    onClose={() => setShowToast(false)}
                />
            )}
        </main>
    );
}
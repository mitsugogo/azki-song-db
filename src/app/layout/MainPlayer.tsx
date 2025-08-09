"use client";

import { useState, useEffect, useRef } from 'react';
import { Song } from '../types/song'; // 型定義をインポート
import YouTubePlayer from '../components/YouTubePlayer';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faShareNodes } from '@fortawesome/free-solid-svg-icons';
import ToastNotification from '../components/ToastNotification';
import { Badge, Button, ButtonGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, TextInput } from 'flowbite-react';
import { HiCheck, HiClipboardCopy, HiSearch, HiX } from 'react-icons/hi';
import { GiPreviousButton, GiNextButton } from 'react-icons/gi';
import { FaDatabase, FaShare, FaShuffle, FaX, FaYoutube } from "react-icons/fa6";
import useDebounce from '../hook/useDebounce';
import { clear } from 'console';

// 状態変更を検知するためのタイマー
let detectedChangeSongTimer: NodeJS.Timeout | undefined;

let youtubeVideoId = "";
let changeVideoIdCount = 0;

export default function MainPlayer() {
    const [isLoading, setIsLoading] = useState(true);

    const [baseUrl, setBaseUrl] = useState('');
    const [apiUrl, setApiUrl] = useState('');

    const [allSongs, setAllSongs] = useState<Song[]>([]);
    const [songs, setSongs] = useState<Song[]>([]);

    // 現在再生中の曲
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    // 現在の曲情報
    const [currentSongInfo, setCurrentSongInfo] = useState<Song | null>(null);
    const currentSongInfoRef = useRef(currentSongInfo);

    const [previousSong, setPreviousSong] = useState<Song | null>(null);
    const [nextSong, setNextSong] = useState<Song | null>(null);

    // 検索
    const [searchTerm, setSearchTerm] = useState('');
    const [urlWithSearchTerm, setUrlWithSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300); // 検索語いれてからの遅延

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // シェア用モーダル
    const [openShareModal, setOpenShereModal] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    const [showCopiedYoutube, setShowCopiedYoutube] = useState(false);

    useEffect(() => {
        setBaseUrl(window.location.origin);
        
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
                if (lowerWord.startsWith('date:')) {
                    const date = lowerWord.substring(5);
                    const [year, month, day] = date.split('/').map(part => part.padStart(2, '0'));
                    const formattedDate = `${year}/${month}/${day}`;
                    const broadcastAt = song.broadcast_at ? new Date(song.broadcast_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '';
                    return broadcastAt === formattedDate;
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

    useEffect(() => {
        const url = new URL(window.location.href);
        if (debouncedSearchTerm) {
            const filteredSongs = searchSongs(allSongs, debouncedSearchTerm);
            setSongs(filteredSongs);

            // URLのqを変更
            url.searchParams.set('q', debouncedSearchTerm);
            history.replaceState(null, '', url);
        } else {
            setSongs(allSongs);

            // URLのqを削除
            url.searchParams.delete('q');
            history.replaceState(null, '', url);
        }
    }, [debouncedSearchTerm]);

    // 検索語を変更したとき、少し待ってから検索を開始する
    const handleSearchChange = (value: string) => {
        changeSearchTerm(value);
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

    const changeCurrentSong = (song: Song | null, infoOnly: boolean = false) => {
        // URLのvとtを消す
        const url = new URL(window.location.href);
        url.searchParams.delete('v');
        url.searchParams.delete('t');
        history.replaceState(null, '', url);

        if (youtubeVideoId !== song?.video_id) {
            clearInterval(detectedChangeSongTimer);
            detectedChangeSongTimer = undefined;
        }
        youtubeVideoId = song?.video_id || "";

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
        if (!video_id || !currentTime) {
            return null;
        }
        const song = songs.slice().sort((a, b) => (parseInt(b.start) || 0) - (parseInt(a.start) || 0))
            .find(s => s.video_id === video_id
                && (parseInt(s.start) || 0) <= currentTime);
        return song || null;
    }


    const copyToClipboard = (text: string) => {
        if (!text) {
            return;
        }
        try {
            navigator.clipboard.writeText(text);
            setToastMessage("コピーしました");
            setShowToast(true);
        } catch (err) {
            setToastMessage("コピーに失敗しました");
            setShowToast(true);
        }
    }

    const changeSearchTerm = (term: string) => {
        setSearchTerm(term);
        if (term) {
            setUrlWithSearchTerm(`${baseUrl}/?q=${term}`);
        } else {
            setUrlWithSearchTerm(`${baseUrl}`);
        }
    }

    // YouTubeの状態変更イベントハンドラ

    const handleStateChange = (event: YouTubeEvent<number>) => {
        console.log(event);
        if (youtubeVideoId !== event.target.getVideoData()?.video_id && detectedChangeSongTimer) {
            clearInterval(detectedChangeSongTimer);
            detectedChangeSongTimer = undefined;
        }
        if (event.data === YouTube.PlayerState.UNSTARTED) {
            clearInterval(detectedChangeSongTimer);
            detectedChangeSongTimer = undefined;
        }
        if (event.data === YouTube.PlayerState.PLAYING) {
            // iOSで勝手にスクロールするのを戻す
            window.scrollTo(0, 0);

            changeCurrentSong(currentSongInfoRef.current, true);
            // 曲が再生されたときの処理
            if (detectedChangeSongTimer) return;
            console.log("timer is undefiend");

            // 曲の変更検知するためのタイマーを起動
            detectedChangeSongTimer = setInterval(() => {
                const currentTime = event.target.getCurrentTime();
                const currentVideoId = event.target.getVideoData()?.video_id;
                if (currentVideoId === null) return;
                const curSong = searchCurrentSong(currentVideoId, currentTime);
                if (curSong && (curSong.video_id !== currentSongInfoRef.current?.video_id || curSong.title !== currentSongInfoRef.current?.title)) {
                    changeVideoIdCount++;
                    // 現在の曲が変わった場合、状態を更新
                    if (changeVideoIdCount > 1) {
                        // console.log("handleStateChange", currentVideoId, curSong, currentSongInfoRef);
                        changeCurrentSong(curSong, true);
                        changeVideoIdCount = 0;
                    }
                }
            }, 3000); // 3秒ごとにチェック
            console.log("start timer!!! ", detectedChangeSongTimer);

        } else if (event.data === YouTube.PlayerState.ENDED) {
            // 曲が終了したときの処理
            if (nextSong) {
                clearInterval(detectedChangeSongTimer);
                detectedChangeSongTimer = undefined;
                console.log("clear timer");
                changeCurrentSong(nextSong, false);
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
                        <div className="hidden lg:flex w-full justify-between gap-2">
                            <div className="w-2/6 p-2 truncate bg-gray-200 dark:bg-gray-800 rounded cursor-pointer" onClick={() => changeCurrentSong(previousSong)}>
                                <div className="flex items-center">
                                    {previousSong && (
                                        <>
                                            <img
                                                src={`https://img.youtube.com/vi/${previousSong?.video_id}/default.jpg`}
                                                alt="thumbnail"
                                                className="w-12 h-12 mr-2"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-left font-bold truncate">{previousSong?.title}</span>
                                                <span className="text-left text-sm text-muted truncate">{previousSong?.artist}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div
                                className='w-2/6 p-2 truncate rounded bg-primary-light cursor-pointer'
                                onClick={() => setOpenShereModal(true)}
                            >
                                <div className="flex items-center">
                                    {currentSongInfo && (
                                        <>
                                            <img
                                                src={`https://img.youtube.com/vi/${currentSongInfo?.video_id}/default.jpg`}
                                                alt="thumbnail"
                                                className="w-12 h-12 mr-2"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-left font-bold truncate">{currentSongInfo?.title}</span>
                                                <span className="text-left text-sm text-muted truncate">{currentSongInfo?.artist}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="w-2/6 p-2 truncate bg-gray-200 dark:bg-gray-800 rounded text-right cursor-pointer" onClick={() => changeCurrentSong(nextSong)}>
                                <div className="flex items-center">
                                    {nextSong && (
                                        <>
                                            <img
                                                src={`https://img.youtube.com/vi/${nextSong?.video_id}/default.jpg`}
                                                alt="thumbnail"
                                                className="w-12 h-12 mr-2"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-left font-bold truncate">{nextSong?.title}</span>
                                                <span className="text-left text-sm text-muted truncate">{nextSong?.artist}</span>
                                            </div>
                                        </>
                                    )}

                                </div>
                            </div>
                        </div>
                        <div className="flex lg:hidden justify-between">
                            <div className="">
                                <ButtonGroup>
                                    <Button
                                        onClick={() => changeCurrentSong(previousSong)}
                                        disabled={!previousSong}
                                        className="bg-primary hover:bg-primary text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    ><GiPreviousButton /></Button>
                                    <Button
                                        onClick={() => changeCurrentSong(nextSong)}
                                        disabled={!nextSong}
                                        className="bg-primary hover:bg-primary text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    ><GiNextButton /></Button>
                                </ButtonGroup>
                            </div>
                            <div>
                                <Button
                                    onClick={() => playRandomSong(songs)}
                                    className="bg-primary hover:bg-primary text-white transition text-sm"
                                ><FaShuffle />&nbsp;ランダム</Button>
                            </div>
                            <div className="flex justify-end">
                                <ButtonGroup>

                                    <Button
                                        onClick={() => setOpenShereModal(true)}
                                        className="bg-primary hover:bg-primary text-white transition text-sm"
                                    ><FaShare />&nbsp;Share
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </div>
                    </div>
                    <div className='flex lg:h-full sm:mt-2 flex-col py-2 pt-0 px-2 lg:p-4 lg:pl-0 text-sm text-foreground'>
                        {currentSongInfo && (
                            <div className="song-info">
                                <h2 className="text-xl lg:text-2xl font-semibold mb-3 cursor-pointer">{currentSongInfo.title}</h2>
                                <div className="flex-grow space-y-1">
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">アーティスト:</dt>
                                        <dd className="col-span-3 sm:col-span-5 flex flex-wrap gap-1">
                                            {currentSongInfo.artist.split('、').map((artist, index) => {
                                                const existsSameArtist = searchTerm.includes(`artist:${artist}`);
                                                return (
                                                    <Badge
                                                        key={index}
                                                        onClick={() => {
                                                            if (existsSameArtist) {
                                                                setSearchTerm(searchTerm.replace(`artist:${artist}`, '').trim());
                                                            } else {
                                                                setSearchTerm(`${searchTerm ? `${searchTerm} ` : ''}artist:${artist}`);
                                                            }
                                                        }}
                                                        className={`cursor-pointer inline-flex whitespace-nowrap ${existsSameArtist ? 'bg-cyan-300' : ''}`}
                                                    >
                                                        {artist}
                                                    </Badge>
                                                );
                                            })}
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">歌った人:</dt>
                                        <dd className="col-span-3 sm:col-span-5 flex flex-wrap gap-1">
                                            {currentSongInfo.sing.split('、').map((sing, index) => {
                                                const existsSameSing = searchTerm.includes(`sing:${sing}`);
                                                return (
                                                    <Badge
                                                        key={index}
                                                        onClick={() => {
                                                            if (existsSameSing) {
                                                                setSearchTerm(searchTerm.replace(`sing:${sing}`, '').trim());
                                                            } else {
                                                                setSearchTerm(`${searchTerm ? `${searchTerm} ` : ''}sing:${sing}`);
                                                            }
                                                        }}
                                                        className={`cursor-pointer inline-flex whitespace-nowrap ${existsSameSing ? 'bg-cyan-300' : ''}`}
                                                    >
                                                        {sing}
                                                    </Badge>
                                                );
                                            })}
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="hidden lg:inline text-muted-foreground truncate">動画タイトル:</dt>
                                        <dt className="lg:hidden text-muted-foreground truncate">動画:</dt>
                                        <dd className="col-span-3 sm:col-span-5">
                                            <span className='hidden lg:inline'>
                                                <a
                                                    href={`${currentSongInfo.video_uri}&t=${currentSongInfo.start || 0}s`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline justify-self-start font-semibold dark:text-primary-light"
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
                                        <dd className="col-span-3 sm:col-span-5 flex flex-wrap gap-1">
                                            <Badge
                                                className={`text-xs cursor-pointer ${searchTerm.includes(`date:${new Date(currentSongInfo.broadcast_at).toLocaleDateString()}`) ? 'bg-cyan-300' : ''}`}
                                                onClick={() => {
                                                    const broadcastDate = new Date(currentSongInfo.broadcast_at).toLocaleDateString();
                                                    const existsSameDate = searchTerm.includes(`date:${broadcastDate}`);
                                                    if (existsSameDate) {
                                                        setSearchTerm(searchTerm.replace(`date:${broadcastDate}`, '').trim());
                                                    } else {
                                                        setSearchTerm(`${searchTerm ? `${searchTerm} ` : ''}date:${broadcastDate}`);
                                                    }
                                                }}
                                            >
                                                {(new Date(currentSongInfo.broadcast_at)).toLocaleDateString()}
                                            </Badge>
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:gap-2">
                                        <dt className="text-muted-foreground truncate">タグ:</dt>
                                        <dd className="col-span-3 sm:col-span-5 flex flex-wrap gap-1">
                                            {currentSongInfo.tags.map(tag => {
                                                const existsSameTag = searchTerm.includes(`tag:${tag}`);
                                                return (
                                                    <Badge
                                                        key={tag}
                                                        className={`text-xs cursor-pointer ${existsSameTag ? 'bg-cyan-300' : ''}`}
                                                        onClick={() => {
                                                            if (existsSameTag) {
                                                                setSearchTerm(searchTerm.replace(`tag:${tag}`, '').trim());
                                                            } else {
                                                                setSearchTerm(`${searchTerm ? `${searchTerm} ` : ''}tag:${tag}`);
                                                            }
                                                        }}
                                                    >
                                                        {tag}
                                                    </Badge>
                                                );
                                            })}
                                        </dd>

                                        {currentSongInfo && currentSongInfo.extra &&
                                            <>
                                                <dt className="text-muted-foreground truncate">追加情報:</dt>
                                                <dd className="col-span-3 sm:col-span-5">{currentSongInfo.extra}</dd>
                                            </>
                                        }
                                    </div>
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
                                <TextInput value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} placeholder='検索' icon={HiSearch} />
                                {searchTerm && <button
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
                                    onClick={() => changeSearchTerm('')}
                                >
                                    <HiX className="w-4 h-4" />
                                </button>}
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <p className="text-xs text-muted-foreground dark:text-white mb-2">楽曲一覧 ({songs.length}曲/{allSongs.length}曲)</p>
                        </div>
                        <ul className="song-list space-y-2 overflow-y-auto h-500 flex-grow">
                            {songs.map((song, index) => (
                                <li
                                    key={index}
                                    className={`p-3 rounded relative cursor-pointer ${currentSongInfo?.title === song.title && currentSongInfo.video_id === song.video_id ? 'bg-primary-light hover:bg-primary-light dark:text-white' : 'bg-gray-200 dark:bg-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-800'}`}
                                    onClick={() => changeCurrentSong(song, false)}
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

            <Modal
                show={openShareModal}
                onClose={() => setOpenShereModal(false)}
                size="md"
                style={{ zIndex: 999 }}
            >
                <ModalHeader className='bg-white dark:bg-gray-800 dark:text-white'>URLをコピー</ModalHeader>
                <ModalBody className='bg-white dark:bg-gray-800 dark:text-white'>
                    <p className="mb-2">
                        以下のURLをコピーして現在の曲をシェアできます
                    </p>
                    <div>
                        <Label><FaYoutube className='inline' />&nbsp;YouTube URL (AZKi Channel)</Label>
                        <div className="relative">
                            <TextInput
                                className="w-full"
                                placeholder="URL"
                                value={`https://www.youtube.com/watch?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`}
                                readOnly
                                onClick={(e) => {
                                    copyToClipboard(`https://www.youtube.com/watch?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`);
                                    setShowCopiedYoutube(true);
                                    setTimeout(() => setShowCopiedYoutube(false), 3000);
                                }}></TextInput>
                            <button
                                className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={(e) => {
                                    copyToClipboard(`https://www.youtube.com/watch?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`);
                                    setShowCopiedYoutube(true);
                                    setTimeout(() => setShowCopiedYoutube(false), 3000);
                                }}>
                                <HiClipboardCopy className="w-4 h-4" />
                            </button>
                            {showCopiedYoutube && (
                                <div className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full text-white bg-gray-900 dark:bg-gray-800 text-sm font-bold">
                                    copied!
                                </div>
                            )}
                        </div>
                        <div className='mt-2'>
                            <Button
                                size='xs'
                                className='bg-black text-white'
                                onClick={() => {
                                    const text = `${currentSongInfo?.video_title} \nhttps://www.youtube.com/watch/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`;
                                    const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
                                    window.open(twitterUrl);
                                }}>
                                <FaX className='w-4 h-4' />
                            </Button>
                        </div>
                    </div>
                    <div className="mt-2">
                        <Label><FaDatabase className='inline' />&nbsp;AZKi Song Database</Label>
                        <div className="relative">
                            <TextInput
                                className="w-full"
                                placeholder="URL"
                                value={`${baseUrl}/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`}
                                readOnly
                                onClick={(e) => {
                                    copyToClipboard(`${baseUrl}/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`);
                                    setShowCopied(true);
                                    setTimeout(() => setShowCopied(false), 3000);
                                }}></TextInput>
                            <button
                                className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={(e) => {
                                    copyToClipboard(`${baseUrl}/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`);
                                    setShowCopied(true);
                                    setTimeout(() => setShowCopied(false), 3000);
                                }}>
                                <HiClipboardCopy className="w-4 h-4" />
                            </button>
                            {showCopied && (
                                <div className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full text-white bg-gray-900 dark:bg-gray-800 text-sm font-bold">
                                    copied!
                                </div>
                            )}
                        </div>
                        <div className='mt-2'>
                            <Button
                                size='xs'
                                className='bg-black text-white'
                                onClick={() => {
                                    const text = `Now Playing♪ ${currentSongInfo?.title} - ${currentSongInfo?.artist} \n${baseUrl}/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`;
                                    const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
                                    window.open(twitterUrl);
                                }}>
                                <FaX className='w-4 h-4' />
                            </Button>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className='bg-white dark:bg-gray-800 dark:text-white'>
                    <Button className='bg-primary dark:bg-primary' onClick={() => setOpenShereModal(false)}>閉じる</Button>
                </ModalFooter>
            </Modal>
        </main>
    );
}
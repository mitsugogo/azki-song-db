"use client";

import { useState, useEffect, useRef } from 'react';
import { Song } from '../types/song'; // 型定義をインポート
import YouTubePlayer from '../components/YouTubePlayer';
import YouTube, { YouTubeEvent } from 'react-youtube';
import ToastNotification from '../components/ToastNotification';
import { Button, ButtonGroup, Card, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, TextInput } from 'flowbite-react';
import { HiClipboardCopy, HiSearch, HiX } from 'react-icons/hi';
import { GiPreviousButton, GiNextButton } from 'react-icons/gi';
import { FaBackwardStep, FaCompactDisc, FaDatabase, FaForwardStep, FaPlay, FaShare, FaShuffle, FaX, FaYoutube } from "react-icons/fa6";
import useDebounce from '../hook/useDebounce';
import NowPlayingSongInfo from '../components/NowPlayingSongInfo';
import SongsList from '../components/SongList';

let youtubeVideoId = "";
let changeVideoIdCount = 0;

export default function MainPlayer() {
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // 現在の曲変更をwatchするタイマー
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const [baseUrl, setBaseUrl] = useState('');
    const [apiUrl, setApiUrl] = useState('');

    const [allSongs, setAllSongs] = useState<Song[]>([]);
    const [songs, setSongs] = useState<Song[]>([]);
    const songsRef = useRef(songs);

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

    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [availableArtists, setAvailableArtists] = useState<string[]>([]);
    const [availableSingers, setAvailableSingers] = useState<string[]>([]);
    const [availableSongTitles, setAvailableSongTitles] = useState<string[]>([]);

    const [searchArtists, setSearchArtists] = useState('');



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
                setIsInitialLoading(false);

                // 取得したデータから検索用ワードを抽出
                const tags = data.flatMap(song => song.tags);
                const songTitles = data.map(song => song.title);
                const singers = data.flatMap(song => song.sing.split(/、/).map(s => s.trim()));
                const artists = data.flatMap(song => song.artist.split(/、/).map(s => s.trim()));

                setAvailableTags(tags);
                setAvailableSongTitles(songTitles);
                setAvailableSingers(singers);
                setAvailableArtists(artists);
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
            if (!isInitialLoading) {
                url.searchParams.delete('q');
                history.replaceState(null, '', url);
            }
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
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
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
        const song = allSongs.slice().sort((a, b) => (parseInt(b.start) || 0) - (parseInt(a.start) || 0))
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
        if (youtubeVideoId !== event.target.getVideoData()?.video_id && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (intervalRef.current && (event.data === YouTube.PlayerState.UNSTARTED || event.data === YouTube.PlayerState.PAUSED)) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (event.data === YouTube.PlayerState.PLAYING) {
            // iOSで勝手にスクロールするのを戻す
            window.scrollTo(0, 0);

            changeCurrentSong(currentSongInfoRef.current, true);
            // 曲が再生されたときの処理
            if (intervalRef.current) return;

            // 曲の変更検知するためのタイマーを起動
            intervalRef.current = setInterval(() => {
                const currentTime = event.target.getCurrentTime();
                const currentVideoId = event.target.getVideoData()?.video_id;
                if (currentVideoId === null) return;
                const curSong = searchCurrentSong(currentVideoId, currentTime);
                if (curSong && (curSong.video_id !== currentSongInfoRef.current?.video_id || curSong.title !== currentSongInfoRef.current?.title)) {
                    changeVideoIdCount++;
                    // 現在の曲が変わった場合、状態を更新
                    if (changeVideoIdCount > 1) {
                        changeCurrentSong(curSong, true);
                        changeVideoIdCount = 0;
                    }
                }
                // song.end を超えたら次の曲へ
                if (curSong && curSong.end && curSong.end < currentTime) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    changeCurrentSong(nextSong, false);
                }
            }, 1000); // 1秒ごとにチェック

        } else if (event.data === YouTube.PlayerState.ENDED) {
            // 曲が終了したときの処理
            if (nextSong) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                changeCurrentSong(nextSong, false);
            } else {
                playRandomSong(songs);
            }
        }
    }
    return (
        <main className='flex flex-col lg:flex-row flex-grow overflow-y-scroll lg:overflow-hidden p-0 lg:p-4 dark:bg-gray-800'>
            <aside className='flex lg:w-2/3 xl:w-7/12 sm:w-full'>
                <div className="flex flex-col h-full w-full bg-background overflow-auto">
                    <div className="relative aspect-video w-full bg-black">
                        <div className="absolute top-0 left-0 w-full h-full">
                            <div className='w-full h-full shadow-md'>
                                {currentSong && (
                                    <YouTubePlayer key="youtube-player" song={currentSong} onStateChange={handleStateChange} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col p-2 px-2 lg:px-0 text-sm text-foreground'>
                        <div className="hidden lg:flex w-full justify-between gap-2">
                            <Card className="h-20 w-2/6 p-2 truncate bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded cursor-pointer hover:bg-gray-300" onClick={() => changeCurrentSong(previousSong)}>
                                <div className="flex items-center">
                                    {previousSong && (
                                        <>
                                            <img
                                                src={`https://img.youtube.com/vi/${previousSong?.video_id}/maxresdefault.jpg`}
                                                alt="thumbnail"
                                                className="w-12 mr-2"
                                            />
                                            <div className="flex flex-col w-full">
                                                <span className="text-left font-bold truncate">{previousSong?.title}</span>
                                                <span className="text-left text-sm text-muted truncate">{previousSong?.artist}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>
                            <Card
                                className='h-20 w-2/6 p-2 truncate rounded bg-primary-400 dark:bg-primary-900 dark:text-gray-300 border-0 shadow-none'
                            >
                                <div className="flex items-center">
                                    {currentSongInfo && (
                                        <>
                                            <img
                                                src={`https://img.youtube.com/vi/${currentSongInfo?.video_id}/maxresdefault.jpg`}
                                                alt="thumbnail"
                                                className="w-12 mr-2"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-left font-bold truncate">{currentSongInfo?.title}</span>
                                                <span className="text-left text-sm text-muted truncate">{currentSongInfo?.artist}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>
                            <Card className="h-20 w-2/6 p-2 truncate bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded text-right cursor-pointer hover:bg-gray-300" onClick={() => changeCurrentSong(nextSong)}>
                                <div className="flex items-center">
                                    {nextSong && (
                                        <>
                                            <img
                                                src={`https://img.youtube.com/vi/${nextSong?.video_id}/maxresdefault.jpg`}
                                                alt="thumbnail"
                                                className="w-12 mr-2"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-left font-bold truncate">{nextSong?.title}</span>
                                                <span className="text-left text-sm text-muted truncate">{nextSong?.artist}</span>
                                            </div>
                                        </>
                                    )}

                                </div>
                            </Card>
                        </div>
                        <div className="flex lg:hidden justify-between">
                            <div className="">
                                <ButtonGroup className='shadow-none'>
                                    <Button
                                        onClick={() => changeCurrentSong(previousSong)}
                                        disabled={!previousSong}
                                        className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary border-none text-white transition disabled:opacity-50 disabled:cursor-not-allowed  cursor-pointer"
                                    ><GiPreviousButton /></Button>
                                    <Button
                                        onClick={() => changeCurrentSong(nextSong)}
                                        disabled={!nextSong}
                                        className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition disabled:opacity-50 disabled:cursor-not-allowed  cursor-pointer"
                                    ><GiNextButton /></Button>
                                </ButtonGroup>
                            </div>
                            <div>
                                <Button
                                    onClick={() => playRandomSong(songs)}
                                    className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition text-sm  cursor-pointer"
                                ><FaShuffle />&nbsp;ランダム</Button>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setOpenShereModal(true)}
                                    className="bg-primary hover:bg-primary dark:bg-primary-800 dark:hover:bg-primary text-white transition text-sm cursor-pointer"
                                ><FaShare />&nbsp;Share
                                </Button>
                            </div>
                        </div>
                    </div>
                    <NowPlayingSongInfo
                        currentSongInfo={currentSongInfo}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        setOpenShereModal={setOpenShereModal} />
                </div>
            </aside>

            <section className='flex lg:w-1/3 xl:w-5/12 sm:w-full flex-col min-h-0 h-dvh lg:h-full lg:ml-3 sm:mx-0'>
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
                        <SongsList
                            songs={songs}
                            currentSongInfo={currentSongInfo}
                            changeCurrentSong={changeCurrentSong}
                        />
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
                <ModalHeader className='bg-white dark:bg-gray-800 dark:text-white'>シェア</ModalHeader>
                <ModalBody className='bg-white dark:bg-gray-800 dark:text-white'>
                    <p className="mb-4">
                        AZKiさんの素敵な歌声をシェアしましょう！
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
                                className='bg-black text-white dark:bg-black dark:text-white dark:hover:bg-gray-900'
                                onClick={() => {
                                    const text = `${currentSongInfo?.video_title} \nhttps://www.youtube.com/watch/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`;
                                    const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
                                    window.open(twitterUrl);
                                }}>
                                <FaX className='w-4 h-4' />
                            </Button>
                        </div>
                    </div>
                    <div className="mt-4">
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
                                className='bg-black text-white dark:bg-black dark:text-white dark:hover:bg-gray-900'
                                onClick={() => {
                                    const text = `Now Playing♪ ${currentSongInfo?.title} - ${currentSongInfo?.artist} \n${currentSongInfo?.video_title} \n${baseUrl}/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`;
                                    const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
                                    window.open(twitterUrl);
                                }}>
                                <FaX className='w-4 h-4' />
                            </Button>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className='bg-white dark:bg-gray-800 dark:text-white'>
                    <Button className='bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary text-white transition text-sm' onClick={() => setOpenShereModal(false)}>閉じる</Button>
                </ModalFooter>
            </Modal>
        </main>
    );
}
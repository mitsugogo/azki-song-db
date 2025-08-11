"use client";

import { useEffect, useState } from 'react';
import { Song } from '../types/song';
import { TabItem, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Tabs, ThemeProvider } from 'flowbite-react';
import { HiClipboardList, HiUserCircle, HiMusicNote, HiPlay } from 'react-icons/hi';
import { FaYoutube } from 'react-icons/fa6';

export default function StatisticsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [songCounts, setSongCounts] = useState<{ title: string; count: number; song: Song; lastVideo: Song | null }[]>([]);
  const [artistCounts, setArtistCounts] = useState<{ artist: string; count: number; song: Song; lastVideo: Song | null }[]>([]);
  const [originalSongCounts, setOriginalSongCounts] = useState<{ title: string; count: number; song: Song; lastVideo: Song | null }[]>([]);
  const [tab, setTab] = useState<'song' | 'artist' | 'original'>('song');

  useEffect(() => {
    fetch('/api/songs')
      .then((res) => res.json())
      .then((data) => setSongs(data));
  }, []);

  useEffect(() => {
    const songCountsMap = songs.slice().sort((a, b) => {
      const dateA = new Date(a.broadcast_at).getTime();
      const dateB = new Date(b.broadcast_at).getTime();
      return dateA - dateB;
    }).reduce((map, song) => {
      const title = song.title;
      map[title] = {
        title,
        count: (map[title]?.count || 0) + 1,
        song: song,
        lastVideo: song,
      };
      return map;
    }, {} as { [key: string]: { title: string; count: number; song: Song; lastVideo: Song | null } });

    const songCounts = Object.values(songCountsMap)
      .sort((a, b) => b.count - a.count);

    setSongCounts(songCounts);
  }, [songs]);

  useEffect(() => {
    const artistCountsMap = songs.slice().sort((a, b) => {
      const dateA = new Date(a.broadcast_at).getTime();
      const dateB = new Date(b.broadcast_at).getTime();
      return dateA - dateB;
    }).reduce((map, song) => {
      const artist = song.artist;
      map[artist] = {
        artist,
        count: (map[artist]?.count || 0) + 1,
        song: song,
        lastVideo: song,
      };
      return map;
    }, {} as { [key: string]: { artist: string; count: number; song: Song; lastVideo: Song | null } });

    const artistCounts = Object.values(artistCountsMap)
      .sort((a, b) => b.count - a.count);

    setArtistCounts(artistCounts);
  }, [songs]);

  useEffect(() => {
    const originalSongCountsMap = songs.slice().sort((a, b) => {
      const dateA = new Date(a.broadcast_at).getTime();
      const dateB = new Date(b.broadcast_at).getTime();
      return dateA - dateB;
    }).reduce((map, song) => {
      if (['AZKi', '瀬名航 feat.AZKi'].includes(song.artist)) {
        const title = song.title;
        map[title] = {
          title,
          count: (map[title]?.count || 0) + 1,
          song: song,
          lastVideo: song,
        };
      }
      return map;
    }, {} as { [key: string]: { title: string; count: number; song: Song; lastVideo: Song | null } });

    const originalSongCounts = Object.values(originalSongCountsMap)
      .sort((a, b) => b.count - a.count);

    setOriginalSongCounts(originalSongCounts);
  }, [songs]);

  return (
    <div className='lg:p-6'>
      <div>
        <h1 className='font-extrabold text-2xl mb-3 sm:p-3 dark:text-gray-200'>統計情報</h1>
      </div>
      <Tabs aria-label="Default tabs" variant="default">
        <TabItem active={tab === 'song'} title="曲名別" icon={HiMusicNote} onClick={() => setTab('song')}>
          <div className=''>
            <Table striped hoverable className='w-full'>
              <caption className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                曲名別 - {songCounts.length}曲
                <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                  全{songCounts.length}曲で、曲名別に歌唱した回数をまとめています。<br />
                  データ上、表記揺れした場合に別の曲としてカウントされる場合がありますので、ご了承ください。
                </p>
              </caption>
              <TableHead className='sticky top-0'>
                <TableRow>
                  <TableHeadCell className=''>曲名</TableHeadCell>
                  <TableHeadCell className='lg:text-nowrap hidden lg:block'>アーティスト名</TableHeadCell>
                  <TableHeadCell className='lg:text-nowrap'>回数</TableHeadCell>
                  <TableHeadCell className=''>最新の動画</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {songCounts.map((songCount) => {
                  const lastVideo = songCount.lastVideo;
                  const today = new Date();
                  const lastVideoDate = lastVideo ? new Date(lastVideo.broadcast_at) : null;
                  const daysAfterLastVideo = lastVideoDate ? Math.ceil((today.getTime() - lastVideoDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  return (
                    <TableRow key={songCount.title}>
                      <TableCell>{songCount.title}</TableCell>
                      <TableCell className='hidden lg:table-cell'>{songCount.song.artist}</TableCell>
                      <TableCell>{songCount.count}</TableCell>
                      <TableCell>
                        {lastVideo ? (
                          <a href={`${lastVideo.video_uri}${lastVideo.start ? `&t=${lastVideo.start}s` : ''}`} target="_blank" rel="noopener noreferrer" className='text-primary hover:text-primary-700'>
                            <div className="lg:flex lg:items-center lg:gap-2 flex flex-col lg:flex-row">
                              <img src={`https://img.youtube.com/vi/${lastVideo.video_id}/mqdefault.jpg`} alt={lastVideo.video_title} className="w-full lg:w-12 aspect-video" />
                              <div className="flex flex-col gap-1 lg:gap-">
                                <span className="text-sm hidden lg:inline">
                                  <span className="">{lastVideo.video_title}</span>
                                </span>
                                <span className="text-xs text-muted-foreground">{new Date(lastVideo.broadcast_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </a>
                        ) : (
                          <span className="text-sm">なし</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabItem>
        <TabItem active={tab === 'artist'} title="アーティスト名別" icon={HiUserCircle} onClick={() => setTab('artist')}>
          <Table striped hoverable>
            <caption className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
              アーティスト名別 - {artistCounts.length}曲
              <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                全{artistCounts.length}曲で、アーティスト名別に歌唱した回数をまとめています。<br />
                データ上、表記揺れした場合に別のアーティストとしてカウントされる場合がありますので、ご了承ください。
              </p>
            </caption>
            <TableHead>
              <TableRow>
                <TableHeadCell className=''>アーティスト名</TableHeadCell>
                <TableHeadCell className='lg:text-nowrap'>回数</TableHeadCell>
                <TableHeadCell className=''>最新の動画</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {artistCounts.map((artistCount) => {
                const lastVideo = artistCount.lastVideo;
                const today = new Date();
                const lastVideoDate = lastVideo ? new Date(lastVideo.broadcast_at) : null;
                const daysAfterLastVideo = lastVideoDate ? Math.ceil((today.getTime() - lastVideoDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <TableRow key={artistCount.artist}>
                    <TableCell>{artistCount.artist}</TableCell>
                    <TableCell>{artistCount.count}</TableCell>
                    <TableCell>
                      {lastVideo ? (
                          <a href={`${lastVideo.video_uri}${lastVideo.start ? `&t=${lastVideo.start}s` : ''}`} target="_blank" rel="noopener noreferrer" className='text-primary hover:text-primary-700'>
                            <div className="lg:flex lg:items-center lg:gap-2 flex flex-col lg:flex-row">
                              <img src={`https://img.youtube.com/vi/${lastVideo.video_id}/mqdefault.jpg`} alt={lastVideo.video_title} className="w-full lg:w-12 aspect-video" />
                              <div className="flex flex-col gap-1 lg:gap-">
                                <span className="text-sm hidden lg:inline">
                                  <span className="">{lastVideo.video_title}</span>
                                </span>
                                <span className="text-xs text-muted-foreground">{new Date(lastVideo.broadcast_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </a>
                        ) : (
                          <span className="text-sm">なし</span>
                        )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabItem>
        <TabItem active={tab === 'original'} title="オリ曲" icon={HiPlay} onClick={() => setTab('original')}>
          <Table striped hoverable>
            <caption className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
              オリ曲 - {originalSongCounts.length}曲
              <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                全{originalSongCounts.length}曲で、オリジナル楽曲のみの回数をまとめています。<br />
                データ上、表記揺れした場合に別のオリ曲としてカウントされる場合がありますので、ご了承ください。
              </p>
            </caption>
            <TableHead>
              <TableRow>
                <TableHeadCell className=''>曲名</TableHeadCell>
                <TableHeadCell className='lg:text-nowrap'>回数</TableHeadCell>
                <TableHeadCell className=''>最新の動画</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {originalSongCounts.map((originalSongCount) => {
                const lastVideo = originalSongCount.lastVideo;
                const today = new Date();
                const lastVideoDate = lastVideo ? new Date(lastVideo.broadcast_at) : null;
                const daysAfterLastVideo = lastVideoDate ? Math.ceil((today.getTime() - lastVideoDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <TableRow key={originalSongCount.title}>
                    <TableCell>{originalSongCount.title}</TableCell>
                    <TableCell>{originalSongCount.count}</TableCell>
                    <TableCell>
                      {lastVideo ? (
                          <a href={`${lastVideo.video_uri}${lastVideo.start ? `&t=${lastVideo.start}s` : ''}`} target="_blank" rel="noopener noreferrer" className='text-primary hover:text-primary-700'>
                            <div className="lg:flex lg:items-center lg:gap-2 flex flex-col lg:flex-row">
                              <img src={`https://img.youtube.com/vi/${lastVideo.video_id}/mqdefault.jpg`} alt={lastVideo.video_title} className="w-full lg:w-12 aspect-video" />
                              <div className="flex flex-col gap-1 lg:gap-">
                                <span className="text-sm hidden lg:inline">
                                  <span className="">{lastVideo.video_title}</span>
                                </span>
                                <span className="text-xs text-muted-foreground">{new Date(lastVideo.broadcast_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </a>
                        ) : (
                          <span className="text-sm">なし</span>
                        )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabItem>
      </Tabs>
    </div>
  );
}



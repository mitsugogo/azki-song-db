import { Song } from "../types/song"

interface SongListProps {
    songs: Song[]
    currentSongInfo: Song | null
    changeCurrentSong: (song: Song, isRandom: boolean) => void
}

const SongsList = ({ songs, currentSongInfo, changeCurrentSong }: SongListProps) => {
    return (
        <ul className="song-list grid grid-cols-3 auto-rows-max md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 gap-2 overflow-y-auto h-dvh lg:h-full flex-grow dark:text-gray-300">
            {songs.map((song, index) => (
                <li
                    key={index}
                    className={`p-3 rounded relative cursor-pointer transition ${currentSongInfo?.title === song.title && currentSongInfo.video_id === song.video_id ? 'bg-primary-300 hover:bg-primary-400 dark:bg-primary-900 dark:hover:bg-primary-800 dark:text-gray-300' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
                    onClick={() => changeCurrentSong(song, false)}
                    data-video-id={song.video_id}
                    data-start-time={song.start}
                    data-title={song.title}
                >
                    <div className="block w-full mb-2 text-center">
                        <div className='shadow-md 0'>
                            <img src={`https://img.youtube.com/vi/${song?.video_id}/maxresdefault.jpg`} />
                        </div>
                    </div>
                    <div className='w-full'>
                        <div className="w-full text-sm font-semibold line-clamp-3">{song.title}</div>
                        <div className="w-full text-xs text-muted-foreground line-clamp-3">{song.artist} - {song.sing}</div>
                    </div>
                    <div className='flex gap-x-2 mt-2p-2 rounded text-xs text-muted-foreground'>
                        {song.broadcast_at && (
                            <>{(new Date(song.broadcast_at)).toLocaleDateString()}</>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    )
}

export default SongsList
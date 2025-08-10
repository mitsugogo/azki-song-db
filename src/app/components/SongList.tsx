import { Song } from "../types/song"

interface SongListProps {
    songs: Song[]
    currentSongInfo: Song | null
    changeCurrentSong: (song: Song, isRandom: boolean) => void
}

const SongsList = ({ songs, currentSongInfo, changeCurrentSong }: SongListProps) => {
    return (
        <ul className="song-list grid grid-cols-3 lg:grid-cols-2 gap-2 overflow-y-auto h- lg:h-full flex-grow">
            {songs.map((song, index) => (
                <li
                    key={index}
                    className={`p-3 rounded relative cursor-pointer transition ${currentSongInfo?.title === song.title && currentSongInfo.video_id === song.video_id ? 'bg-primary-light hover:bg-primary-light dark:text-white' : 'bg-gray-200 dark:bg-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-800'}`}
                    onClick={() => changeCurrentSong(song, false)}
                    data-video-id={song.video_id}
                    data-start-time={song.start}
                    data-title={song.title}
                >
                    <div className="block w-full mb-2">
                        <div className='shadow-md 0'>
                            <img src={`https://img.youtube.com/vi/${song.video_id}/maxresdefault.jpg`} />
                        </div>
                    </div>
                    <div className='w-full'>
                        <div className="w-full text-sm font-semibold">{song.title}</div>
                        <div className="w-full text-xs text-muted-foreground">{song.artist} - {song.sing}</div>
                    </div>
                    <div className='hidden lg:flex gap-x-2 mt-2p-2 rounded text-xs text-muted-foreground'>
                        {/* <div className='w-1/6'>
                            <img src={`https://img.youtube.com/vi/${song.video_id}/maxresdefault.jpg`} />
                        </div>
                        <div className='w-5/6'>
                            <div className="w-full text-xs text-muted-foreground text-gray-700 dark:text-gray-400 pt-1 hidden lg:block">{song.video_title} ({(new Date(song.broadcast_at)).toLocaleDateString()})</div>
                        </div> */}
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
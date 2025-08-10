import { Badge, Button, Modal, ModalBody, ModalHeader } from "flowbite-react";
import { Song } from "../types/song";
import { FaBook, FaCalendar, FaShare, FaTag, FaUser, FaYoutube } from "react-icons/fa6";
import { PiMicrophoneStageFill } from "react-icons/pi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";

interface NowPlayingSongInfoDetailProps {
    currentSongInfo: Song;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
}

const NowPlayingSongInfoDetail = ({ currentSongInfo, searchTerm, setSearchTerm }: NowPlayingSongInfoDetailProps) => {
    return (
        <>
            {currentSongInfo && (
                <div className="flex-grow">
                    <dl className="grid grid-cols-6 gap-x-4 gap-y-2">
                        <div className="col-span-1 flex items-center">
                            <dt className="text-muted-foreground flex items-center"><FaUser /><span className="hidden lg:inline ml-1">アーティスト:</span></dt>
                        </div>
                        <div className="col-span-5">
                            <dd className="flex flex-wrap gap-1">
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

                        <div className="col-span-1 flex items-center">
                            <dt className="text-muted-foreground flex items-center"><PiMicrophoneStageFill /><span className="hidden lg:inline ml-1">歌った人:</span></dt>
                        </div>
                        <div className="col-span-5">
                            <dd className="flex flex-wrap gap-1">
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

                        <div className="col-span-1 flex items-center">
                            <dt className="text-muted-foreground flex items-center"><FaYoutube /><span className="hidden lg:inline ml-1">動画タイトル:</span></dt>
                        </div>
                        <div className="col-span-5">
                            <dd>
                                <a
                                    href={`${currentSongInfo.video_uri}&t=${currentSongInfo.start || 0}s`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline justify-self-start font-semibold dark:text-primary-light"
                                >
                                    <FontAwesomeIcon icon={faYoutube} /> {currentSongInfo.video_title}
                                </a>
                            </dd>
                        </div>

                        <div className="col-span-1 flex items-center">
                            <dt className="text-muted-foreground flex items-center"><FaCalendar /><span className="hidden lg:inline ml-1">配信日:</span></dt>
                        </div>
                        <div className="col-span-5">
                            <dd className="flex flex-wrap gap-1">
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

                        <div className="col-span-1 flex items-center">
                            <dt className="text-muted-foreground flex items-center"><FaTag /><span className="hidden lg:inline ml-1">タグ:</span></dt>
                        </div>
                        <div className="col-span-5">
                            <dd className="flex flex-wrap gap-1">
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
                        </div>

                        {currentSongInfo && currentSongInfo.extra && (
                            <>
                                <div className="col-span-1 flex items-center">
                                    <dt className="text-muted-foreground flex items-center"><FaBook /><span className="hidden lg:inline ml-1">追加情報:</span></dt>
                                </div>
                                <div className="col-span-5">
                                    <dd>{currentSongInfo.extra}</dd>
                                </div>
                            </>
                        )}
                    </dl>
                </div>
            )}
        </>
    )
};

export default NowPlayingSongInfoDetail;
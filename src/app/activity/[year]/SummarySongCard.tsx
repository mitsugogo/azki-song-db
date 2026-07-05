import type { ReactNode } from "react";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import { Link } from "@/i18n/navigation";
import { formatDate } from "../../lib/formatDate";
import { Song } from "../../types/song";

type SummarySongCardProps = {
  song: Pick<Song, "title" | "artist" | "video_id" | "broadcast_at">;
  href: string;
  locale: string;
  showArtist?: boolean;
  bottomContent?: ReactNode;
};

export default function SummarySongCard({
  song,
  href,
  locale,
  showArtist = Boolean(song.artist),
  bottomContent,
}: SummarySongCardProps) {
  return (
    <article className="card-glassmorphism hover-lift-shadow overflow-hidden">
      <Link href={href} className="block">
        <div className="w-full aspect-video bg-black">
          <YoutubeThumbnail videoId={song.video_id} alt={song.title} />
        </div>
        <div className="p-3">
          <div className="font-medium line-clamp-2">{song.title}</div>
          {showArtist && (
            <div className="text-sm text-gray-700 dark:text-light-gray-400 line-clamp-2">
              {song.artist}
            </div>
          )}
          <div className="text-xs text-gray-700 dark:text-light-gray-400 mt-1">
            {formatDate(song.broadcast_at, locale)}
          </div>
          {bottomContent}
        </div>
      </Link>
    </article>
  );
}

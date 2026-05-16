import { Link } from "@/i18n/navigation";
import { Badge } from "@mantine/core";
import { useLocale } from "next-intl";
import { FaStar } from "react-icons/fa6";
import YoutubeThumbnail from "../../components/YoutubeThumbnail";
import { formatDate } from "../../lib/formatDate";
import { Song } from "../../types/song";

interface SearchSongCardProps {
  song: Song;
  href: string;
  membersOnlyBadgeLabel: string;
  articleClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  artistClassName?: string;
  dateClassName?: string;
}

const SearchSongCard = ({
  song,
  href,
  membersOnlyBadgeLabel,
  articleClassName,
  contentClassName,
  titleClassName,
  artistClassName,
  dateClassName,
}: SearchSongCardProps) => {
  const locale = useLocale();

  return (
    <article
      className={[
        "card-glassmorphism hover-shadow-md overflow-hidden rounded-xl transition",
        articleClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link href={href} className="block">
        <div className="relative w-full aspect-video bg-black text-center mb-2">
          <YoutubeThumbnail
            videoId={song.video_id}
            alt={song.title}
            imageClassName="rounded-t-sm"
          />
        </div>
        <div
          className={["w-full space-y-0.5 px-3 pt-0.5 pb-2", contentClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {song.is_members_only && (
            <div className="text-xs">
              <Badge
                color="green"
                size="xs"
                radius="xs"
                className="text-[0.5rem]"
                variant="light"
              >
                <FaStar className="inline -mt-0.5" /> {membersOnlyBadgeLabel}
              </Badge>
            </div>
          )}
          <div
            className={[
              "line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white break-all",
              titleClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {song.title}
          </div>
          {song.artist && (
            <div
              className={[
                "line-clamp-2 text-xs text-gray-600 dark:text-gray-100",
                artistClassName,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {song.artist}
            </div>
          )}
          <div
            className={[
              "flex items-center justify-between text-[0.7rem] uppercase text-gray-400 dark:text-gray-300",
              dateClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span>{formatDate(song.broadcast_at, locale)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default SearchSongCard;

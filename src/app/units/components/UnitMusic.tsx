import { Badge } from "@mantine/core";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import { formatDate } from "@/app/lib/formatDate";
import { getDiscographyLink } from "@/app/lib/song";
import type { Song } from "@/app/types/song";

export default async function UnitMusic({
  works,
  singingStats,
}: {
  works: Song[];
  singingStats: {
    uniqueSongCount: number;
    performanceCount: number;
    ranked: Array<{ title: string; count: number }>;
  };
}) {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Units", locale });
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);

  return (
    <section aria-labelledby="unit-music-title" className="mt-12">
      <h2
        id="unit-music-title"
        className="text-xl font-bold text-gray-900 dark:text-gray-100"
      >
        {t("musicTitle")}
      </h2>
      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t("worksTitle")}
          </h3>
          {works.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {t("worksEmpty")}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {works.map((song) => {
                const href =
                  getDiscographyLink(song) ??
                  `/watch?v=${encodeURIComponent(song.video_id)}&t=${song.start}`;
                return (
                  <article
                    key={song.slugv2 || `${song.video_id}-${song.title}`}
                    className="card-glassmorphism flex overflow-hidden border border-primary/10 shadow-none! dark:border-white/25 dark:shadow-none!"
                  >
                    <Link href={href} className="w-32 shrink-0 sm:w-40">
                      <YoutubeThumbnail
                        videoId={song.video_id}
                        alt={song.title}
                      />
                    </Link>
                    <div className="min-w-0 p-3">
                      <h4 className="line-clamp-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                        <Link href={href}>{song.title}</Link>
                      </h4>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(
                          song.album_release_at || song.broadcast_at,
                          locale,
                          { timeZone: "Asia/Tokyo" },
                        )}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {song.tags
                          .filter((tag) =>
                            [
                              "オリ曲",
                              "オリ曲MV",
                              "カバー曲",
                              "ユニット曲",
                            ].includes(tag),
                          )
                          .map((tag) => (
                            <Badge key={tag} size="xs" variant="light">
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t("songsTogetherTitle")}
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="card-glassmorphism border border-primary/10 p-4 shadow-none! dark:border-white/25 dark:shadow-none!">
              <p className="text-2xl font-extrabold text-primary-700 dark:text-pink-200">
                {number(singingStats.uniqueSongCount)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("uniqueSongs")}
              </p>
            </div>
            <div className="card-glassmorphism border border-primary/10 p-4 shadow-none! dark:border-white/25 dark:shadow-none!">
              <p className="text-2xl font-extrabold text-primary-700 dark:text-pink-200">
                {number(singingStats.performanceCount)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("totalPerformances")}
              </p>
            </div>
          </div>
          {singingStats.ranked.length > 0 && (
            <ol className="card-glassmorphism mt-4 divide-y divide-gray-200 border border-primary/10 px-4 shadow-none! dark:divide-gray-700 dark:border-white/25 dark:shadow-none!">
              {singingStats.ranked.slice(0, 10).map((entry, index) => (
                <li
                  key={entry.title}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <span className="w-6 text-right font-mono text-xs text-gray-400">
                    {index + 1}
                  </span>
                  <Link
                    href={`/search?q=${encodeURIComponent(`title:${entry.title}`)}`}
                    className="min-w-0 flex-1 font-semibold text-gray-800 hover:text-primary hover:underline dark:text-gray-100"
                  >
                    {entry.title}
                  </Link>
                  <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                    {t("times", { count: entry.count })}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

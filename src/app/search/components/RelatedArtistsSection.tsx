import { Alert } from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FaCircleInfo } from "react-icons/fa6";
import { RelatedArtistsCategoryFilterItem } from "../hook/useSearchFilterModeData";

interface RelatedArtistsSectionProps {
  categories: RelatedArtistsCategoryFilterItem[];
}

const RelatedArtistsSection = ({ categories }: RelatedArtistsSectionProps) => {
  const t = useTranslations("SearchBrowse");
  const icon = <FaCircleInfo size={16} />;
  const noteDescription = t.raw("relatedArtists.noteDescription");

  return (
    <div className="p-3 space-y-8">
      <Alert
        variant="light"
        color="blue"
        title={t("relatedArtists.noteTitle")}
        icon={icon}
      >
        {typeof noteDescription === "string" ? (
          <span dangerouslySetInnerHTML={{ __html: noteDescription }} />
        ) : null}
      </Alert>

      {categories.map((category) => {
        const maxCount = Math.max(
          ...category.artists.map((artist) => artist.count),
          1,
        );

        return (
          <section key={category.categoryKey}>
            <h2 className="mb-3 text-lg font-bold dark:text-white">
              {t(`relatedArtists.categories.${category.categoryKey}`)}
            </h2>

            {category.artists.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-light-gray-400">
                {t("relatedArtists.emptyCategory")}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {category.artists.map((artist) => {
                  const pct = Math.round((artist.count / maxCount) * 100);
                  return (
                    <Link
                      key={`${category.categoryKey}-${artist.artist}`}
                      href={`/search?q=${encodeURIComponent(`artist:${artist.artist}`)}`}
                      className="card-glassmorphism hover-lift-shadow block relative overflow-hidden"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-pink-400 to-rose-500 dark:from-pink-500 dark:to-rose-400 opacity-30"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative z-10 p-3">
                        <div className="font-medium text-sm line-clamp-2">
                          {artist.artist}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-light-gray-400 mt-1">
                          {artist.count}
                          {t("songsSuffix")}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default RelatedArtistsSection;

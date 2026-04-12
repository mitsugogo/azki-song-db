"use client";

import { Link, useRouter } from "../i18n/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Burger, Skeleton, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useLocale, useTranslations } from "next-intl";
import { AnalyticsWrapper } from "./components/AnalyticsWrapper";
import DrawerMenu from "./components/DrawerMenu";
import SearchInput from "./components/SearchInput";
import Footer from "./components/Footer";
import LanguageSwitcher from "./components/LanguageSwitcher";
import ThemeToggle from "./components/ThemeToggle";
import YoutubeThumbnail from "./components/YoutubeThumbnail";
import { siteConfig } from "./config/siteConfig";
import useSongs from "./hook/useSongs";
import { buildWatchHref } from "./lib/watchUrl";
import { formatDate } from "./lib/formatDate";
import { flowbiteTheme } from "./theme";
import { ThemeProvider } from "flowbite-react";
import { LuSearch, LuSparkles } from "react-icons/lu";
import { FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Song } from "./types/song";

const RECOMMENDED_SONG_COUNT = 20;
const RECOMMENDED_SKELETON_COUNT = 20;

function pickRecommendedSongs<T>(items: Song[], count: number) {
  if (items.length <= count) {
    return items;
  }

  // 本人歌唱動画に限定する
  items = items.filter((item) => item.sing.includes(siteConfig.talentName));

  const pool = [...items];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, count);
}

// video_id基準で楽曲をグループ化し、直近3件を取得
function groupRecentUpdates(items: Song[], limit: number = 3) {
  // broadcast_at と video_id が存在する楽曲のみを対象
  const validItems = items.filter((item) => item.broadcast_at && item.video_id);

  // video_id でグループ化
  const grouped = new Map<string, Song[]>();
  validItems.forEach((song) => {
    if (!grouped.has(song.video_id)) {
      grouped.set(song.video_id, []);
    }
    grouped.get(song.video_id)!.push(song);
  });

  // 各グループの最新配信日でソート（新しい順）して、直近 limit 件を取得
  const sorted = Array.from(grouped.entries())
    .map(([videoId, songs]) => {
      // グループ内で最新の配信日を取得
      const latestDate = new Date(
        Math.max(...songs.map((s) => new Date(s.broadcast_at).getTime())),
      );
      // グループ内の最初の曲のタイトルを使用
      const videoTitle = songs[0].video_title;
      return {
        videoId,
        videoTitle,
        songs,
        count: songs.length,
        latestDate,
      };
    })
    .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime())
    .slice(0, limit)
    .map(({ videoId, videoTitle, songs, count, latestDate }) => ({
      // ISO文字列で渡して、表示側でロケールに応じて整形する
      date: latestDate.toISOString(),
      videoId,
      videoTitle,
      songs,
      count,
    }));

  return sorted;
}

export default function ClientTop() {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const { allSongs, songsFetchedAt, isLoading } = useSongs();
  const t = useTranslations("Home");
  const tHeader = useTranslations("Header");
  const tDrawer = useTranslations("DrawerMenu");
  const [searchValue, setSearchValue] = useState<string[]>([]);

  useEffect(() => {
    const updateHeaderState = () => {
      setIsScrolled(window.scrollY > 12);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeaderState);
    };
  }, []);

  const recommendedSongs = useMemo(
    () => pickRecommendedSongs(allSongs, RECOMMENDED_SONG_COUNT),
    [allSongs],
  );

  const recentUpdates = useMemo(
    () => groupRecentUpdates(allSongs, 3),
    [allSongs],
  );

  const songsUpdatedLabel = useMemo(() => {
    if (!songsFetchedAt) {
      return null;
    }

    const date = new Date(songsFetchedAt);
    if (Number.isNaN(date.getTime())) {
      return songsFetchedAt;
    }

    return formatDate(date, locale);
  }, [songsFetchedAt]);

  const handleSearch = () => {
    const query = searchValue.join("|").trim();
    startTransition(() => {
      router.push(query ? `/search?q=${encodeURIComponent(query)}` : `/search`);
    });
  };

  return (
    <ThemeProvider theme={flowbiteTheme}>
      <div className="min-h-dvh overflow-x-clip bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.18),transparent_38%),linear-gradient(180deg,#fffafc_0%,#fdf2f8_100%)] text-gray-900 dark:bg-[radial-gradient(circle_at_top,rgba(190,24,93,0.2),transparent_34%),linear-gradient(180deg,#111827_0%,#0f172a_100%)] dark:text-white">
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-24 pt-0 lg:pt-6 sm:px-6 lg:px-8">
          <header
            className={`sticky top-0 z-40 -mx-4 px-4 py-4 transition-colors duration-200 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${
              isScrolled
                ? "bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/70 dark:bg-gray-900/70 dark:supports-backdrop-filter:bg-gray-900/70"
                : "border-transparent bg-transparent"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Burger
                  opened={drawerOpened}
                  onClick={toggleDrawer}
                  aria-label="Toggle navigation"
                />
                <Link
                  href={`/`}
                  className="inline-block truncate text-base font-semibold tracking-[0.12em] text-primary dark:text-pink-200 sm:text-lg sm:tracking-[0.24em]"
                >
                  {siteConfig.siteNameUpper}
                </Link>
              </div>

              <div className="flex shrink-0 items-center justify-end sm:gap-2">
                <nav className="hidden items-center gap-5 text-sm text-gray-600 dark:text-gray-300 sm:flex">
                  <Link href={`/search`} className="hover:text-primary-500">
                    <LuSearch />
                  </Link>
                  <Link
                    href={`/discography`}
                    className="hover:text-primary-500"
                  >
                    {tDrawer("discography")}
                  </Link>
                  <Link href={`/summary`} className="hover:text-primary-500">
                    {tDrawer("activity")}
                  </Link>
                  <Link
                    href={`/anniversaries`}
                    className="hover:text-primary-500"
                  >
                    {tDrawer("anniversaries")}
                  </Link>
                  <Link href={`/statistics`} className="hover:text-primary-500">
                    {tDrawer("statistics")}
                  </Link>
                </nav>
                <LanguageSwitcher />
                <ThemeToggle className="hover:text-primary-500 dark:hover:text-white dark:hover:bg-primary-800" />
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col">
            <section className="flex min-h-[48dvh] flex-col items-center justify-center py-10 text-center sm:py-16">
              <p className="mb-3 text-xs font-semibold tracking-[0.35em] text-primary/70 dark:text-pink-200/70">
                {t("brand")}
              </p>
              <h1 className="max-w-4xl text-balance text-4xl font-black leading-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                {t("heroLine1")}
                <br />
                <span className="hidden md:inline">{t("heroLine2")}</span>
                <span className="inline md:hidden">{t("heroLine2_short")}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                {t("description")}
              </p>

              <div className="mt-8 w-full max-w-3xl rounded-4xl border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_rgba(190,24,93,0.16)] backdrop-blur dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-5">
                <SearchInput
                  allSongs={allSongs}
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  placeholder={tHeader("searchPlaceholder")}
                  className="[&_input]:h-12 [&_input]:text-base"
                />
                <div className="mt-4 flex items-center justify-center gap-3 flex-row">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="inline-flex min-w-40 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.01] hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    disabled={isPending}
                  >
                    {isPending ? (
                      t("searching")
                    ) : (
                      <>
                        <LuSearch className="mr-1 inline" />
                        {t("searchButton")}
                      </>
                    )}
                  </button>
                  <Tooltip
                    withArrow
                    arrowSize={8}
                    position="bottom"
                    transitionProps={{ transition: "fade", duration: 300 }}
                    label={
                      <>
                        <LuSparkles className="mr-1 inline" />
                        {t("surpriseTooltip")}
                      </>
                    }
                  >
                    <Link
                      href={`/watch`}
                      className="inline-flex min-w-40 items-center justify-center rounded-full border border-primary/20 bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5 dark:border-pink-200/20 dark:bg-transparent dark:text-pink-100 dark:hover:bg-pink-200/10"
                      aria-label={t("aria.randomPlay")}
                    >
                      <LuSparkles className="mr-1 inline" />
                      {t("surpriseMe")}
                    </Link>
                  </Tooltip>
                </div>
              </div>
            </section>

            <section className="pb-10">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                    {t("recommendedLabel")}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {t("recommendedTitle")}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {isLoading
                  ? Array.from({ length: RECOMMENDED_SKELETON_COUNT }).map(
                      (_, index) => (
                        <div
                          key={`recommended-skeleton-${index}`}
                          className="overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-0 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/50 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]"
                          aria-hidden="true"
                        >
                          <Skeleton height="100%" className="aspect-video" />
                          <div className="space-y-2 p-3">
                            <Skeleton height={16} radius="sm" />
                            <Skeleton height={12} width="70%" radius="sm" />
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <Skeleton height={10} width="28%" radius="sm" />
                              <Skeleton height={10} width="42%" radius="sm" />
                            </div>
                          </div>
                        </div>
                      ),
                    )
                  : recommendedSongs.map((song) => (
                      <Link
                        key={`${song.video_id}-${song.start}-${song.title}`}
                        href={buildWatchHref({
                          videoId: song.video_id,
                          start: song.start,
                        })}
                        className="group overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-[0_16px_45px_rgba(15,23,42,0.08)] hover-lift-animation hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(190,24,93,0.18)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)] dark:hover:border-pink-300/30"
                      >
                        <div className="relative aspect-video overflow-hidden bg-black">
                          <YoutubeThumbnail
                            videoId={song.video_id}
                            alt={song.title}
                            imageClassName="transition duration-500"
                          />
                        </div>
                        <div className="space-y-2 p-3">
                          <div className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                            {song.title}
                          </div>
                          <div className="line-clamp-1 text-xs text-gray-600 dark:text-gray-200">
                            {song.artist}
                          </div>
                          <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-400">
                            <span>{song.year}</span>
                            <span>{formatDate(song.broadcast_at, locale)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
              </div>

              {/* 更新情報セクション */}
              <div className="mt-16 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                    {t("recentUpdatesLabel")}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {t("recentUpdatesTitle")}
                  </h3>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={`update-skeleton-${i}`} height={60} />
                    ))}
                  </div>
                ) : recentUpdates.length > 0 ? (
                  <div className="space-y-4">
                    {recentUpdates.map((update) => {
                      return (
                        <Link
                          key={update.videoId}
                          href={buildWatchHref({ videoId: update.videoId })}
                          className="block rounded-lg border border-pink-200 bg-white p-4 hover-lift-animation transition hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(190,24,93,0.18)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)] dark:hover:border-pink-300/30"
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDate(update.date, locale)}{" "}
                            <span className="pl-3 text-gray-100">
                              {update.count}曲追加
                            </span>
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-black">
                              <YoutubeThumbnail
                                videoId={update.videoId}
                                alt={update.videoTitle}
                                imageClassName="object-cover"
                              />
                            </div>
                            <p className="min-w-0 text-xs opacity-70 line-clamp-2">
                              {update.videoTitle}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("noRecentUpdates")}
                  </p>
                )}
              </div>

              {/* リンク集 */}
              <div className="mt-24 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={siteConfig.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-64 items-center justify-center rounded-full bg-red-600 hover-lift-animation px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
                >
                  <FaYoutube className="mr-2" />
                  {siteConfig.channelName}
                </Link>
                <Link
                  href={siteConfig.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-64 items-center justify-center rounded-full bg-gray-900 hover-lift-animation px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  <FaXTwitter className="mr-2" />
                  {siteConfig.xName}
                </Link>
                <Link
                  href="https://hololive.hololivepro.com/talents/azki/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-64 items-center justify-center rounded-full bg-cyan-600 hover:bg-cyan-500 hover-lift-animation px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition dark:bg-cyan-600 dark:text-white dark:hover:bg-cyan-500"
                >
                  {t("hololiveOfficial")}
                </Link>
              </div>

              <p className="mt-4 text-center text-xs text-gray-500/80 dark:text-gray-100/80">
                {isLoading
                  ? t("statsLoading")
                  : t("stats", {
                      count: allSongs.length.toLocaleString(),
                      date: songsUpdatedLabel
                        ? t("lastUpdated", { date: songsUpdatedLabel })
                        : "",
                    })}
              </p>
            </section>
          </main>

          <Footer />
        </div>
        <DrawerMenu opened={drawerOpened} onClose={closeDrawer} />
        <AnalyticsWrapper />
      </div>
    </ThemeProvider>
  );
}

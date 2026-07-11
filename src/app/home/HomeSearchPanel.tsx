"use client";

import { Text, Tooltip } from "@mantine/core";
import { useTranslations } from "next-intl";
import { memo, useState, useTransition } from "react";
import { LuSearch, LuSparkles } from "react-icons/lu";
import { Link, useRouter } from "../../i18n/navigation";
import SearchInput from "../components/SearchInput";
import type { Song } from "../types/song";
import { HomeSongModeButtons } from "./HomeSongModeButtons";

type HomeSearchPanelProps = {
  songs: Song[];
};

const SURPRISE_TOOLTIP_TRANSITION = {
  transition: "fade",
  duration: 300,
} as const;

export const HomeSearchPanel = memo(function HomeSearchPanel({
  songs,
}: HomeSearchPanelProps) {
  const router = useRouter();
  const t = useTranslations("Home");
  const tHeader = useTranslations("Header");
  const [searchValue, setSearchValue] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = () => {
    const query = searchValue.join("|").trim();
    startTransition(() => {
      router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    });
  };

  return (
    <div className="mt-8 w-full max-w-3xl rounded-4xl border border-white/70 bg-white/60 p-4 shadow-[0_24px_80px_rgba(190,24,93,0.16)] backdrop-blur dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-5">
      <SearchInput
        allSongs={songs}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        placeholder={tHeader("searchPlaceholder")}
        className="[&_input]:h-12 [&_input]:text-base"
      />
      <div className="mt-4 flex flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleSearch}
          className="inline-flex min-w-40 cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.01] hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
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
          transitionProps={SURPRISE_TOOLTIP_TRANSITION}
          label={
            <>
              <LuSparkles className="mr-1 inline" />
              {t("surpriseTooltip")}
            </>
          }
        >
          <Link
            href="/watch"
            className="inline-flex min-w-40 items-center justify-center rounded-full border border-primary/20 bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5 dark:border-pink-200/20 dark:bg-transparent dark:text-pink-100 dark:hover:bg-pink-200/10"
            aria-label={t("aria.randomPlay")}
          >
            <LuSparkles className="mr-1 inline" />
            {t("surpriseMe")}
          </Link>
        </Tooltip>
      </div>

      <hr className="my-3 border-t border-gray-300 dark:border-gray-700" />

      <div className="flex items-left justify-center gap-3">
        <Text size="sm" c="dimmed">
          {t("songMode")}
        </Text>
      </div>
      <HomeSongModeButtons />
    </div>
  );
});

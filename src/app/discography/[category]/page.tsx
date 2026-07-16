import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import slugify from "../../lib/slugify";
import { Song } from "../../types/song";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import {
  isCollaborationSong,
  isCoverSong,
  isOverallSong,
  isPossibleOriginalSong,
} from "@/app/config/filters";
import { fetchSongsFromApiCached } from "@/app/lib/server/fetchSongs";
import CategoryClient from "./client";

type AlbumEntry = {
  album: string;
  slug: string;
};

type DiscographyCategory = "originals" | "collab" | "overall" | "covers";

function normalizeCategorySlug(value: string): DiscographyCategory | null {
  const lower = value.toLowerCase();

  const originals = new Set(["originals", "original", "ori"]);
  const collabs = new Set(["collab", "collabo", "collaboration", "unit"]);
  const overall = new Set(["overall"]);
  const covers = new Set(["covers", "cover"]);

  if (originals.has(lower) || lower.includes("original")) {
    return "originals";
  }

  if (
    collabs.has(lower) ||
    lower.includes("collab") ||
    lower.includes("unit")
  ) {
    return "collab";
  }

  if (covers.has(lower) || lower.includes("cover")) {
    return "covers";
  }

  if (overall.has(lower)) {
    return "overall";
  }

  return null;
}

function buildAlbumEntries(songs: Song[]): AlbumEntry[] {
  const albumNames = Array.from(
    new Set(
      songs
        .map((song) => song.album?.trim())
        .filter((album): album is string => Boolean(album)),
    ),
  ).sort((a, b) => a.localeCompare(b, "ja"));

  const slugCounts = new Map<string, number>();

  return albumNames.map((album) => {
    const baseSlug = slugify(album) || "album";
    const count = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, count + 1);

    return {
      album,
      slug: count === 0 ? baseSlug : `${baseSlug}-${count + 1}`,
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({
    namespace: "Metadata.discography",
    locale,
  });

  const resolved = await params;
  const possibleSlug = decodeURIComponent(resolved.category || "");
  const normalizedCategory = normalizeCategorySlug(possibleSlug);

  if (!normalizedCategory) {
    return {
      title: t("title", { siteName: siteConfig.siteName }),
      description: t("description"),
    };
  }

  const title = t(`category.${normalizedCategory}.title`, {
    siteName: siteConfig.siteName,
  });
  const description = t(`category.${normalizedCategory}.description`);
  const canonical = new URL(
    `/discography/${encodeURIComponent(normalizedCategory)}`,
    baseUrl,
  ).toString();

  const ogImage = new URL("/api/og", baseUrl);
  ogImage.searchParams.set("title", title);
  ogImage.searchParams.set("subtitle", description);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [
        {
          url: ogImage.toString(),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.toString()],
    },
  };
}

export default async function CategoryOrLegacyRedirect({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const locale = await getLocale();
  const resolved = await params;
  const possibleSlug = decodeURIComponent(resolved.category || "");
  const normalizedCategory = normalizeCategorySlug(possibleSlug);

  // path ベースのカテゴリ要求であれば Discography のクライアントをレンダリング
  if (normalizedCategory) {
    return <CategoryClient category={normalizedCategory} />;
  }
  const songs: Song[] = await fetchSongsFromApiCached({ locale });

  let filteredSongs = songs.filter(
    (s) =>
      isCollaborationSong(s) ||
      isCoverSong(s) ||
      isOverallSong(s) ||
      isPossibleOriginalSong(s),
  );

  const matchedAlbum = buildAlbumEntries(filteredSongs).find(
    (entry) => entry.slug === possibleSlug,
  );

  if (matchedAlbum) {
    redirect(`/discography/album/${encodeURIComponent(matchedAlbum.slug)}`);
  }

  // 旧URL の場合、category に slug(v1) が入っていることがあるため判定してリダイレクト
  const possibleSong = filteredSongs.find(
    (s) =>
      s.slug === possibleSlug ||
      s.slugv2 === possibleSlug ||
      (s.title && slugify(s.title) === possibleSlug) ||
      (s.album && slugify(s.album) === possibleSlug),
  );

  if (possibleSong) {
    const targetCategory = isPossibleOriginalSong(possibleSong)
      ? "originals"
      : isCollaborationSong(possibleSong)
        ? "collabo"
        : isOverallSong(possibleSong)
          ? "overall"
          : "covers";
    const targetSlug =
      possibleSong.slugv2 ||
      possibleSong.slug ||
      (possibleSong.title ? slugify(possibleSong.title) : "");
    if (!targetSlug) notFound();

    redirect(
      `/discography/${targetCategory}/${encodeURIComponent(targetSlug)}`,
    );
  }

  // 旧スラグでなければカテゴリ一覧ページ（404 相当）を表示
  notFound();
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOptionalServerSession } from "@/app/lib/authSession";
import { loadSharedPlaylist } from "@/app/lib/server/userLibrary";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { getLocale, getTranslations } from "next-intl/server";
import SharedPlaylistClient from "./client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale();
  const tMeta = await getTranslations({
    namespace: "Metadata.playlist",
    locale,
  });
  const { id } = await params;
  const session = await getOptionalServerSession();
  const result = await loadSharedPlaylist(id, session?.user?.id);
  if (!result)
    return {
      title: `${tMeta("title")} | ${siteConfig.siteName}`,
      robots: { index: false, follow: false },
    };
  const { playlist } = result;
  const url = new URL(`/playlist/shared/${playlist.id}`, baseUrl).toString();
  const index = playlist.visibility === "PUBLIC";
  const pageTitle = `${playlist.name} | ${siteConfig.siteName}`;
  const description = tMeta("sharedDescription", {
    count: playlist.songs.length,
  });
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", playlist.name);
  ogImageUrl.searchParams.set("subtitle", description);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    title: pageTitle,
    description,
    alternates: { canonical: url },
    robots: { index, follow: index },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImagePath],
    },
  };
}

export default async function SharedPlaylistPage({ params }: Props) {
  const session = await getOptionalServerSession();
  const result = await loadSharedPlaylist((await params).id, session?.user?.id);
  if (!result) notFound();
  return <SharedPlaylistClient playlist={result.playlist} />;
}

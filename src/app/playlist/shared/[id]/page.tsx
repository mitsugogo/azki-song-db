import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOptionalServerSession } from "@/app/lib/authSession";
import { loadSharedPlaylist } from "@/app/lib/server/userLibrary";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import SharedPlaylistClient from "./client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await getOptionalServerSession();
  const result = await loadSharedPlaylist((await params).id, session?.user?.id);
  if (!result)
    return {
      title: `Playlist | ${siteConfig.siteName}`,
      robots: { index: false },
    };
  const { playlist } = result;
  const url = new URL(`/playlist/shared/${playlist.id}`, baseUrl).toString();
  const index = playlist.visibility === "PUBLIC";
  return {
    title: `${playlist.name} | ${siteConfig.siteName}`,
    description: `${playlist.songs.length}曲のプレイリスト`,
    alternates: { canonical: url },
    robots: { index, follow: index },
    openGraph: {
      title: playlist.name,
      description: `${playlist.songs.length}曲のプレイリスト`,
      url,
      type: "website",
    },
  };
}

export default async function SharedPlaylistPage({ params }: Props) {
  const session = await getOptionalServerSession();
  const result = await loadSharedPlaylist((await params).id, session?.user?.id);
  if (!result) notFound();
  return <SharedPlaylistClient playlist={result.playlist} />;
}

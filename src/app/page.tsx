import type { Metadata, ResolvingMetadata } from "next";
import "./globals.css";
import ClientTop from "./client";
import { metadata } from "./layout";
import { Song } from "./types/song";

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { q, v, t } = await searchParams;

  let title = "AZKi Song Database";
  let subtitle = "AZKiさんの歌の素晴らしさを伝えるサイト";
  if (q) {
    subtitle = `「${q}」の検索結果`;
  }
  if (v && t) {
    const video_id = v;
    const start = t.toString().replace("s", "");
    const songs = await fetch(baseUrl + "/api/songs")
      .then((res) => res.json())
      .catch(() => []);
    const song: Song = songs.find(
      (s: Song) =>
        s.video_id === video_id && parseInt(s.start) === parseInt(start)
    );
    if (song) {
      title = `🎵 ${song.title} - ${song.artist}` || title;
      subtitle =
        `${song.video_title}\n(${new Date(song.broadcast_at).toLocaleDateString(
          "ja-JP"
        )}配信)` || subtitle;
    }
  }

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);
  ogImageUrl.searchParams.set("titlecolor", "b81e8a");
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

export default function Home() {
  return <ClientTop />;
}

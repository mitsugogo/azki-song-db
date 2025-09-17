import type { Metadata, ResolvingMetadata } from "next";
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
  let description = "AZKiさんの歌の素晴らしさを伝えるサイト";

  const og_title = "AZKi Song Database";
  let og_subtitle = "AZKiさんの歌の素晴らしさを伝えるサイト";

  let ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", og_title);
  ogImageUrl.searchParams.set("subtitle", og_subtitle);

  if (q) {
    const isSololive2025 = q === "sololive2025";
    if (isSololive2025) {
      title = "ソロライブ予習モード | AZKi Song Database";
      og_subtitle = "ソロライブに向けたオリ曲予習用プレイリスト";
    } else {
      og_subtitle = `「${q}」の検索結果`;
    }

    ogImageUrl.searchParams.set("title", og_subtitle);
    ogImageUrl.searchParams.set("subtitle", og_subtitle);
    ogImageUrl.searchParams.set("titlecolor", "b81e8a");
  }
  if (v && t) {
    ogImageUrl = new URL("/api/og/thumb", baseUrl);
    ogImageUrl.searchParams.set("v", v?.toString());
    ogImageUrl.searchParams.set("t", t?.toString());

    const songs = await fetch(new URL(`/api/songs/${v}/${t}`, baseUrl)).then(
      (res) => res.json()
    );
    const song = songs.find((s: Song) => s.video_id === v && s.start === t);
    if (song) {
      title = `🎵 ${song.title} - ${song.artist} | AZKi Song Database`;
      description = `${song.video_title}\n(配信日時:${new Date(
        song.broadcast_at
      ).toLocaleDateString("ja-JP")})`;
    }
  }

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    title: title,
    description: description,
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

export default function Home() {
  return <ClientTop />;
}

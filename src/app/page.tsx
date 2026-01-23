import type { Metadata } from "next";
import ClientTop from "./client";
import { metadata } from "./layout";
import { Song } from "./types/song";
import { Playlist } from "./hook/usePlaylists";

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q, v, t, playlist } = await searchParams;

  let title = "AZKi Song Database";
  let description = "AZKiさんの歌の素晴らしさを伝えるサイト";

  let og_title = "AZKi Song Database";
  let og_subtitle = "AZKiさんの歌の素晴らしさを伝えるサイト";

  let ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", og_title);
  ogImageUrl.searchParams.set("subtitle", og_subtitle);

  if (q) {
    const isOriginalSongsMode = q === "sololive2025" || q === "original-songs";
    const qStr = typeof q === "string" ? q : "";

    // プレフィックスとアイコンのマッピング
    const prefixMap: Record<string, { icon: string; label: string }> = {
      "unit:": { icon: "👥", label: "" },
      "artist:": { icon: "🎤", label: "" },
      "sing:": { icon: "🎤", label: "" },
      "tag:": { icon: "🏷️", label: "" },
      "title:": { icon: "🎵", label: "" },
      "milestone:": { icon: "⭐", label: "" },
      "year:": { icon: "📅", label: "" },
      "season:": { icon: "🌸", label: "" },
    };

    if (isOriginalSongsMode) {
      title = "オリジナル曲モード | AZKi Song Database";
      og_title = "オリジナル曲モード";
      og_subtitle = "AZKiさんのオリジナル楽曲を集めたプレイリスト";
    } else {
      // プレフィックスを検出
      let matched = false;
      for (const [prefix, { icon }] of Object.entries(prefixMap)) {
        if (qStr.startsWith(prefix)) {
          const displayTerm = qStr.replace(prefix, "");
          title = `${displayTerm}の検索結果 | AZKi Song Database`;
          og_title = `${icon} ${displayTerm}の検索結果`;
          og_subtitle = "AZKi Song Database";
          matched = true;
          break;
        }
      }

      if (!matched) {
        title = `「${q}」の検索結果 | AZKi Song Database`;
        og_title = `「${q}」の検索結果`;
        og_subtitle = "AZKi Song Database";
      }
    }

    ogImageUrl.searchParams.set("title", og_title);
    ogImageUrl.searchParams.set("subtitle", og_subtitle);
    ogImageUrl.searchParams.set("titlecolor", "b81e8a");
  }
  if (v && t) {
    ogImageUrl = new URL("/api/og/thumb", baseUrl);
    ogImageUrl.searchParams.set("v", v?.toString());
    ogImageUrl.searchParams.set("t", t?.toString());

    const songs = await fetch(new URL(`/api/songs/`, baseUrl)).then((res) =>
      res.json(),
    );
    const song = songs.find(
      (s: Song) =>
        s.video_id === v &&
        parseInt(s.start) == parseInt(t.toString().replace("s", "")),
    );
    if (song) {
      title = `🎵 ${song.title} - ${song.artist} | AZKi Song Database`;
      description = `${song.video_title} (配信日時:${new Date(
        song.broadcast_at,
      ).toLocaleDateString("ja-JP")})`;
    }
  }
  if (playlist) {
    const decodePlaylistUrlParam = (param: string) => {
      const binaryString = atob(param);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoder = new TextDecoder();
      const decoded = decoder.decode(bytes);
      const compressedJson = JSON.parse(decoded);

      const playlist: Playlist = {
        name: compressedJson.name,
        songs: compressedJson.songs.map((entry: { v: string; s: number }) => ({
          videoId: entry.v,
          start: entry.s,
        })),
        createdAt: compressedJson?.createdAt,
        updatedAt: compressedJson?.updatedAt,
        author: compressedJson?.author,
      };
      return playlist;
    };

    const decoded = decodePlaylistUrlParam(playlist as string);
    title = `プレイリスト「${decoded.name}」 | AZKi Song Database`;
    og_title = `📒 ${decoded.name}`;
    og_subtitle = `${decoded.songs.length}曲の楽曲をまとめたプレイリスト`;
    ogImageUrl.searchParams.set("title", og_title);
    ogImageUrl.searchParams.set("subtitle", og_subtitle);
    ogImageUrl.searchParams.set("titlecolor", "b81e8a");
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

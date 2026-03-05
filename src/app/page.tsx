import type { Metadata } from "next";
import ClientTop from "./client";
import { metadata } from "./layout";
import { Song } from "./types/song";
import { Playlist } from "./hook/usePlaylists";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q, v, t, playlist } = await searchParams;

  let title = `${siteConfig.siteName}`;
  let description = "AZKiさんの歌の素晴らしさを伝えるサイト";

  let og_title = `${siteConfig.siteName}`;
  let og_subtitle = "AZKiさんの歌の素晴らしさを伝えるサイト";

  let ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", og_title);
  ogImageUrl.searchParams.set("subtitle", og_subtitle);

  if (q) {
    const isOriginalSongsMode = q === "sololive2025" || q === "original-songs";
    const isCoverSongsMode = q === "cover-songs";
    const isCollaborationSongsMode = q === "collaboration-songs";
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
      title = `オリジナル曲モード | ${siteConfig.siteName}`;
      og_title = "オリジナル曲モード";
      og_subtitle = "AZKiさんのオリジナル楽曲を集めたプレイリスト";
    } else if (isCoverSongsMode) {
      title = `カバー曲モード | ${siteConfig.siteName}`;
      og_title = "カバー曲モード";
      og_subtitle = "AZKiさんのカバー楽曲を集めたプレイリスト";
    } else if (isCollaborationSongsMode) {
      title = `コラボ曲モード | ${siteConfig.siteName}`;
      og_title = "コラボ曲モード";
      og_subtitle = "AZKiさんのコラボ楽曲を集めたプレイリスト";
    } else {
      // プレフィックスを検出
      let matched = false;
      for (const [prefix, { icon }] of Object.entries(prefixMap)) {
        if (qStr.startsWith(prefix)) {
          const displayTerm = qStr.replace(prefix, "");
          title = `${displayTerm}の検索結果 | ${siteConfig.siteName}`;
          og_title = `${icon} ${displayTerm}の検索結果`;
          og_subtitle = `${siteConfig.siteName}`;
          matched = true;
          break;
        }
      }

      if (!matched) {
        title = `「${q}」の検索結果 | ${siteConfig.siteName}`;
        og_title = `「${q}」の検索結果`;
        og_subtitle = `${siteConfig.siteName}`;
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

    const songs = await fetch(new URL(`/api/songs`, baseUrl)).then((res) =>
      res.json(),
    );
    const song = songs.find(
      (s: Song) =>
        s.video_id === v &&
        parseInt(s.start) == parseInt(t.toString().replace("s", "")),
    );
    if (song) {
      title = `${song.title} - ${song.artist} | ${siteConfig.siteName}`;
      description = `${song.video_title} (配信日時:${new Date(
        song.broadcast_at,
      ).toLocaleDateString("ja-JP")})`;

      og_title = title;
      og_subtitle = `${song.video_title} (配信日時:${new Date(
        song.broadcast_at,
      ).toLocaleDateString("ja-JP")})`;
    }
  } else if (v) {
    // video_idのみのパターン
    const songs = await fetch(new URL(`/api/songs/`, baseUrl)).then((res) =>
      res.json(),
    );
    const filteredSongs = songs.filter((s: Song) => s.video_id === v);
    if (filteredSongs) {
      const song = filteredSongs[0];
      if (filteredSongs.length === 1) {
        // video_idが一意に特定できる場合は動画タイトルをOGPタイトルにする
        title = `${song.video_title} | ${siteConfig.siteName}`;
        ogImageUrl = new URL("/api/og/thumb", baseUrl);
        ogImageUrl.searchParams.set("v", v?.toString());
        ogImageUrl.searchParams.set("t", song.start.toString());
        og_title = title;
      } else {
        title = `${song.video_title} | ${siteConfig.siteName}`;
        og_title = title;
        ogImageUrl.searchParams.set("title", og_title);
        ogImageUrl.searchParams.set("subtitle", og_subtitle);
      }
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
    title = `プレイリスト「${decoded.name}」 | ${siteConfig.siteName}`;
    og_title = `📒 ${decoded.name}`;
    og_subtitle = `${decoded.songs.length}曲の楽曲をまとめたプレイリスト`;
    ogImageUrl.searchParams.set("title", og_title);
    ogImageUrl.searchParams.set("subtitle", og_subtitle);
    ogImageUrl.searchParams.set("titlecolor", "b81e8a");
  }

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  // build canonical URL including relevant search params
  const canonical = new URL(baseUrl);
  if (typeof q === "string") canonical.searchParams.set("q", q);
  if (typeof v === "string") canonical.searchParams.set("v", v);
  if (typeof t === "string") canonical.searchParams.set("t", t);
  if (typeof playlist === "string")
    canonical.searchParams.set("playlist", playlist);

  return {
    ...metadata,
    title: title,
    description: description,
    keywords: [
      "AZKi",
      "歌",
      "まとめ",
      "楽曲",
      "Discography",
      "オリジナル曲",
      "コラボ曲",
      "カバー曲",
      "オリ曲",
      "歌枠",
      "ライブ",
      "セトリ",
      "ホロライブ",
    ],
    openGraph: {
      ...metadata.openGraph,
      title: og_title,
      description: og_subtitle,
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: og_title,
        },
      ],
    },
    alternates: {
      canonical: canonical.toString(),
    },
  };
}

export default function Home() {
  return <ClientTop />;
}

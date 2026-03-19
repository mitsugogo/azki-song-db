import type { Metadata } from "next";
import WatchPageClient from "./client";
import { metadata } from "../layout";
import { Song } from "../types/song";
import { Playlist } from "../hook/usePlaylists";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { WATCH_PATH, normalizeWatchTimeParam } from "@/app/lib/watchUrl";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const getParamValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const q = getParamValue(params.q);
  const v = getParamValue(params.v) ?? getParamValue(params.videoId);
  const t = normalizeWatchTimeParam(getParamValue(params.t));
  const playlist = getParamValue(params.playlist);

  let title = `${siteConfig.siteName}`;
  let description = "AZKiさんの歌の素晴らしさを伝えるサイト";

  let ogTitle = `${siteConfig.siteName}`;
  let ogSubtitle = "AZKiさんの歌の素晴らしさを伝えるサイト";

  let ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", ogTitle);
  ogImageUrl.searchParams.set("subtitle", ogSubtitle);

  if (q) {
    const isOriginalSongsMode = q === "sololive2025" || q === "original-songs";
    const isCoverSongsMode = q === "cover-songs";
    const isCollaborationSongsMode = q === "collaboration-songs";

    const prefixMap: Record<string, { icon: string }> = {
      "unit:": { icon: "👥" },
      "artist:": { icon: "🎤" },
      "sing:": { icon: "🎤" },
      "tag:": { icon: "🏷️" },
      "title:": { icon: "🎵" },
      "milestone:": { icon: "⭐" },
      "year:": { icon: "📅" },
      "season:": { icon: "🌸" },
    };

    if (isOriginalSongsMode) {
      title = `オリジナル曲モード | ${siteConfig.siteName}`;
      ogTitle = "オリジナル曲モード";
      ogSubtitle = "AZKiさんのオリジナル楽曲を集めたプレイリスト";
    } else if (isCoverSongsMode) {
      title = `カバー曲モード | ${siteConfig.siteName}`;
      ogTitle = "カバー曲モード";
      ogSubtitle = "AZKiさんのカバー楽曲を集めたプレイリスト";
    } else if (isCollaborationSongsMode) {
      title = `コラボ曲モード | ${siteConfig.siteName}`;
      ogTitle = "コラボ曲モード";
      ogSubtitle = "AZKiさんのコラボ楽曲を集めたプレイリスト";
    } else {
      let matched = false;
      for (const [prefix, { icon }] of Object.entries(prefixMap)) {
        if (q.startsWith(prefix)) {
          const displayTerm = q.replace(prefix, "");
          title = `${displayTerm}の検索結果 | ${siteConfig.siteName}`;
          ogTitle = `${icon} ${displayTerm}の検索結果`;
          ogSubtitle = `${siteConfig.siteName}`;
          matched = true;
          break;
        }
      }

      if (!matched) {
        title = `「${q}」の検索結果 | ${siteConfig.siteName}`;
        ogTitle = `「${q}」の検索結果`;
        ogSubtitle = `${siteConfig.siteName}`;
      }
    }

    ogImageUrl.searchParams.set("title", ogTitle);
    ogImageUrl.searchParams.set("subtitle", ogSubtitle);
    ogImageUrl.searchParams.set("titlecolor", "b81e8a");
  }

  if (v && t) {
    ogImageUrl = new URL("/api/og/thumb", baseUrl);
    ogImageUrl.searchParams.set("v", v);
    ogImageUrl.searchParams.set("t", t);

    const songs = await fetch(new URL("/api/songs", baseUrl)).then((res) =>
      res.json(),
    );
    const song = songs.find(
      (s: Song) => s.video_id === v && parseInt(s.start) === parseInt(t, 10),
    );

    if (song) {
      title = `${song.title} - ${song.artist} | ${siteConfig.siteName}`;
      description = `${song.video_title} (配信日時:${new Date(
        song.broadcast_at,
      ).toLocaleDateString("ja-JP")})`;
      ogTitle = title;
      ogSubtitle = `${song.video_title} (配信日時:${new Date(
        song.broadcast_at,
      ).toLocaleDateString("ja-JP")})`;
    }
  } else if (v) {
    const songs = await fetch(new URL("/api/songs/", baseUrl)).then((res) =>
      res.json(),
    );
    const filteredSongs = songs.filter((s: Song) => s.video_id === v);
    if (filteredSongs.length > 0) {
      const song = filteredSongs[0];
      if (filteredSongs.length === 1) {
        title = `${song.video_title} | ${siteConfig.siteName}`;
        ogImageUrl = new URL("/api/og/thumb", baseUrl);
        ogImageUrl.searchParams.set("v", v);
        ogImageUrl.searchParams.set(
          "t",
          normalizeWatchTimeParam(song.start) ?? "",
        );
        ogTitle = title;
      } else {
        title = `${song.video_title} | ${siteConfig.siteName}`;
        ogTitle = title;
        ogImageUrl = new URL("/api/og/videothumb", baseUrl);
        ogImageUrl.searchParams.set("v", v);
      }
    }
  }

  if (playlist) {
    const decodePlaylistUrlParam = (param: string) => {
      const binaryString = atob(param);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let index = 0; index < len; index += 1) {
        bytes[index] = binaryString.charCodeAt(index);
      }
      const decoder = new TextDecoder();
      const decoded = decoder.decode(bytes);
      const compressedJson = JSON.parse(decoded);

      const parsedPlaylist: Playlist = {
        name: compressedJson.name,
        songs: compressedJson.songs.map((entry: { v: string; s: number }) => ({
          videoId: entry.v,
          start: entry.s,
        })),
        createdAt: compressedJson?.createdAt,
        updatedAt: compressedJson?.updatedAt,
        author: compressedJson?.author,
      };
      return parsedPlaylist;
    };

    const decoded = decodePlaylistUrlParam(playlist);
    title = `プレイリスト「${decoded.name}」 | ${siteConfig.siteName}`;
    ogTitle = `📒 ${decoded.name}`;
    ogSubtitle = `${decoded.songs.length}曲の楽曲をまとめたプレイリスト`;
    ogImageUrl.searchParams.set("title", ogTitle);
    ogImageUrl.searchParams.set("subtitle", ogSubtitle);
    ogImageUrl.searchParams.set("titlecolor", "b81e8a");
  }

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  const canonical = new URL(WATCH_PATH, baseUrl);
  if (q) canonical.searchParams.set("q", q);
  if (v) canonical.searchParams.set("v", v);
  if (t) canonical.searchParams.set("t", t);
  if (playlist) canonical.searchParams.set("playlist", playlist);

  return {
    ...metadata,
    title,
    description,
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
      title: ogTitle,
      description: ogSubtitle,
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    alternates: {
      canonical: canonical.toString(),
    },
  };
}

export default function WatchPage() {
  return <WatchPageClient />;
}

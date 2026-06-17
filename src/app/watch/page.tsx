import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import WatchPageClient from "./client";
import { metadata } from "../layout";
import { Song } from "../types/song";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { WATCH_PATH, normalizeWatchTimeParam } from "@/app/lib/watchUrl";
import { formatDate } from "@/app/lib/formatDate";
import { fetchSongsFromApiCached } from "@/app/lib/server/fetchSongs";
import {
  encodePlaylistOgPayload,
  tryDecodePlaylistUrlParam,
} from "@/app/lib/playlistUrl";

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
  const locale = await getLocale();
  const requestHeaders = await headers();
  const tMeta = await getTranslations({ namespace: "Metadata.watch", locale });
  const params = await searchParams;
  const q = getParamValue(params.q);
  const v = getParamValue(params.v) ?? getParamValue(params.videoId);
  const t = normalizeWatchTimeParam(getParamValue(params.t));
  const tSeconds = t ? Number(String(t).replace(/s$/i, "")) : null;
  const playlist = getParamValue(params.playlist);

  let title = `${siteConfig.siteName}`;
  let description = tMeta("description");

  let ogTitle = `${siteConfig.siteName}`;
  let ogSubtitle = tMeta("ogSubtitle", { siteName: siteConfig.siteName });

  let ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", ogTitle);
  ogImageUrl.searchParams.set("subtitle", ogSubtitle);
  let ogImageWidth = 1200;
  let ogImageHeight = 630;
  let twitterCard: "summary" | "summary_large_image" = "summary_large_image";

  const fetchSongs = async () => {
    const cookie = requestHeaders.get("cookie") ?? "";

    return fetchSongsFromApiCached({
      locale,
      includeMembersOnly: Boolean(cookie),
      cookie,
    });
  };

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
      title = tMeta("mode.original.title", { siteName: siteConfig.siteName });
      ogTitle = tMeta("mode.original.ogTitle");
      ogSubtitle = tMeta("mode.original.ogSubtitle");
    } else if (isCoverSongsMode) {
      title = tMeta("mode.cover.title", { siteName: siteConfig.siteName });
      ogTitle = tMeta("mode.cover.ogTitle");
      ogSubtitle = tMeta("mode.cover.ogSubtitle");
    } else if (isCollaborationSongsMode) {
      title = tMeta("mode.collab.title", { siteName: siteConfig.siteName });
      ogTitle = tMeta("mode.collab.ogTitle");
      ogSubtitle = tMeta("mode.collab.ogSubtitle");
    } else {
      let matched = false;
      for (const [prefix, { icon }] of Object.entries(prefixMap)) {
        if (q.startsWith(prefix)) {
          const displayTerm = q.replace(prefix, "");
          title = tMeta("search.prefixTitle", {
            term: displayTerm,
            siteName: siteConfig.siteName,
          });
          ogTitle = tMeta("search.prefixOgTitle", { icon, term: displayTerm });
          ogSubtitle = `${siteConfig.siteName}`;
          matched = true;
          break;
        }
      }

      if (!matched) {
        title = tMeta("search.queryTitle", {
          q,
          siteName: siteConfig.siteName,
        });
        ogTitle = tMeta("search.queryOgTitle", { q });
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
    ogImageUrl.searchParams.set("hl", locale);

    const songs = await fetchSongs();
    const song = songs.find(
      (s: Song) =>
        s.video_id === v &&
        (tSeconds === null
          ? Number(s.start) === Number(t)
          : Number(s.start) === tSeconds),
    );

    if (song) {
      title = `${song.title} - ${song.artist} | ${siteConfig.siteName}`;
      const localizedDate = formatDate(song.broadcast_at, locale);
      description = tMeta("song.description", {
        videoTitle: song.video_title,
        date: localizedDate,
      });
      ogTitle = title;
      ogSubtitle = tMeta("song.ogSubtitle", {
        date: localizedDate,
        title: song.title,
        artist: song.artist,
        videoTitle: song.video_title,
      });
    }
  } else if (v) {
    const songs = await fetchSongs();
    const filteredSongs = songs.filter((s: Song) => s.video_id === v);
    if (filteredSongs.length > 0) {
      const song = filteredSongs[0];
      if (filteredSongs.length === 1) {
        title = `${song.title} - ${song.artist} | ${siteConfig.siteName}`;
        ogImageUrl = new URL("/api/og/thumb", baseUrl);
        ogImageUrl.searchParams.set("v", v);
        ogImageUrl.searchParams.set(
          "t",
          normalizeWatchTimeParam(song.start) ?? "",
        );
        ogImageUrl.searchParams.set("hl", locale);
        ogTitle = title;
        description = tMeta("song.description", {
          videoTitle: song.video_title,
          date: formatDate(song.broadcast_at, locale),
        });
        ogSubtitle = tMeta("song.ogSubtitle", {
          date: formatDate(song.broadcast_at, locale),
          title: song.title,
          artist: song.artist,
          videoTitle: song.video_title,
        });
      } else {
        title = `${song.video_title} | ${siteConfig.siteName}`;
        ogTitle = title;
        ogSubtitle = tMeta("song.ogSubtitle", {
          date: formatDate(song.broadcast_at, locale),
          title: song.title,
          artist: song.artist,
          videoTitle: song.video_title,
        });
        ogImageUrl = new URL("/api/og/videothumb", baseUrl);
        ogImageUrl.searchParams.set("v", v);
        ogImageUrl.searchParams.set("hl", locale);
        description = song.video_title;
      }
    }
  }

  if (playlist) {
    const decoded = tryDecodePlaylistUrlParam(playlist);
    if (decoded) {
      title = tMeta("playlist.title", {
        name: decoded.name,
        siteName: siteConfig.siteName,
      });
      ogTitle = tMeta("playlist.ogTitle", { name: decoded.name });
      ogSubtitle = tMeta("playlist.ogSubtitle", {
        count: decoded.songs.length,
      });
      ogImageUrl = new URL("/api/og/playlist", baseUrl);
      ogImageUrl.searchParams.set("p", encodePlaylistOgPayload(decoded));
      ogImageUrl.searchParams.set("hl", locale);
      ogImageWidth = 400;
      ogImageHeight = 400;
      twitterCard = "summary";
    }
  }

  ogImageUrl.searchParams.set("w", String(ogImageWidth));
  ogImageUrl.searchParams.set("h", String(ogImageHeight));

  const canonical = new URL(WATCH_PATH, baseUrl);
  if (q) canonical.searchParams.set("q", q);
  if (v) canonical.searchParams.set("v", v);
  if (t) canonical.searchParams.set("t", t);
  if (playlist) canonical.searchParams.set("playlist", playlist);

  return {
    ...metadata,
    title,
    description,
    keywords: (tMeta("keywords") || "AZKi").split(",").map((s) => s.trim()),
    openGraph: {
      ...metadata.openGraph,
      title: ogTitle,
      description: ogSubtitle,
      url: canonical.toString(),
      siteName: siteConfig.siteName,
      locale: "ja_JP",
      type: "website",
      images: [
        {
          url: `${ogImageUrl.pathname}${ogImageUrl.search}`,
          width: ogImageWidth,
          height: ogImageHeight,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: twitterCard,
      title: ogTitle,
      description: ogSubtitle,
      images: [`${ogImageUrl.pathname}${ogImageUrl.search}`],
    },
    alternates: {
      canonical: canonical.toString(),
    },
  };
}

export default function WatchPage() {
  return <WatchPageClient />;
}

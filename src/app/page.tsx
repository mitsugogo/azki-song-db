import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ClientTop from "./client";
import { metadata } from "./layout";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import {
  SEARCH_PATH,
  buildWatchHref,
  normalizeWatchTimeParam,
} from "@/app/lib/watchUrl";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const getParamValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...metadata,
    title: siteConfig.siteName,
    description:
      "ホロライブのAZKiさんの歌を楽しむためのデータベース。歌枠やオリ曲、ライブ等で歌唱した楽曲やセトリをまとめています。",
    alternates: {
      canonical: new URL("/", baseUrl).toString(),
    },
  };
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const q = getParamValue(params.q);
  const playlist = getParamValue(params.playlist);
  const videoId = getParamValue(params.v) ?? getParamValue(params.videoId);
  const normalizedTime = normalizeWatchTimeParam(getParamValue(params.t));

  if (videoId || playlist) {
    redirect(
      buildWatchHref({
        videoId,
        start: normalizedTime,
        searchTerm: q,
        playlist,
      }),
    );
  }

  if (q) {
    redirect(`${SEARCH_PATH}?q=${encodeURIComponent(q)}`);
  }

  return <ClientTop />;
}

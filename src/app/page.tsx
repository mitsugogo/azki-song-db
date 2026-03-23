import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
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
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Metadata.home", locale });

  const description = t("description");
  const ogSubtitle = t("ogSubtitle");
  const ogAlt = t("ogAlt", { siteName: siteConfig.siteName });

  const ogImagePath = `/api/og?title=${encodeURIComponent(siteConfig.siteName)}&subtitle=${encodeURIComponent(ogSubtitle)}&w=1200&h=630`;
  const canonical = new URL("/", baseUrl).toString();

  return {
    ...metadata,
    title: siteConfig.siteName,
    description,
    openGraph: {
      ...metadata.openGraph,
      title: siteConfig.siteName,
      description,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.siteName,
      description,
      images: [ogImagePath],
    },
    alternates: {
      canonical,
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

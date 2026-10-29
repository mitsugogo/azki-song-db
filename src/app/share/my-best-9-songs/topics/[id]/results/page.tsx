import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import Client from "./client";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ preview?: string | string[] }>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: "Share.myBest9.topics",
  });
  const title = `${t("results")} | ${siteConfig.siteName}`;
  const description = t("resultsDescription");
  const image = new URL("/api/og", baseUrl);
  image.search = new URLSearchParams({
    title: t("results"),
    subtitle: description,
    w: "1200",
    h: "630",
  }).toString();
  const url = new URL(
    getPathname({
      locale,
      href: `/share/my-best-9-songs/topics/${id}/results`,
    }),
    baseUrl,
  ).toString();
  const imagePath = `${image.pathname}${image.search}`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.siteName,
      type: "website",
      locale: locale === "ja" ? "ja_JP" : "en_US",
      images: [{ url: imagePath, width: 1200, height: 630, alt: t("results") }],
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [imagePath],
    },
  };
}
export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  // 実回答の取得や更新をせず、開発環境だけで公開のお題と曲から表示を再現する。
  if (
    process.env.NODE_ENV === "development" &&
    (await searchParams)?.preview === "1000"
  ) {
    const [
      { loadBestNineTopic },
      { fetchSongsFromApiCached },
      { createBestNineResultsPreview },
    ] = await Promise.all([
      import("@/app/lib/server/bestNineTopics"),
      import("@/app/lib/server/fetchSongs"),
      import("@/app/lib/bestNineResultsPreview"),
    ]);
    const [topic, songs] = await Promise.all([
      loadBestNineTopic(id),
      fetchSongsFromApiCached({
        locale: await getLocale(),
        baseUrlOverride: `http://127.0.0.1:${process.env.PORT ?? 3000}`,
      }),
    ]);
    return (
      <Client
        id={id}
        previewData={createBestNineResultsPreview(topic, songs)}
      />
    );
  }
  return <Client id={id} />;
}

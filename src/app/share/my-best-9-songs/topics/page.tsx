import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import Client from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: "Share.myBest9.topics",
  });
  const title = `${t("manage")} | ${siteConfig.siteName}`;
  const description = t("manageDescription");
  const url = new URL(
    getPathname({ locale, href: "/share/my-best-9-songs/topics" }),
    baseUrl,
  ).toString();
  const image = new URL("/api/og", baseUrl);
  image.search = new URLSearchParams({
    title: t("manage"),
    subtitle: description,
    w: "1200",
    h: "630",
  }).toString();
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
      images: [{ url: imagePath, width: 1200, height: 630, alt: t("manage") }],
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [imagePath],
    },
  };
}

export default function Page() {
  return <Client />;
}

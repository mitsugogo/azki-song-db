import type { Metadata } from "next";
import { metadata as rootMetadata } from "../layout";
import { baseUrl, siteConfig } from "../config/siteConfig";

export const buildArchivePageMetadata = ({
  title,
  subtitle,
  pathname,
  locale,
}: {
  title: string;
  subtitle: string;
  pathname: string;
  locale: string;
}): Metadata => {
  const pageTitle = `${title} | ${siteConfig.siteName}`;
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;
  const canonical = new URL(pathname, baseUrl).toString();

  return {
    ...rootMetadata,
    title: pageTitle,
    description: subtitle,
    openGraph: {
      ...rootMetadata.openGraph,
      title: pageTitle,
      description: subtitle,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [{ url: ogImagePath, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: subtitle,
      images: [ogImagePath],
    },
    alternates: { canonical },
  };
};

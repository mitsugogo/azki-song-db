import type { Metadata } from "next";
import { metadata as rootMetadata } from "../layout";
import { baseUrl, siteConfig } from "../config/siteConfig";

function buildUnitsMetadata({
  title,
  description,
  pathname,
  locale,
}: {
  title: string;
  description: string;
  pathname: string;
  locale: string;
}): Metadata {
  const pageTitle = `${title} | ${siteConfig.siteName}`;
  const canonical = new URL(pathname, baseUrl).toString();
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", description);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    ...rootMetadata,
    title: pageTitle,
    description,
    openGraph: {
      ...rootMetadata.openGraph,
      title: pageTitle,
      description,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale.startsWith("ja") ? "ja_JP" : "en_US",
      type: "website",
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: `${title} - ${description}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImagePath],
    },
    alternates: { canonical },
  };
}

export function buildUnitsIndexMetadata({
  title,
  description,
  locale,
}: {
  title: string;
  description: string;
  locale: string;
}) {
  return buildUnitsMetadata({
    title,
    description,
    pathname: "/units",
    locale,
  });
}

export function buildUnitPageMetadata({
  title,
  description,
  slug,
  locale,
}: {
  title: string;
  description: string;
  slug: string;
  locale: string;
}): Metadata {
  return buildUnitsMetadata({
    title,
    description,
    pathname: `/units/${slug}`,
    locale,
  });
}

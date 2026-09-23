import type { Metadata } from "next";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";

export const buildLivePageMetadata = ({
  title,
  description,
  pathname,
  locale,
}: {
  title: string;
  description: string;
  pathname: string;
  locale: string;
}): Metadata => {
  const pageTitle = `${title} | ${siteConfig.siteName}`;
  const canonical = new URL(pathname, baseUrl).toString();
  const imageUrl = new URL("/api/og", baseUrl);
  imageUrl.searchParams.set("title", title);
  imageUrl.searchParams.set("subtitle", description);
  imageUrl.searchParams.set("w", "1200");
  imageUrl.searchParams.set("h", "630");
  const imagePath = `${imageUrl.pathname}${imageUrl.search}`;

  return {
    title: pageTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: pageTitle,
      description,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [{ url: imagePath, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [imagePath],
    },
  };
};

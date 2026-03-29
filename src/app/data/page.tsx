import { Suspense } from "react";
import { Breadcrumbs } from "@mantine/core";
import ClientTable from "./client";
import Loading from "../loading";
import { Link } from "@/i18n/navigation";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses } from "../theme";

import { siteConfig, baseUrl } from "@/app/config/siteConfig";

import type { Metadata } from "next";
import { metadata } from "../layout";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tMeta = await getTranslations({ namespace: "Metadata.data", locale });
  const messages = (await import(`../../messages/${locale}.json`)).default;

  const title = messages.Data?.title ?? "List of Recorded Data";
  const subtitle = tMeta("description");

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const canonical = new URL("/data", baseUrl).toString();
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    ...metadata,
    title: `${title} | ${siteConfig.siteName}`,
    description: subtitle,
    openGraph: {
      ...metadata.openGraph,
      title,
      description: subtitle,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [{ url: ogImagePath, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: subtitle,
      images: [ogImagePath],
    },
    alternates: {
      canonical,
    },
  };
}

export default async function DataPage() {
  const locale = await getLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <div className="grow lg:p-6 lg:pb-0">
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" />{" "}
          {messages.Data?.homeLabel ?? "Home"}
        </Link>
        <Link href="/data" className={breadcrumbClasses.link}>
          {messages.Data?.breadcrumb ?? "Recorded Data"}
        </Link>
      </Breadcrumbs>

      <Suspense fallback={<Loading />}>
        <ClientTable />
      </Suspense>
    </div>
  );
}

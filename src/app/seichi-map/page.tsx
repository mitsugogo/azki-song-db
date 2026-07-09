import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import { getOptionalServerSession } from "@/app/lib/authSession";
import { metadata } from "../layout";
import SeichiMapCompleteClient from "./client";

export const dynamic = "force-dynamic";

type SeichiMapPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const getFirstSearchParam = (
  params:
    Record<string, string | string[] | undefined> | URLSearchParams | undefined,
  key: string,
) => {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }

  if (typeof (params as { get?: unknown } | undefined)?.get === "function") {
    const value = (
      params as unknown as {
        get: (name: string) => string | null;
      }
    ).get(key);
    return value ?? undefined;
  }

  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tMeta = await getTranslations({
    namespace: "Metadata.seichiMapComplete",
    locale,
  });
  const title = tMeta("title");
  const description = tMeta("description");
  const canonical = new URL("/seichi-map", baseUrl).toString();
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", description);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    ...metadata,
    title: `${title} | ${siteConfig.siteName}`,
    description,
    openGraph: {
      ...metadata.openGraph,
      title: `${title} | ${siteConfig.siteName}`,
      description,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [{ url: ogImagePath, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.siteName}`,
      description,
      images: [ogImagePath],
    },
    alternates: {
      canonical,
    },
  };
}

export default async function SeichiMapCompletePage({
  searchParams,
}: SeichiMapPageProps) {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "SeichiMapComplete", locale });
  const session = await getOptionalServerSession();
  const resolvedSearchParams = await searchParams;

  return (
    <SeichiMapCompleteClient
      initialShareId={getFirstSearchParam(resolvedSearchParams, "share")}
      isSignedIn={Boolean(session?.user?.id)}
      userName={session?.user?.name || session?.user?.email || t("userName")}
    />
  );
}

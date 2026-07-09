import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import { getOptionalServerSession } from "@/app/lib/authSession";
import {
  getSeichiMapShareByShareId,
  validateSeichiMapShareId,
} from "@/app/lib/seichiMapShareSheet";
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

export async function generateMetadata(
  props: SeichiMapPageProps,
): Promise<Metadata> {
  const locale = await getLocale();
  const tMeta = await getTranslations({
    namespace: "Metadata.seichiMapComplete",
    locale,
  });
  const title = tMeta("title");
  const baseDescription = tMeta("description");

  // shareIdがある場合はニックネームを取得して、OG画像を変更
  let ogSubtitle = baseDescription;
  const resolvedSearchParams = await props.searchParams;
  const shareIdParam = getFirstSearchParam(resolvedSearchParams, "share");
  if (shareIdParam) {
    const shareId = validateSeichiMapShareId(
      typeof shareIdParam === "string"
        ? shareIdParam
        : (shareIdParam as string[])[0],
    );
    if (shareId) {
      const sharedData = await getSeichiMapShareByShareId(shareId);
      console.log("sharedData", sharedData, shareId);
      if (sharedData?.shareId === shareId) {
        const tMetaShared = await getTranslations({
          namespace: "Metadata.seichiMapCompleteShared",
          locale,
        });
        const templateText = tMetaShared("descriptionTemplate", {
          nickname: sharedData.nickname,
        });
        ogSubtitle = templateText;
      }
    }
  }

  const canonical = new URL("/seichi-map", baseUrl).toString();
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", ogSubtitle);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    ...metadata,
    title: `${title} | ${siteConfig.siteName}`,
    description: baseDescription,
    openGraph: {
      ...metadata.openGraph,
      title: `${title} | ${siteConfig.siteName}`,
      description: baseDescription,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [{ url: ogImagePath, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.siteName}`,
      description: baseDescription,
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

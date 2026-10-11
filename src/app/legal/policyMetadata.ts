import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import type { AppLocale } from "@/i18n/routing";

export type PolicyDocument = "terms" | "privacy";

export async function generatePolicyMetadata(
  document: PolicyDocument,
): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations({
    locale,
    namespace: document === "terms" ? "Terms" : "Privacy",
  });
  const title = t("title");
  const description = t("description");
  const pageTitle = `${title} | ${siteConfig.siteName}`;
  const pathname = getPathname({ locale, href: `/${document}` });
  const canonical = new URL(pathname, baseUrl).toString();
  const ogUrl = new URL("/api/og", baseUrl);
  ogUrl.search = new URLSearchParams({
    title,
    subtitle: description,
    w: "1200",
    h: "630",
  }).toString();
  const image = `${ogUrl.pathname}${ogUrl.search}`;

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
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [image],
    },
  };
}

import type { Metadata } from "next";
import { siteConfig } from "@/app/config/siteConfig";
import ShareIndexClient from "./client";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Share", locale });

  return {
    title: `${t("index.title")} | ${siteConfig.siteName}`,
    description: t("index.description"),
  };
}

export default function ShareIndexPage() {
  return <ShareIndexClient />;
}

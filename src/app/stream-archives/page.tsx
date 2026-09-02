import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import ArchiveStatsClient from "./ArchiveStatsClient";
import { buildArchivePageMetadata } from "./archivePageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tMeta = await getTranslations({
    namespace: "Metadata.archives",
    locale,
  });
  const title = tMeta("title");
  const subtitle = tMeta("description");
  return buildArchivePageMetadata({
    title,
    subtitle,
    pathname: "/stream-archives",
    locale,
  });
}

export default function ArchivesPage() {
  return <ArchiveStatsClient />;
}

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import ArchivesPageClient from "../client";
import { buildArchivePageMetadata } from "../archivePageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tMeta = await getTranslations({
    namespace: "Metadata.archiveList",
    locale,
  });

  return buildArchivePageMetadata({
    title: tMeta("title"),
    subtitle: tMeta("description"),
    pathname: "/stream-archives/list",
    locale,
  });
}

export default function ArchiveListPage() {
  return <ArchivesPageClient />;
}

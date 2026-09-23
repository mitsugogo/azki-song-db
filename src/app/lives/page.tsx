import { Suspense } from "react";
import type { Metadata } from "next";
import { Alert } from "@mantine/core";
import { getLocale, getTranslations } from "next-intl/server";
import { fetchLiveTitleGroupsFromApi } from "@/app/lib/server/fetchLives";
import { pageClasses } from "@/app/theme";
import LiveBreadcrumbs from "./LiveBreadcrumbs";
import LivesClient from "./client";
import { buildLivePageMetadata } from "./liveMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Metadata.lives", locale });
  return buildLivePageMetadata({
    title: t("title"),
    description: t("description"),
    pathname: "/lives",
    locale,
  });
}

export default async function LivesPage() {
  const t = await getTranslations("Lives");
  const groups = await fetchLiveTitleGroupsFromApi().catch(() => null);

  return (
    <main className={pageClasses.shell}>
      <div className="mx-auto w-full">
        <LiveBreadcrumbs homeLabel={t("home")} livesLabel={t("lives")} />
        <h1 className={pageClasses.heading}>{t("title")}</h1>
        <p className={pageClasses.description}>{t("description")}</p>
        {groups ? (
          <Suspense fallback={null}>
            <LivesClient groups={groups} />
          </Suspense>
        ) : (
          <Alert color="red" title={t("loadErrorTitle")}>
            {t("loadErrorDescription")}
          </Alert>
        )}
      </div>
    </main>
  );
}

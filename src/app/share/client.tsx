"use client";

import { Breadcrumbs } from "@mantine/core";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses } from "@/app/theme";
import { Header } from "@/app/components/Header";
import { AnalyticsWrapper } from "@/app/components/AnalyticsWrapper";
import Footer from "@/app/components/Footer";
import { useTranslations } from "next-intl";

/** 共有ページ */
export default function ShareIndexClient() {
  return (
    <>
      <div className="flex flex-col h-dvh">
        <Header />
        <div className="flex flex-col grow md:flex-row overflow-y-hidden w-full">
          <ShareIndexContent />
        </div>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </>
  );
}

function ShareIndexContent() {
  const t = useTranslations("Share");
  const dm = useTranslations("DrawerMenu");

  return (
    <div className="grow lg:p-6 lg:pb-0 overflow-auto">
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> {dm("home")}
        </Link>
        <span className={breadcrumbClasses.link}>{t("index.title")}</span>
      </Breadcrumbs>

      <div className="p-3">
        <h1 className="font-extrabold text-2xl mb-1">{t("index.title")}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("index.description")}
        </p>
      </div>

      <div className="px-3 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {(() => {
            const features = [
              {
                href: "/share/my-best-9-songs",
                title: t("features.myBest9.title"),
                description: t("features.myBest9.description"),
                emoji: "🎵",
              },
              {
                href: "/share/where-my-azkichi-began",
                title: t("features.whereMyAzkichiBegan.title"),
                description: t("features.whereMyAzkichiBegan.description"),
                emoji: "🗓️",
              },
            ];
            return features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-pink-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-pink-700"
              >
                <div className="text-3xl mb-3">{feature.emoji}</div>
                <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                  {feature.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

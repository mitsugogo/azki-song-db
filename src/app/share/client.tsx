"use client";

import { Breadcrumbs } from "@mantine/core";
import { ThemeProvider } from "flowbite-react";
import { HiChevronRight, HiHome } from "react-icons/hi";
import Link from "next/link";
import { breadcrumbClasses, flowbiteTheme } from "@/app/theme";
import { Header } from "@/app/components/Header";
import { AnalyticsWrapper } from "@/app/components/AnalyticsWrapper";
import Footer from "@/app/components/Footer";

/** 共有機能の定義 */
const shareFeatures = [
  {
    href: "/share/my-best-9-songs",
    title: "究極の9曲ジェネレーター",
    description:
      "オリジナル曲・カバー曲・ユニット曲・歌枠の中から好きな9曲を選んで、SNSで共有できます。",
    emoji: "🎵",
  },
];

/** 共有ページ */
export default function ShareIndexClient() {
  return (
    <ThemeProvider theme={flowbiteTheme}>
      <div className="flex flex-col h-dvh">
        <Header />
        <div className="flex flex-col grow md:flex-row overflow-y-hidden w-full">
          <ShareIndexContent />
        </div>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </ThemeProvider>
  );
}

function ShareIndexContent() {
  return (
    <div className="grow lg:p-6 lg:pb-0 overflow-auto">
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> Home
        </Link>
        <span className={breadcrumbClasses.link}>共有</span>
      </Breadcrumbs>

      <div className="p-3">
        <h1 className="font-extrabold text-2xl mb-1">共有</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          楽曲の選択結果をSNSで共有できる機能です。
        </p>
      </div>

      <div className="px-3 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {shareFeatures.map((feature) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}

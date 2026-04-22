import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@mantine/core/styles.css";
import "@mantine/spotlight/styles.css";
import "./globals.css";
import { VercelToolbar } from "@vercel/toolbar/next";
import { MantineProvider } from "@mantine/core";
import { NextIntlClientProvider } from "next-intl";
import { theme } from "./theme";
import ClientProviders from "./components/ClientProviders";
import { siteConfig, baseUrl } from "./config/siteConfig";
import { routing } from "../i18n/routing";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: `${siteConfig.siteName}`,
  description:
    "ホロライブのAZKiさんの歌を楽しむためのデータベース。歌枠やオリ曲、ライブ等で歌唱した楽曲やセトリをまとめています。",
  keywords: ["AZKi", "歌", "歌枠", "オリ曲", "ライブ", "ホロライブ"],
  openGraph: {
    title: `${siteConfig.siteName}`,
    description:
      "ホロライブのAZKiさんの歌を楽しむためのデータベース。歌枠やオリ曲、ライブ等で歌唱した楽曲やセトリをまとめています。",
    url: siteConfig.siteUrl,
    siteName: `${siteConfig.siteName}`,
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent(siteConfig.siteName)}&subtitle=${encodeURIComponent("AZKiさんの歌のデータベース")}&w=1200&h=630`,
        width: 1200,
        height: 630,
        alt: `${siteConfig.siteName} - AZKiさんの歌のデータベース`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.siteName}`,
    description:
      "ホロライブのAZKiさんの歌を楽しむためのデータベース。歌枠やオリ曲、ライブ等で歌唱した楽曲やセトリをまとめています。",
    images: [
      `/api/og?title=${encodeURIComponent(siteConfig.siteName)}&subtitle=${encodeURIComponent("AZKiさんの歌のデータベース")}&w=1200&h=630`,
    ],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
    other: [{ rel: "mask-icon", url: "/favicon.ico", color: "#b81e8a" }],
  },
  alternates: {
    canonical: siteConfig.siteUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const localeHeader = headerStore.get("x-locale");
  const locale = routing.locales.includes(
    localeHeader as (typeof routing.locales)[number],
  )
    ? (localeHeader as (typeof routing.locales)[number])
    : routing.defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;
  const shouldInjectToolbar = process.env.NODE_ENV === "development";
  return (
    <html lang={locale} className="antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="theme-color" content="#b81e8a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
      </head>
      <body
        className={`antialiased bg-white dark:bg-azki-gradient bg-fixed transition-colors duration-700`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <MantineProvider theme={theme}>
            <ClientProviders>
              {children}
              {shouldInjectToolbar && <VercelToolbar />}
            </ClientProviders>
          </MantineProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

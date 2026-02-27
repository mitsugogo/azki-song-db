import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VercelToolbar } from "@vercel/toolbar/next";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import ClientProviders from "./components/ClientProviders";
import { siteConfig } from "./config/siteConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
  adjustFontFallback: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
  adjustFontFallback: false,
});

const notoSans = Noto_Sans_JP({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
  adjustFontFallback: false,
});

export const metadata: Metadata = {
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
      `${siteConfig.siteUrl}api/og?title=${encodeURIComponent(
        siteConfig.siteName,
      )}&subtitle=${encodeURIComponent("AZKiさんの歌のデータベース")}&w=1200&h=630`,
    ],
  },
  twitter: {
    card: "summary_large_image",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shouldInjectToolbar = process.env.NODE_ENV === "development";
  return (
    <html
      lang="ja"
      className={`${notoSans.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
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
        className={`antialiased dark:bg-gray-900 transition-colors duration-700`}
      >
        <MantineProvider theme={theme}>
          <ClientProviders>
            {children}
            {shouldInjectToolbar && <VercelToolbar />}
          </ClientProviders>
        </MantineProvider>
      </body>
    </html>
  );
}

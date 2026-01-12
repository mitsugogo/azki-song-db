import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VercelToolbar } from "@vercel/toolbar/next";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoSans = Noto_Sans_JP({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AZKi Song Database",
  description:
    "ホロライブのAZKさんの歌を楽しむためのデータベース。歌枠やオリ曲、ライブ等で歌唱した楽曲やセトリをまとめています。",
  keywords: ["AZKi", "歌", "歌枠", "オリ曲", "ライブ", "ホロライブ"],
  openGraph: {
    title: "AZKi Song Database",
    description:
      "ホロライブのAZKiさんの歌を楽しむためのデータベース。歌枠やオリ曲、ライブ等で歌唱した楽曲やセトリをまとめています。",
    url: "https://azki-song-db.vercel.app/",
    siteName: "AZKi Song Database",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
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
      </head>
      <body
        className={`antialiased dark:bg-gray-900 transition-colors duration-700`}
      >
        <MantineProvider theme={theme}>
          {children}
          {shouldInjectToolbar && <VercelToolbar />}
        </MantineProvider>
      </body>
    </html>
  );
}

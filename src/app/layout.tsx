import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeModeScript } from "flowbite-react";

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

const baseUrl = process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

export const metadata: Metadata = {
  title: "AZKi Song Database",
  description: "ホロライブのAZKiさんの歌を楽しむためのデータベース。歌枠やオリ曲、ライブ等で歌唱した楽曲をまとめています。",
  icons: [
    "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text x=%2250%%22 y=%2250%%22 style=%22dominant-baseline:central;text-anchor:middle;font-size:90px;%22>⚒️</text></svg>"
  ],
  openGraph: {
    title: "AZKi Song Database",
    description: "ホロライブのAZKiさんの歌を楽しむためのデータベース。歌枠やオリ曲、ライブ等で歌唱した楽曲をまとめています。",
    url: "https://azki-song-db.vercel.app/",
    siteName: "AZKi Song Database",
    locale: "ja_JP",
    type: "website",
    images: [
      `${baseUrl}/api/og?title=AZKi Song Database&subtitle=ホロライブのAZKiさんの歌枠の素晴らしさを伝えるサイト&titlecolor=b81e8a&w=1200&h=630`,
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <head>
        <ThemeModeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-gray-900`}
      >
        {children}
      </body>
    </html>
  );
}
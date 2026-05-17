import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { Song } from "@/app/types/song";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { formatDate } from "@/app/lib/formatDate";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hl = searchParams.get("hl")?.toLowerCase() ?? "ja";
    const v = searchParams.get("v");
    const t = searchParams.get("t") || "0";

    if (!v) {
      return new Response("Missing required parameters", { status: 404 });
    }

    const width = searchParams.get("w") || "1200";
    const height = searchParams.get("h") || "630";

    const video_id = v;
    const start = t.toString().replace("s", "");
    const songs = await fetch(
      `${baseUrl}/api/songs?hl=${encodeURIComponent(hl)}`,
      { cache: "no-store" },
    )
      .then((res) => res.json())
      .catch(() => []);
    const song: Song = songs.find(
      (s: Song) => s.video_id === video_id && Number(s.start) === Number(start),
    );
    if (!song) {
      return new Response("Song not found", { status: 404 });
    }

    const title = `🎵 ${song.title} - ${song.artist}`;
    const subTitle = `${song.video_title}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${video_id}/mqdefault.jpg`;

    const notoSansRegular = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&text=" +
        encodeURIComponent(title || `${siteConfig.siteName}`) +
        encodeURIComponent(subTitle || `🎵 ${siteConfig.siteName}`) +
        encodeURIComponent(song.tags.join("")) +
        encodeURIComponent("1234567890-/") +
        encodeURIComponent("JanFebMarAprMayJunJulAugSepOctNovDec") +
        encodeURIComponent("...…,"),
    )
      .then((res) => res.text())
      .then((css) => {
        const url = css.match(
          /src: url\((.+)\) format\('(opentype|truetype)'\)/,
        )?.[1];
        if (!url) throw new Error("Font not found");
        return fetch(url).then((res) => res.arrayBuffer());
      });

    const notoSansBold = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=" +
        encodeURIComponent(title || `${siteConfig.siteName}`) +
        encodeURIComponent(subTitle || `🎵 ${siteConfig.siteName}`) +
        encodeURIComponent(song.tags.join("")) +
        encodeURIComponent("1234567890-/") +
        encodeURIComponent("JanFebMarAprMayJunJulAugSepOctNovDec") +
        encodeURIComponent("...…,"),
    )
      .then((res) => res.text())
      .then((css) => {
        const url = css.match(
          /src: url\((.+)\) format\('(opentype|truetype)'\)/,
        )?.[1];
        if (!url) throw new Error("Font not found");
        return fetch(url).then((res) => res.arrayBuffer());
      });

    return new ImageResponse(
      <div
        style={{
          backgroundColor: "#fdf7fb",
          backgroundImage:
            "linear-gradient(135deg, #ffffff 0%, #fff6fb 44%, #edf9ff 100%)",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          fontFamily: "Noto Sans JP",
          padding: "70px 96px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景の装飾レイヤー */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.96,
            backgroundImage:
              "radial-gradient(560px 320px at 12% 92%, rgba(59, 130, 246, 0.12), transparent 62%), linear-gradient(180deg, rgba(255, 255, 255, 0.52) 0%, rgba(255, 255, 255, 0.14) 28%, rgba(255, 255, 255, 0) 56%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-140px",
            top: "-120px",
            width: "420px",
            height: "420px",
            borderRadius: "999px",
            background:
              "linear-gradient(150deg, rgba(255, 226, 238, 0.22), rgba(196, 236, 255, 0.14))",
            filter: "blur(24px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "-180px",
            bottom: "-160px",
            width: "520px",
            height: "520px",
            borderRadius: "999px",
            background:
              "linear-gradient(165deg, rgba(191, 219, 254, 0.58), rgba(255, 192, 203, 0.26))",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 18px",
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.72)",
              color: "#c2185b",
              fontSize: 20,
              letterSpacing: "0.08em",
              alignSelf: "flex-start",
              border: "1px solid rgba(255, 255, 255, 0.72)",
              boxShadow: "0 16px 32px rgba(255, 140, 180, 0.16)",
            }}
          >
            {siteConfig.siteName}
          </div>
          {/* 曲名コンテナ（上段） */}
          <div
            style={{
              fontSize: 60,
              fontStyle: "normal",
              fontWeight: 700,
              display: "block",
              color: "#8c1748",
              lineHeight: 1.15,
              letterSpacing: "0.01em",
              textShadow: "0 10px 28px rgba(255, 255, 255, 0.7)",
              lineClamp: '3 "..."',
            }}
          >
            {title}
          </div>
        </div>
        {/* サムネイルと動画名のコンテナ（中段） */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            gap: "32px",
            position: "relative",
            padding: "30px 32px",
            borderRadius: "32px",
            background: "rgba(255, 255, 255, 0.52)",
            border: "1px solid rgba(255, 255, 255, 0.72)",
            boxShadow: "0 24px 48px rgba(255, 145, 185, 0.14)",
          }}
        >
          {/* サムネイル画像 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "300px",
              height: "190px",
              borderRadius: "18px",
              padding: "6px",
              background:
                "linear-gradient(140deg, rgba(255, 120, 170, 0.86), rgba(125, 211, 252, 0.56))",
              boxShadow: "0 14px 34px rgba(255, 138, 177, 0.22)",
            }}
          >
            <img
              src={thumbnailUrl}
              alt="YouTube Thumbnail"
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
                borderRadius: "14px",
              }}
            />
          </div>
          {/* 動画名 */}
          <div
            style={{
              display: "block",
              fontSize: 30,
              fontStyle: "normal",
              color: "#6a2044",
              lineHeight: 1.4,
              flex: 1,
              lineClamp: '3 "..."',
            }}
          >
            {subTitle}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            padding: "24px 28px 0",
            color: "#9d3d68",
            fontSize: 22,
            fontWeight: 400,
          }}
        >
          <div
            style={{
              letterSpacing: "0.12em",
              lineClamp: '1 "..."',
              padding: "10px 18px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.54)",
            }}
          >
            {song.tags.join(", ")}
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#c74a7d",
              fontWeight: 700,
            }}
          >
            {formatDate(song.broadcast_at, hl)}
          </div>
        </div>
      </div>,
      {
        width: parseInt(width),
        height: parseInt(height),
        fonts: [
          {
            name: "Noto Sans JP",
            data: notoSansRegular,
            style: "normal",
            weight: 400,
          },
          {
            name: "Noto Sans JP",
            data: notoSansBold,
            style: "normal",
            weight: 700,
          },
        ],
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "s-maxage=604800, stale-while-revalidate=900",
        },
      },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(`${e.message}`);
    }
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

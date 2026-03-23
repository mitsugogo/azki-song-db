import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { Song } from "@/app/types/song";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hl = searchParams.get("hl")?.toLowerCase() ?? "ja";
    const v = searchParams.get("v");
    if (!v) {
      return new Response("Missing required parameters", { status: 404 });
    }

    const width = searchParams.get("w") || "1200";
    const height = searchParams.get("h") || "630";

    const video_id = v;
    const songs = await fetch(
      `${baseUrl}/api/songs?hl=${encodeURIComponent(hl)}`,
    )
      .then((res) => res.json())
      .catch(() => []);
    const song: Song = songs.find((s: Song) => s.video_id === video_id);
    const songsByVideoId = songs.filter((s: Song) => s.video_id === video_id);
    if (!song) {
      return new Response("Song not found", { status: 404 });
    }

    const title = `${song.video_title}`;
    const subTitle =
      `${song.title} - ${song.artist}` +
      (songsByVideoId.length > 1 ? ` 他${songsByVideoId.length - 1}曲` : "");
    const thumbnailUrl = `https://img.youtube.com/vi/${video_id}/mqdefault.jpg`;

    const notoSansRegular = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&text=" +
        encodeURIComponent(title || `${siteConfig.siteName}`) +
        encodeURIComponent(subTitle || `🎵 ${siteConfig.siteName}`) +
        encodeURIComponent(song.tags.join("")) +
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
          backgroundColor: "#090f2a",
          backgroundImage:
            "radial-gradient(1000px 420px at 50% -20%, rgba(236, 72, 153, 0.26), transparent 62%), linear-gradient(130deg, #0a1438 0%, #1d1239 48%, #2b1138 100%)",
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
            opacity: 0.88,
            backgroundImage:
              "radial-gradient(700px 320px at 88% 12%, rgba(244, 114, 182, 0.34), transparent 62%), radial-gradient(520px 300px at 12% 92%, rgba(59, 130, 246, 0.24), transparent 64%)",
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
              "linear-gradient(150deg, rgba(244, 114, 182, 0.5), rgba(129, 140, 248, 0.18))",
            filter: "blur(6px)",
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
              "linear-gradient(165deg, rgba(30, 64, 175, 0.36), rgba(219, 39, 119, 0.18))",
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
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              color: "#ffe3f0",
              fontSize: 20,
              letterSpacing: "0.08em",
              alignSelf: "flex-start",
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
              color: "#ffffff",
              lineHeight: 1.15,
              letterSpacing: "0.01em",
              textShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
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
                "linear-gradient(140deg, rgba(252, 52, 136, 0.6), rgba(209, 28, 118, 0.25))",
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
              color: "#ffe3f0",
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
            paddingTop: "24px",
            color: "#f7cfe1",
            fontSize: 22,
            fontWeight: 400,
          }}
        >
          <div style={{ letterSpacing: "0.12em", lineClamp: '1 "..."' }}>
            {song.tags.join(", ")}
          </div>
          <div style={{ fontSize: 20, color: "#fc3488" }}>
            {new Date(song.broadcast_at).toLocaleDateString("ja-JP") + " 配信"}
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

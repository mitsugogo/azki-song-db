import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { Song } from "@/app/types/song";

export const runtime = "edge";

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const v = searchParams.get("v");
    const t = searchParams.get("t");

    if (!v || !t) {
      return new Response("Missing required parameters", { status: 404 });
    }

    const width = searchParams.get("w") || "1200";
    const height = searchParams.get("h") || "630";

    const video_id = v;
    const start = t.toString().replace("s", "");
    const songs = await fetch(baseUrl + "/api/songs")
      .then((res) => res.json())
      .catch(() => []);
    const song: Song = songs.find(
      (s: Song) =>
        s.video_id === video_id && parseInt(s.start) === parseInt(start)
    );
    if (!song) {
      return new Response("Song not found", { status: 404 });
    }

    const title = `🎵 ${song.title} - ${song.artist}`;
    const subTitle = `${song.video_title}\n(${new Date(
      song.broadcast_at
    ).toLocaleDateString("ja-JP")})`;
    const thumbnailUrl = `https://img.youtube.com/vi/${video_id}/mqdefault.jpg`;

    // サムネイルが読み込めない場合のフォールバックは、ImageResponseのtry/catchでエラーハンドリングする
    // ため、useYoutubeThumbnailFallbackはここでは使用しません。

    const notoSansRegular = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&text=" +
        encodeURIComponent(title || "AZKi Song Database") +
        encodeURIComponent(subTitle || "🎵 AZKi Song Database")
    )
      .then((res) => res.text())
      .then((css) => {
        const url = css.match(
          /src: url\((.+)\) format\('(opentype|truetype)'\)/
        )?.[1];
        if (!url) throw new Error("Font not found");
        return fetch(url).then((res) => res.arrayBuffer());
      });

    const notoSansBold = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=" +
        encodeURIComponent(title || "AZKi Song Database") +
        encodeURIComponent(subTitle || "🎵 AZKi Song Database")
    )
      .then((res) => res.text())
      .then((css) => {
        const url = css.match(
          /src: url\((.+)\) format\('(opentype|truetype)'\)/
        )?.[1];
        if (!url) throw new Error("Font not found");
        return fetch(url).then((res) => res.arrayBuffer());
      });

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: "#eee",
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "nowrap",
            border: "30px solid #b81e8a",
            fontFamily: "Noto Sans JP",
            padding: "60px 90px",
            position: "relative", // 子要素の絶対位置指定を可能にする
          }}
        >
          {/* 曲名コンテナ（上段） */}
          <div
            style={{
              width: "100%",
              fontSize: 60,
              fontStyle: "normal",
              fontWeight: "bold",
              color: "#333",
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
          {/* サムネイルと動画名のコンテナ（中段） */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              marginTop: "120px",
            }}
          >
            {/* サムネイル画像 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "280px",
                height: "180px",
                marginRight: "40px",
              }}
            >
              <img
                src={thumbnailUrl}
                alt="YouTube Thumbnail"
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                  borderRadius: "10px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              />
            </div>
            {/* 動画名 */}
            <div
              style={{
                fontSize: 32,
                fontStyle: "normal",
                color: "#333",
                lineHeight: 1.3,
                flex: 1,
                lineClamp: 3,
              }}
            >
              {subTitle}
            </div>
          </div>
          {/* サイト名（左下から絶対位置で固定） */}
          <div
            style={{
              fontSize: 24,
              fontStyle: "normal",
              color: "#999",
              fontWeight: 400,
              position: "absolute",
              bottom: "20px",
              left: "40px",
            }}
          >
            AZKi Song Database
          </div>
        </div>
      ),
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
      }
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

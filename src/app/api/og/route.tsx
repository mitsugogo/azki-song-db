import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const hasTitle = searchParams.has("title");
    const title = hasTitle
      ? searchParams.get("title")?.slice(0, 100)
      : "AZKi Song Database";

    const titleColor = searchParams.get("titlecolor") || "000";

    const hasSubTitle = searchParams.has("subtitle");
    const subTitle = hasSubTitle
      ? searchParams.get("subtitle")?.slice(0, 100)
      : "🎵 AZKi Song Database";

    const subTitleColor = searchParams.get("subtitlecolor") || "000";

    const width = searchParams.get("w") || "1200";
    const height = searchParams.get("h") || "630";

    const notoSansRegular = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&text=" +
        encodeURIComponent(title || "AZKi Song Database") +
        encodeURIComponent(subTitle || "🎵 AZKi Song Database"),
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
        encodeURIComponent(title || "AZKi Song Database") +
        encodeURIComponent(subTitle || "🎵 AZKi Song Database"),
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
      (
        <div
          style={{
            backgroundColor: "#eee",
            backgroundSize: "100% 100%",
            height: "100%",
            width: "100%",
            display: "flex",
            textAlign: "left",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexDirection: "column",
            flexWrap: "nowrap",
            border: "30px solid #b81e8a",
            fontFamily: "Noto Sans JP",
            padding: "90px 120px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: "100%",
                fontSize: 60,
                fontStyle: "normal",
                fontWeight: "bold",
                color: `#${titleColor}`,
                lineHeight: 1.3,
                marginBottom: "30px",
              }}
            >
              {title}
            </div>
            <div
              style={{
                width: "100%",
                fontSize: 40,
                fontStyle: "normal",
                color: `#${subTitleColor}`,
                lineHeight: 1.3,
              }}
            >
              {subTitle}
            </div>
          </div>
          {/* サイト名用のコンテナ */}
          <div
            style={{
              width: "100%",
              fontSize: 24,
              fontStyle: "normal",
              color: "#333", // サイト名の色を調整
              fontWeight: 400,
              textAlign: "left", // 左揃え
              marginTop: "auto", // 親要素の末尾に配置
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

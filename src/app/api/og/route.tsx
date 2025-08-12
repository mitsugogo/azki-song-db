import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";

export const config = {
  runtime: "edge",
};

export const contentType = 'image/png'

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

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: "#fff",
            backgroundSize: "100% 100%",
            height: "100%",
            width: "100%",
            display: "flex",
            textAlign: "left",
            alignItems: "flex-start",
            justifyContent: "center",
            flexDirection: "column",
            flexWrap: "nowrap",
            border: "30px solid #b81e8a"
          }}
        >
          <div
            style={{
              width: "100%",
              fontSize: 60,
              fontStyle: "normal",
              fontWeight: "bold",
              color: `#${titleColor}`,
              padding: "0 120px",
              lineHeight: 1.3,
              marginBottom: "30px",
              wordWrap: "break-word",
            }}
          >
            {title}
          </div>
          <div
            style={{
              width: "100%",
              fontSize: 40,
              fontStyle: "normal",
              fontWeight: "bold",
              color: `#${subTitleColor}`,
              padding: "0 120px",
              lineHeight: 1.3,
            }}
          >
            {subTitle}
          </div>
        </div>
      ),
      {
        width: parseInt(width),
        height: parseInt(height),
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
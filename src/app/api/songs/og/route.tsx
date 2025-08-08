import { NextRequest } from "next/server";
import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "experimental-edge",
};

const font = fetch(
  new URL("../../assets/NotoSansJP-Bold.otf", import.meta.url)
).then((res) => res.arrayBuffer());

export default async function ogp(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fontData = await font;

  const hasTitle = searchParams.has("title");
  const title = hasTitle
    ? searchParams.get("title")?.slice(0, 100)
    : "My default title";
  const hasUserName = searchParams.has("userName");
  const userName = hasUserName ? searchParams.get("userName") : "unknown";
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 50,
          backgroundImage: `url(${`data:image/svg+xml,${encodeURIComponent(
            '<svg id="visual" viewBox="0 0 1200 630" width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"><defs><filter id="blur1" x="-10%" y="-10%" width="120%" height="120%"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur stdDeviation="201" result="effect1_foregroundBlur"></feGaussianBlur></filter></defs><rect width="1200" height="630" fill="#6600FF"></rect><g filter="url(#blur1)"><circle cx="603" cy="131" fill="#00CC99" r="447"></circle><circle cx="38" cy="287" fill="#6600FF" r="447"></circle><circle cx="1182" cy="342" fill="#00CC99" r="447"></circle><circle cx="633" cy="523" fill="#00CC99" r="447"></circle><circle cx="1020" cy="539" fill="#6600FF" r="447"></circle><circle cx="843" cy="207" fill="#00CC99" r="447"></circle></g></svg>'
          )}`})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "100% 100%",
          width: "100%",
          height: "100%",
          display: "flex",
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: '"NotoSansJP"',
          textShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
          position: "relative",
        }}
      >
        <h2
          style={{
            width: "100%",
            color: "white",
            fontSize: 60,
            fontFamily: '"NotoSansJP"',
            textShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
          }}
        >
          {title}
        </h2>
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: "100%",
            bottom: 0,
            paddingLeft: 30,
            paddingRight: 30,
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              color: "white",
              fontSize: 40,
              fontFamily: '"NotoSansJP"',
              textShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
            }}
          >
            2022.10.22
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={`https://github.com/${userName}.png`}
              alt=""
              width="60"
              height="60"
              style={{ borderRadius: 60, marginRight: 10 }}
            />
            <h2
              style={{
                color: "white",
                fontSize: 40,
                fontFamily: '"NotoSansJP"',
                textShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
              }}
            >
              {userName}
            </h2>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 600,
      fonts: [
        {
          name: "NotoSansJP",
          data: fontData,
          style: "normal",
        },
      ],
    }
  );
}
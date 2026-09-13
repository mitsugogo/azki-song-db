import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { isArtTrack } from "@/app/discography/utils/releaseVariants";
import { fetchSongMetadataLookup } from "@/app/lib/server/fetchSongs";
import {
  fetchOgFonts,
  getOgBackgroundImageUrl,
  getOgDetailContentTopPadding,
  getOgDetailThumbnailLayout,
  normalizeOgText,
  ogColors,
  ogImageHeaders,
} from "../ogDesign";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const { searchParams } = requestUrl;
    const hl = searchParams.get("hl")?.toLowerCase() ?? "ja";
    const videoId = searchParams.get("v");
    const timestamp = searchParams.get("t");

    if (!videoId) {
      return new Response("Missing required parameters", { status: 404 });
    }

    const width = searchParams.get("w") || "1200";
    const height = searchParams.get("h") || "630";
    const start = timestamp?.replace("s", "");
    const songs = await fetchSongMetadataLookup({
      locale: hl,
      videoId,
      baseUrlOverride: requestUrl.origin,
    }).catch(() => []);
    const songsByVideoId = songs.filter((song) => song.video_id === videoId);
    const isStreamArchive = songsByVideoId.length > 1;
    const song =
      start !== undefined
        ? (songsByVideoId.find(
            (item) => Number(item.start) === Number(start),
          ) ?? songsByVideoId[0])
        : songsByVideoId[0];

    if (!song) {
      return new Response("Song not found", { status: 404 });
    }

    const title = normalizeOgText(
      isStreamArchive ? song.video_title : song.title,
    );
    const tags = Array.from(
      new Set(
        song.tags.map((tag) => normalizeOgText(tag.trim())).filter(Boolean),
      ),
    ).slice(0, 3);
    const titleLength = Array.from(title).length;
    const titleFontSize = titleLength > 48 ? 38 : titleLength > 36 ? 44 : 52;
    const thumbnailKind =
      !isStreamArchive && isArtTrack(song) ? "artwork" : "video";
    const thumbnail = getOgDetailThumbnailLayout(thumbnailKind);
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const backgroundUrl = getOgBackgroundImageUrl(requestUrl.origin);
    const fonts = await fetchOgFonts(`${title}${tags.join("")}`, "detail");

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#fff6fa",
          color: ogColors.ink,
          fontFamily: '"Noto Sans JP", "Noto Sans", sans-serif',
        }}
      >
        <img
          src={backgroundUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "flex-start",
            gap: 62,
            padding: `${getOgDetailContentTopPadding(thumbnailKind)}px 58px 72px`,
          }}
        >
          <div
            style={{
              display: "flex",
              width: thumbnail.width,
              minWidth: thumbnail.width,
              height: thumbnail.height,
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              boxShadow: "0 8px 22px rgba(92, 38, 66, 0.08)",
            }}
          >
            <img
              src={thumbnailUrl}
              alt="YouTube Thumbnail"
              style={{
                width: "100%",
                height: "100%",
                objectFit: thumbnail.objectFit,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              minWidth: 0,
              maxWidth: 612,
              flexDirection: "column",
              alignItems: "flex-start",
              paddingTop: 0,
            }}
          >
            <div
              style={{
                display: "block",
                width: "100%",
                lineClamp: 3,
                overflow: "hidden",
                fontSize: titleFontSize,
                fontWeight: 700,
                color: "#5b173a",
                lineHeight: 1.18,
                letterSpacing: -1.2,
                paddingBottom: 12,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: tags.length ? "flex" : "none",
                flexWrap: "wrap",
                gap: 16,
                marginTop: 26,
                maxWidth: "100%",
              }}
            >
              {tags.map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    padding: "11px 22px",
                    borderRadius: 999,
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    color: ogColors.primary,
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1.25,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>,
      {
        width: Number.parseInt(width, 10),
        height: Number.parseInt(height, 10),
        fonts,
        headers: ogImageHeaders,
      },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(`${e.message}`);
    }
    return new Response("Failed to generate the image", {
      status: 500,
    });
  }
}

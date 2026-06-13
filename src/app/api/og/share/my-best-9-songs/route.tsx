import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { Song } from "@/app/types/song";
import { siteConfig } from "@/app/config/siteConfig";
import { fetchSongsFromApiCached } from "@/app/lib/server/fetchSongs";
import {
  fetchOgFonts,
  normalizeOgText,
  ogColors,
  ogFontFamily,
  ogImageHeaders,
} from "../../ogDesign";

export const runtime = "edge";

type OgSongCard = {
  url: string;
  title: string;
  artist: string;
};

const normalizeStart = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const withoutSuffix = trimmed.replace(/s$/i, "");
  const numeric = Number(withoutSuffix);
  if (Number.isFinite(numeric)) {
    return String(numeric);
  }

  return withoutSuffix;
};

const fallbackOgImage = async () => {
  const fonts = await fetchOgFonts("好きな曲9選 AZKi Song Database");

  return new ImageResponse(
    <div
      style={{
        backgroundColor: ogColors.background,
        backgroundImage:
          "linear-gradient(135deg, #fffafc 0%, #fdf2f7 46%, #eef8ff 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
        fontFamily: ogFontFamily,
        color: ogColors.primaryDeep,
        fontSize: 48,
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          color: ogColors.cyan,
        }}
      >
        ♪
      </div>
      <div style={{ display: "flex" }}>好きな曲9選</div>
      <div
        style={{
          fontSize: 24,
          color: ogColors.primary,
          marginTop: "20px",
          display: "flex",
        }}
      >
        {siteConfig.siteName}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts,
      headers: ogImageHeaders,
    },
  );
};

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const { searchParams } = requestUrl;
    const hl = searchParams.get("hl")?.toLowerCase() ?? "ja";
    const origin = requestUrl.origin;
    const id = searchParams.get("id");

    if (!id) {
      return await fallbackOgImage();
    }

    const width = searchParams.get("w") || "1200";
    const height = searchParams.get("h") || "630";

    const savedResponse = await fetch(
      `${origin}/api/share/my-best-9-songs/${id}`,
    ).catch(() => null);

    const selection = savedResponse?.ok
      ? (
          (await savedResponse.json()) as {
            selection?: {
              title: string;
              author?: string;
              songs: { v: string; s: string }[];
            };
          }
        ).selection
      : null;

    if (!selection) {
      return await fallbackOgImage();
    }

    // 曲データを取得
    const songs = await fetchSongsFromApiCached({
      locale: hl,
      baseUrlOverride: origin,
    }).catch(() => []);

    // 厳選した曲を取得
    const selectedSongs = selection.songs
      .map((entry: { v: string; s: string }) => {
        const normalizedEntryStart = normalizeStart(entry.s);
        if (!normalizedEntryStart) return undefined;

        const exact = songs.find((s: Song) => {
          const normalizedSongStart = normalizeStart(s.start);
          return (
            s.video_id === entry.v &&
            normalizedSongStart !== null &&
            normalizedSongStart === normalizedEntryStart
          );
        });
        if (exact) return exact;

        // 旧データ向け: 同じ動画IDが1件だけなら安全にフォールバック
        const sameVideoSongs = songs.filter(
          (s: Song) => s.video_id === entry.v,
        );
        if (sameVideoSongs.length === 1) {
          return sameVideoSongs[0];
        }

        return undefined;
      })
      .filter((s: Song | undefined) => s !== undefined)
      .slice(0, 9) as Song[];

    const titleText = normalizeOgText(selection.title.trim() || "好きな曲9選");
    const authorText = selection.author?.trim()
      ? normalizeOgText(`by ${selection.author.trim()}`)
      : "";

    const ogSongCards: OgSongCard[] = selectedSongs.map((song) => {
      let url = `https://img.youtube.com/vi/${song.video_id}/maxresdefault.jpg`;
      if (song.video_id === "fiddR-oZta4") {
        // afterglow(id:fiddR-oZta4)だけmaxresdefault.jpgが存在しないため、hqdefault.jpgを使用
        url = `https://img.youtube.com/vi/${song.video_id}/hqdefault.jpg`;
      }
      return {
        url: url,
        title: normalizeOgText(song.title),
        artist: normalizeOgText(song.artist),
      };
    });

    // 9枚未満の場合は空カードでパディング
    while (ogSongCards.length < 9) {
      ogSongCards.push({
        url: "",
        title: "",
        artist: "",
      });
    }

    const thumbnailRows = [0, 1, 2].map((rowIndex) =>
      ogSongCards.slice(rowIndex * 3, rowIndex * 3 + 3),
    );

    const fontTextSeed = `${titleText}${authorText}${ogSongCards
      .map((card) => `${card.title}${card.artist}`)
      .join("")}...…,:・`;

    const fonts = await fetchOgFonts(fontTextSeed);

    return new ImageResponse(
      <div
        style={{
          backgroundColor: ogColors.background,
          backgroundImage:
            "linear-gradient(135deg, #fffafc 0%, #fdf2f7 46%, #eef8ff 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "24px 24px 8px",
          fontFamily: ogFontFamily,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景装飾 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.96,
            backgroundImage:
              "radial-gradient(circle at center, rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.46) 42%, rgba(253, 242, 248, 0.92) 100%)",
          }}
        />

        {/* ヘッダー */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            width: "100%",
            maxWidth: "1080px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 700,
              color: ogColors.primaryDeep,
              marginBottom: "6px",
              letterSpacing: 0,
            }}
          >
            {titleText}
          </div>
          <div
            style={{
              display: authorText ? "flex" : "none",
              fontSize: 28,
              color: ogColors.muted,
              fontWeight: 400,
            }}
          >
            {authorText}
          </div>
        </div>

        {/* 3x3 レイアウト（next/og では grid が使えないため flex で構成） */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "1040px",
            width: "100%",
            height: "430px",
            marginBottom: "4px",
            position: "relative",
          }}
        >
          {thumbnailRows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                gap: "10px",
                flex: 1,
              }}
            >
              {row.map((card, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    flex: 1,
                    position: "relative",
                    backgroundColor: card.url
                      ? "rgba(255, 255, 255, 0.82)"
                      : "rgba(255, 240, 247, 0.9)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    border: `1px solid ${ogColors.line}`,
                  }}
                >
                  {card.url ? (
                    <img
                      src={card.url}
                      alt=""
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                    />
                  ) : null}

                  <div
                    style={{
                      display: card.title ? "flex" : "none",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      width: "100%",
                      minHeight: "42px",
                      padding: "5px 7px",
                      backgroundImage:
                        "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(106, 32, 68, 0.76) 78%)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: 1.15,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        color: "#f8dbe8",
                        fontSize: 10,
                        fontWeight: 400,
                        marginTop: "2px",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {card.artist}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* フッター */}
        <div
          style={{
            position: "absolute",
            right: "24px",
            bottom: "4px",
            display: "flex",
            fontSize: 18,
            color: ogColors.muted,
            fontWeight: 400,
            letterSpacing: "0.05em",
          }}
        >
          {siteConfig.siteName}
        </div>
      </div>,
      {
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        fonts,
        headers: ogImageHeaders,
      },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.error("Failed to generate OG image:", e.message);
    }
    return await fallbackOgImage();
  }
}

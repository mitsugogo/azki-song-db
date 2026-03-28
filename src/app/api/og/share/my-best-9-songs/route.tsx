import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { Song } from "@/app/types/song";
import { siteConfig } from "@/app/config/siteConfig";

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

const fallbackOgImage = () =>
  new ImageResponse(
    <div
      style={{
        backgroundColor: "#090f2a",
        backgroundImage:
          "radial-gradient(1000px 420px at 50% -20%, rgba(236, 72, 153, 0.26), transparent 62%), linear-gradient(130deg, #0a1438 0%, #1d1239 48%, #2b1138 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
        fontFamily: "serif",
        color: "#ffffff",
        fontSize: 48,
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: "20px", display: "flex" }}>♪</div>
      <div style={{ display: "flex" }}>好きな曲9選</div>
      <div
        style={{
          fontSize: 24,
          color: "#ffe3f0",
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
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "s-maxage=604800, stale-while-revalidate=900",
      },
    },
  );

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const { searchParams } = requestUrl;
    const hl = searchParams.get("hl")?.toLowerCase() ?? "ja";
    const origin = requestUrl.origin;
    const id = searchParams.get("id");

    if (!id) {
      return fallbackOgImage();
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
      return fallbackOgImage();
    }

    // 曲データを取得
    const songs = await fetch(
      `${origin}/api/songs?hl=${encodeURIComponent(hl)}`,
    )
      .then((res) => res.json())
      .catch(() => []);

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

    const titleText = selection.title.trim() || "好きな曲9選";
    const authorText = selection.author?.trim()
      ? `by ${selection.author.trim()}`
      : "";

    const ogSongCards: OgSongCard[] = selectedSongs.map((song) => {
      let url = `https://img.youtube.com/vi/${song.video_id}/maxresdefault.jpg`;
      if (song.video_id === "fiddR-oZta4") {
        // afterglow(id:fiddR-oZta4)だけmaxresdefault.jpgが存在しないため、hqdefault.jpgを使用
        url = `https://img.youtube.com/vi/${song.video_id}/hqdefault.jpg`;
      }
      return {
        url: url,
        title: song.title,
        artist: song.artist,
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

    // フォント取得
    const notoSansRegular = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&text=" +
        encodeURIComponent(fontTextSeed),
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
        encodeURIComponent(fontTextSeed),
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
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "24px 24px 8px",
          fontFamily: "Noto Sans JP",
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
            opacity: 0.88,
            backgroundImage:
              "radial-gradient(700px 320px at 88% 12%, rgba(244, 114, 182, 0.3), transparent 58%), radial-gradient(520px 300px at 12% 92%, rgba(59, 130, 246, 0.2), transparent 62%)",
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
              color: "#ffffff",
              marginBottom: "6px",
              letterSpacing: "-0.02em",
            }}
          >
            {titleText}
          </div>
          <div
            style={{
              display: authorText ? "flex" : "none",
              fontSize: 28,
              color: "#ffe3f0",
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
                    backgroundColor: card.url ? "#12080f" : "#2a1a22",
                    borderRadius: "6px",
                    overflow: "hidden",
                    border: "1px solid rgba(244, 52, 139, 0.2)",
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
                        "linear-gradient(180deg, rgba(10, 5, 9, 0) 0%, rgba(10, 5, 9, 0.92) 70%)",
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
            color: "#f7cfe1",
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
      console.error("Failed to generate OG image:", e.message);
    }
    return fallbackOgImage();
  }
}

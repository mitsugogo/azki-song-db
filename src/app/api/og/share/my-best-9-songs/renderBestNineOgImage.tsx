import { siteConfig } from "@/app/config/siteConfig";
import {
  bestNineOgSize,
  getBestNineOgLayout,
} from "@/app/lib/myBestNineSongsOg";
import { ogColors, ogFontFamily } from "../../ogDesign";

export type BestNineOgCard = {
  url: string;
  title: string;
  artist: string;
  theme?: string;
  emptyLabel?: string;
};

/** 実際のImageResponseとプレビューの両方で使う、データ取得を伴わない描画処理。 */
export function renderBestNineOgImage({
  cards,
  title,
  author,
  size,
}: {
  cards: BestNineOgCard[];
  title: string;
  author: string;
  size: { width: number; height: number };
}) {
  const layout = getBestNineOgLayout(
    cards.length,
    cards.some((card) => !!card.theme),
  );
  const scale = Math.min(
    size.width / bestNineOgSize.width,
    size.height / bestNineOgSize.height,
  );
  let offset = 0;
  const rows = layout.rows.map((count) => {
    const row = cards.slice(offset, offset + count);
    offset += count;
    return row;
  });
  const headingSize = title.length > 32 ? 30 : 42;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#fff6fb",
      }}
    >
      <div
        style={{
          width: 1200,
          height: 630,
          flexShrink: 0,
          position: "relative",
          display: "flex",
          fontFamily: ogFontFamily,
          color: ogColors.ink,
          backgroundImage:
            "linear-gradient(135deg, #fff8fc 0%, #ffffff 48%, #fce8f4 100%)",
          transform: `scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 16,
            width: 1168,
            height: 598,
            display: "flex",
            borderRadius: 28,
            border: "2px solid #e5afd0",
            overflow: "hidden",
            boxShadow: "0 3px 8px rgba(125, 50, 91, 0.16)",
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,247,252,0.88) 100%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 5,
              display: "flex",
              borderRadius: 22,
              border: "2px solid rgba(255,255,255,0.95)",
            }}
          />
          <svg
            width="1168"
            height="598"
            viewBox="0 0 1200 630"
            style={{ position: "absolute", left: 0, top: 0 }}
          >
            <path
              d="M0 518 C210 596 370 583 566 608 C790 638 932 527 1200 503 L1200 630 L0 630 Z"
              fill="#f7c7e3"
              opacity="0.6"
            />
            <path
              d="M0 538 C250 624 406 589 593 618 C825 647 976 533 1200 527"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4"
            />
            <path
              d="M0 554 C244 627 418 605 603 629 C835 658 1003 554 1200 541"
              fill="none"
              stroke="#e9a9d0"
              strokeWidth="2"
            />
            <path
              d="M0 565 C242 638 425 620 608 640 C851 665 1010 570 1200 556"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div
          style={{
            position: "absolute",
            left: 52,
            top: 24,
            width: 1096,
            height: 94,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 100,
                height: 2,
                flexShrink: 0,
                backgroundColor: "#e4a5ca",
              }}
            />
            <div
              style={{
                display: "flex",
                maxWidth: 820,
                fontSize: headingSize,
                lineHeight: 1.15,
                fontWeight: 700,
                color: ogColors.primaryDeep,
                textAlign: "center",
                lineClamp: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                width: 100,
                height: 2,
                flexShrink: 0,
                backgroundColor: "#e4a5ca",
              }}
            />
          </div>
          {author && (
            <div
              style={{
                display: "flex",
                marginTop: 5,
                fontSize: 18,
                lineHeight: 1.1,
                color: "#886181",
              }}
            >
              {author}
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            left: 52,
            top: 128,
            width: layout.contentWidth,
            height: layout.contentHeight,
            display: "flex",
            flexDirection: "column",
            gap: layout.gap,
          }}
        >
          {rows.length === 2 && (
            <div
              style={{
                position: "absolute",
                top: layout.rowHeight + layout.gap / 2,
                left: 0,
                width: layout.contentWidth,
                height: 1,
                display: "flex",
                backgroundColor: "#efdae7",
              }}
            />
          )}
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              data-og-row={rowIndex}
              style={{
                display: "flex",
                width: layout.contentWidth,
                height: layout.rowHeight,
                flexShrink: 0,
                justifyContent: "center",
                alignItems: "center",
                gap: layout.gap,
              }}
            >
              {row.map((card, columnIndex) => (
                <div
                  key={columnIndex}
                  data-og-slot={
                    layout.rows
                      .slice(0, rowIndex)
                      .reduce((sum, count) => sum + count, 0) + columnIndex
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: layout.cardWidth,
                    height: layout.rowHeight,
                    flexShrink: 0,
                    padding: "0 12px",
                    ...(columnIndex < row.length - 1
                      ? { borderRight: "1px solid #efdae7" }
                      : {}),
                  }}
                >
                  {layout.themeHeight > 0 && (
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        height: layout.themeHeight,
                        flexShrink: 0,
                        marginBottom: 6,
                        alignItems: "flex-start",
                        color: ogColors.primaryDeep,
                        fontSize: 16,
                        lineHeight: 1.1,
                        fontWeight: 700,
                        lineClamp: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {card.theme || ""}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: layout.horizontal ? "row" : "column",
                      alignItems: layout.horizontal ? "center" : "flex-start",
                      justifyContent: "center",
                      width: "100%",
                      gap: layout.horizontal
                        ? cards.length === 1
                          ? 32
                          : 20
                        : 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignSelf: "center",
                        alignItems: "center",
                        justifyContent: "center",
                        width: layout.thumbnailWidth,
                        height: layout.thumbnailHeight,
                        flexShrink: 0,
                        borderRadius: cards.length === 1 ? 14 : 9,
                        overflow: "hidden",
                        backgroundColor: card.url ? "#fff" : "#f8e8f1",
                        border: "1px solid rgba(151, 91, 125, 0.14)",
                      }}
                    >
                      {card.url ? (
                        <img
                          src={card.url}
                          alt=""
                          width={layout.thumbnailWidth}
                          height={layout.thumbnailHeight}
                          style={{
                            width: layout.thumbnailWidth,
                            height: layout.thumbnailHeight,
                            objectFit: "cover",
                            objectPosition: "center",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            padding: 8,
                            width: "100%",
                            maxHeight: layout.thumbnailHeight,
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            fontSize: Math.min(20, layout.artistFontSize),
                            lineHeight: 1.2,
                            color: ogColors.muted,
                            lineClamp: 3,
                            overflow: "hidden",
                          }}
                        >
                          {card.emptyLabel || ""}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: layout.horizontal
                          ? "center"
                          : "flex-start",
                        ...(layout.horizontal
                          ? {
                              flex: 1,
                              minWidth: 0,
                              height: layout.thumbnailHeight,
                            }
                          : {
                              width: layout.thumbnailWidth,
                              height: layout.textHeight,
                              alignSelf: "center",
                            }),
                        overflow: "hidden",
                      }}
                    >
                      {card.title && (
                        <div
                          style={{
                            display: "flex",
                            width: "100%",
                            flexShrink: 0,
                            maxHeight: Math.ceil(
                              layout.titleFontSize * 1.2 * layout.titleLines,
                            ),
                            fontSize: layout.titleFontSize,
                            lineHeight: 1.2,
                            fontWeight: 700,
                            color: ogColors.ink,
                            lineClamp: layout.titleLines,
                            wordBreak: "break-word",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {card.title}
                        </div>
                      )}
                      {card.artist && (
                        <div
                          style={{
                            display: "flex",
                            width: "100%",
                            flexShrink: 0,
                            marginTop: 6,
                            maxHeight: Math.ceil(
                              layout.artistFontSize * 1.2 * layout.artistLines,
                            ),
                            fontSize: layout.artistFontSize,
                            lineHeight: 1.2,
                            color: "#886181",
                            lineClamp: layout.artistLines,
                            wordBreak: "break-word",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {card.artist}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 200,
            top: 584,
            width: 800,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            color: "#886181",
            letterSpacing: 1,
          }}
        >
          {siteConfig.siteName}
        </div>
        <svg
          width="46"
          height="62"
          viewBox="0 0 54 72"
          style={{
            position: "absolute",
            right: 48,
            bottom: 34,
            transform: "rotate(12deg)",
          }}
        >
          <path
            d="M27 5 L27 43 C21 40 9 43 7 50 C4 62 24 63 29 50 L34 19 C38 25 46 25 45 35 C55 24 39 14 27 5 Z"
            fill="#e88fbe"
            stroke="#ffffff"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}

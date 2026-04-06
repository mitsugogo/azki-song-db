import { baseUrl } from "@/app/config/siteConfig";

export const IMAGE_WIDTH = 1080;
export const IMAGE_HEIGHT = 1350;
export const MAX_TIMELINE_ROWS = 8;

export type TimelineRowInput = {
  year: string;
  month: string;
  content: string;
};

export type TimelineRow = {
  year: string;
  month: string;
  content: string;
};

type ImageGeneratorOptions = {
  name: string;
  handle?: string;
  rows: TimelineRowInput[];
  iconDataUrl?: string | null;
  favoriteOriginalSong?: string;
  favoriteOriginalSongThumbnailUrl?: string;
  locale?: "ja" | "en";
};

type WrappedText = {
  lines: string[];
  truncated: boolean;
};

export const sanitizeTimelineRows = (
  rows: TimelineRowInput[],
  maxRows = MAX_TIMELINE_ROWS,
): TimelineRow[] => {
  return rows
    .map((row) => ({
      year: row.year.trim(),
      month: row.month.trim(),
      content: row.content.trim(),
    }))
    .filter((row) => row.year && row.content)
    .slice(0, maxRows);
};

export const buildXPostText = (
  name: string,
  rowCount: number,
  locale: "ja" | "en" = "ja",
  handle?: string,
): string => {
  const cleanName = name.trim() || (locale === "ja" ? "名無し" : "Anonymous");
  if (locale === "en") {
    const url = new URL("/en/share/where-my-azkichi-began", baseUrl);
    return `${cleanName}'s AZKi timeline\n${url.toString()}\n#私はここから開拓者 #AZSongDB`;
  }

  const url = new URL("/share/where-my-azkichi-began", baseUrl);
  return `${cleanName}の「あなたのあずきちはどこから？」\n${url.toString()}\n#私はここから開拓者 #AZSongDB`;
};

const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//.test(src)) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    image.src = src;
  });
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): WrappedText => {
  if (!text) {
    return { lines: [""], truncated: false };
  }

  const tokens = text.split("");
  const lines: string[] = [];
  let current = "";

  for (const token of tokens) {
    const trial = current + token;
    const trialWidth = ctx.measureText(trial).width;
    if (trialWidth <= maxWidth) {
      current = trial;
      continue;
    }

    if (!current) {
      lines.push(token);
      current = "";
    } else {
      lines.push(current);
      current = token;
    }

    if (lines.length >= maxLines) {
      const last = lines[maxLines - 1] || "";
      const trimmed = `${last.slice(0, Math.max(0, last.length - 1))}…`;
      lines[maxLines - 1] = trimmed;
      return { lines, truncated: true };
    }
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    const clipped = lines.slice(0, maxLines);
    const last = clipped[maxLines - 1] || "";
    clipped[maxLines - 1] = `${last.slice(0, Math.max(0, last.length - 1))}…`;
    return { lines: clipped, truncated: true };
  }

  return { lines, truncated: false };
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const drawBackground = (ctx: CanvasRenderingContext2D): void => {
  const gradient = ctx.createLinearGradient(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  gradient.addColorStop(0, "#fff8f2");
  gradient.addColorStop(0.52, "#f3f8ff");
  gradient.addColorStop(1, "#eef6ff");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#ffcfe3";
  for (let i = 0; i < 16; i += 1) {
    const size = 60 + (i % 5) * 24;
    const x = (i * 173) % IMAGE_WIDTH;
    const y = (i * 227) % IMAGE_HEIGHT;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

const drawFittedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    initialFontSize: number;
    minFontSize: number;
    weight?: 400 | 500 | 700;
    family?: string;
    color?: string;
    align?: CanvasTextAlign;
  },
): number => {
  const weight = options.weight ?? 500;
  const family = options.family ?? "'Noto Sans JP', sans-serif";
  const align = options.align ?? "left";
  let fontSize = options.initialFontSize;

  ctx.textAlign = align;
  while (fontSize > options.minFontSize) {
    ctx.font = `${weight} ${fontSize}px ${family}`;
    if (ctx.measureText(text).width <= options.maxWidth) {
      break;
    }
    fontSize -= 1;
  }

  if (options.color) {
    ctx.fillStyle = options.color;
  }
  ctx.font = `${weight} ${fontSize}px ${family}`;
  ctx.fillText(text, options.x, options.y);

  return fontSize;
};

const getTimelineMetrics = (rowCount: number, availableHeight: number) => {
  const count = Math.max(1, rowCount);
  const gap = count >= 9 ? 10 : count >= 7 ? 12 : 18;
  const raw = Math.floor((availableHeight - gap * (count - 1)) / count);
  const rowHeight = Math.max(56, Math.min(130, raw));
  const contentFontSize = Math.max(
    13,
    Math.min(22, Math.floor((rowHeight - 18) / 3)),
  );
  const contentLineGap = 3;
  const contentInnerHeight = Math.max(28, rowHeight - 18);
  const lineStep = contentFontSize + contentLineGap;
  const maxContentLines = Math.max(
    1,
    Math.floor((contentInnerHeight + contentLineGap) / lineStep),
  );

  return { rowHeight, gap, contentFontSize, maxContentLines, contentLineGap };
};

export const generateWhereMyAzkichiBeganImage = async (
  options: ImageGeneratorOptions,
): Promise<Blob> => {
  const rows = sanitizeTimelineRows(options.rows);
  if (rows.length === 0) {
    throw new Error("年表を1行以上入力してください");
  }

  const name = options.name.trim();
  if (!name) {
    throw new Error("名前を入力してください");
  }
  const handle = options.handle?.trim() || "";
  const favoriteOriginalSong = options.favoriteOriginalSong?.trim() || "";
  const favoriteOriginalSongThumbnailUrl =
    options.favoriteOriginalSongThumbnailUrl?.trim() || "";
  const normalizedHandle = handle
    ? handle.startsWith("@")
      ? handle
      : `@${handle}`
    : "";

  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvasの初期化に失敗しました");
  }

  drawBackground(ctx);

  drawRoundedRect(ctx, 48, 46, IMAGE_WIDTH - 96, IMAGE_HEIGHT - 92, 40);
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 165, 201, 0.56)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const titleText =
    options.locale === "en"
      ? "Where did your AZKi journey begin?"
      : "あなたのあずきちはどこから？";
  drawFittedText(ctx, titleText, {
    x: 90,
    y: 150,
    maxWidth: IMAGE_WIDTH - 180,
    initialFontSize: 56,
    minFontSize: 40,
    weight: 700,
    color: "#d14d86",
  });

  ctx.fillStyle = "#2e3c6a";
  ctx.font = "500 40px 'Noto Sans JP', sans-serif";
  ctx.fillText(name, 250, 232);

  if (normalizedHandle) {
    ctx.fillStyle = "rgba(92, 112, 168, 0.94)";
    ctx.font = "500 28px 'Noto Sans JP', sans-serif";
    ctx.fillText(normalizedHandle, 250, 274);
  }

  const iconX = 90;
  const iconY = 178;
  const iconSize = 130;

  ctx.fillStyle = "rgba(255, 164, 200, 0.26)";
  ctx.beginPath();
  ctx.arc(
    iconX + iconSize / 2,
    iconY + iconSize / 2,
    iconSize / 2,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  if (options.iconDataUrl) {
    try {
      const iconImage = await loadImageElement(options.iconDataUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        iconX + iconSize / 2,
        iconY + iconSize / 2,
        iconSize / 2,
        0,
        Math.PI * 2,
      );
      ctx.clip();
      ctx.drawImage(iconImage, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    } catch {
      // アイコン読み込み失敗時はプレースホルダーを維持
    }
  }

  ctx.strokeStyle = "rgba(244, 116, 172, 0.9)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  const timelineStartY = normalizedHandle ? 350 : 320;
  const favoriteRowY = 1144;
  const timelineBottomY = favoriteOriginalSong ? favoriteRowY - 14 : 1180;
  ctx.beginPath();
  ctx.moveTo(178, timelineStartY);
  ctx.lineTo(178, timelineBottomY);
  ctx.stroke();

  const timelineBasePadding = 10;
  const availableTimelineHeight = Math.max(
    520,
    timelineBottomY - timelineStartY - timelineBasePadding,
  );
  const metrics = getTimelineMetrics(rows.length, availableTimelineHeight);
  const baseY = timelineStartY + 10;

  rows.forEach((row, index) => {
    const y = baseY + index * (metrics.rowHeight + metrics.gap);

    ctx.fillStyle = "#f36aa5";
    ctx.beginPath();
    ctx.arc(178, y + metrics.rowHeight / 2, 14, 0, Math.PI * 2);
    ctx.fill();

    drawRoundedRect(ctx, 224, y, 170, metrics.rowHeight, 20);
    ctx.fillStyle = "rgba(255, 198, 224, 0.7)";
    ctx.fill();

    ctx.fillStyle = "#8a2f5d";
    ctx.font = "700 28px 'Noto Sans JP', sans-serif";
    ctx.fillText(`${row.year}年`, 246, y + 40);
    if (row.month) {
      ctx.font = "500 24px 'Noto Sans JP', sans-serif";
      ctx.fillText(`${row.month}月`, 246, y + 70);
    }

    drawRoundedRect(ctx, 416, y, 564, metrics.rowHeight, 20);
    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.fill();

    ctx.fillStyle = "#30426f";
    ctx.font = `500 ${metrics.contentFontSize}px 'Noto Sans JP', sans-serif`;
    const wrapped = wrapText(ctx, row.content, 520, metrics.maxContentLines);
    const contentLineCount = Math.max(1, wrapped.lines.length);
    const contentBlockHeight =
      contentLineCount * metrics.contentFontSize +
      (contentLineCount - 1) * metrics.contentLineGap;
    const firstBaseline =
      y +
      Math.max(
        metrics.contentFontSize,
        Math.floor((metrics.rowHeight - contentBlockHeight) / 2) +
          metrics.contentFontSize,
      );

    wrapped.lines.forEach((line, lineIndex) => {
      const lineY =
        firstBaseline +
        lineIndex * (metrics.contentFontSize + metrics.contentLineGap);
      ctx.fillText(line, 438, lineY);
    });
  });

  if (favoriteOriginalSong) {
    const favoriteRowX = 90;
    const favoriteRowHeight = 86;
    const labelY = favoriteRowY + 53;
    const thumbnailWidth = 96;
    const thumbnailHeight = 54;
    const rightPadding = 24;
    const rowRightX = IMAGE_WIDTH - favoriteRowX;
    const favoriteSongLabel =
      options.locale === "en" ? "Favorite song" : "推しオリ曲";
    const separator = options.locale === "en" ? ":" : "：";
    const labelText = `${favoriteSongLabel}${separator}`;
    const labelX = 120;
    const labelFontSize = options.locale === "en" ? 22 : 30;

    ctx.fillStyle = "rgba(133, 50, 95, 0.95)";
    ctx.font = `700 ${labelFontSize}px 'Noto Sans JP', sans-serif`;
    const labelWidth = ctx.measureText(labelText).width;
    const minThumbnailX = labelX + Math.ceil(labelWidth) + 16;
    const maxThumbnailX = rowRightX - rightPadding - thumbnailWidth - 220;
    const thumbnailX = Math.max(minThumbnailX, 246);
    const resolvedThumbnailX = Math.min(thumbnailX, maxThumbnailX);
    const songTextX = resolvedThumbnailX + thumbnailWidth + 16;
    const songTextMaxWidth = Math.max(
      120,
      rowRightX - rightPadding - songTextX,
    );
    const thumbnailY =
      favoriteRowY + Math.floor((favoriteRowHeight - thumbnailHeight) / 2);

    drawRoundedRect(
      ctx,
      favoriteRowX,
      favoriteRowY,
      IMAGE_WIDTH - 180,
      favoriteRowHeight,
      18,
    );
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(244, 116, 172, 0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(133, 50, 95, 0.95)";
    ctx.font = `700 ${labelFontSize}px 'Noto Sans JP', sans-serif`;
    ctx.fillText(labelText, labelX, labelY);

    drawRoundedRect(
      ctx,
      resolvedThumbnailX,
      thumbnailY,
      thumbnailWidth,
      thumbnailHeight,
      10,
    );
    ctx.fillStyle = "rgba(255, 214, 232, 0.72)";
    ctx.fill();

    if (favoriteOriginalSongThumbnailUrl) {
      try {
        const thumbnailImage = await loadImageElement(
          favoriteOriginalSongThumbnailUrl,
        );
        ctx.save();
        drawRoundedRect(
          ctx,
          resolvedThumbnailX,
          thumbnailY,
          thumbnailWidth,
          thumbnailHeight,
          10,
        );
        ctx.clip();
        ctx.drawImage(
          thumbnailImage,
          resolvedThumbnailX,
          thumbnailY,
          thumbnailWidth,
          thumbnailHeight,
        );
        ctx.restore();
      } catch {
        // サムネイル読み込み失敗時はプレースホルダーを維持
      }
    }

    drawFittedText(ctx, favoriteOriginalSong, {
      x: songTextX,
      y: labelY,
      maxWidth: songTextMaxWidth,
      initialFontSize: 40,
      minFontSize: 20,
      weight: 700,
      color: "#2f406e",
    });
  }

  const generatedAt = new Date();
  const generatedAtText =
    options.locale === "en"
      ? `Generated: ${generatedAt.getFullYear()}-${String(
          generatedAt.getMonth() + 1,
        ).padStart(2, "0")}-${String(generatedAt.getDate()).padStart(2, "0")}`
      : `生成日: ${generatedAt.getFullYear()}/${String(
          generatedAt.getMonth() + 1,
        ).padStart(2, "0")}/${String(generatedAt.getDate()).padStart(2, "0")}`;

  drawFittedText(ctx, generatedAtText, {
    x: IMAGE_WIDTH - 76,
    y: IMAGE_HEIGHT - 88,
    maxWidth: 300,
    initialFontSize: 18,
    minFontSize: 14,
    weight: 500,
    color: "rgba(102, 121, 168, 0.88)",
    align: "right",
  });

  ctx.fillStyle = "rgba(66, 84, 131, 0.9)";
  ctx.font = "500 24px 'Noto Sans JP', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("AZKi Song Database", IMAGE_WIDTH - 76, IMAGE_HEIGHT - 58);
  ctx.textAlign = "left";

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((generated) => resolve(generated), "image/png", 1);
  });

  if (!blob) {
    throw new Error("画像生成に失敗しました");
  }

  return blob;
};

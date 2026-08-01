import type { sheets_v4 } from "googleapis";
import {
  getSheetsServiceAccountClient,
  GOOGLE_SHEETS_WRITE_SCOPE,
} from "./googleSheets";

const CHANNELS_SHEET_NAME = "channels";
const MINIMUM_APPEND_COLUMNS = 26;
const GOOGLE_SHEETS_EPOCH_UTC = Date.UTC(1899, 11, 30);
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

type Sheet = sheets_v4.Schema$Sheet;
type CellData = sheets_v4.Schema$CellData;
type RowData = sheets_v4.Schema$RowData;

type ColumnMap = Record<string, number>;

export type UpsertChannelInput = {
  channelId: string;
  channelName: string;
};

export type SongMetadataUpdate = {
  videoId: string;
  videoUri?: string;
  start: number;
  matchTitle?: string;
  matchArtist?: string;
  matchAlbum?: string;
  title: string;
  artist: string;
  album: string;
  albumListUri?: string;
  singer: string;
  videoTitle: string;
  broadcastDate: string;
  tags: string;
  extra: string;
};

const getWriteClient = () =>
  getSheetsServiceAccountClient({
    scopes: [GOOGLE_SHEETS_WRITE_SCOPE],
  });

const getRows = (sheet: Sheet): RowData[] =>
  (sheet.data?.[0]?.rowData ?? []).filter((row): row is RowData =>
    Boolean(row),
  );

const getDisplayString = (cell: CellData | null | undefined) => {
  if (!cell) return "";
  if (typeof cell.formattedValue === "string") return cell.formattedValue;

  const value = cell.userEnteredValue;
  if (typeof value?.stringValue === "string") return value.stringValue;
  if (typeof value?.numberValue === "number") return String(value.numberValue);
  if (typeof value?.boolValue === "boolean") return String(value.boolValue);
  return "";
};

const getNumber = (cell: CellData | null | undefined) => {
  const numberValue = cell?.userEnteredValue?.numberValue;
  if (typeof numberValue === "number") return numberValue;

  const parsed = Number(getDisplayString(cell));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getHyperlink = (cell: CellData | null | undefined) =>
  cell?.hyperlink?.trim() ?? "";

const normalizeHeader = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[（）()\s?？.,，、!！]/g, "")
    .toLowerCase();

const getHeaders = (rows: RowData[]) =>
  (rows[0]?.values ?? []).map((cell) => getDisplayString(cell).trim());

const findColumn = (headers: string[], aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) =>
    normalizedAliases.includes(normalizeHeader(header)),
  );
};

const toColumnName = (columnIndex: number) => {
  let value = columnIndex + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
};

const quoteSheetName = (sheetName: string) =>
  `'${sheetName.replace(/'/g, "''")}'`;

const getCellValue = (row: RowData, columnIndex: number) =>
  row.values?.[columnIndex];

const buildCellRange = (
  sheetName: string,
  rowNumber: number,
  columnIndex: number,
) => `${quoteSheetName(sheetName)}!${toColumnName(columnIndex)}${rowNumber}`;

const writeRawCellsForSheet = async ({
  spreadsheetId,
  sheets,
  sheetName,
  updates,
}: {
  spreadsheetId: string;
  sheets: ReturnType<typeof getWriteClient>["sheets"];
  sheetName: string;
  updates: Array<{
    rowNumber: number;
    columnIndex: number;
    value: string | number;
  }>;
}) => {
  if (updates.length === 0) return;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: updates.map((update) => ({
        range: buildCellRange(sheetName, update.rowNumber, update.columnIndex),
        values: [[update.value]],
      })),
    },
  });
};

const writeUserEnteredCells = async ({
  spreadsheetId,
  sheets,
  sheetName,
  updates,
}: {
  spreadsheetId: string;
  sheets: ReturnType<typeof getWriteClient>["sheets"];
  sheetName: string;
  updates: Array<{
    rowNumber: number;
    columnIndex: number;
    value: string;
  }>;
}) => {
  if (updates.length === 0) return;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: updates.map((update) => ({
        range: buildCellRange(sheetName, update.rowNumber, update.columnIndex),
        values: [[update.value]],
      })),
    },
  });
};

const readSpreadsheet = async () => {
  const { spreadsheetId, sheets } = getWriteClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: true,
    fields:
      "sheets(properties(title),data/rowData/values(userEnteredValue,formattedValue,hyperlink))",
  });

  return {
    spreadsheetId,
    sheets,
    sheetList: (response.data.sheets ?? []).filter((sheet): sheet is Sheet =>
      Boolean(sheet),
    ),
  };
};

const findChannelsSheet = (sheetList: Sheet[]) =>
  sheetList.find(
    (sheet) =>
      sheet.properties?.title?.trim().toLowerCase() === CHANNELS_SHEET_NAME,
  );

const channelColumns = (headers: string[]): ColumnMap => ({
  youtubeId: findColumn(headers, [
    "YouTube ID",
    "YouTubeId",
    "youtube_id",
    "channel ID",
    "channel_id",
  ]),
  channelName: findColumn(headers, [
    "チャンネル名",
    "channel name",
    "channel",
    "name",
  ]),
});

const assertText = (value: unknown, label: string, maxLength = 500) => {
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new Error(`${label}が不正です`);
  }
  return value.trim();
};

export async function upsertChannel(input: UpsertChannelInput) {
  const channelId = assertText(input.channelId, "channelId", 200);
  const channelName = assertText(input.channelName, "channelName", 500);
  if (!channelId || !channelName) {
    throw new Error("channelId と channelName は必須です");
  }

  const { spreadsheetId, sheets, sheetList } = await readSpreadsheet();
  const sheet = findChannelsSheet(sheetList);
  if (!sheet) throw new Error("channelsシートが見つかりません");

  const sheetName = sheet.properties?.title ?? CHANNELS_SHEET_NAME;
  const rows = getRows(sheet);
  const columns = channelColumns(getHeaders(rows));
  if (columns.youtubeId < 0 || columns.channelName < 0) {
    throw new Error("channelsシートの列名を特定できません");
  }

  let matchingRowIndex = -1;
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const existingId = getDisplayString(
      getCellValue(row, columns.youtubeId),
    ).trim();
    const existingName = getDisplayString(
      getCellValue(row, columns.channelName),
    ).trim();
    if (
      existingId === channelId ||
      (!existingId && existingName === channelName)
    ) {
      matchingRowIndex = rowIndex;
      break;
    }
  }

  if (matchingRowIndex >= 1) {
    const rowNumber = matchingRowIndex + 1;
    await writeRawCellsForSheet({
      spreadsheetId,
      sheets,
      sheetName,
      updates: [
        { rowNumber, columnIndex: columns.youtubeId, value: channelId },
        { rowNumber, columnIndex: columns.channelName, value: channelName },
      ],
    });
    return { added: false, channelId, channelName };
  }

  const headers = getHeaders(rows);
  const appendValues = new Array(
    Math.max(MINIMUM_APPEND_COLUMNS, headers.length),
  ).fill("");
  appendValues[columns.youtubeId] = channelId;
  appendValues[columns.channelName] = channelName;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${quoteSheetName(sheetName)}!A:${toColumnName(
      appendValues.length - 1,
    )}`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [appendValues] },
  });

  return { added: true, channelId, channelName };
}

const metadataColumns = (headers: string[]): ColumnMap => ({
  title: findColumn(headers, ["曲名", "title"]),
  artist: findColumn(headers, ["アーティスト", "artist"]),
  album: findColumn(headers, ["アルバム", "album"]),
  singer: findColumn(headers, ["歌った人", "sing"]),
  video: findColumn(headers, ["動画", "動画タイトル", "video", "video_uri"]),
  start: findColumn(headers, ["start", "開始", "開始時刻"]),
  broadcastDate: findColumn(headers, ["配信日", "date", "broadcast_at"]),
  tags: findColumn(headers, ["タグ", "tags", "tags（カンマ区切り）"]),
  extra: findColumn(headers, ["備考", "extra", "note"]),
});

const extractYouTubeVideoId = (videoUri: string) => {
  const value = videoUri.trim();
  if (!value) return "";
  if (YOUTUBE_ID_PATTERN.test(value)) return value;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return YOUTUBE_ID_PATTERN.test(id) ? id : "";
    }

    if (hostname === "youtube.com" || hostname === "music.youtube.com") {
      const queryId = url.searchParams.get("v") ?? "";
      if (YOUTUBE_ID_PATTERN.test(queryId)) return queryId;

      const segments = url.pathname.split("/").filter(Boolean);
      const candidate = ["embed", "shorts", "live"].includes(segments[0] ?? "")
        ? (segments[1] ?? "")
        : (segments.at(-1) ?? "");
      return YOUTUBE_ID_PATTERN.test(candidate) ? candidate : "";
    }
  } catch {
    return "";
  }

  return "";
};

const toDateSerial = (value: string) => {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("配信日の形式が不正です");
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("配信日が不正です");
  }
  return (date.getTime() - GOOGLE_SHEETS_EPOCH_UTC) / DAY_IN_MS;
};

const buildHyperlinkFormula = (uri: string, label: string) => {
  const escapedUri = uri.replace(/"/g, '""');
  const escapedLabel = label.replace(/"/g, '""');
  return `=HYPERLINK("${escapedUri}","${escapedLabel}")`;
};

const findSongRow = (
  sheetList: Sheet[],
  videoId: string,
  start: number,
  hints?: {
    title?: string;
    artist?: string;
    album?: string;
  },
) => {
  let fallbackMatch: {
    sheet: Sheet;
    sheetName: string;
    rows: RowData[];
    columns: ColumnMap;
    row: RowData;
    rowNumber: number;
  } | null = null;

  for (const sheet of sheetList) {
    const sheetName = sheet.properties?.title?.trim() ?? "";
    if (
      !sheetName ||
      ["artists", "song_titles", CHANNELS_SHEET_NAME].includes(
        sheetName.toLowerCase(),
      )
    ) {
      continue;
    }

    const rows = getRows(sheet);
    const columns = metadataColumns(getHeaders(rows));
    if (columns.video < 0 || columns.start < 0) continue;

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const videoUri =
        getHyperlink(getCellValue(row, columns.video)) ||
        getDisplayString(getCellValue(row, columns.video));
      const currentVideoId = extractYouTubeVideoId(videoUri);
      const currentStart = Math.round(
        getNumber(getCellValue(row, columns.start)) * 24 * 60 * 60,
      );
      if (currentVideoId === videoId && currentStart === start) {
        const match = {
          sheet,
          sheetName,
          rows,
          columns,
          row,
          rowNumber: rowIndex + 1,
        };
        const titleMatches =
          !hints?.title ||
          columns.title < 0 ||
          getDisplayString(getCellValue(row, columns.title)).trim() ===
            hints.title.trim();
        const artistMatches =
          !hints?.artist ||
          columns.artist < 0 ||
          getDisplayString(getCellValue(row, columns.artist)).trim() ===
            hints.artist.trim();
        const albumMatches =
          !hints?.album ||
          columns.album < 0 ||
          getDisplayString(getCellValue(row, columns.album)).trim() ===
            hints.album.trim();

        if (titleMatches && artistMatches && albumMatches) return match;
        fallbackMatch ??= match;
      }
    }
  }
  return fallbackMatch;
};

export async function updateSongMetadata(input: SongMetadataUpdate) {
  const videoId = assertText(input.videoId, "videoId", 200);
  const videoUri = assertText(
    input.videoUri || `https://www.youtube.com/watch?v=${videoId}`,
    "videoUri",
    2_000,
  );
  const start = Number(input.start);
  if (!videoId || !Number.isFinite(start) || start < 0) {
    throw new Error("videoId と start が不正です");
  }

  const metadata = {
    title: assertText(input.title, "title"),
    artist: assertText(input.artist, "artist"),
    album: assertText(input.album, "album"),
    singer: assertText(input.singer, "singer"),
    videoTitle: assertText(input.videoTitle, "videoTitle", 2_000),
    broadcastDate: assertText(input.broadcastDate, "broadcastDate", 20),
    tags: assertText(input.tags, "tags", 2_000),
    extra: assertText(input.extra, "extra", 4_000),
  };

  const { spreadsheetId, sheets, sheetList } = await readSpreadsheet();
  const match = findSongRow(sheetList, videoId, Math.round(start), {
    title: input.matchTitle,
    artist: input.matchArtist,
    album: input.matchAlbum,
  });
  if (!match) throw new Error("対象の楽曲行が見つかりません");

  const { sheetName, columns, rowNumber, row } = match;
  const rawUpdates: Array<{
    rowNumber: number;
    columnIndex: number;
    value: string | number;
  }> = [];
  const linkUpdates: Array<{
    rowNumber: number;
    columnIndex: number;
    value: string;
  }> = [];

  const addRawUpdate = (columnIndex: number, value: string | number) => {
    if (columnIndex >= 0) rawUpdates.push({ rowNumber, columnIndex, value });
  };

  addRawUpdate(columns.title, metadata.title);
  addRawUpdate(columns.artist, metadata.artist);
  addRawUpdate(columns.singer, metadata.singer);
  addRawUpdate(columns.broadcastDate, toDateSerial(metadata.broadcastDate));
  addRawUpdate(columns.tags, metadata.tags);
  addRawUpdate(columns.extra, metadata.extra);

  if (columns.album >= 0) {
    const albumUri =
      input.albumListUri?.trim() ||
      getHyperlink(getCellValue(row, columns.album));
    if (albumUri) {
      linkUpdates.push({
        rowNumber,
        columnIndex: columns.album,
        value: buildHyperlinkFormula(albumUri, metadata.album),
      });
    } else {
      addRawUpdate(columns.album, metadata.album);
    }
  }

  if (columns.video >= 0) {
    linkUpdates.push({
      rowNumber,
      columnIndex: columns.video,
      value: buildHyperlinkFormula(videoUri, metadata.videoTitle),
    });
  }

  await writeRawCellsForSheet({
    spreadsheetId,
    sheets,
    sheetName,
    updates: rawUpdates,
  });
  await writeUserEnteredCells({
    spreadsheetId,
    sheets,
    sheetName,
    updates: linkUpdates,
  });

  return { sheetName, rowNumber, videoId, start: Math.round(start) };
}

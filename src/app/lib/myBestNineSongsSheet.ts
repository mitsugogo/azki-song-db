import { google } from "googleapis";
import { randomBytes } from "crypto";
import { normalizeSelection } from "./myBestNineSongs";

const SHEET_NAME = "推し曲9選";

const getSheetsClient = () => {
  const spreadsheetId = process.env.SAVE_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!spreadsheetId) {
    throw new Error("SAVE_SPREADSHEET_ID が未設定です");
  }
  if (!clientEmail || !privateKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY が未設定です",
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return {
    spreadsheetId,
    sheets: google.sheets({ version: "v4", auth }),
  };
};

const buildRange = (a1: string) => `'${SHEET_NAME}'!${a1}`;

const generateShareId = () => {
  // YouTube動画ID相当の11文字（URL-safe）
  return randomBytes(9)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
    .slice(0, 11);
};

export const createMyBestNineSongsEntry = async (selection: unknown) => {
  const normalized = normalizeSelection(selection);
  if (!normalized) {
    throw new Error("保存データが不正です");
  }

  const { spreadsheetId, sheets } = getSheetsClient();
  const id = generateShareId();
  const now = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: buildRange("A:E"),
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          id,
          JSON.stringify(normalized),
          normalized.title,
          normalized.author || "",
          now,
        ],
      ],
    },
  });

  return { id, selection: normalized, createdAt: now };
};

export const findMyBestNineSongsEntryById = async (id: string) => {
  if (!id || !/^[A-Za-z0-9_-]{8,20}$/.test(id)) {
    return null;
  }

  const { spreadsheetId, sheets } = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: buildRange("A:E"),
  });

  const rows = response.data.values || [];
  for (const row of rows) {
    const rowId = row?.[0];
    const payload = row?.[1];
    // 新形式: A=id, B=payload, C=title, D=author, E=createdAt
    const createdAt = row?.[4] || "";
    if (rowId !== id || typeof payload !== "string") continue;

    try {
      const parsed = JSON.parse(payload);
      const normalized = normalizeSelection(parsed);
      if (!normalized) return null;
      return { id, selection: normalized, createdAt };
    } catch {
      return null;
    }
  }

  return null;
};

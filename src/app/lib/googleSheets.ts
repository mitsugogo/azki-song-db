import { google } from "googleapis";

export const GOOGLE_SHEETS_READONLY_SCOPE =
  "https://www.googleapis.com/auth/spreadsheets.readonly";
export const GOOGLE_SHEETS_WRITE_SCOPE =
  "https://www.googleapis.com/auth/spreadsheets";

type SheetsServiceAccountClientOptions = {
  spreadsheetIdEnv?: string;
  scopes?: string[];
};

const getPrivateKey = () =>
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const hasSheetsServiceAccountConfig = (
  spreadsheetIdEnv = "SPREADSHEET_ID",
) =>
  Boolean(
    process.env[spreadsheetIdEnv] &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    getPrivateKey(),
  );

export const getSheetsServiceAccountClient = ({
  spreadsheetIdEnv = "SPREADSHEET_ID",
  scopes = [GOOGLE_SHEETS_READONLY_SCOPE],
}: SheetsServiceAccountClientOptions = {}) => {
  const spreadsheetId = process.env[spreadsheetIdEnv];
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = getPrivateKey();

  if (!spreadsheetId) {
    throw new Error(`${spreadsheetIdEnv} が未設定です`);
  }
  if (!clientEmail || !privateKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY が未設定です",
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes,
  });

  return {
    spreadsheetId,
    sheets: google.sheets({ version: "v4", auth }),
  };
};

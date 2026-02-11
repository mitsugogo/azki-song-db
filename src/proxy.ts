import { type NextRequest, NextResponse } from "next/server";

// 固定の許可オリジン
const allowedOrigins = [
  // Production
  "https://azki-song-db.vercel.app/",
  // Develop branch
  "https://azki-song-db-git-develop-mitsugogos-projects.vercel.app",
  // main branch
  "https://azki-song-db-git-main-mitsugogos-projects.vercel.app",

  // 環境変数から許可オリジンを取得
  process.env.PUBLIC_BASE_URL,
];

// 動的な Vercel プレビュー URL パターン（PR ブランチ用）
// azki-song-db-git-issue-30-mitsugogos-projects.vercel.app などにマッチ
const vercelPreviewPattern =
  /^(?:https:\/\/azki-song-db-git-[\w-]+-mitsugogos-projects\.vercel\.app)$/;

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function isAllowedOrigin(origin: string): boolean {
  // 開発モードのときは localhost を許可
  if (process.env.NODE_ENV === "development") {
    if (origin.startsWith("http://localhost")) return true;
    if (origin.startsWith("http://127.0.0.1")) return true;
    if (origin.startsWith("https://localhost")) return true;
    if (origin.startsWith("https://127.0.0.1")) return true;
  }

  if (allowedOrigins.includes(origin)) return true;
  if (vercelPreviewPattern.test(origin)) return true;
  return false;
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = origin ? isAllowedOrigin(origin) : false;

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    const preflightHeaders: Record<string, string> = {
      ...(allowed && { "Access-Control-Allow-Origin": origin }),
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
      ...corsOptions,
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Handle simple requests
  const response = NextResponse.next();

  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Access-Control-Allow-Credentials", "true");

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};

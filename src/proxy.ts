import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import createMiddleware from "next-intl/middleware";

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

export const middleware = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localeDetection: false,
});

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api")) {
    const requestHeaders = new Headers(request.headers);
    const segments = request.nextUrl.pathname.split("/").filter(Boolean);
    const maybeLocale = segments[0];
    const locale = routing.locales.includes(
      maybeLocale as (typeof routing.locales)[number],
    )
      ? maybeLocale
      : routing.defaultLocale;

    requestHeaders.set("x-locale", locale);

    if (locale !== routing.defaultLocale) {
      const rewrittenUrl = request.nextUrl.clone();
      const restSegments = segments.slice(1);
      rewrittenUrl.pathname =
        restSegments.length > 0 ? `/${restSegments.join("/")}` : "/";
      return NextResponse.rewrite(rewrittenUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    }

    if (maybeLocale === routing.defaultLocale) {
      const rewrittenUrl = request.nextUrl.clone();
      const restSegments = segments.slice(1);
      rewrittenUrl.pathname =
        restSegments.length > 0 ? `/${restSegments.join("/")}` : "/";
      return NextResponse.rewrite(rewrittenUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

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
  matcher: [
    "/",
    "/(ja|en)/:path*",
    "/((?!_next|_vercel|.*\\..*).*)",
    "/api/:path*",
  ],
};

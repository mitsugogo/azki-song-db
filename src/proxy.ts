import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const localePattern = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(localePattern);

  if (!match) {
    return NextResponse.next();
  }

  const locale = match[1];
  const pathname = request.nextUrl.pathname.replace(localePattern, "") || "/";
  const rewriteUrl = request.nextUrl.clone();
  const requestHeaders = new Headers(request.headers);

  rewriteUrl.pathname = pathname;
  requestHeaders.set("x-locale", locale);

  const response = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

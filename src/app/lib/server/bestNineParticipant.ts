import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { BestNineError } from "../bestNineTopics";

const COOKIE = "azki-best-nine-guest";
const sign = (value: string) => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new BestNineError("SERVICE_UNAVAILABLE", 503);
  return createHmac("sha256", secret)
    .update(`best-nine:${value}`)
    .digest("hex");
};

export const readGuestToken = (request: NextRequest): string | null => {
  const cookie = request.cookies.get(COOKIE)?.value;
  if (!cookie || !/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(cookie)) return null;
  const [token, signature] = cookie.split(".");
  return timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(sign(`cookie:${token}`), "hex"),
  )
    ? token
    : null;
};

export const ensureParticipantCookie = (
  request: NextRequest,
  response: NextResponse,
) => {
  if (readGuestToken(request)) return;
  const token = randomBytes(32).toString("hex");
  response.cookies.set(COOKIE, `${token}.${sign(`cookie:${token}`)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/share/my-best-9-songs",
    maxAge: 60 * 60 * 24 * 365,
  });
};

export const participantKey = (
  scope: string,
  kind: "user" | "guest",
  id: string,
) => sign(JSON.stringify([scope, kind, id]));

export const assertSameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new BestNineError("FORBIDDEN", 403);
};

import { createHmac, timingSafeEqual } from "crypto";

export const membersOnlyAccessCookieName = "azki_members_only_access";

const tokenVersion = "v1";
const tokenScope = "members-only-songs";
const defaultMaxAgeSeconds = 60 * 60 * 24 * 30;

function getRequiredPassword(): string | null {
  const password = process.env.MEMBERS_ONLY_SONGS_PASSWORD?.trim();
  return password ? password : null;
}

function getSigningSecret(): string | null {
  const secret = process.env.MEMBERS_ONLY_COOKIE_SECRET?.trim();
  if (secret) return secret;

  const password = getRequiredPassword();
  return password ? `members-only:${password}` : null;
}

function createSignature(password: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${tokenScope}:${password}`)
    .digest("base64url");
}

function buildToken(password: string, secret: string): string {
  return `${tokenVersion}.${createSignature(password, secret)}`;
}

export function isMembersOnlyAccessConfigured(): boolean {
  return Boolean(getRequiredPassword() && getSigningSecret());
}

export function verifyMembersOnlyPassword(password: string): boolean {
  const requiredPassword = getRequiredPassword();
  if (!requiredPassword) return false;
  return password === requiredPassword;
}

export function createMembersOnlyAccessToken(): string | null {
  const password = getRequiredPassword();
  const secret = getSigningSecret();
  if (!password || !secret) return null;
  return buildToken(password, secret);
}

export function hasMembersOnlyAccess(
  cookieValue: string | null | undefined,
): boolean {
  const password = getRequiredPassword();
  const secret = getSigningSecret();
  if (!password || !secret || !cookieValue) return false;

  const expected = buildToken(password, secret);
  const actualBuffer = Buffer.from(cookieValue);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function getMembersOnlyAccessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: defaultMaxAgeSeconds,
  };
}

export const membersOnlySongRanges = [
  "記念ライブ系 【メン限】!A:M",
  "歌枠【メン限】!A:M",
] as const;

const membersOnlySongSheetTitles = new Set(
  membersOnlySongRanges.map((range) =>
    range.split("!")[0]?.trim().toLowerCase(),
  ),
);

export function isMembersOnlySongSheetTitle(title: string): boolean {
  return membersOnlySongSheetTitles.has(title.trim().toLowerCase());
}

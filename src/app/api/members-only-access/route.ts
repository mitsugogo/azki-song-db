import { NextResponse } from "next/server";
import {
  createMembersOnlyAccessToken,
  getMembersOnlyAccessCookieOptions,
  isMembersOnlyAccessConfigured,
  membersOnlyAccessCookieName,
  verifyMembersOnlyPassword,
} from "@/app/lib/membersOnlyAccess";

type AccessRequestBody = {
  password?: string;
  playbackVerified?: boolean;
};

export async function POST(request: Request) {
  if (!isMembersOnlyAccessConfigured()) {
    return NextResponse.json(
      { error: "members_only_access_not_configured" },
      { status: 503 },
    );
  }

  let body: AccessRequestBody;

  try {
    body = (await request.json()) as AccessRequestBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_request_body" },
      { status: 400 },
    );
  }

  const password = body.password?.trim() ?? "";
  if (!password) {
    return NextResponse.json({ error: "password_required" }, { status: 400 });
  }

  if (body.playbackVerified !== true) {
    return NextResponse.json(
      { error: "playback_verification_required" },
      { status: 400 },
    );
  }

  if (!verifyMembersOnlyPassword(password)) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const token = createMembersOnlyAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: "members_only_access_not_configured" },
      { status: 503 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    membersOnlyAccessCookieName,
    token,
    getMembersOnlyAccessCookieOptions(),
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(membersOnlyAccessCookieName, "", {
    ...getMembersOnlyAccessCookieOptions(),
    maxAge: 0,
  });
  return response;
}

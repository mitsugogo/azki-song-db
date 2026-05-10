import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { DELETE, POST } from "../route";

const originalMembersPassword = process.env.MEMBERS_ONLY_SONGS_PASSWORD;
const originalCookieSecret = process.env.MEMBERS_ONLY_COOKIE_SECRET;

describe("members-only access route", () => {
  beforeEach(() => {
    process.env.MEMBERS_ONLY_SONGS_PASSWORD = "open-sesame";
    process.env.MEMBERS_ONLY_COOKIE_SECRET = "cookie-secret";
  });

  afterAll(() => {
    process.env.MEMBERS_ONLY_SONGS_PASSWORD = originalMembersPassword;
    process.env.MEMBERS_ONLY_COOKIE_SECRET = originalCookieSecret;
  });

  it("正しいパスワードでCookieを発行する", async () => {
    const response = await POST(
      new Request("http://localhost/api/members-only-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: "open-sesame",
          playbackVerified: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(
      "azki_members_only_access=",
    );
  });

  it("誤ったパスワードでは401を返す", async () => {
    const response = await POST(
      new Request("http://localhost/api/members-only-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: "wrong-password",
          playbackVerified: true,
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("再生確認が未完了なら400を返す", async () => {
    const response = await POST(
      new Request("http://localhost/api/members-only-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: "open-sesame" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "playback_verification_required",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("DELETEでCookieを削除する", async () => {
    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});

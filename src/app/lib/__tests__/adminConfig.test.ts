import { afterEach, describe, expect, it } from "vitest";
import { isAdminGoogleAccountId } from "../adminConfig";

const originalAdminAccountId = process.env.ADMIN_GOOGLE_ACCOUNT_ID;

describe("isAdminGoogleAccountId", () => {
  afterEach(() => {
    if (originalAdminAccountId === undefined) {
      delete process.env.ADMIN_GOOGLE_ACCOUNT_ID;
    } else {
      process.env.ADMIN_GOOGLE_ACCOUNT_ID = originalAdminAccountId;
    }
  });

  it("設定したGoogleアカウントIDだけを管理者として扱う", () => {
    process.env.ADMIN_GOOGLE_ACCOUNT_ID = "1234567890";

    expect(isAdminGoogleAccountId("1234567890")).toBe(true);
    expect(isAdminGoogleAccountId("0987654321")).toBe(false);
    expect(isAdminGoogleAccountId(null)).toBe(false);
  });

  it("設定がない場合は管理者を作らない", () => {
    delete process.env.ADMIN_GOOGLE_ACCOUNT_ID;

    expect(isAdminGoogleAccountId("1234567890")).toBe(false);
  });
});

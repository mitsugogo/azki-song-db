import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAdminSessionMock,
  getJapaneseYouTubeChannelNameMock,
  upsertChannelMock,
  updateSongMetadataMock,
} = vi.hoisted(() => ({
  getAdminSessionMock: vi.fn(),
  getJapaneseYouTubeChannelNameMock: vi.fn(),
  upsertChannelMock: vi.fn(),
  updateSongMetadataMock: vi.fn(),
}));

vi.mock("@/app/lib/admin", () => ({
  getAdminSession: getAdminSessionMock,
}));

vi.mock("@/app/lib/adminGoogleSheets", () => ({
  upsertChannel: upsertChannelMock,
  updateSongMetadata: updateSongMetadataMock,
}));

vi.mock("@/app/lib/youtubeDataApi", () => ({
  getJapaneseYouTubeChannelName: getJapaneseYouTubeChannelNameMock,
}));

import { POST } from "../route";

describe("admin Google Sheets route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminSessionMock.mockResolvedValue({
      user: { email: "owner@example.com" },
    });
    upsertChannelMock.mockResolvedValue({ added: true });
    updateSongMetadataMock.mockResolvedValue({ rowNumber: 2 });
    getJapaneseYouTubeChannelNameMock.mockResolvedValue("日本語チャンネル");
  });

  it("管理者でない場合は書き込み処理を実行しない", async () => {
    getAdminSessionMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/admin/google-sheets", {
        method: "POST",
        body: JSON.stringify({ action: "upsert-channel" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(upsertChannelMock).not.toHaveBeenCalled();
  });

  it("管理者のチャンネル追加をサービスへ渡す", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/google-sheets", {
        method: "POST",
        body: JSON.stringify({
          action: "upsert-channel",
          channelId: "UCabcdefghijk",
          channelName: "Channel",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(getJapaneseYouTubeChannelNameMock).toHaveBeenCalledWith(
      "UCabcdefghijk",
      "http://localhost/api/admin/google-sheets",
    );
    expect(upsertChannelMock).toHaveBeenCalledWith({
      channelId: "UCabcdefghijk",
      channelName: "日本語チャンネル",
    });
  });

  it("未知の操作を拒否する", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/google-sheets", {
        method: "POST",
        body: JSON.stringify({ action: "unknown" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(updateSongMetadataMock).not.toHaveBeenCalled();
  });
});

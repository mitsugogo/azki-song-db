import { describe, expect, it } from "vitest";
import enMessages from "@/messages/en.json";
import jaMessages from "@/messages/ja.json";

describe("stream archive messages", () => {
  it("defines the compact activity and filter labels in Japanese and English", () => {
    expect(jaMessages.Archives.activityLabel).toBe("活動量");
    expect(jaMessages.Archives.filterToggleLabel).toBe("検索条件");
    expect(enMessages.Archives.activityLabel).toBe("Activity");
    expect(enMessages.Archives.filterToggleLabel).toBe("Search filters");
  });
});

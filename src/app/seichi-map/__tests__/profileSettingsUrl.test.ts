import { describe, expect, it } from "vitest";
import {
  buildSettingsCallbackUrl,
  consumeSettingsRequestFromUrl,
} from "../profileSettingsUrl";

describe("profileSettingsUrl", () => {
  it("ログイン後に設定を開くためのパラメータを既存URLへ追加する", () => {
    expect(
      buildSettingsCallbackUrl(
        "https://example.test/en/seichi-map?location=aaaaaaaaaaaaaaaa#map",
      ),
    ).toBe(
      "https://example.test/en/seichi-map?location=aaaaaaaaaaaaaaaa&settings=nickname#map",
    );
  });

  it("設定要求だけを消して元のパス・クエリ・ハッシュを維持する", () => {
    expect(
      consumeSettingsRequestFromUrl(
        "https://example.test/en/seichi-map?location=aaaaaaaaaaaaaaaa&settings=nickname#map",
      ),
    ).toBe("/en/seichi-map?location=aaaaaaaaaaaaaaaa#map");
    expect(
      consumeSettingsRequestFromUrl(
        "https://example.test/seichi-map?location=aaaaaaaaaaaaaaaa",
      ),
    ).toBeNull();
  });
});

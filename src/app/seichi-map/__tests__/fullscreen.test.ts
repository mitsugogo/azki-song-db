import { describe, expect, it, vi } from "vitest";
import {
  getGoogleMapFullscreenPortalTarget,
  isIosDevice,
  toggleElementFullscreen,
} from "../fullscreen";

describe("isIosDevice", () => {
  it("iPhoneをiOS端末として判定する", () => {
    expect(
      isIosDevice({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it("デスクトップ表示のiPadOSをiOS端末として判定する", () => {
    expect(
      isIosDevice({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.5 Safari/605.1.15",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it("タッチ非対応のmacOSとAndroidはiOS端末として扱わない", () => {
    expect(
      isIosDevice({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.5 Safari/605.1.15",
        maxTouchPoints: 0,
      }),
    ).toBe(false);
    expect(
      isIosDevice({
        userAgent:
          "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/136.0 Mobile Safari/537.36",
        maxTouchPoints: 5,
      }),
    ).toBe(false);
  });
});

describe("toggleElementFullscreen", () => {
  it("通常表示から対象要素を全画面表示にする", async () => {
    const element = document.createElement("div");
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(element, "requestFullscreen", {
      value: requestFullscreen,
    });
    const exitFullscreen = vi.fn();

    await toggleElementFullscreen(element, {
      fullscreenElement: null,
      exitFullscreen,
    });

    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(exitFullscreen).not.toHaveBeenCalled();
  });

  it("対象要素の全画面表示を終了する", async () => {
    const element = document.createElement("div");
    const requestFullscreen = vi.fn();
    Object.defineProperty(element, "requestFullscreen", {
      value: requestFullscreen,
    });
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);

    await toggleElementFullscreen(element, {
      fullscreenElement: element,
      exitFullscreen,
    });

    expect(exitFullscreen).toHaveBeenCalledOnce();
    expect(requestFullscreen).not.toHaveBeenCalled();
  });
});

describe("getGoogleMapFullscreenPortalTarget", () => {
  it("Fullscreen APIで表示中のGoogle Maps要素を返す", () => {
    const mapElement = document.createElement("div");
    const fullscreenElement = document.createElement("div");
    mapElement.appendChild(fullscreenElement);

    expect(
      getGoogleMapFullscreenPortalTarget(mapElement, { fullscreenElement }),
    ).toBe(fullscreenElement);
  });

  it("Google MapsのCSS全画面表示コンテナを返す", () => {
    const mapElement = document.createElement("div");
    const fullscreenContainer = document.createElement("div");
    const mapStyle = document.createElement("div");
    const fullscreenControl = document.createElement("button");
    mapStyle.className = "gm-style";
    fullscreenControl.className = "gm-fullscreen-control";
    fullscreenControl.setAttribute("aria-pressed", "true");
    mapStyle.appendChild(fullscreenControl);
    fullscreenContainer.appendChild(mapStyle);
    mapElement.appendChild(fullscreenContainer);

    expect(
      getGoogleMapFullscreenPortalTarget(mapElement, {
        fullscreenElement: null,
      }),
    ).toBe(fullscreenContainer);
  });

  it("通常表示中はPortal先を変更しない", () => {
    const mapElement = document.createElement("div");
    const mapStyle = document.createElement("div");
    const fullscreenControl = document.createElement("button");
    mapStyle.className = "gm-style";
    fullscreenControl.className = "gm-fullscreen-control";
    fullscreenControl.setAttribute("aria-pressed", "false");
    mapStyle.appendChild(fullscreenControl);
    mapElement.appendChild(mapStyle);

    expect(
      getGoogleMapFullscreenPortalTarget(mapElement, {
        fullscreenElement: null,
      }),
    ).toBeNull();
  });

  it("Google Maps外の全画面要素はPortal先にしない", () => {
    const mapElement = document.createElement("div");
    const fullscreenElement = document.createElement("div");

    expect(
      getGoogleMapFullscreenPortalTarget(mapElement, { fullscreenElement }),
    ).toBeNull();
  });
});

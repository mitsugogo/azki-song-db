import { describe, expect, it } from "vitest";
import { getGoogleMapFullscreenPortalTarget } from "../fullscreen";

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

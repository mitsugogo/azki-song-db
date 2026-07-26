import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatStraightLineDistance,
  getNearbyLocations,
  getStraightLineDistanceMeters,
  requestCurrentLocation,
  updateCurrentLocationControl,
} from "../currentLocation";

const labels = {
  locating: "現在地を取得中",
  show: "現在地を表示",
  unavailable: "現在地を取得できません",
};

afterEach(() => {
  vi.useRealTimers();
});

describe("requestCurrentLocation", () => {
  it("位置情報の許可待ちが続いてもUI側のタイムアウトで操作可能に戻す", () => {
    vi.useFakeTimers();
    const control = document.createElement("button");
    const getCurrentPosition = vi.fn();

    requestCurrentLocation({
      control,
      geolocation: { getCurrentPosition },
      labels,
      onSuccess: vi.fn(),
      timeoutMs: 100,
    });

    expect(control.disabled).toBe(true);
    expect(control.title).toBe(labels.locating);
    expect(control.style.cursor).toBe("wait");

    vi.advanceTimersByTime(100);

    expect(control.disabled).toBe(false);
    expect(control.title).toBe(labels.unavailable);
    expect(control.style.cursor).toBe("pointer");
  });

  it("位置情報の取得に成功したら通常表示へ戻して座標を渡す", () => {
    const control = document.createElement("button");
    const coords = { latitude: 35, longitude: 139 } as GeolocationCoordinates;
    const onSuccess = vi.fn();

    requestCurrentLocation({
      control,
      geolocation: {
        getCurrentPosition: (success) =>
          success({ coords } as GeolocationPosition),
      },
      labels,
      onSuccess,
    });

    expect(control.disabled).toBe(false);
    expect(control.title).toBe(labels.show);
    expect(onSuccess).toHaveBeenCalledWith(coords);
  });
});

describe("updateCurrentLocationControl", () => {
  it("読み込み状態と通常状態を切り替える", () => {
    const control = document.createElement("button");

    updateCurrentLocationControl(control, labels.locating, true);
    expect(control.disabled).toBe(true);
    expect(control.getAttribute("aria-label")).toBe(labels.locating);

    updateCurrentLocationControl(control, labels.show, false);
    expect(control.disabled).toBe(false);
    expect(control.getAttribute("aria-label")).toBe(labels.show);
  });
});

describe("nearby locations", () => {
  it("直線距離をmまたはkmで表示する", () => {
    expect(formatStraightLineDistance(49.6)).toBe("50m");
    expect(formatStraightLineDistance(1_300)).toBe("1.3km");
    expect(formatStraightLineDistance(10_000)).toBe("10km");
  });

  it("現在地から10km以内の聖地だけを近い順に返す", () => {
    const currentPosition = { latitude: 35, longitude: 139 };
    const locations = [
      { id: "far", latitude: 35.11, longitude: 139 },
      { id: "near", latitude: 35.00045, longitude: 139 },
      { id: "middle", latitude: 35.045, longitude: 139 },
    ];

    const nearbyLocations = getNearbyLocations(currentPosition, locations);

    expect(nearbyLocations.map(({ location }) => location.id)).toEqual([
      "near",
      "middle",
    ]);
    expect(nearbyLocations[0].distanceMeters).toBeCloseTo(50, 0);
  });

  it("Haversine式で直線距離を計算する", () => {
    expect(
      getStraightLineDistanceMeters(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 0.008993 },
      ),
    ).toBeCloseTo(1_000, -1);
  });
});

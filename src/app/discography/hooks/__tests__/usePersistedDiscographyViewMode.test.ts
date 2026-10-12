import { act, renderHook, waitFor } from "@testing-library/react";
import {
  DISCOGRAPHY_VIEW_MODE_STORAGE_KEY,
  usePersistedDiscographyViewMode,
} from "../usePersistedDiscographyViewMode";

describe("usePersistedDiscographyViewMode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each([true, false])(
    "保存値がない場合はリストを表示する（オリ曲MV対応: %s）",
    (allowOriginalMv) => {
      const { result } = renderHook(() =>
        usePersistedDiscographyViewMode(allowOriginalMv),
      );

      expect(result.current[0]).toBe("list");
    },
  );

  it.each(["tile", "list", "originalMv"])(
    "保存された表示モード %s を復元する",
    async (mode) => {
      localStorage.setItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY, mode);

      const { result } = renderHook(() =>
        usePersistedDiscographyViewMode(true),
      );

      await waitFor(() => expect(result.current[0]).toBe(mode));
    },
  );

  it("表示モードの変更を保存する", () => {
    const { result } = renderHook(() => usePersistedDiscographyViewMode(true));

    act(() => result.current[1]("originalMv"));

    expect(result.current[0]).toBe("originalMv");
    expect(localStorage.getItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY)).toBe(
      "originalMv",
    );
  });

  it("オリ曲MVを表示できないカテゴリではリストにフォールバックし、保存値は維持する", async () => {
    localStorage.setItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY, "originalMv");

    const { result, rerender } = renderHook(
      ({ allowOriginalMv }) => usePersistedDiscographyViewMode(allowOriginalMv),
      { initialProps: { allowOriginalMv: false } },
    );

    expect(result.current[0]).toBe("list");
    expect(localStorage.getItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY)).toBe(
      "originalMv",
    );

    rerender({ allowOriginalMv: true });
    await waitFor(() => expect(result.current[0]).toBe("originalMv"));
  });

  it("不正な保存値はリストとして扱う", async () => {
    localStorage.setItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY, "unknown");

    const { result } = renderHook(() => usePersistedDiscographyViewMode(true));

    await waitFor(() => expect(result.current[0]).toBe("list"));
  });
});

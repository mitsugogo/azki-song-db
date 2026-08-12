import { act, renderHook, waitFor } from "@testing-library/react";
import {
  DISCOGRAPHY_VIEW_MODE_STORAGE_KEY,
  usePersistedDiscographyViewMode,
} from "../usePersistedDiscographyViewMode";

describe("usePersistedDiscographyViewMode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("保存された表示モードを復元する", async () => {
    localStorage.setItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY, "list");

    const { result } = renderHook(() => usePersistedDiscographyViewMode(true));

    await waitFor(() => expect(result.current[0]).toBe("list"));
  });

  it("表示モードの変更を保存する", () => {
    const { result } = renderHook(() => usePersistedDiscographyViewMode(true));

    act(() => result.current[1]("originalMv"));

    expect(result.current[0]).toBe("originalMv");
    expect(localStorage.getItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY)).toBe(
      "originalMv",
    );
  });

  it("オリ曲MVを表示できないカテゴリではタイルにフォールバックし、保存値は維持する", async () => {
    localStorage.setItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY, "originalMv");

    const { result, rerender } = renderHook(
      ({ allowOriginalMv }) => usePersistedDiscographyViewMode(allowOriginalMv),
      { initialProps: { allowOriginalMv: false } },
    );

    expect(result.current[0]).toBe("tile");
    expect(localStorage.getItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY)).toBe(
      "originalMv",
    );

    rerender({ allowOriginalMv: true });
    await waitFor(() => expect(result.current[0]).toBe("originalMv"));
  });

  it("不正な保存値はタイルとして扱う", async () => {
    localStorage.setItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY, "unknown");

    const { result } = renderHook(() => usePersistedDiscographyViewMode(true));

    await waitFor(() => expect(result.current[0]).toBe("tile"));
  });
});

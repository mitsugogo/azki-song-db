import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useDebounce from "../useDebounce";

describe("useDebounce", () => {
  it("初期値が正しく設定される", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it("遅延時間後に値が更新される", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 300 },
      },
    );

    expect(result.current).toBe("initial");

    // 値を更新
    rerender({ value: "updated", delay: 300 });

    // 即座には更新されない
    expect(result.current).toBe("initial");

    // 遅延時間後に更新される
    await waitFor(
      () => {
        expect(result.current).toBe("updated");
      },
      { timeout: 500 },
    );
  });

  it("遅延時間内に複数回更新された場合、最後の値のみが反映される", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 300 },
      },
    );

    rerender({ value: "first", delay: 300 });
    rerender({ value: "second", delay: 300 });
    rerender({ value: "third", delay: 300 });

    // 遅延時間後に最後の値が反映される
    await waitFor(
      () => {
        expect(result.current).toBe("third");
      },
      { timeout: 500 },
    );
  });

  it("数値型の値でも動作する", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 200 },
      },
    );

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 200 });

    await waitFor(
      () => {
        expect(result.current).toBe(42);
      },
      { timeout: 400 },
    );
  });

  it("オブジェクト型の値でも動作する", async () => {
    const initialObj = { name: "test", count: 1 };
    const updatedObj = { name: "updated", count: 2 };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 200 },
      },
    );

    expect(result.current).toEqual(initialObj);

    rerender({ value: updatedObj, delay: 200 });

    await waitFor(
      () => {
        expect(result.current).toEqual(updatedObj);
      },
      { timeout: 400 },
    );
  });

  it("遅延時間が0の場合も動作する", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 0 },
      },
    );

    rerender({ value: "updated", delay: 0 });

    await waitFor(() => {
      expect(result.current).toBe("updated");
    });
  });
});

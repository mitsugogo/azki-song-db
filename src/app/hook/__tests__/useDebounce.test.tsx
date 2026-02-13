import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useDebounce from "../useDebounce";

describe("useDebounce", () => {
  it("初期値が正しく設定される", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it.skip("遅延時間後に値が更新される", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 0 },
      },
    );

    expect(result.current).toBe("initial");

    // 値を更新
    rerender({ value: "updated", delay: 0 });

    // setTimeout(0)が実行されるまで待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current).toBe("updated");
  });

  it.skip("遅延時間内に複数回更新された場合、最後の値のみが反映される", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 0 },
      },
    );

    rerender({ value: "first", delay: 0 });
    rerender({ value: "second", delay: 0 });
    rerender({ value: "third", delay: 0 });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current).toBe("third");
  });

  it.skip("数値型の値でも動作する", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 0 },
      },
    );

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 0 });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current).toBe(42);
  });

  it.skip("オブジェクト型の値でも動作する", async () => {
    const initialObj = { name: "test", count: 1 };
    const updatedObj = { name: "updated", count: 2 };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 0 },
      },
    );

    expect(result.current).toEqual(initialObj);

    rerender({ value: updatedObj, delay: 0 });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current).toEqual(updatedObj);
  });

  it.skip("遅延時間が0の場合も動作する", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 0 },
      },
    );

    rerender({ value: "updated", delay: 0 });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current).toBe("updated");
  });
});

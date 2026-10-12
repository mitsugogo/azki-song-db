import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageNavigationViewportContext } from "../../components/PageNavigationLayoutContext";
import { usePageScrollVirtualizer } from "../usePageScrollVirtualizer";

function renderList() {
  const viewport = document.createElement("div");
  Object.defineProperties(viewport, {
    offsetHeight: { value: 300 },
    offsetWidth: { value: 800 },
    clientHeight: { value: 300 },
    scrollHeight: { value: 10400 },
  });
  viewport.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
  viewport.scrollTo = vi.fn();
  const viewportRef = { current: viewport };
  let listOffset = 400;
  let resizeCallback: ResizeObserverCallback | undefined;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

  function List() {
    const listRef = useRef<HTMLDivElement>(null);
    const virtualizer = usePageScrollVirtualizer(listRef, {
      count: 100,
      estimateSize: () => 100,
      overscan: 0,
      useFlushSync: false,
    });
    return (
      <div
        ref={(element) => {
          listRef.current = element;
          if (element)
            element.getBoundingClientRect = () =>
              ({
                top: 100 + listOffset - viewport.scrollTop,
              }) as DOMRect;
        }}
      >
        <output aria-label="一覧開始位置">
          {virtualizer.options.scrollMargin}
        </output>
        <button
          onClick={() => virtualizer.scrollToIndex(50, { align: "start" })}
        >
          指定行へ
        </button>
        {virtualizer.getVirtualItems().map((row) => (
          <div key={row.key}>行{row.index}</div>
        ))}
      </div>
    );
  }

  const tree = () => (
    <PageNavigationViewportContext.Provider value={viewportRef}>
      <List />
    </PageNavigationViewportContext.Provider>
  );
  const view = render(tree());
  return {
    viewport,
    rerender: () => view.rerender(tree()),
    moveList: (offset: number) => {
      listOffset = offset;
    },
    resize: () => act(() => resizeCallback?.([], {} as ResizeObserver)),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("usePageScrollVirtualizer", () => {
  it("本文のスクロールで長い一覧の表示行を切り替える", () => {
    const { viewport } = renderList();
    expect(screen.getByText("行0")).toBeInTheDocument();
    viewport.scrollTop = 1400;
    fireEvent.scroll(viewport);
    expect(screen.getByText("行10")).toBeInTheDocument();
    expect(screen.queryByText("行0")).not.toBeInTheDocument();
    fireEvent.scroll(window);
    expect(screen.getByText("行10")).toBeInTheDocument();
  });

  it("スクロール中も本文内の一覧開始位置を保ち、条件変更時に再計測する", () => {
    const { viewport, rerender, moveList } = renderList();
    viewport.scrollTop = 900;
    fireEvent.scroll(viewport);
    expect(screen.getByLabelText("一覧開始位置")).toHaveTextContent("400");
    moveList(600);
    rerender();
    expect(screen.getByLabelText("一覧開始位置")).toHaveTextContent("600");
  });

  it("本文のサイズ変更で一覧開始位置を再計測する", () => {
    const { moveList, resize } = renderList();
    moveList(520);
    resize();
    expect(screen.getByLabelText("一覧開始位置")).toHaveTextContent("520");
  });

  it("指定行への移動は一覧開始位置を含めて本文をスクロールする", () => {
    const { viewport } = renderList();
    fireEvent.click(screen.getByRole("button", { name: "指定行へ" }));
    expect(viewport.scrollTo).toHaveBeenCalledWith({
      top: 5400,
      behavior: "auto",
    });
  });
});

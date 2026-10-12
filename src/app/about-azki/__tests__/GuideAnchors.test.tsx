import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageNavigationViewportContext } from "../../components/PageNavigationLayoutContext";
import GuideAnchors from "../GuideAnchors";

let viewport: HTMLDivElement;
let scrollTo: ReturnType<typeof vi.fn>;
let frame: FrameRequestCallback;

beforeEach(() => {
  window.history.replaceState(null, "", "/about-azki");
  viewport = document.createElement("div");
  document.body.appendChild(viewport);
  viewport.scrollTop = 100;
  scrollTo = vi.fn();
  viewport.scrollTo = scrollTo;
  vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
    top: 20,
  } as DOMRect);
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  cleanup();
  viewport.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

function renderGuide(current: HTMLDivElement | null = viewport) {
  return render(
    <PageNavigationViewportContext.Provider value={{ current }}>
      <GuideAnchors>
        <a href="#term-geoguessr">GeoGuessr</a>
        <a href="#missing">Missing</a>
        <h2 id="term-geoguessr" tabIndex={-1}>
          GeoGuessr term
        </h2>
      </GuideAnchors>
    </PageNavigationViewportContext.Provider>,
    { container: viewport },
  );
}

describe("GuideAnchors", () => {
  it("本文領域だけをスクロールし、用語にフォーカスしてURLを更新する", () => {
    renderGuide();
    const target = screen.getByRole("heading");
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
      top: 400,
    } as DOMRect);
    const focus = vi.spyOn(target, "focus");
    fireEvent.click(screen.getByRole("link", { name: "GeoGuessr" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 464, behavior: "auto" });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(target);
    expect(window.location.hash).toBe("#term-geoguessr");
  });

  it.each(["/about-azki", "/en/about-azki"])(
    "%sの用語への直接アクセスを初期描画後に復元する",
    (path) => {
      window.history.replaceState(null, "", `${path}#term-geoguessr`);
      renderGuide();
      expect(scrollTo).not.toHaveBeenCalled();
      act(() => frame(0));
      expect(scrollTo).toHaveBeenCalledOnce();
      expect(document.activeElement).toBe(screen.getByRole("heading"));
      expect(window.location.pathname).toBe(path);
    },
  );

  it("戻る・進むとhashchangeで用語の位置を復元する", () => {
    renderGuide();
    window.history.replaceState(null, "", "#term-geoguessr");
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    act(() => window.dispatchEvent(new HashChangeEvent("hashchange")));
    expect(scrollTo).toHaveBeenCalledTimes(2);
  });

  it("不明または壊れたアンカーを安全に無視する", () => {
    window.history.replaceState(null, "", "#%E0%A4%A");
    renderGuide();
    expect(() => act(() => frame(0))).not.toThrow();
    window.history.replaceState(null, "", "#missing");
    act(() => window.dispatchEvent(new HashChangeEvent("hashchange")));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("修飾キー付きリンククリックを横取りしない", () => {
    renderGuide();
    let preventedByGuide = false;
    // Observe the delegated handler, then stop jsdom from performing navigation.
    document.addEventListener(
      "click",
      (event) => {
        preventedByGuide = event.defaultPrevented;
        event.preventDefault();
      },
      { once: true },
    );
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });
    screen.getByRole("link", { name: "GeoGuessr" }).dispatchEvent(event);
    expect(preventedByGuide).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("viewportの準備ができたら直接リンクを復元し、unmountで購読を解除する", () => {
    window.history.replaceState(null, "", "#term-geoguessr");
    const view = renderGuide(null);
    act(() => frame(0));
    expect(scrollTo).not.toHaveBeenCalled();
    view.rerender(
      <PageNavigationViewportContext.Provider value={{ current: viewport }}>
        <GuideAnchors>
          <h2 id="term-geoguessr" tabIndex={-1}>
            GeoGuessr term
          </h2>
        </GuideAnchors>
      </PageNavigationViewportContext.Provider>,
    );
    act(() => frame(0));
    expect(scrollTo).toHaveBeenCalledOnce();
    view.unmount();
    scrollTo.mockClear();
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(scrollTo).not.toHaveBeenCalled();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});

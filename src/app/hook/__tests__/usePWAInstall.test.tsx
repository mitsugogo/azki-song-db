import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import usePWAInstall from "../usePWAInstall";

describe("usePWAInstall", () => {
  let beforeInstallPromptEvent: Event;
  let beforeInstallPromptHandler: EventListener;
  let appInstalledHandler: EventListener;

  beforeEach(() => {
    vi.clearAllMocks();

    // イベントリスナーをキャプチャ
    vi.spyOn(window, "addEventListener").mockImplementation(
      (event: string, handler: any) => {
        if (event === "beforeinstallprompt") {
          beforeInstallPromptHandler = handler;
        } else if (event === "appinstalled") {
          appInstalledHandler = handler;
        }
      },
    );

    vi.spyOn(window, "removeEventListener");

    // matchMedia のモック
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // beforeinstallprompt イベントのモック
    beforeInstallPromptEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    } as any;
  });

  it("初期状態ではインストール不可", () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
  });

  it("既にPWAとしてインストール済みの場合、isInstalledがtrueになる", () => {
    (window.matchMedia as any).mockImplementation((query: string) => ({
      matches: query === "(display-mode: standalone)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstalled).toBe(true);
  });

  it("beforeinstallpromptイベントでインストール可能になる", () => {
    const { result } = renderHook(() => usePWAInstall());

    // beforeinstallprompt イベントを発火
    act(() => {
      beforeInstallPromptHandler?.(beforeInstallPromptEvent);
    });

    expect(result.current.isInstallable).toBe(true);
    expect(beforeInstallPromptEvent.preventDefault).toHaveBeenCalled();
  });

  it("promptInstallでインストールプロンプトを表示できる", async () => {
    const { result } = renderHook(() => usePWAInstall());

    // beforeinstallprompt イベントを発火
    act(() => {
      beforeInstallPromptHandler?.(beforeInstallPromptEvent);
    });

    // インストールプロンプトを表示
    await act(async () => {
      await result.current.promptInstall();
    });

    expect((beforeInstallPromptEvent as any).prompt).toHaveBeenCalled();
  });

  it("installPromptがない場合、promptInstallは何もしない", async () => {
    const { result } = renderHook(() => usePWAInstall());

    // promptInstallを呼んでもエラーにならない
    await act(async () => {
      await result.current.promptInstall();
    });

    expect((beforeInstallPromptEvent as any).prompt).not.toHaveBeenCalled();
  });

  it("appinstalledイベントでインストール済み状態になる", () => {
    const { result } = renderHook(() => usePWAInstall());

    // beforeinstallprompt イベントを発火
    act(() => {
      beforeInstallPromptHandler?.(beforeInstallPromptEvent);
    });

    expect(result.current.isInstallable).toBe(true);

    // appinstalled イベントを発火
    act(() => {
      appInstalledHandler?.(new Event("appinstalled"));
    });

    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(true);
  });

  it("アンマウント時にイベントリスナーが削除される", () => {
    const { unmount } = renderHook(() => usePWAInstall());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function),
    );
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "appinstalled",
      expect.any(Function),
    );
  });

  it("promptInstallの結果がacceptedの場合、正しくハンドリングされる", async () => {
    const { result } = renderHook(() => usePWAInstall());

    // beforeinstallprompt イベントを発火
    act(() => {
      beforeInstallPromptHandler?.(beforeInstallPromptEvent);
    });

    // インストールプロンプトを表示して受諾
    await act(async () => {
      const outcome = await result.current.promptInstall();
      // userChoiceの結果を待つ
      await (beforeInstallPromptEvent as any).userChoice;
    });

    expect((beforeInstallPromptEvent as any).prompt).toHaveBeenCalled();
  });
});

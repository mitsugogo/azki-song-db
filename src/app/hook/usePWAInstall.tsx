import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWAインストールプロンプトを管理するカスタムフック
 */
export default function usePWAInstall() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // すでにインストール済みかチェック
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // beforeinstallprompt イベントをキャッチ
    const handleBeforeInstallPrompt = (e: Event) => {
      // デフォルトのミニバーを表示しない
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // インストール完了時のイベント
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      return;
    }

    // インストールプロンプトを表示
    installPrompt.prompt();

    // ユーザーの選択を待つ
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("PWA installed");
    } else {
      console.log("PWA installation dismissed");
    }

    // プロンプトは一度しか使えないのでクリア
    setInstallPrompt(null);
    setIsInstallable(false);
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}

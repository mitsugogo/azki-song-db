import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UnlockMembersClient from "../client";

const youtubeHandlers = {
  onReady: null as ((event: any) => void) | null,
  onStateChange: null as ((event: any) => void) | null,
  onError: null as ((event: any) => void) | null,
};

vi.mock("@/app/components/Header", () => ({
  Header: () => <div>header</div>,
}));

vi.mock("@/app/components/Footer", () => ({
  default: () => <div>footer</div>,
}));

vi.mock("@/app/components/AnalyticsWrapper", () => ({
  AnalyticsWrapper: () => null,
}));

vi.mock("@mantine/core", () => ({
  createTheme: (value: any) => value,
  Breadcrumbs: ({ children }: any) => <div>{children}</div>,
  Alert: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("react-youtube", () => ({
  __esModule: true,
  default: (props: any) => {
    youtubeHandlers.onReady = props.onReady;
    youtubeHandlers.onStateChange = props.onStateChange;
    youtubeHandlers.onError = props.onError;

    return <div data-testid="members-only-probe-player" />;
  },
}));

describe("UnlockMembersClient", () => {
  beforeEach(() => {
    youtubeHandlers.onReady = null;
    youtubeHandlers.onStateChange = null;
    youtubeHandlers.onError = null;
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response),
    ) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("再生確認が通るまで解除ボタンを無効化する", async () => {
    render(<UnlockMembersClient initialUnlocked={false} isConfigured />);

    const submitButton = screen.getByRole("button", { name: "submit" });
    const passwordInput = screen.getByLabelText("passwordLabel");

    fireEvent.change(passwordInput, { target: { value: "open-sesame" } });
    expect(submitButton).toBeDisabled();

    youtubeHandlers.onReady?.({
      target: {
        mute: vi.fn(),
        playVideo: vi.fn(),
      },
    });
    youtubeHandlers.onStateChange?.({ data: 1 });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it("解除時に再生確認フラグを送信する", async () => {
    render(<UnlockMembersClient initialUnlocked={false} isConfigured />);

    youtubeHandlers.onReady?.({
      target: {
        mute: vi.fn(),
        playVideo: vi.fn(),
      },
    });
    youtubeHandlers.onStateChange?.({ data: 1 });

    fireEvent.change(screen.getByLabelText("passwordLabel"), {
      target: { value: "open-sesame" },
    });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/members-only-access",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            password: "open-sesame",
            playbackVerified: true,
          }),
        }),
      );
    });
  });

  it("再生確認エラー時は失敗メッセージを表示する", async () => {
    render(<UnlockMembersClient initialUnlocked={false} isConfigured />);

    youtubeHandlers.onError?.({ data: 150 });

    await waitFor(() => {
      expect(screen.getByText("playback.statusFailed")).toBeInTheDocument();
    });
  });
});

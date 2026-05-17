import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UnlockMembersClient from "../client";

const youtubeHandlers = {
  onReady: null as ((event: any) => void) | null,
  onStateChange: null as ((event: any) => void) | null,
  onError: null as ((event: any) => void) | null,
};

const defaultUserAgent = window.navigator.userAgent;
const defaultVendor = window.navigator.vendor;
const defaultMaxTouchPoints = window.navigator.maxTouchPoints;

function setNavigatorValue(key: string, value: unknown) {
  Object.defineProperty(window.navigator, key, {
    configurable: true,
    value,
  });
}

function setSafariNavigator({
  userAgent,
  vendor,
  maxTouchPoints,
}: {
  userAgent: string;
  vendor: string;
  maxTouchPoints: number;
}) {
  setNavigatorValue("userAgent", userAgent);
  setNavigatorValue("vendor", vendor);
  setNavigatorValue("maxTouchPoints", maxTouchPoints);
}

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
  Alert: ({ children, title, color, icon }: any) => (
    <div data-color={color}>
      {icon ? <div data-testid="alert-icon">{icon}</div> : null}
      {title ? <div>{title}</div> : null}
      {children}
    </div>
  ),
  TextInput: ({ label, id, ...props }: any) => (
    <div>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <input id={id} {...props} />
    </div>
  ),
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
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
    setSafariNavigator({
      userAgent: defaultUserAgent,
      vendor: defaultVendor,
      maxTouchPoints: defaultMaxTouchPoints,
    });
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response),
    ) as any;
  });

  afterEach(() => {
    setSafariNavigator({
      userAgent: defaultUserAgent,
      vendor: defaultVendor,
      maxTouchPoints: defaultMaxTouchPoints,
    });
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
      expect(screen.getAllByTestId("alert-icon").length).toBeGreaterThan(0);
      expect(screen.getByText("playback.statusFailed")).toBeInTheDocument();
    });
  });

  it("iOS Safari ではサイト越えトラッキング設定の案内を表示する", () => {
    setSafariNavigator({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
      vendor: "Apple Computer, Inc.",
      maxTouchPoints: 5,
    });

    render(<UnlockMembersClient initialUnlocked={false} isConfigured />);

    expect(screen.getByText("playback.safariNoticeTitle")).toBeInTheDocument();
    expect(
      screen.getByText("playback.safariNoticeStepsIos"),
    ).toBeInTheDocument();
  });

  it("macOS Safari ではSafari設定の案内を表示する", () => {
    setSafariNavigator({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
      vendor: "Apple Computer, Inc.",
      maxTouchPoints: 0,
    });

    render(<UnlockMembersClient initialUnlocked={false} isConfigured />);

    expect(screen.getByText("playback.safariNoticeTitle")).toBeInTheDocument();
    expect(
      screen.getByText("playback.safariNoticeStepsMac"),
    ).toBeInTheDocument();
  });
});

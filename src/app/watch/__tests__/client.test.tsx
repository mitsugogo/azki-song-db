import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WatchPageClient from "../client";
import type { WatchLayoutState } from "../../hook/useWatchLayout";

const { layoutRef } = vi.hoisted(() => ({
  layoutRef: {
    current: null as WatchLayoutState | null,
  },
}));

vi.mock("../../hook/useWatchLayout", () => ({
  __esModule: true,
  default: () => layoutRef.current,
}));

vi.mock("../../hook/useSongs", () => ({
  SongsQueryOptionsProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../components/Header", () => ({
  Header: () => <div data-testid="header" />,
}));

vi.mock("../../components/Footer", () => ({
  __esModule: true,
  default: () => <div data-testid="footer" />,
}));

vi.mock("../../components/MainPlayer", () => ({
  __esModule: true,
  default: ({ layout }: { layout: WatchLayoutState }) => (
    <div data-testid="main-player" data-layout={layout.mode} />
  ),
}));

vi.mock("../../components/FoldableToggle", () => ({
  __esModule: true,
  default: () => <button data-testid="floating-foldable-toggle" />,
}));

vi.mock("../../components/AnalyticsWrapper", () => ({
  AnalyticsWrapper: () => null,
}));

const makeLayout = (mode: WatchLayoutState["mode"]): WatchLayoutState => ({
  mode,
  supportsDevicePosture: true,
  posture: mode === "tabletop" ? "folded" : "continuous",
  orientation: mode === "portrait-theater" ? "portrait" : "landscape",
  segments: [],
  tabletopPanes: null,
  tabletopVariant: mode === "tabletop" ? "columns" : null,
});

describe("WatchPageClient", () => {
  beforeEach(() => {
    layoutRef.current = makeLayout("landscape-columns");
  });

  it("横持ちではヘッダーとフッターを表示する", () => {
    render(<WatchPageClient />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("縦持ちではヘッダーを表示し、フッターを隠す", () => {
    layoutRef.current = makeLayout("portrait-theater");
    const { container } = render(<WatchPageClient />);

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-watch-layout="portrait-theater"]'),
    ).toBeInTheDocument();
  });

  it("tabletopではヘッダーとフッターを隠す", () => {
    layoutRef.current = makeLayout("tabletop");
    const { container } = render(<WatchPageClient />);

    expect(screen.queryByTestId("header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
    expect(screen.getByTestId("main-player")).toHaveAttribute(
      "data-layout",
      "tabletop",
    );
    expect(
      container.querySelector('[data-watch-layout="tabletop"]'),
    ).toBeInTheDocument();
  });

  it("compact tabletopを実機確認用data属性へ出す", () => {
    layoutRef.current = {
      ...makeLayout("tabletop"),
      tabletopVariant: "compact",
    };
    const { container } = render(<WatchPageClient />);

    expect(
      container.querySelector('[data-tabletop-variant="compact"]'),
    ).toBeInTheDocument();
  });

  it("API非対応の手動tabletopでは通常表示へ戻す操作を表示する", () => {
    layoutRef.current = {
      ...makeLayout("tabletop"),
      supportsDevicePosture: false,
      posture: "continuous",
    };

    render(<WatchPageClient />);

    expect(screen.getByTestId("floating-foldable-toggle")).toBeInTheDocument();
  });
});

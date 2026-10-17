import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MantineProvider } from "@mantine/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jaMessages from "@/messages/ja.json";
import enMessages from "@/messages/en.json";
import ActivityDaysBadge from "../ActivityDaysBadge";

const locale = vi.hoisted(() => ({ current: "ja" as "ja" | "en" }));

vi.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string, values: Record<string, unknown> = {}) => {
      const messages = locale.current === "ja" ? jaMessages : enMessages;
      const template = messages.Header[key as keyof typeof messages.Header];
      return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name]));
    },
}));

function renderBadge(variant: "header" | "light" = "header") {
  return render(
    <MantineProvider env="test">
      <ActivityDaysBadge variant={variant} />
    </MantineProvider>,
  );
}

async function hoverBadge() {
  await act(async () => {
    fireEvent.mouseEnter(screen.getByRole("link"));
    await vi.advanceTimersByTimeAsync(100);
  });
  return screen.getByRole("tooltip");
}

describe("ActivityDaysBadge", () => {
  beforeEach(() => {
    locale.current = "ja";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T03:00:00Z"));
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("活動記録と同じ日数と透過ミニキャラを表示する", () => {
    renderBadge();

    const badge = screen.getByRole("link", {
      name: "AZKi 活動2886日目（2018年11月15日から、日本時間で集計）",
    });
    expect(badge).toHaveTextContent("活動2886日");
    expect(badge).toHaveAttribute("href", "/activity");
    expect(badge.querySelector("img")).toHaveAttribute(
      "src",
      "/azki-header-chibi.webp",
    );
    expect(badge.querySelector("img")).toHaveAttribute("alt", "");
  });

  it.each([
    [0, "/azki-header-chibi.webp"],
    [1 / 3, "/azki-header-chibi-20261017-01.webp"],
    [2 / 3, "/azki-header-chibi-20261017-02.webp"],
    [0.999999, "/azki-header-chibi-20261017-02.webp"],
  ])("読み込み時の乱数%sで%sを選ぶ", (random, imageSrc) => {
    vi.mocked(Math.random).mockReturnValue(random);
    renderBadge();

    expect(screen.getByRole("link").querySelector("img")).toHaveAttribute(
      "src",
      imageSrc,
    );
  });

  it("再描画や日付更新、タブ復帰では選んだ画像を変えない", () => {
    vi.mocked(Math.random).mockReturnValue(0.5);
    const { rerender } = renderBadge();
    vi.mocked(Math.random).mockReturnValue(0.9);

    rerender(
      <MantineProvider env="test">
        <ActivityDaysBadge variant="light" />
      </MantineProvider>,
    );
    act(() => vi.advanceTimersByTime(24 * 60 * 60 * 1000));
    fireEvent.focus(window);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));

    expect(screen.getByText("2887日")).toBeInTheDocument();
    expect(screen.getByRole("link").querySelector("img")).toHaveAttribute(
      "src",
      "/azki-header-chibi-20261017-01.webp",
    );
  });

  it("次の読み込みでは画像を選び直す", () => {
    const { unmount } = renderBadge();
    unmount();
    vi.mocked(Math.random).mockReturnValue(0.9);

    renderBadge();

    expect(screen.getByRole("link").querySelector("img")).toHaveAttribute(
      "src",
      "/azki-header-chibi-20261017-02.webp",
    );
  });

  it("SSRでは画像を固定し、ブラウザでランダムに選ぶ", () => {
    vi.mocked(Math.random).mockReturnValue(0.9);

    const html = renderToString(
      <MantineProvider env="test">
        <ActivityDaysBadge />
      </MantineProvider>,
    );

    expect(html).toContain('src="/azki-header-chibi.webp"');
    expect(html).not.toContain("/azki-header-chibi-20261017-02.webp");

    renderBadge();
    expect(screen.getByRole("link").querySelector("img")).toHaveAttribute(
      "src",
      "/azki-header-chibi-20261017-02.webp",
    );
  });

  it("ホバーするとMantine Tooltipで活動開始からの年月日を表示する", async () => {
    renderBadge();

    expect(screen.getByRole("link")).not.toHaveAttribute("title");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    expect(await hoverBadge()).toHaveTextContent("活動開始から 7年10ヶ月24日");

    await act(async () => {
      fireEvent.mouseLeave(screen.getByRole("link"));
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("英語でも日数と経過期間を表示する", async () => {
    locale.current = "en";
    renderBadge("light");

    expect(
      screen.getByRole("link", {
        name: "AZKi: day 2886 since November 15, 2018 (Japan time)",
      }),
    ).toHaveTextContent("Active2886 days");
    expect(await hoverBadge()).toHaveTextContent(
      "Active for 7 years 10 months 24 days",
    );
  });

  it("SSRでは日数を確定せず、ブラウザで現在の日数に更新する", () => {
    expect(
      renderToString(
        <MantineProvider env="test">
          <ActivityDaysBadge />
        </MantineProvider>,
      ),
    ).toContain("—日");

    renderBadge();
    expect(screen.getByText("2886日")).toBeInTheDocument();
    expect(screen.queryByText("—日")).not.toBeInTheDocument();
  });

  it("JSTの午前0時をまたぐと日数とTooltipの経過期間が更新される", async () => {
    vi.setSystemTime(new Date("2026-10-08T14:59:59Z"));
    renderBadge();
    expect(screen.getByText("2885日")).toBeInTheDocument();
    expect(await hoverBadge()).toHaveTextContent("活動開始から 7年10ヶ月23日");

    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByText("2886日")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "活動開始から 7年10ヶ月24日",
    );
  });

  it.each(["focus", "visibilitychange"])(
    "%sで復帰したときにも現在の日数に追いつく",
    (event) => {
      renderBadge();
      vi.setSystemTime(new Date("2026-10-10T03:00:00Z"));

      if (event === "focus") {
        fireEvent.focus(window);
      } else {
        vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
        fireEvent(document, new Event("visibilitychange"));
      }

      expect(screen.getByText("2887日")).toBeInTheDocument();
    },
  );

  it("ヘッダーを閉じると日付更新のタイマーを解除する", () => {
    const { unmount } = renderBadge();
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

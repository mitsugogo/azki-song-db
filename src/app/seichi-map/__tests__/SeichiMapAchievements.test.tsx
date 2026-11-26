import React from "react";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  SeichiMapAchievementProfile,
  SeichiMapAchievementsResponse,
  SeichiMapAchievementView,
  SeichiMapUnlockedAchievement,
} from "@/app/types/seichiMapAchievements";

const { showMock } = vi.hoisted(() => ({ showMock: vi.fn() }));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: showMock },
}));

vi.mock("@mantine/core", () => {
  const Box = ({ children }: any) => <div>{children}</div>;
  return {
    Alert: ({ children }: any) => <div role="alert">{children}</div>,
    Button: ({ children, onClick, disabled }: any) => (
      <button type="button" onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
    Center: Box,
    Divider: () => <hr />,
    Group: Box,
    Loader: () => <span>loading</span>,
    Modal: ({ children, opened, title }: any) =>
      opened ? (
        <section aria-label={title}>
          <h2>{title}</h2>
          {children}
        </section>
      ) : null,
    Paper: Box,
    Progress: ({ value }: any) => <progress value={value} max={100} />,
    RingProgress: ({ label, ...props }: any) => (
      <div role="meter" aria-label={props["aria-label"]}>
        {label}
      </div>
    ),
    ScrollArea: { Autosize: Box },
    Stack: Box,
    Text: ({ children }: any) => <p>{children}</p>,
    Tooltip: ({ children }: any) => children,
  };
});

import {
  formatSeichiMapAchievementTier,
  notifySeichiMapAchievementsUnlocked,
  pickSeichiMapLocalizedText,
  SeichiMapAchievementsModal,
  useSeichiMapAchievements,
} from "../SeichiMapAchievements";
import { SeichiMapPlayerCard } from "../SeichiMapPlayerCard";
import { formatSeichiMapHolderRate } from "../achievementText";

const t = ((key: string, values?: Record<string, unknown>) =>
  values ? `${key}:${JSON.stringify(values)}` : key) as any;

const unlocked = (
  achievementId: string,
  source: "LIVE" | "BACKFILL" = "LIVE",
  rarity: SeichiMapUnlockedAchievement["rarity"] = "N",
): SeichiMapUnlockedAchievement => ({
  achievementId,
  name: { ja: `バッジ${achievementId}`, en: null },
  metric: "LOCATION_COUNT",
  level: 1,
  thresholdType: "COUNT",
  thresholdValue: 1,
  rarity,
  source,
});

const profile = (
  overrides: Partial<SeichiMapAchievementProfile> = {},
): SeichiMapAchievementProfile => ({
  points: 540,
  level: 7,
  currentLevelPoints: 60,
  levelSpan: 150,
  earnedCount: 3,
  totalCount: 10,
  rarityCounts: { N: 1, R: 1, SR: 0, SSR: 0, UR: 1 },
  title: {
    achievementId: "layer",
    name: { ja: "交通のお姉さん", en: null },
    metric: "LOCATION_COUNT",
    level: 1,
    thresholdType: "PERCENT",
    thresholdValue: 100,
    rarity: "UR",
    holderRate: 0.02,
  },
  titleSelected: false,
  ...overrides,
});

const item = (
  overrides: Partial<SeichiMapAchievementView> = {},
): SeichiMapAchievementView => ({
  id: "layer",
  name: { ja: "交通のお姉さん", en: null },
  description: { ja: "説明", en: null },
  metric: "LOCATION_COUNT",
  progressCount: 2,
  denominator: 10,
  tiers: [
    {
      level: 1,
      thresholdType: "PERCENT",
      thresholdValue: 100,
      rarity: "UR",
      requiredCount: 10,
      achievedAt: "2026-11-26T00:00:00.000Z",
      holderRate: 0.02,
    },
    {
      level: 2,
      thresholdType: "COUNT",
      thresholdValue: 1,
      rarity: "N",
      requiredCount: 1,
      achievedAt: "2026-11-25T00:00:00.000Z",
      holderRate: 0.5,
    },
    {
      level: 3,
      thresholdType: "PERCENT",
      thresholdValue: 50,
      rarity: "SR",
      requiredCount: 5,
      achievedAt: null,
      holderRate: null,
    },
  ],
  ...overrides,
});

const response = (
  body: Partial<SeichiMapAchievementsResponse> = {},
): SeichiMapAchievementsResponse => ({
  ready: true,
  profile: profile(),
  items: [],
  unseen: [],
  ...body,
});

describe("SeichiMapAchievements", () => {
  beforeEach(() => {
    showMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("グレードの表記を件数・%・全制覇で切り替える", () => {
    expect(
      formatSeichiMapAchievementTier(t, {
        thresholdType: "PERCENT",
        thresholdValue: 100,
      }),
    ).toBe("tier.complete");
    expect(
      formatSeichiMapAchievementTier(t, {
        thresholdType: "PERCENT",
        thresholdValue: 25,
      }),
    ).toBe('tier.percent:{"value":25}');
    expect(
      formatSeichiMapAchievementTier(
        t,
        { thresholdType: "COUNT", thresholdValue: 3 },
        "PREFECTURE_COUNT",
      ),
    ).toBe('tier.prefectures:{"count":3}');
  });

  it("英語名が無ければ日本語名を使う", () => {
    expect(pickSeichiMapLocalizedText({ ja: "日本語", en: null }, "en")).toBe(
      "日本語",
    );
    expect(
      pickSeichiMapLocalizedText({ ja: "日本語", en: "English" }, "en"),
    ).toBe("English");
  });

  it("取得率を読みやすい桁数にする", () => {
    expect(formatSeichiMapHolderRate(0.5)).toBe("50%");
    expect(formatSeichiMapHolderRate(0.023)).toBe("2.3%");
    expect(formatSeichiMapHolderRate(0.0004)).toBe("<0.1%");
    expect(formatSeichiMapHolderRate(0)).toBe("0.0%");
  });

  it("獲得はレアなものから知らせ、多いときはまとめる", () => {
    notifySeichiMapAchievementsUnlocked(
      [
        unlocked("a"),
        unlocked("b", "LIVE", "UR"),
        unlocked("c"),
        unlocked("d", "LIVE", "SR"),
        unlocked("e"),
      ],
      t,
      "ja",
    );
    expect(showMock).toHaveBeenCalledTimes(3);
    expect(showMock.mock.calls[0][0]).toMatchObject({ color: "pink" });
    expect(showMock.mock.calls[0][0].message).toContain('"rarity":"UR"');
    expect(showMock.mock.calls[1][0]).toMatchObject({ color: "grape" });
    expect(showMock.mock.calls[2][0].message).toBe('toast.more:{"count":3}');
  });

  it("本人の初回取得で一括判定の獲得分を1回だけまとめて知らせ、通知済みにする", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith("/seen")
        ? new Response(JSON.stringify({ updatedCount: 2 }))
        : new Response(
            JSON.stringify(
              response({
                unseen: [unlocked("a", "BACKFILL"), unlocked("b", "BACKFILL")],
              }),
            ),
          ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(
      ({ enabled }) => useSeichiMapAchievements({ enabled }),
      { initialProps: { enabled: true } },
    );
    await waitFor(() => expect(result.current.data?.ready).toBe(true));
    rerender({ enabled: true });
    rerender({ enabled: true });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/seichi-map/achievements/seen",
        { method: "POST" },
      ),
    );
    expect(
      fetchMock.mock.calls.filter(
        ([url]) => url === "/api/seichi-map/achievements",
      ),
    ).toHaveLength(1);
    expect(showMock).toHaveBeenCalledTimes(1);
    expect(showMock.mock.calls[0][0].message).toBe("toast.summary");
  });

  it("共有マップでは持ち主の状況を取得し、通知や既読化はしない", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify(response({ unseen: [unlocked("a", "BACKFILL")] })),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useSeichiMapAchievements({ enabled: true, shareId: "share/1" }),
    );
    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/seichi-map/share/share%2F1/achievements",
      { cache: "no-store" },
    );
    act(() => result.current.handleUnlocked([unlocked("b")]));
    await expect(
      result.current.updateTitle({ achievementId: "a", level: 1 }),
    ).resolves.toBe(false);
    expect(showMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ログインしていなければ取得しない", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useSeichiMapAchievements({ enabled: false }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it("訪問の保存で獲得した分をトーストで知らせ、一覧を取り直す", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify(response())),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() =>
      useSeichiMapAchievements({ enabled: true }),
    );
    await waitFor(() => expect(result.current.data).not.toBeNull());
    fetchMock.mockClear();

    act(() => {
      result.current.handleUnlocked([unlocked("a")]);
    });

    expect(showMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("称号を変更したら一覧を取り直す", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify(response())),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() =>
      useSeichiMapAchievements({ enabled: true }),
    );
    await waitFor(() => expect(result.current.data).not.toBeNull());
    fetchMock.mockClear();

    await act(async () => {
      await expect(
        result.current.updateTitle({ achievementId: "layer", level: 1 }),
      ).resolves.toBe(true);
    });

    expect(fetchMock.mock.calls[0]).toEqual([
      "/api/seichi-map/achievements/title",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementId: "layer", level: 1 }),
      },
    ]);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/seichi-map/achievements");

    fetchMock.mockClear();
    await act(async () => {
      await result.current.updateTitle(null);
    });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      body: JSON.stringify({ achievementId: null }),
    });
  });

  it("プレイヤーカードにレベル・称号・ポイントを表示し、押すと開く", () => {
    const onClick = vi.fn();
    render(
      <SeichiMapPlayerCard
        profile={profile()}
        onClick={onClick}
        label="バッジ一覧を開く"
      />,
    );

    const card = screen.getByRole("button", { name: "バッジ一覧を開く" });
    expect(card).toHaveTextContent("7");
    expect(card).toHaveTextContent("UR");
    expect(card).toHaveTextContent("交通のお姉さん");
    expect(card).toHaveTextContent("points");
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("本人のバッジ一覧では獲得済みのグレードを押して称号を選べる", () => {
    const onSelectTitle = vi.fn();
    const { rerender } = render(
      <SeichiMapAchievementsModal
        opened
        onClose={vi.fn()}
        loading={false}
        error={false}
        editable
        onSelectTitle={onSelectTitle}
        data={response({ items: [item()] })}
      />,
    );

    const buttons = screen.getAllByRole("button", { pressed: false });
    // 自動で選ばれている称号（UR）を押すと固定する
    fireEvent.click(screen.getByRole("button", { pressed: true }));
    expect(onSelectTitle).toHaveBeenLastCalledWith({
      achievementId: "layer",
      level: 1,
    });
    fireEvent.click(buttons[0]);
    expect(onSelectTitle).toHaveBeenLastCalledWith({
      achievementId: "layer",
      level: 2,
    });
    // 未獲得のグレードは押せない
    expect(screen.queryAllByRole("button", { name: /\(SR\)/ })).toHaveLength(0);
    expect(screen.getByText("titleAutoHint")).toBeInTheDocument();

    rerender(
      <SeichiMapAchievementsModal
        opened
        onClose={vi.fn()}
        loading={false}
        error={false}
        editable
        onSelectTitle={onSelectTitle}
        data={response({
          profile: profile({ titleSelected: true }),
          items: [item()],
        })}
      />,
    );
    // 自分で選んだ称号をもう一度押すと自動に戻す
    fireEvent.click(screen.getByRole("button", { pressed: true }));
    expect(onSelectTitle).toHaveBeenLastCalledWith(null);
    fireEvent.click(screen.getByRole("button", { name: "resetTitle" }));
    expect(onSelectTitle).toHaveBeenLastCalledWith(null);
  });

  it("他人のバッジ一覧は閲覧だけで、持ち主の名前を見出しにする", () => {
    render(
      <SeichiMapAchievementsModal
        opened
        onClose={vi.fn()}
        loading={false}
        error={false}
        ownerName="開拓者A"
        data={response({
          items: [
            item(),
            item({
              id: "empty",
              name: { ja: "準備中のバッジ", en: null },
              description: null,
              progressCount: 0,
              denominator: 0,
              tiers: [
                {
                  level: 1,
                  thresholdType: "PERCENT",
                  thresholdValue: 10,
                  rarity: "R",
                  requiredCount: null,
                  achievedAt: null,
                  holderRate: null,
                },
              ],
            }),
          ],
        })}
      />,
    );

    expect(screen.getByRole("heading")).toHaveTextContent("titleOf");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getAllByText("交通のお姉さん").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("progressbar")[0]).toHaveAttribute(
      "value",
      "40",
    );
    expect(screen.getByText("preparing")).toBeInTheDocument();
  });

  it("同期前は準備中の案内を表示する", () => {
    render(
      <SeichiMapAchievementsModal
        opened
        onClose={vi.fn()}
        loading={false}
        error={false}
        data={response({ ready: false, profile: null })}
      />,
    );
    expect(screen.getByText("notReady")).toBeInTheDocument();
  });
});

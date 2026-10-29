import { emptySlotCategories } from "@/app/lib/bestNineCategories";
import { MantineProvider } from "@mantine/core";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/ja.json";
import { buildThemeQuery, emptyThemes } from "@/app/lib/myBestNineSongs";
import type { MyBestNineSongs } from "@/app/lib/myBestNineSongs";
import type { Song } from "@/app/types/song";

let params = new URLSearchParams();
let authStatus = "unauthenticated";
const signInMock = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    status: authStatus,
    data:
      authStatus === "authenticated"
        ? { user: { id: "owner", isAdmin: false } }
        : null,
  }),
  signIn: (...args: unknown[]) => signInMock(...args),
}));
vi.mock("next/navigation", () => ({ useSearchParams: () => params }));
vi.mock("next-intl", () => ({
  useLocale: () => "ja",
  useTranslations:
    (namespace: string) => (key: string, values?: Record<string, unknown>) => {
      let value: unknown = messages;
      for (const part of `${namespace}.${key}`.split("."))
        value = (value as Record<string, unknown>)?.[part];
      return String(value ?? key).replace(/\{(\w+)\}/g, (_, name: string) =>
        String(values?.[name] ?? name),
      );
    },
}));
const measureElementMock = vi.fn();
let virtualRows = [{ index: 0, start: 0, end: 220, key: "row" }];
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => virtualRows,
    getTotalSize: () => 220,
    measureElement: measureElementMock,
  }),
}));
const songs = [
  {
    video_id: "song-a",
    title: "曲A",
    start: 0,
    artist: "AZKi",
    tags: [],
    broadcast_at: "2024-01-01",
  },
  {
    video_id: "song-b",
    title: "曲B",
    start: 10,
    artist: "AZKi",
    tags: [],
    broadcast_at: "2024-01-01",
  },
] as Song[];
let availableSongs = songs;
vi.mock("@/app/hook/useSongs", () => ({
  default: () => ({ allSongs: availableSongs, isLoading: false }),
}));
vi.mock("@/app/hook/useSearch", () => ({
  default: () => ({ songs, searchTerm: "", setSearchTerm: vi.fn() }),
}));
vi.mock("@/app/hook/useGlobalPlayer", () => ({
  useGlobalPlayer: () => ({
    setCurrentSong: vi.fn(),
    setCurrentTime: vi.fn(),
    setIsPlaying: vi.fn(),
    setIsMinimized: vi.fn(),
  }),
}));
vi.mock("@/app/components/YoutubeThumbnail", () => ({
  default: ({ alt }: { alt: string }) => <span>{alt}サムネイル</span>,
}));
const notify = vi.fn();
vi.mock("@/app/lib/notifications", () => ({
  showAppNotification: (...args: unknown[]) => notify(...args),
}));

import Client from "../client";

const draftKey = "my-best-9-songs-draft";
const readDraft = (): MyBestNineSongs =>
  JSON.parse(localStorage.getItem(draftKey)!);
const mount = () =>
  render(
    <MantineProvider
      env="test"
      theme={{
        components: {
          Accordion: { defaultProps: { transitionDuration: 0 } },
          Modal: { defaultProps: { transitionProps: { duration: 0 } } },
        },
      }}
    >
      <Client />
    </MantineProvider>,
  );
const openCreate = () => {
  fireEvent.click(screen.getByRole("button", { name: "お題を作成する" }));
  return within(screen.getByRole("dialog", { name: "お題を作成する" }));
};
const choose = (title: string) =>
  fireEvent.click(
    Array.from(document.querySelectorAll("article")).find((article) =>
      article.textContent?.includes(title),
    )!,
  );
const openThemes = () =>
  fireEvent.click(screen.getByRole("button", { name: "枠ごとのお題" }));
const mountOwnerEditing = async () => {
  authStatus = "authenticated";
  const id = "12345678-1234-4234-8234-123456789abc";
  params = new URLSearchParams({ topic: id });
  vi.mocked(fetch).mockImplementation(async (url) =>
    Response.json(
      String(url).endsWith(`/topics/${id}`)
        ? {
            topic: {
              id,
              title: "登録されたお題",
              themes: emptyThemes(),
              version: 1,
              canEdit: true,
              canViewResults: true,
            },
            response: null,
          }
        : { id: "selection-id", ready: true },
    ),
  );
  mount();
  await screen.findByRole("button", { name: "お題を編集" });
  expect(screen.queryByRole("button", { name: "枠ごとのお題" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "お題を編集" }));
};
const preset = () => {
  openThemes();
  fireEvent.click(screen.getByRole("button", { name: "おすすめのお題を入力" }));
};

describe("9選の枠ごとのお題編集", () => {
  beforeEach(() => {
    availableSongs = songs;
    virtualRows = [{ index: 0, start: 0, end: 220, key: "row" }];
    measureElementMock.mockClear();
    localStorage.clear();
    sessionStorage.clear();
    authStatus = "unauthenticated";
    signInMock.mockClear();
    params = new URLSearchParams();
    notify.mockClear();
    global.__mockNextRouter.push.mockClear();
    global.__mockNextRouter.replace.mockClear();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(async () => Response.json({ id: "selection-id" })),
    );
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("作成時に枠ごとに複数カテゴリを指定し、Googleログイン後の作成用にも保持する", async () => {
    mount();
    const dialog = openCreate();
    fireEvent.click(dialog.getByRole("radio", { name: "枠ごとのお題" }));
    fireEvent.click(
      dialog.getByRole("button", { name: "おすすめのお題を入力" }),
    );
    const first = dialog.getByLabelText("1枠目のカテゴリ");
    fireEvent.click(first);
    fireEvent.click(
      screen.getByRole("option", { name: "オリ曲", exact: true }),
    );
    fireEvent.keyDown(first, { key: "Escape" });
    const second = dialog.getByLabelText("2枠目のカテゴリ");
    fireEvent.click(second);
    fireEvent.click(
      screen.getByRole("option", { name: "オリ曲", exact: true }),
    );
    fireEvent.click(
      screen.getByRole("option", { name: "カバー曲", exact: true }),
    );
    fireEvent.keyDown(second, { key: "Escape" });
    fireEvent.click(
      dialog.getByRole("button", {
        name: messages.Share.myBest9.topics.loginToCreate,
      }),
    );
    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    const saved = JSON.parse(
      sessionStorage.getItem("azki-best-nine:pending-topic")!,
    );
    expect(saved.slotCategories).toEqual([
      ["original"],
      ["original", "cover"],
      ...emptySlotCategories().slice(2),
    ]);
  });

  it("回答する枠を移動すると、その枠のカテゴリに候補が切り替わる", async () => {
    const slotCategories = emptySlotCategories();
    slotCategories[0] = ["original"];
    slotCategories[1] = ["cover"];
    availableSongs = [
      { ...songs[0], title: "オリジナルA", tags: ["オリ曲"], sing: "AZKi" },
      { ...songs[1], title: "カバーB", tags: ["カバー曲"], sing: "AZKi" },
    ];
    params = new URLSearchParams({
      topic: "12345678-1234-4234-8234-123456789abc",
    });
    vi.mocked(fetch).mockImplementation(async (url) =>
      Response.json(
        String(url).includes("/topics/")
          ? {
              topic: {
                id: params.get("topic"),
                title: "カテゴリ別",
                version: 1,
                themes: [
                  "オリ曲を一曲",
                  "カバー曲を一曲",
                  ...emptyThemes().slice(2),
                ],
                slotCategories,
                canEdit: false,
                canViewResults: false,
              },
              response: null,
            }
          : { ready: true },
      ),
    );
    mount();
    await screen.findByDisplayValue("カテゴリ別");
    await waitFor(() =>
      expect(document.querySelectorAll("article")).toHaveLength(1),
    );
    expect(document.querySelector("article")).toHaveTextContent("オリジナルA");
    choose("オリジナルA");
    await waitFor(() =>
      expect(document.querySelector("article")).toHaveTextContent("カバーB"),
    );
    choose("カバーB");
    expect(readDraft().songs).toEqual([
      { v: "song-a", s: "0", slot: 0 },
      { v: "song-b", s: "10", slot: 1 },
    ]);
    expect(readDraft().slotCategories).toEqual(slotCategories);
  });

  it("計測対象のカードから仮想行番号を警告なしで読み取れる", async () => {
    availableSongs = Array.from({ length: 11 }, (_, index) => ({
      ...songs[0],
      video_id: `video-${index}`,
    }));
    virtualRows = [
      { index: 1, start: 220, end: 440, key: "row-1" },
      { index: 2, start: 440, end: 660, key: "row-2" },
    ];
    const {
      Virtualizer,
      elementScroll,
      observeElementRect,
      observeElementOffset,
    } = await vi.importActual<typeof import("@tanstack/react-virtual")>(
      "@tanstack/react-virtual",
    );
    const virtualizer = new Virtualizer<HTMLDivElement, HTMLElement>({
      count: 3,
      getScrollElement: () => null,
      estimateSize: () => 220,
      scrollToFn: elementScroll,
      observeElementRect,
      observeElementOffset,
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mount();
    const elements = [
      ...new Set(
        measureElementMock.mock.calls
          .map(([element]) => element as HTMLElement | null)
          .filter((element): element is HTMLElement => element !== null),
      ),
    ];
    expect(elements.length).toBeGreaterThanOrEqual(2);
    expect([
      ...new Set(
        elements.map((element) => virtualizer.indexFromElement(element)),
      ),
    ]).toEqual([1, 2]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("選曲欄は一箇所で表示し、明示した削除ボタンで曲を外せる", () => {
    mount();
    expect(
      screen.getByRole("heading", { name: "曲を選ぶ" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: "選択済みの曲" }),
    ).toHaveLength(1);
    expect(
      screen.getByText("一覧から曲を選んでください。"),
    ).toBeInTheDocument();
    choose("曲A");
    expect(screen.getByLabelText("選択済み: 1/9")).toHaveTextContent("1 / 9");
    expect(
      screen.getByRole("button", { name: "「曲A」を選択" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(
      screen.getByRole("button", { name: "「曲A」を選曲から外す" }),
    );
    expect(readDraft().songs).toEqual([]);
    expect(screen.getByLabelText("選択済み: 0/9")).toBeInTheDocument();
  });

  it("再生ボタンは選曲せず、カテゴリの選択状態を切り替えられる", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "「曲A」を再生" }));
    expect(readDraft().songs).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "歌枠", exact: true }));
    expect(
      screen.getByRole("button", { name: "歌枠", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "「曲A」を選択" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "全て", exact: true }));
    expect(
      screen.getByRole("button", { name: "「曲A」を選択" }),
    ).toBeInTheDocument();
  });

  it("作成したお題と集計は専用ページへのリンクから開く", () => {
    mount();
    expect(
      screen.getByRole("link", { name: "作成したお題・集計" }),
    ).toHaveAttribute("href", "/share/my-best-9-songs/topics");
    expect(
      screen.queryByRole("button", { name: "作成したお題・集計" }),
    ).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("通常画面ではお題を設定できず、任意の曲を重複せずに選べる", () => {
    mount();
    expect(screen.queryByRole("button", { name: "枠ごとのお題" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "おすすめのお題を入力" }),
    ).toBeNull();
    expect(screen.queryByLabelText("1枠目のお題")).toBeNull();
    choose("曲A");
    expect(readDraft().songs).toEqual([{ v: "song-a", s: "0" }]);
    choose("曲A");
    expect(readDraft().songs).toEqual([]);
    expect(readDraft().themes).toBeUndefined();
    const dialog = openCreate();
    fireEvent.click(dialog.getByRole("radio", { name: "枠ごとのお題" }));
    expect(dialog.getByLabelText("1枠目のお題")).toBeInTheDocument();
  });

  it("既存のお題に同じ曲を別枠へ割り当て、置換・削除して回答できる", async () => {
    params = new URLSearchParams(
      buildThemeQuery(
        "募集",
        Array.from(
          { length: 9 },
          (_, index) =>
            messages.Share.myBest9.themes.presets[String(index) as "0"],
        ),
      ),
    );
    mount();
    expect(screen.queryByRole("button", { name: "枠ごとのお題" })).toBeNull();
    choose("曲A");
    choose("曲A");
    expect(readDraft().songs).toEqual([
      { v: "song-a", s: "0", slot: 0 },
      { v: "song-a", s: "0", slot: 1 },
    ]);
    fireEvent.click(
      screen.getAllByRole("button", { name: /1\. あなたの出会いの曲/ })[0],
    );
    choose("曲B");
    expect(readDraft().songs[0]).toEqual({ v: "song-b", s: "10", slot: 0 });
    fireEvent.click(
      screen.getAllByRole("button", { name: "1枠目の曲を削除" })[0],
    );
    expect(readDraft().songs).toEqual([{ v: "song-a", s: "0", slot: 1 }]);
    fireEvent.click(screen.getByRole("button", { name: "共有URLを生成" }));
    await screen.findByRole("button", { name: "共有URL作成済み" });
    const payload = JSON.parse(
      vi
        .mocked(fetch)
        .mock.calls.find(([url]) => url === "/api/share/my-best-9-songs")![1]!
        .body as string,
    );
    expect(payload.themes[0]).toBe("あなたの出会いの曲");
    expect(payload.songs[0].slot).toBe(1);
  });

  it("重複がある状態でお題を消すと確認し、キャンセルでは維持する", async () => {
    await mountOwnerEditing();
    preset();
    choose("曲A");
    choose("曲A");
    fireEvent.click(screen.getByRole("button", { name: "お題をすべて消す" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "キャンセル",
      }),
    );
    expect(readDraft().songs).toHaveLength(2);
    expect(readDraft().themes).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "お題をすべて消す" }));
    fireEvent.click(screen.getByRole("button", { name: "重複を除いて戻す" }));
    expect(readDraft().songs).toEqual([{ v: "song-a", s: "0" }]);
    expect(readDraft().themes).toBeUndefined();
  });

  it("最後のカテゴリ制限を解除するときも重複の確認を行う", async () => {
    availableSongs = songs.map((song) => ({ ...song, tags: ["歌枠"] }));
    await mountOwnerEditing();
    openThemes();
    const categories = screen.getByLabelText("1枠目のカテゴリ");
    fireEvent.click(categories);
    fireEvent.click(screen.getByRole("option", { name: "歌枠", exact: true }));
    fireEvent.keyDown(categories, { key: "Escape" });
    choose("曲A");
    choose("曲A");
    fireEvent.click(categories);
    fireEvent.click(screen.getByRole("option", { name: "全て", exact: true }));
    const confirm = within(
      screen.getByRole("dialog", { name: "従来の選曲方法に戻しますか？" }),
    );
    fireEvent.click(confirm.getByRole("button", { name: "キャンセル" }));
    expect(readDraft().slotCategories?.[0]).toEqual(["live-singing"]);
    expect(readDraft().songs).toHaveLength(2);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.keyDown(categories, { key: "Escape" });
    fireEvent.click(categories);
    fireEvent.click(screen.getByRole("option", { name: "全て", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "重複を除いて戻す" }));
    expect(readDraft().slotCategories).toBeUndefined();
    expect(readDraft().songs).toEqual([{ v: "song-a", s: "0" }]);
  });

  it("選んだ枠の曲だけを置換し、最後のお題を消すと従来型に戻る", async () => {
    await mountOwnerEditing();
    openThemes();
    fireEvent.change(screen.getByLabelText("1枠目のお題"), {
      target: { value: "出会い" },
    });
    choose("曲A");
    fireEvent.click(screen.getAllByRole("button", { name: /1\. 出会い/ })[0]);
    choose("曲B");
    expect(readDraft().songs).toEqual([{ v: "song-b", s: "10", slot: 0 }]);
    fireEvent.change(screen.getByLabelText("1枠目のお題"), {
      target: { value: "" },
    });
    expect(readDraft().themes).toBeUndefined();
    expect(readDraft().songs).toEqual([{ v: "song-b", s: "10" }]);
  });

  it("最後の1題を消す場合も重複の確認を行う", async () => {
    await mountOwnerEditing();
    openThemes();
    fireEvent.change(screen.getByLabelText("1枠目のお題"), {
      target: { value: "出会い" },
    });
    choose("曲A");
    choose("曲A");
    fireEvent.change(screen.getByLabelText("1枠目のお題"), {
      target: { value: "" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "キャンセル",
      }),
    );
    expect(screen.getByLabelText("1枠目のお題")).toHaveValue("出会い");
    expect(readDraft().songs).toHaveLength(2);
  });

  it("回答の変更で共有URLの生成ロックを解除し、リセットでは全て消す", async () => {
    params = new URLSearchParams(
      buildThemeQuery("募集", ["出会い", ...emptyThemes().slice(1)]),
    );
    mount();
    choose("曲A");
    fireEvent.click(screen.getByRole("button", { name: "共有URLを生成" }));
    expect(
      await screen.findByRole("button", { name: "共有URL作成済み" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("作成者名（任意）"), {
      target: { value: "回答者" },
    });
    expect(screen.getByRole("button", { name: "共有URLを生成" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "共有URLを生成" }));
    await screen.findByRole("button", { name: "共有URL作成済み" });
    fireEvent.change(screen.getByLabelText("タイトル", { exact: false }), {
      target: { value: "私が選んだ究極の9曲 " },
    });
    expect(screen.getByRole("button", { name: "共有URLを生成" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "リセット" }));
    expect(readDraft().songs).toEqual([]);
    expect(readDraft().themes).toBeUndefined();
    expect(screen.queryByLabelText("1枠目のお題")).toBeNull();
  });

  it.each([undefined, "12345678-1234-4234-8234-123456789abc"])(
    "topicなしでは保存済み下書きを復元も自動移動もしない（保存topic=%s）",
    (topicId) => {
      const saved = {
        title: "保存タイトル",
        author: "作者",
        topicId,
        topicVersion: topicId ? 1 : undefined,
        themes: ["出会い", ...emptyThemes().slice(1)],
        songs: [{ v: "song-a", s: "0", slot: 8 }],
      };
      localStorage.setItem(draftKey, JSON.stringify(saved));
      mount();
      expect(screen.getByLabelText("タイトル", { exact: false })).toHaveValue(
        "私が選んだ究極の9曲",
      );
      expect(screen.getByLabelText("作成者名（任意）")).toHaveValue("");
      expect(
        screen.queryByRole("button", { name: "9枠目の曲を削除" }),
      ).toBeNull();
      expect(global.__mockNextRouter.replace).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      expect(readDraft()).toEqual(JSON.parse(JSON.stringify(saved)));
      choose("曲B");
      expect(readDraft().songs).toEqual([{ v: "song-b", s: "10" }]);
      expect(readDraft().topicId).toBeUndefined();
    },
  );

  it.each([true, false])(
    "旧お題URLも選曲・作成者を復元せず新規にする（一致=%s）",
    (match) => {
      const themes = ["出会い", ...emptyThemes().slice(1)];
      params = new URLSearchParams(buildThemeQuery("募集", themes));
      const saved = {
        title: match ? "募集" : "別の募集",
        themes,
        author: "作者",
        songs: [{ v: "song-a", s: "0", slot: 8 }],
      };
      localStorage.setItem(draftKey, JSON.stringify(saved));
      mount();
      expect(screen.getByLabelText("タイトル", { exact: false })).toHaveValue(
        "募集",
      );
      expect(screen.getByLabelText("作成者名（任意）")).toHaveValue("");
      expect(readDraft()).toEqual(saved);
      choose("曲B");
      expect(readDraft().songs).toEqual([{ v: "song-b", s: "10", slot: 0 }]);
      expect(readDraft().author).toBe("");
    },
  );

  it("不正なお題URLを通知し、ダイアログからの作成にはGoogleログインを要求する", () => {
    params = new URLSearchParams("title=募集&themes=broken!");
    mount();
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: "warning" }),
    );
    const dialog = openCreate();
    fireEvent.click(dialog.getByRole("radio", { name: "枠ごとのお題" }));
    fireEvent.click(
      dialog.getByRole("button", { name: "おすすめのお題を入力" }),
    );
    fireEvent.click(
      dialog.getByRole("button", { name: "Googleでログインしてお題を作成" }),
    );
    expect(signInMock).toHaveBeenCalledWith(
      "google",
      expect.objectContaining({
        callbackUrl: expect.stringContaining("resumeTopic=1"),
      }),
    );
    expect(
      JSON.parse(sessionStorage.getItem("azki-best-nine:pending-topic")!)
        .themes[0],
    ).toBe("あなたの出会いの曲");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("作成をキャンセルしても選曲や下書きを変更せず、開き直すと新規ダイアログになる", () => {
    mount();
    choose("曲A");
    const saved = readDraft();
    const dialog = openCreate();
    expect(dialog.getByRole("radio", { name: "任意の9曲" })).toBeChecked();
    fireEvent.change(dialog.getByLabelText("タイトル", { exact: false }), {
      target: { value: "未保存" },
    });
    fireEvent.click(dialog.getByRole("button", { name: "キャンセル" }));
    expect(readDraft()).toEqual(saved);
    expect(fetch).not.toHaveBeenCalled();
    expect(
      openCreate().getByLabelText("タイトル", { exact: false }),
    ).toHaveValue("私が選んだ究極の9曲");
  });

  it("テーマ方式は1題以上を必要とし、空白タイトルも作成しない", () => {
    mount();
    const dialog = openCreate();
    const submit = dialog.getByRole("button", {
      name: "Googleでログインしてお題を作成",
    });
    fireEvent.click(dialog.getByRole("radio", { name: "枠ごとのお題" }));
    expect(submit).toBeDisabled();
    fireEvent.change(dialog.getByLabelText("1枠目のお題"), {
      target: { value: "出会い" },
    });
    expect(submit).toBeEnabled();
    fireEvent.change(dialog.getByLabelText("タイトル", { exact: false }), {
      target: { value: "  " },
    });
    expect(submit).toBeDisabled();
  });

  it("new=1の作成導線はダイアログを開き、保存済み選曲を引き継がない", () => {
    params = new URLSearchParams("new=1");
    mount();
    expect(
      screen.getByRole("dialog", { name: "お題を作成する" }),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["NOT_FOUND", "SERVICE_UNAVAILABLE"])(
    "お題の取得が%sの場合、削除済みだけ新規画面へ戻して通知する",
    async (code) => {
      params = new URLSearchParams({
        topic: "12345678-1234-4234-8234-123456789abc",
      });
      vi.mocked(fetch).mockImplementation(async (url) =>
        String(url).includes("/topics/")
          ? Response.json(
              { error: code },
              { status: code === "NOT_FOUND" ? 404 : 503 },
            )
          : Response.json({ ready: true }),
      );
      mount();
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      if (code === "NOT_FOUND") {
        await waitFor(() =>
          expect(global.__mockNextRouter.replace).toHaveBeenCalledWith(
            "/share/my-best-9-songs",
          ),
        );
        expect(notify).toHaveBeenCalledWith({
          type: "warning",
          message: "このお題はありません",
        });
      } else {
        await screen.findByText(
          messages.Share.myBest9.topics.errors.SERVICE_UNAVAILABLE,
        );
        expect(global.__mockNextRouter.replace).not.toHaveBeenCalled();
        expect(notify).not.toHaveBeenCalled();
      }
    },
  );

  it("お題IDから読み込み、ゲストは定義を編集せず回答できる", async () => {
    const id = "12345678-1234-4234-8234-123456789abc";
    params = new URLSearchParams({ topic: id });
    vi.mocked(fetch).mockImplementation(async (url) =>
      Response.json(
        String(url).endsWith(`/topics/${id}`)
          ? {
              topic: {
                id,
                version: 1,
                title: "登録されたお題",
                themes: ["出会い", ...emptyThemes().slice(1)],
                canEdit: false,
                canViewResults: false,
              },
              response: null,
            }
          : { id: "saved-id", ready: true },
      ),
    );
    mount();
    await waitFor(() =>
      expect(screen.getByLabelText("タイトル", { exact: false })).toHaveValue(
        "登録されたお題",
      ),
    );
    expect(screen.getByLabelText("タイトル", { exact: false })).toHaveAttribute(
      "readonly",
    );
    fireEvent.change(screen.getByLabelText("タイトル", { exact: false }), {
      target: { value: "変更したタイトル" },
    });
    expect(screen.getByLabelText("タイトル", { exact: false })).toHaveValue(
      "登録されたお題",
    );
    expect(screen.queryByRole("button", { name: "お題を編集" })).toBeNull();
    expect(screen.queryByRole("button", { name: "枠ごとのお題" })).toBeNull();
    expect(screen.queryByLabelText("1枠目のお題")).toBeNull();
    choose("曲A");
    expect(readDraft()).toMatchObject({ topicId: id, topicVersion: 1 });
    fireEvent.click(screen.getByRole("button", { name: "共有URLを生成" }));
    await screen.findByRole("button", { name: "共有URL作成済み" });
    const saved = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => url === "/api/share/my-best-9-songs")!;
    expect(JSON.parse(saved[1]!.body as string)).toMatchObject({
      topicId: id,
      topicVersion: 1,
    });
  });

  it.each(["matching", "other-topic", "old-version", "no-draft"])(
    "topic付きURLは一致する下書きか保存済み回答を復元する（%s）",
    async (source) => {
      const id = "12345678-1234-4234-8234-123456789abc";
      params = new URLSearchParams({ topic: id });
      if (source !== "no-draft")
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            title: "編集途中",
            author: "下書きの回答者",
            themes: ["出会い", ...emptyThemes().slice(1)],
            topicId: source === "other-topic" ? "other-topic" : id,
            topicVersion: source === "old-version" ? 1 : 2,
            songs: [{ v: "song-a", s: "0", slot: 8 }],
          }),
        );
      vi.mocked(fetch).mockImplementation(async (url) =>
        Response.json(
          String(url).endsWith(`/topics/${id}`)
            ? {
                topic: {
                  id,
                  title: "現在のお題",
                  themes: ["出会い", ...emptyThemes().slice(1)],
                  version: 2,
                  canEdit: false,
                  canViewResults: false,
                },
                response: {
                  id: "answer-id",
                  selection: {
                    title: "現在のお題",
                    author: "保存済み回答者",
                    themes: ["出会い", ...emptyThemes().slice(1)],
                    songs: [{ v: "song-b", s: "10", slot: 4 }],
                  },
                },
              }
            : { ready: true },
        ),
      );
      mount();
      await waitFor(() =>
        expect(screen.getByLabelText("タイトル", { exact: false })).toHaveValue(
          "現在のお題",
        ),
      );
      expect(screen.getByLabelText("作成者名（任意）")).toHaveValue(
        ["matching", "old-version"].includes(source)
          ? "下書きの回答者"
          : "保存済み回答者",
      );
      expect(
        screen.getAllByRole("button", {
          name: ["matching", "old-version"].includes(source)
            ? "9枠目の曲を削除"
            : "5枠目の曲を削除",
        }),
      ).toHaveLength(1);
      expect(global.__mockNextRouter.replace).not.toHaveBeenCalled();
    },
  );

  it.each(["themed", "free"])(
    "ログイン済みのダイアログ作成で新しいお題IDへ移動する（%s）",
    async (mode) => {
      authStatus = "authenticated";
      const id = "12345678-1234-4234-8234-123456789abc";
      vi.mocked(fetch).mockImplementation(async () =>
        Response.json({ topic: { id, version: 1 } }),
      );
      mount();
      // 回答画面のタイトルや曲を、新しいお題の定義へ流用しない。
      fireEvent.change(screen.getByLabelText("タイトル", { exact: false }), {
        target: { value: "回答のタイトル" },
      });
      choose("曲A");
      const dialog = openCreate();
      fireEvent.change(dialog.getByLabelText("タイトル", { exact: false }), {
        target: { value: " 新しい募集 " },
      });
      if (mode === "themed") {
        fireEvent.click(dialog.getByRole("radio", { name: "枠ごとのお題" }));
        fireEvent.click(
          dialog.getByRole("button", { name: "おすすめのお題を入力" }),
        );
        fireEvent.change(dialog.getByLabelText("3枠目のお題"), {
          target: { value: "独自のお題" },
        });
      }
      fireEvent.click(dialog.getByRole("button", { name: "お題を作成する" }));
      await waitFor(() =>
        expect(global.__mockNextRouter.push).toHaveBeenCalledWith(
          `/share/my-best-9-songs?topic=${id}&revision=1`,
        ),
      );
      const call = vi
        .mocked(fetch)
        .mock.calls.find(
          ([url]) => url === "/api/share/my-best-9-songs/topics",
        )!;
      expect(call[1]?.method).toBe("POST");
      expect(JSON.parse(call[1]!.body as string)).toEqual({
        title: "新しい募集",
        slotCategories: emptySlotCategories(),
        themes:
          mode === "free"
            ? emptyThemes()
            : Array.from({ length: 9 }, (_, index) =>
                index === 2
                  ? "独自のお題"
                  : messages.Share.myBest9.themes.presets[String(index) as "0"],
              ),
      });
    },
  );

  it("APIエラーではダイアログの入力を維持し、再試行できる", async () => {
    authStatus = "authenticated";
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 }),
    );
    mount();
    const dialog = openCreate();
    fireEvent.change(dialog.getByLabelText("タイトル", { exact: false }), {
      target: { value: "再試行する募集" },
    });
    fireEvent.click(dialog.getByRole("button", { name: "お題を作成する" }));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" }),
      ),
    );
    expect(dialog.getByLabelText("タイトル", { exact: false })).toHaveValue(
      "再試行する募集",
    );
    expect(
      dialog.getByRole("button", { name: "お題を作成する" }),
    ).toBeEnabled();
  });

  it("通常アクセスでは古いログイン保留データがあってもお題を作成しない", () => {
    authStatus = "authenticated";
    sessionStorage.setItem(
      "azki-best-nine:pending-topic",
      JSON.stringify({ title: "古い保留", themes: emptyThemes() }),
    );
    mount();
    expect(fetch).not.toHaveBeenCalled();
    expect(global.__mockNextRouter.push).not.toHaveBeenCalled();
  });

  it("Googleログインから戻ると保留していたお題作成を再開する", async () => {
    params = new URLSearchParams("resumeTopic=1");
    authStatus = "authenticated";
    const id = "12345678-1234-4234-8234-123456789abc";
    sessionStorage.setItem(
      "azki-best-nine:pending-topic",
      JSON.stringify({ title: "ログイン前のお題", themes: emptyThemes() }),
    );
    vi.mocked(fetch).mockImplementation(async () =>
      Response.json({ topic: { id, version: 1 } }),
    );
    mount();
    await waitFor(() =>
      expect(sessionStorage.getItem("azki-best-nine:pending-topic")).toBeNull(),
    );
    const call = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => url === "/api/share/my-best-9-songs/topics")!;
    expect(JSON.parse(call[1]!.body as string).title).toBe("ログイン前のお題");
  });

  it("作成者はお題を編集して変更を保存できる", async () => {
    authStatus = "authenticated";
    const id = "12345678-1234-4234-8234-123456789abc";
    params = new URLSearchParams({ topic: id });
    const topic = {
      id,
      title: "元のお題",
      themes: emptyThemes(),
      version: 1,
      canEdit: true,
      canViewResults: true,
    };
    vi.mocked(fetch).mockImplementation(async (_url, init) =>
      Response.json(
        init?.method === "PATCH"
          ? { topic: { ...topic, version: 2 } }
          : { topic, response: null, ready: true },
      ),
    );
    mount();
    await screen.findByRole("button", { name: "お題を編集" });
    fireEvent.click(screen.getByRole("button", { name: "お題を編集" }));
    expect(
      screen.getByLabelText("タイトル", { exact: false }),
    ).not.toHaveAttribute("readonly");
    fireEvent.change(screen.getByLabelText("タイトル", { exact: false }), {
      target: { value: "改訂したお題" },
    });
    fireEvent.click(screen.getByRole("button", { name: "変更を保存" }));
    await waitFor(() =>
      expect(
        vi
          .mocked(fetch)
          .mock.calls.some(([, init]) => init?.method === "PATCH"),
      ).toBe(true),
    );
    const call = vi
      .mocked(fetch)
      .mock.calls.find(([, init]) => init?.method === "PATCH")!;
    expect(JSON.parse(call[1]!.body as string)).toMatchObject({
      title: "改訂したお題",
      version: 1,
    });
  });
});

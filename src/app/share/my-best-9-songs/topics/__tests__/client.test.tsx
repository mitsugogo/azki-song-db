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
import Client from "../client";
import { AdminModeProvider } from "@/app/context/AdminModeContext";
import { ADMIN_MODE_STORAGE_KEY } from "@/app/lib/adminConfig";
import AccountMenu from "@/app/components/AccountMenu";

const notify = vi.fn();
vi.mock("@/app/lib/notifications", () => ({
  showAppNotification: (...args: unknown[]) => notify(...args),
}));
let status = "unauthenticated";
let admin = false;
let userId = "owner";
const login = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    status,
    data: { user: { id: userId, isAdmin: admin } },
  }),
  signIn: (...args: unknown[]) => login(...args),
}));
const topic = {
  id: "topic-id",
  title: "作成済みのお題",
  version: 2,
  themes: ["出会い", ...Array<string>(8).fill("")],
  createdAt: "2026-10-27T15:30:00.000Z",
  canEdit: true,
  canDelete: true,
  canViewResults: true,
};
const topicPage = (
  topics: (typeof topic)[],
  page = 1,
  total = topics.length,
) => ({
  topics,
  total,
  page,
  pageSize: 20,
  totalPages: Math.max(1, Math.ceil(total / 20)),
});
const content = () => (
  <MantineProvider env="test">
    <AdminModeProvider>
      <AccountMenu />
      <Client />
    </AdminModeProvider>
  </MantineProvider>
);

describe("作成したお題・集計の専用ページ", () => {
  beforeEach(() => {
    status = "unauthenticated";
    admin = false;
    userId = "owner";
    login.mockClear();
    notify.mockClear();
    localStorage.clear();
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
      vi.fn().mockImplementation(async () => Response.json(topicPage([topic]))),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("未ログインではログインを案内し、一覧APIを呼ばない", () => {
    render(content());
    fireEvent.click(screen.getByRole("button", { name: "login" }));
    expect(login).toHaveBeenCalledWith(
      "google",
      expect.objectContaining({ callbackUrl: expect.any(String) }),
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "newTopic" })).toHaveAttribute(
      "href",
      "/share/my-best-9-songs?new=1",
    );
  });

  it("通常ユーザーの一覧からお題と集計を開ける", async () => {
    status = "authenticated";
    render(content());
    await screen.findByRole("heading", { name: "作成済みのお題" });
    expect(fetch).toHaveBeenCalledWith(
      "/api/share/my-best-9-songs/topics",
      expect.any(Object),
    );
    expect(
      screen.getByRole("link", { name: "作成済みのお題" }),
    ).toHaveAttribute("href", "/share/my-best-9-songs?topic=topic-id");
    expect(screen.getByRole("link", { name: "results" })).toHaveAttribute(
      "href",
      "/share/my-best-9-songs/topics/topic-id/results",
    );
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByText("version")).toBeNull();
    expect(
      screen.getByText("2026/10/28 00:30", { selector: "time" }),
    ).toHaveAttribute("datetime", topic.createdAt);
    expect(screen.queryByRole("button", { name: "refresh" })).toBeNull();
    expect(screen.getByRole("button", { name: "delete" })).toHaveTextContent(
      "",
    );
    expect(
      screen.getByText("manage", { selector: '[aria-current="page"]' }),
    ).toBeInTheDocument();
  });

  it("一覧の鉛筆からタイトルと9枠を編集し、一覧へ反映する", async () => {
    status = "authenticated";
    const updated = {
      ...topic,
      title: "更新したお題",
      themes: ["更新した枠", ...topic.themes.slice(1)],
      version: 3,
    };
    vi.mocked(fetch).mockImplementation(async (_url, init) =>
      Response.json(
        init?.method === "PATCH" ? { topic: updated } : topicPage([topic]),
      ),
    );
    render(content());
    await screen.findByRole("heading", { name: topic.title });
    fireEvent.click(screen.getByRole("button", { name: "edit", exact: true }));
    const dialog = within(screen.getByRole("dialog", { name: "topics.edit" }));
    const title = dialog.getByLabelText("form.titleLabel", { exact: false });
    const fields = dialog.getAllByLabelText("inputLabel");
    expect(title).toHaveValue(topic.title);
    expect(fields).toHaveLength(9);
    expect(fields[0]).toHaveValue("出会い");
    expect(
      dialog.getByRole("button", { name: "topics.saveRevision" }),
    ).toBeDisabled();
    fireEvent.change(title, { target: { value: " 更新したお題 " } });
    fireEvent.change(fields[0], { target: { value: " 更新した枠 " } });
    fireEvent.click(
      dialog.getByRole("button", { name: "topics.saveRevision" }),
    );
    await screen.findByRole("heading", { name: "更新したお題" });
    expect(screen.getByRole("link", { name: "更新したお題" })).toHaveAttribute(
      "href",
      `/share/my-best-9-songs?topic=${topic.id}`,
    );
    expect(screen.getByRole("link", { name: "results" })).toHaveAttribute(
      "href",
      `/share/my-best-9-songs/topics/${topic.id}/results`,
    );
    expect(
      vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === "POST"),
    ).toBe(false);
    const save = vi
      .mocked(fetch)
      .mock.calls.find(([, init]) => init?.method === "PATCH")!;
    expect(save[0]).toBe("/api/share/my-best-9-songs/topics/topic-id");
    expect(JSON.parse(save[1]!.body as string)).toEqual({
      title: "更新したお題",
      themes: updated.themes,
      slotCategories: emptySlotCategories(),
      version: 2,
    });
    expect(notify).toHaveBeenCalledWith({ message: "topics.saved" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "edit", exact: true }));
    expect(
      within(screen.getByRole("dialog")).getAllByLabelText("inputLabel")[0],
    ).toHaveValue("更新した枠");
  });

  it("編集のキャンセルは一覧と保存データを変更しない", async () => {
    status = "authenticated";
    render(content());
    await screen.findByRole("heading", { name: topic.title });
    fireEvent.click(screen.getByRole("button", { name: "edit", exact: true }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(
      dialog.getByLabelText("form.titleLabel", { exact: false }),
      { target: { value: "保存しない" } },
    );
    fireEvent.click(dialog.getByRole("button", { name: "themes.cancel" }));
    expect(
      screen.getByRole("heading", { name: topic.title }),
    ).toBeInTheDocument();
    expect(
      vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === "PATCH"),
    ).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "edit", exact: true }));
    expect(
      within(screen.getByRole("dialog")).getByLabelText("form.titleLabel", {
        exact: false,
      }),
    ).toHaveValue(topic.title);
  });

  it("一覧の編集で各枠のカテゴリを読み込み、個別変更して同じIDに保存できる", async () => {
    status = "authenticated";
    const slotCategories = emptySlotCategories();
    slotCategories[0] = ["original"];
    slotCategories[8] = ["original", "cover"];
    const saved = { ...topic, slotCategories };
    vi.mocked(fetch).mockImplementation(async (_url, init) =>
      Response.json(
        init?.method === "PATCH" ? { topic: saved } : topicPage([saved]),
      ),
    );
    render(content());
    await screen.findByRole("heading", { name: topic.title });
    fireEvent.click(screen.getByRole("button", { name: "edit", exact: true }));
    const dialog = within(screen.getByRole("dialog"));
    const categories = dialog.getAllByLabelText("topics.slotCategoriesLabel");
    expect(categories).toHaveLength(9);
    const ninth = categories[8];
    expect(ninth.closest(".mantine-MultiSelect-root")).toHaveTextContent(
      "filters.original",
    );
    expect(ninth.closest(".mantine-MultiSelect-root")).toHaveTextContent(
      "filters.cover",
    );
    fireEvent.click(categories[0]);
    fireEvent.click(
      screen.getByRole("option", { name: "filters.cover", exact: true }),
    );
    fireEvent.keyDown(categories[0], { key: "Escape" });
    fireEvent.click(
      dialog.getByRole("button", { name: "topics.saveRevision" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const save = vi
      .mocked(fetch)
      .mock.calls.find(([, init]) => init?.method === "PATCH")!;
    expect(save[0]).toBe(`/api/share/my-best-9-songs/topics/${topic.id}`);
    expect(JSON.parse(save[1]!.body as string).slotCategories).toEqual([
      ["original", "cover"],
      ...slotCategories.slice(1),
    ]);
  });

  it.each(["FORBIDDEN", "TOPIC_CHANGED", "SERVICE_UNAVAILABLE"])(
    "編集の%sエラー時は入力を保持する",
    async (code) => {
      status = "authenticated";
      vi.mocked(fetch).mockImplementation(async (_url, init) =>
        init?.method === "PATCH"
          ? Response.json(
              { error: code },
              {
                status:
                  code === "FORBIDDEN"
                    ? 403
                    : code === "TOPIC_CHANGED"
                      ? 409
                      : 503,
              },
            )
          : Response.json(topicPage([topic])),
      );
      render(content());
      await screen.findByRole("heading", { name: topic.title });
      fireEvent.click(
        screen.getByRole("button", { name: "edit", exact: true }),
      );
      const dialog = within(screen.getByRole("dialog"));
      fireEvent.change(
        dialog.getByLabelText("form.titleLabel", { exact: false }),
        { target: { value: "編集中のお題" } },
      );
      fireEvent.click(
        dialog.getByRole("button", { name: "topics.saveRevision" }),
      );
      await dialog.findByText(`topics.errors.${code}`);
      expect(
        dialog.getByLabelText("form.titleLabel", { exact: false }),
      ).toHaveValue("編集中のお題");
      expect(
        dialog.getByRole("button", { name: "topics.saveRevision" }),
      ).toBeEnabled();
      expect(
        screen.getByRole("heading", { name: topic.title }),
      ).toBeInTheDocument();
    },
  );

  it("自由枠に戻す編集もでき、空白タイトルでは保存できない", async () => {
    status = "authenticated";
    render(content());
    await screen.findByRole("heading", { name: topic.title });
    fireEvent.click(screen.getByRole("button", { name: "edit", exact: true }));
    const dialog = within(screen.getByRole("dialog"));
    const save = dialog.getByRole("button", { name: "topics.saveRevision" });
    fireEvent.click(dialog.getByRole("button", { name: "clear" }));
    expect(
      dialog
        .getAllByLabelText("inputLabel")
        .every((field) => (field as HTMLInputElement).value === ""),
    ).toBe(true);
    expect(save).toBeEnabled();
    fireEvent.change(
      dialog.getByLabelText("form.titleLabel", { exact: false }),
      { target: { value: "   " } },
    );
    expect(save).toBeDisabled();
  });

  it("削除の確認を閉じるだけでは削除APIを呼ばない", async () => {
    status = "authenticated";
    render(content());
    await screen.findByRole("heading", { name: "作成済みのお題" });
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(dialog.getByText("閉じる"));
    expect(
      vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === "DELETE"),
    ).toBe(false);
    expect(
      screen.getByRole("heading", { name: "作成済みのお題" }),
    ).toBeInTheDocument();
  });

  it("確認して削除すると一覧から消え、通知する", async () => {
    status = "authenticated";
    let deleted = false;
    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      if (init?.method === "DELETE") {
        deleted = true;
        return Response.json({ deleted: true });
      }
      return Response.json(topicPage(deleted ? [] : [topic]));
    });
    render(content());
    await screen.findByRole("heading", { name: "作成済みのお題" });
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "delete",
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "作成済みのお題" }),
      ).toBeNull(),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/share/my-best-9-songs/topics/topic-id",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(notify).toHaveBeenCalledWith({ message: "deleted" });
    expect(await screen.findByText("empty")).toBeInTheDocument();
  });

  it("削除に失敗した場合は一覧と確認画面を維持して再試行できる", async () => {
    status = "authenticated";
    vi.mocked(fetch).mockImplementation(async (_url, init) =>
      init?.method === "DELETE"
        ? Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 })
        : Response.json(topicPage([topic])),
    );
    render(content());
    await screen.findByRole("heading", { name: "作成済みのお題" });
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "delete",
      }),
    );
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith({
        type: "error",
        message: "errors.SERVICE_UNAVAILABLE",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "作成済みのお題" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "delete",
      }),
    ).toBeEnabled();
  });

  it.each([true, false])(
    "編集権限がなくても削除権限がある管理者だけ削除ボタンを表示する（%s）",
    async (canDelete) => {
      status = "authenticated";
      admin = canDelete;
      vi.mocked(fetch).mockResolvedValue(
        Response.json(topicPage([{ ...topic, canEdit: false, canDelete }])),
      );
      render(content());
      await screen.findByRole("heading", { name: "作成済みのお題" });
      expect(
        screen.queryByRole("button", { name: "edit", exact: true }),
      ).toBeNull();
      expect(!!screen.queryByRole("button", { name: "delete" })).toBe(
        canDelete,
      );
    },
  );

  it.each([false, true])(
    "複数ページのお題を前後に移動できる（全件表示=%s）",
    async (showAll) => {
      status = "authenticated";
      admin = showAll;
      if (showAll) localStorage.setItem(ADMIN_MODE_STORAGE_KEY, "true");
      vi.mocked(fetch).mockImplementation(async (url) => {
        const page = Number(
          new URL(String(url), "https://example.test").searchParams.get(
            "page",
          ) || 1,
        );
        return Response.json(
          topicPage([{ ...topic, title: `お題${page}` }], page, 45),
        );
      });
      render(content());
      await screen.findByRole("heading", { name: "お題1" });
      fireEvent.click(screen.getByRole("button", { name: "pagination.next" }));
      await screen.findByRole("heading", { name: "お題2" });
      expect(fetch).toHaveBeenCalledWith(
        `/api/share/my-best-9-songs/topics?${showAll ? "scope=all&" : ""}page=2`,
        expect.any(Object),
      );
      fireEvent.click(screen.getByRole("button", { name: "pagination.next" }));
      await screen.findByRole("heading", { name: "お題3" });
      expect(
        screen.getByRole("button", { name: "pagination.next" }),
      ).toBeDisabled();
      fireEvent.click(
        screen.getByRole("button", { name: "pagination.previous" }),
      );
      await screen.findByRole("heading", { name: "お題2" });
    },
  );

  it("最終ページの最後のお題を削除すると前のページへ戻る", async () => {
    status = "authenticated";
    let deleted = false;
    vi.mocked(fetch).mockImplementation(async (url, init) => {
      if (init?.method === "DELETE") {
        deleted = true;
        return Response.json({ deleted: true });
      }
      const requested = Number(
        new URL(String(url), "https://example.test").searchParams.get("page") ||
          1,
      );
      const page = deleted ? 1 : requested;
      return Response.json(
        topicPage(
          [{ ...topic, title: `お題${page}` }],
          page,
          deleted ? 20 : 21,
        ),
      );
    });
    render(content());
    await screen.findByRole("heading", { name: "お題1" });
    fireEvent.click(screen.getByRole("button", { name: "pagination.next" }));
    await screen.findByRole("heading", { name: "お題2" });
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "delete",
      }),
    );
    await screen.findByRole("heading", { name: "お題1" });
    expect(
      screen.queryByRole("button", { name: "pagination.next" }),
    ).toBeNull();
    expect(screen.queryByText("empty")).toBeNull();
  });

  it("管理モードの切替時はページを先頭に戻す", async () => {
    status = "authenticated";
    admin = true;
    vi.mocked(fetch).mockImplementation(async (url) => {
      const query = new URL(String(url), "https://example.test").searchParams;
      const page = Number(query.get("page") || 1);
      return Response.json(
        topicPage(
          [
            {
              ...topic,
              title: `${query.has("scope") ? "全件" : "自分"}${page}`,
            },
          ],
          page,
          42,
        ),
      );
    });
    render(content());
    await screen.findByRole("heading", { name: "自分1" });
    fireEvent.click(screen.getByRole("button", { name: "pagination.next" }));
    await screen.findByRole("heading", { name: "自分2" });
    fireEvent.click(screen.getByRole("button", { name: "menuLabel" }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "adminEnable" }),
    );
    await screen.findByRole("heading", { name: "全件1" });
    expect(vi.mocked(fetch).mock.calls.at(-1)?.[0]).toBe(
      "/api/share/my-best-9-songs/topics?scope=all",
    );
  });

  it("右上の管理機能の有効・無効に連動し、一覧に独立したトグルを置かない", async () => {
    status = "authenticated";
    admin = true;
    render(content());
    await screen.findByRole("heading", { name: "作成済みのお題" });
    expect(screen.queryByRole("switch")).toBeNull();
    expect(fetch).not.toHaveBeenCalledWith(
      "/api/share/my-best-9-songs/topics?scope=all",
      expect.any(Object),
    );
    fireEvent.click(screen.getByRole("button", { name: "menuLabel" }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "adminEnable" }),
    );
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/share/my-best-9-songs/topics?scope=all",
        expect.any(Object),
      ),
    );
    expect(screen.getByText("allTopics")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "menuLabel" }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "adminDisable" }),
    );
    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.at(-1)?.[0]).toBe(
        "/api/share/my-best-9-songs/topics",
      ),
    );
    expect(screen.queryByText("allTopics")).toBeNull();
  });

  it("保存されている共通の管理モード設定を引き継ぐ", async () => {
    status = "authenticated";
    admin = true;
    localStorage.setItem(ADMIN_MODE_STORAGE_KEY, "true");
    render(content());
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/share/my-best-9-songs/topics?scope=all",
        expect.any(Object),
      ),
    );
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("管理者でないユーザーは保存設定があっても自分のお題だけを取得する", async () => {
    status = "authenticated";
    localStorage.setItem(ADMIN_MODE_STORAGE_KEY, "true");
    render(content());
    await screen.findByRole("heading", { name: "作成済みのお題" });
    expect(fetch).not.toHaveBeenCalledWith(
      "/api/share/my-best-9-songs/topics?scope=all",
      expect.any(Object),
    );
  });

  it("エラー時は再読込でき、空の一覧も案内する", async () => {
    status = "authenticated";
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 }),
      )
      .mockResolvedValueOnce(Response.json(topicPage([])));
    render(content());
    await screen.findByText("errors.SERVICE_UNAVAILABLE");
    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    await screen.findByText("empty");
  });

  it("アカウント切替では前のユーザーのお題一覧を保持しない", async () => {
    status = "authenticated";
    const view = render(content());
    await screen.findByRole("heading", { name: "作成済みのお題" });
    vi.mocked(fetch).mockResolvedValue(Response.json(topicPage([])));
    userId = "another-owner";
    view.rerender(content());
    await screen.findByText("empty");
    expect(screen.queryByText("作成済みのお題")).toBeNull();
  });
});

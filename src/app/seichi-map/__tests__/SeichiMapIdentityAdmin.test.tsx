import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useAdminMode } = vi.hoisted(() => ({ useAdminMode: vi.fn() }));
vi.mock("../../context/AdminModeContext", () => ({ useAdminMode }));

import { SeichiMapIdentityAdmin } from "../SeichiMapIdentityAdmin";
import type { SeichiMapIdentityPreview } from "../../types/seichiMapIdentityRegistry";

const preview: SeichiMapIdentityPreview = {
  baseVersion: 2,
  candidateHash: "a".repeat(64),
  needsApply: true,
  updatedAt: "2026-10-22T00:00:00Z",
  summary: {
    locationCount: 2,
    registryCount: 3,
    addedCount: 1,
    updatedCount: 1,
    unchangedCount: 1,
  },
  changes: [{ id: "0123456789abcdef", name: "地点A", kind: "updated" }],
};
const response = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status });

describe("SeichiMapIdentityAdmin", () => {
  const fetchMock = vi.fn();
  const onReload = vi.fn();
  const mount = () =>
    render(
      <MantineProvider>
        <SeichiMapIdentityAdmin onReload={onReload} />
      </MantineProvider>,
    );
  const generate = async () => {
    fireEvent.click(screen.getByRole("button", { name: "preview" }));
    await screen.findByRole("button", { name: "apply" });
  };

  beforeEach(() => {
    vi.resetAllMocks();
    useAdminMode.mockReturnValue({ enabled: true });
    vi.stubGlobal("fetch", fetchMock);
    onReload.mockResolvedValue(true);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    fetchMock.mockImplementation(async () => response(preview));
  });

  it("管理用UIがOFFの場合は表示も通信もしない", () => {
    useAdminMode.mockReturnValue({ enabled: false });
    mount();
    expect(screen.queryByText("title")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("差分確認では保存せず、反映操作の後にだけマップを再取得する", async () => {
    mount();
    expect(
      screen.queryByRole("button", { name: "apply" }),
    ).not.toBeInTheDocument();
    await generate();
    expect(screen.getByText("地点A")).toBeInTheDocument();
    expect(screen.getByText("0123456789abcdef")).toBeInTheDocument();
    expect(screen.getByText("updated")).toBeInTheDocument();
    expect(onReload).not.toHaveBeenCalled();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      action: "preview",
    });
    fireEvent.click(screen.getByRole("button", { name: "apply" }));
    await screen.findByText("saved");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      action: "apply",
      baseVersion: 2,
      candidateHash: preview.candidateHash,
    });
    await waitFor(() => expect(onReload).toHaveBeenCalledOnce());
  });

  it("差分なしの保存済みデータは反映ボタンを出さない", async () => {
    fetchMock.mockImplementation(async () =>
      response({ ...preview, needsApply: false, changes: [] }),
    );
    mount();
    fireEvent.click(screen.getByRole("button", { name: "preview" }));
    await screen.findByText("noChanges");
    expect(
      screen.queryByRole("button", { name: "apply" }),
    ).not.toBeInTheDocument();
  });

  it("未初期化なら差分なしでも初回保存できる", async () => {
    fetchMock.mockImplementation(async () =>
      response({ ...preview, baseVersion: 0, updatedAt: null, changes: [] }),
    );
    mount();
    await generate();
    expect(screen.getByText("notInitialized")).toBeInTheDocument();
  });

  it("処理中は重複操作を防ぐ", async () => {
    let finish!: (value: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    mount();
    const button = screen.getByRole("button", { name: "preview" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledOnce();
    await act(async () => finish(response(preview)));
    await screen.findByRole("button", { name: "apply" });
  });

  it("競合時は確認結果を破棄し、再確認を求める", async () => {
    fetchMock
      .mockResolvedValueOnce(response(preview))
      .mockResolvedValueOnce(response({ error: "conflict" }, 409));
    mount();
    await generate();
    fireEvent.click(screen.getByRole("button", { name: "apply" }));
    await screen.findByText("errors.conflict");
    expect(
      screen.queryByRole("button", { name: "apply" }),
    ).not.toBeInTheDocument();
    expect(onReload).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "preview" })).toBeEnabled();
  });

  it("通信失敗を表示し再試行できる", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    mount();
    fireEvent.click(screen.getByRole("button", { name: "preview" }));
    await screen.findByText("errors.request_failed");
    await generate();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("保存後の再取得失敗は保存成功と区別し、保存し直さず再取得する", async () => {
    onReload.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mount();
    await generate();
    fireEvent.click(screen.getByRole("button", { name: "apply" }));
    await screen.findByText("reloadFailed");
    expect(screen.getByText("saved")).toBeInTheDocument();
    expect(screen.queryByText("errors.request_failed")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "reload" }));
    await waitFor(() =>
      expect(screen.queryByText("reloadFailed")).not.toBeInTheDocument(),
    );
    expect(onReload).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

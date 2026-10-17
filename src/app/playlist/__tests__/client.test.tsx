import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderUI, resetState, state } from "./setup";
import PlaylistPage from "../client";
import { tryDecodePlaylistUrlParam } from "../../lib/playlistUrl";

describe("Playlist management", () => {
  beforeEach(() => resetState());

  it("表とスマホ行で同じ選択状態を使い、確認後のみ削除する", async () => {
    renderUI(<PlaylistPage />);
    expect(
      screen.queryByRole("button", { name: "選択項目を削除" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("table")).getByRole("checkbox", {
        name: "「プレイリスト1」を選択",
      }),
    );
    expect(
      screen.getByRole("checkbox", { name: "すべて選択" }),
    ).toBePartiallyChecked();
    expect(
      within(screen.getByRole("list")).getByRole("checkbox", {
        name: "「プレイリスト1」を選択",
      }),
    ).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "選択項目を削除" }));
    let dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/1個のプレイリスト/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "キャンセル" }));
    expect(state.deletePlaylist).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "すべて選択" }));
    expect(screen.getByText("2件を選択中")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "選択項目を削除" }));
    dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "削除", exact: true }),
    );
    expect(state.deletePlaylist.mock.calls.map(([p]) => p.id)).toEqual([
      "playlist-1",
      "playlist-2",
    ]);
  });

  it("お気に入りを先頭に置き、選択・共有から除外し、再生URLを維持する", () => {
    state.favorites = [{ videoId: "favorite", start: "0" }];
    renderUI(<PlaylistPage />);
    const table = within(screen.getByRole("table"));
    const first = table.getAllByRole("row")[1];
    expect(
      within(first).getByRole("link", { name: "お気に入り", exact: true }),
    ).toHaveAttribute("href", "/playlist/detail?id=system-favorites");
    expect(within(first).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      within(first).queryByRole("button", { name: /共有/ }),
    ).not.toBeInTheDocument();
    const play = table.getByRole("link", { name: "「プレイリスト1」を再生" });
    const param = new URL(
      play.getAttribute("href")!,
      window.location.origin,
    ).searchParams.get("playlist");
    expect(tryDecodePlaylistUrlParam(param!).songs).toEqual(
      state.playlists[0].songs,
    );
    expect(
      table.getByRole("button", { name: "「空のリスト」を再生" }),
    ).toBeDisabled();
  });

  it("共有はダイアログで開き、設定を更新する", () => {
    renderUI(<PlaylistPage />);
    expect(
      screen.queryByRole("combobox", { name: "共有設定" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("table")).getByRole("button", {
        name: "「プレイリスト1」を共有",
      }),
    );
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("combobox", { name: "共有設定" })).toHaveValue(
      "非公開",
    );
    expect(
      dialog.getByRole("button", { name: "共有用URLコピー" }),
    ).toBeDisabled();
    fireEvent.click(dialog.getByRole("combobox", { name: "共有設定" }));
    fireEvent.click(screen.getByRole("option", { name: "公開", exact: true }));
    expect(state.updatePlaylist).toHaveBeenCalledWith({
      ...state.playlists[0],
      visibility: "PUBLIC",
    });
  });

  it("読み込み中と空の一覧を区別し、新規作成に進める", () => {
    state.ready = false;
    state.playlists = [];
    const { rerenderUI } = renderUI(<PlaylistPage />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(/まだありません/)).not.toBeInTheDocument();
    state.ready = true;
    rerenderUI(<PlaylistPage />);
    expect(screen.getByText(/まだありません/)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "新規プレイリスト作成" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

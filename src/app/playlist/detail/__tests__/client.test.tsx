import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DragEndEvent, DndContextProps } from "@dnd-kit/core";
import { renderUI, resetState, song, state } from "../../__tests__/setup";
import PlaylistDetailPage from "../client";

const dnd = vi.hoisted(() => ({
  end: undefined as DndContextProps["onDragEnd"],
}));
vi.mock("@dnd-kit/core", async (importOriginal) => {
  const original = await importOriginal<typeof import("@dnd-kit/core")>();
  return {
    ...original,
    DndContext: (props: DndContextProps) => {
      dnd.end = props.onDragEnd;
      return <original.DndContext {...props} />;
    },
  };
});

describe("Playlist detail", () => {
  beforeEach(() => {
    resetState();
    window.history.replaceState({}, "", "/playlist/detail?id=playlist-1");
  });

  it.each([false, true])(
    "曲名と動画操作を%sのレイアウトで表示し、プレビューを再生する",
    async (desktop) => {
      resetState(desktop);
      renderUI(<PlaylistDetailPage />);
      expect(
        await screen.findByRole("heading", { name: "プレイリスト1", level: 1 }),
      ).toBeInTheDocument();
      expect(screen.getByText("テスト曲")).toBeInTheDocument();
      if (desktop) expect(screen.getByRole("table")).toBeInTheDocument();
      else {
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
        expect(screen.getAllByRole("listitem")).toHaveLength(2);
      }
      expect(
        screen.getByRole("link", { name: "「テスト曲」をYouTubeで開く" }),
      ).toHaveAttribute(
        "href",
        "https://www.youtube.com/watch?v=video-1&t=15s",
      );
      fireEvent.click(
        screen.getByRole("button", { name: "「テスト曲」をプレビュー" }),
      );
      expect(state.setCurrentSong).toHaveBeenCalledWith(song);
      expect(state.setCurrentTime).toHaveBeenCalledWith(15);
      expect(state.setIsMinimized).toHaveBeenCalledWith(true);
      expect(state.setIsPlaying).toHaveBeenCalledWith(true);
      expect(
        screen
          .getByRole("link", { name: "「プレイリスト1」を再生" })
          .getAttribute("href"),
      ).toContain("playlist=");
    },
  );

  it("同じ動画・開始位置の楽曲情報が複数ある場合は従来どおり先頭を使う", async () => {
    state.songs.push({ ...song, title: "別の楽曲情報" });
    renderUI(<PlaylistDetailPage />);
    expect(await screen.findByText("テスト曲")).toBeInTheDocument();
    expect(screen.queryByText("別の楽曲情報")).not.toBeInTheDocument();
  });

  it("選択曲削除はキャンセルでき、確定時に選択外の曲を維持する", async () => {
    renderUI(<PlaylistDetailPage />);
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "「テスト曲」を選択" }),
    );
    expect(
      screen.getByRole("checkbox", { name: "すべて選択" }),
    ).toBePartiallyChecked();
    fireEvent.click(screen.getByRole("button", { name: "選択項目を削除" }));
    expect(
      screen.getByText("1曲をリストから削除します。よろしいですか？"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(state.updatePlaylist).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "選択項目を削除" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "削除",
        exact: true,
      }),
    );
    expect(state.updatePlaylist).toHaveBeenCalledWith({
      ...state.playlists[0],
      songs: [state.playlists[0].songs[1]],
    });
    expect(screen.queryByText("1件を選択中")).not.toBeInTheDocument();
  });

  it.each([false, true])(
    "全曲削除はメニュー内に置き、確認後に実行する（お気に入り=%s）",
    async (favorites) => {
      if (favorites) {
        state.favorites = state.playlists[0].songs;
        window.history.replaceState(
          {},
          "",
          "/playlist/detail?id=system-favorites",
        );
      }
      renderUI(<PlaylistDetailPage />);
      expect(
        screen.queryByRole("button", {
          name: "プレイリスト内の曲をすべて削除",
        }),
      ).not.toBeInTheDocument();
      fireEvent.click(
        await screen.findByRole("button", { name: "その他の操作" }),
      );
      fireEvent.click(
        await screen.findByRole("menuitem", {
          name: "プレイリスト内の曲をすべて削除",
        }),
      );
      expect(
        screen.getByText("2曲をリストから削除します。よろしいですか？"),
      ).toBeInTheDocument();
      expect(state.clearAllSongs).not.toHaveBeenCalled();
      expect(state.clearAllFavorites).not.toHaveBeenCalled();
      fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "削除",
          exact: true,
        }),
      );
      if (favorites) expect(state.clearAllFavorites).toHaveBeenCalledOnce();
      else expect(state.clearAllSongs).toHaveBeenCalledWith(state.playlists[0]);
    },
  );

  it("お気に入りの選択削除は専用の処理に渡す", async () => {
    state.favorites = state.playlists[0].songs;
    window.history.replaceState({}, "", "/playlist/detail?id=system-favorites");
    renderUI(<PlaylistDetailPage />);
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "すべて選択" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "選択項目を削除" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "削除",
        exact: true,
      }),
    );
    expect(state.removeMultipleFavorites).toHaveBeenCalledWith(state.favorites);
    expect(state.updatePlaylist).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "並べ替えで未取得の曲も保持して保存する（お気に入り=%s）",
    async (favorites) => {
      const missing = { videoId: "missing-video", start: "0" };
      state.playlists[0].songs.splice(1, 0, missing);
      if (favorites) {
        state.favorites = state.playlists[0].songs;
        window.history.replaceState(
          {},
          "",
          "/playlist/detail?id=system-favorites",
        );
      }
      renderUI(<PlaylistDetailPage />);
      expect(
        await screen.findByText("楽曲情報を取得できません"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "「楽曲情報を取得できません」をプレビュー",
        }),
      ).toBeDisabled();
      act(() =>
        dnd.end?.({
          active: { id: "video-2-20" },
          over: { id: "video-1-15" },
        } as DragEndEvent),
      );
      const songs = [
        state.playlists[0].songs[2],
        state.playlists[0].songs[0],
        missing,
      ];
      if (favorites) expect(state.reorderFavorites).toHaveBeenCalledWith(songs);
      else
        expect(state.updatePlaylist).toHaveBeenCalledWith({
          ...state.playlists[0],
          songs,
        });
    },
  );

  it("ハンドルをSpaceでつかみ、Escapeで取り消せる", async () => {
    renderUI(<PlaylistDetailPage />);
    const handle = await screen.findByRole("button", {
      name: "「テスト曲」を並べ替え",
    });
    handle.focus();
    fireEvent.keyDown(handle, { code: "Space", key: " " });
    await waitFor(() => expect(handle).toHaveAttribute("aria-pressed", "true"));
    fireEvent.keyDown(document, { code: "Escape", key: "Escape" });
    await waitFor(() =>
      expect(handle).not.toHaveAttribute("aria-pressed", "true"),
    );
    expect(state.updatePlaylist).not.toHaveBeenCalled();
  });

  it("ライブラリ取得完了前に未検出や空状態を表示しない", async () => {
    state.ready = false;
    state.playlists = [];
    const { rerenderUI } = renderUI(<PlaylistDetailPage />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.queryByText("このIDのプレイリストは見つかりません"),
    ).not.toBeInTheDocument();
    state.ready = true;
    rerenderUI(<PlaylistDetailPage />);
    expect(
      await screen.findByText("このIDのプレイリストは見つかりません"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "プレイリスト一覧へ" }),
    ).toHaveAttribute("href", "/playlist");
  });

  it("空のプレイリストでは再生と全曲削除を無効にする", async () => {
    window.history.replaceState({}, "", "/playlist/detail?id=playlist-2");
    renderUI(<PlaylistDetailPage />);
    expect(
      await screen.findByText("プレイリスト内に曲がありません"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "「空のリスト」を再生" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "その他の操作" }));
    expect(
      await screen.findByRole("menuitem", {
        name: "プレイリスト内の曲をすべて削除",
      }),
    ).toHaveAttribute("data-disabled");
  });
});

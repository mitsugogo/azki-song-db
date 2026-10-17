import { createEvent, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderUI, resetState, state } from "../../playlist/__tests__/setup";
import CreatePlaylistModal from "../CreatePlaylistModal";

describe("CreatePlaylistModal", () => {
  beforeEach(() => resetState());

  it("ラベル付き入力から空のプレイリストをフォーム送信で作成する", () => {
    const onClose = vi.fn();
    renderUI(<CreatePlaylistModal onenModal setOpenModal={onClose} />);
    const input = screen.getByRole("textbox", { name: "プレイリスト名" });
    fireEvent.change(input, { target: { value: "新しいリスト" } });
    fireEvent.submit(input.closest("form")!);
    expect(state.savePlaylist).toHaveBeenCalledWith({
      name: "新しいリスト",
      songs: [],
    });
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it("初期名・初期曲を使って作成する", () => {
    const songs = [
      { videoId: "video-a", start: "10" },
      { videoId: "video-b", start: "20" },
    ];
    renderUI(
      <CreatePlaylistModal
        onenModal
        setOpenModal={vi.fn()}
        initialName="縦読み「あずき」"
        initialSongs={songs}
      />,
    );
    expect(screen.getByDisplayValue("縦読み「あずき」")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "作成", exact: true }));
    expect(state.savePlaylist).toHaveBeenCalledWith({
      name: "縦読み「あずき」",
      songs,
    });
    expect(state.savePlaylist.mock.calls[0][0].songs).not.toBe(songs);
  });

  it("空白名と重複名を拒否し、エラーを入力へ関連付ける", () => {
    const { rerenderUI } = renderUI(
      <CreatePlaylistModal onenModal setOpenModal={vi.fn()} />,
    );
    const input = screen.getByRole("textbox", { name: "プレイリスト名" });
    fireEvent.change(input, { target: { value: "  " } });
    expect(
      screen.getByRole("button", { name: "作成", exact: true }),
    ).toBeDisabled();
    fireEvent.submit(input.closest("form")!);
    expect(state.savePlaylist).not.toHaveBeenCalled();
    state.isDuplicate.mockReturnValue(true);
    rerenderUI(<CreatePlaylistModal onenModal setOpenModal={vi.fn()} />);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(
      document.getElementById(input.getAttribute("aria-describedby")!),
    ).toHaveTextContent("同じ名前");
    expect(
      screen.getByRole("button", { name: "作成", exact: true }),
    ).toBeDisabled();
  });

  it("名前を200文字に制限し、IME変換中のEnterを送信させない", () => {
    renderUI(<CreatePlaylistModal onenModal setOpenModal={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "プレイリスト名" });
    fireEvent.change(input, { target: { value: "あ".repeat(201) } });
    expect(input).toHaveValue("あ".repeat(200));
    const event = createEvent.keyDown(input, {
      key: "Enter",
      isComposing: true,
    });
    fireEvent(input, event);
    expect(event.defaultPrevented).toBe(true);
    expect(state.savePlaylist).not.toHaveBeenCalled();
    const normalEnter = createEvent.keyDown(input, { key: "Enter" });
    fireEvent(input, normalEnter);
    expect(normalEnter.defaultPrevented).toBe(false);
  });

  it("キャンセルでは保存しない", () => {
    const onClose = vi.fn();
    renderUI(<CreatePlaylistModal onenModal setOpenModal={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(state.savePlaylist).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it("サインイン再開イベントで作成モーダルを開く", () => {
    const onClose = vi.fn();
    renderUI(
      <CreatePlaylistModal
        onenModal={false}
        setOpenModal={onClose}
        initialName="縦読み「あずき」"
        initialSongs={[{ videoId: "video-a", start: "10" }]}
      />,
    );
    window.dispatchEvent(
      new CustomEvent("azki-library-action", {
        detail: { type: "create-playlist" },
      }),
    );
    expect(onClose).toHaveBeenCalledWith(true);
  });
});

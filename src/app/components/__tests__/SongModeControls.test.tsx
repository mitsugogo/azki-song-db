import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { baseUrl } from "../../config/siteConfig";
import SongModeControls, { buildSongModeShareUrl } from "../SongModeControls";
import { SONG_MODE_MENU_ITEMS } from "../songModeMenu";

const writeTextMock = vi.hoisted(() => vi.fn());

vi.mock("@mantine/core", () => {
  const Button = ({ children, leftSection, rightSection, ...props }: any) => (
    <button type="button" {...props}>
      {leftSection}
      {children}
      {rightSection}
    </button>
  );
  const ActionIcon = ({ children, ...props }: any) => (
    <button type="button" {...props}>
      {children}
    </button>
  );
  const CopyButton = ({ children, value }: any) =>
    children({
      copied: false,
      copy: () => writeTextMock(value),
    });
  const Menu = ({ children, width }: any) => (
    <div data-testid="song-mode-menu" data-width={width}>
      {children}
    </div>
  );
  Menu.Target = ({ children }: any) => <div>{children}</div>;
  Menu.Dropdown = ({ children }: any) => <div>{children}</div>;
  Menu.Item = ({ children, leftSection, ...props }: any) => (
    <button type="button" {...props}>
      {leftSection}
      {children}
    </button>
  );
  Menu.Label = ({ children }: any) => <div>{children}</div>;
  Menu.Divider = () => <hr />;
  const Tooltip = ({ children }: any) => <>{children}</>;

  return {
    __esModule: true,
    ActionIcon,
    Button,
    CopyButton,
    Menu,
    Tooltip,
  };
});

vi.mock("../../hook/usePlaylists", () => ({
  __esModule: true,
  default: () => ({
    authenticated: true,
    isNowPlayingPlaylist: () => false,
  }),
}));

describe("SongModeControls", () => {
  beforeEach(() => {
    writeTextMock.mockClear();
  });

  it("各ソングモードの右端にURLコピーボタンを表示する", () => {
    render(
      <SongModeControls
        currentSongMode=""
        onSelectSongMode={vi.fn()}
        onSurprise={vi.fn()}
        onPlaylist={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: "copyModeUrl" })).toHaveLength(
      SONG_MODE_MENU_ITEMS.length,
    );
  });

  it("デスクトップではメニューを広げ、モバイルでは画面幅の80%にする", () => {
    const props = {
      currentSongMode: "" as const,
      onSelectSongMode: vi.fn(),
      onSurprise: vi.fn(),
      onPlaylist: vi.fn(),
    };
    const { rerender } = render(<SongModeControls {...props} />);

    expect(screen.getByTestId("song-mode-menu")).toHaveAttribute(
      "data-width",
      "520",
    );
    expect(
      screen.getAllByRole("button", { name: "copyModeUrl" })[0],
    ).toHaveClass("opacity-0", "group-hover:opacity-70");

    rerender(<SongModeControls {...props} variant="mobile" />);

    expect(screen.getByTestId("song-mode-menu")).toHaveAttribute(
      "data-width",
      "80vw",
    );
    expect(
      screen.getAllByRole("button", { name: "copyModeUrl" })[0],
    ).toHaveClass("opacity-40");
    expect(
      screen.getAllByRole("button", { name: "copyModeUrl" })[0],
    ).not.toHaveClass("opacity-0");
  });

  it("コピーボタンではモードを切り替えず、対象モードのURLをコピーする", () => {
    const onSelectSongMode = vi.fn();

    render(
      <SongModeControls
        currentSongMode=""
        onSelectSongMode={onSelectSongMode}
        onSurprise={vi.fn()}
        onPlaylist={vi.fn()}
      />,
    );

    const copyButtons = screen.getAllByRole("button", {
      name: "copyModeUrl",
    });
    fireEvent.click(copyButtons[1]);

    expect(writeTextMock).toHaveBeenCalledWith(
      new URL("/watch?q=original-songs", baseUrl).toString(),
    );
    expect(onSelectSongMode).not.toHaveBeenCalled();
  });

  it("英語表示の共有URLにはロケールを含める", () => {
    expect(buildSongModeShareUrl("spring-song", "en")).toBe(
      new URL("/en/watch?q=spring-song", baseUrl).toString(),
    );
    expect(buildSongModeShareUrl("", "ja")).toBe(
      new URL("/watch", baseUrl).toString(),
    );
  });
});

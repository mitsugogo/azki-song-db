import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderUI, resetState, state } from "./setup";
import { PlaylistShareModal } from "../PlaylistControls";

describe("Playlist sharing", () => {
  beforeEach(() => resetState());
  it.each([undefined, "PRIVATE", "UNLISTED", "PUBLIC"] as const)(
    "公開範囲 %s のコピー可否",
    (visibility) => {
      renderUI(
        <PlaylistShareModal
          playlist={{ ...state.playlists[0], visibility }}
          onClose={vi.fn()}
          onUpdate={vi.fn()}
        />,
      );
      const copy = screen.getByRole("button", { name: "共有用URLコピー" });
      if (!visibility || visibility === "PRIVATE") expect(copy).toBeDisabled();
      else expect(copy).toBeEnabled();
    },
  );
  it.each(["no-id", "empty"])("%s はコピーできない", (mode) => {
    renderUI(
      <PlaylistShareModal
        playlist={{
          ...state.playlists[0],
          visibility: "PUBLIC",
          ...(mode === "no-id" ? { id: undefined } : { songs: [] }),
        }}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "共有用URLコピー" }),
    ).toBeDisabled();
  });
  it.each(["ja", "en"])(
    "%s の共有URLをコピーし、完了を表示する",
    async (locale) => {
      state.locale = locale;
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
      renderUI(
        <PlaylistShareModal
          playlist={{
            ...state.playlists[0],
            id: "id/with space",
            visibility: "UNLISTED",
          }}
          onClose={vi.fn()}
          onUpdate={vi.fn()}
        />,
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: locale === "ja" ? "共有用URLコピー" : "Copy share URL",
        }),
      );
      await waitFor(() =>
        expect(writeText).toHaveBeenCalledWith(
          `${window.location.origin}${locale === "en" ? "/en" : ""}/playlist/shared/id%2Fwith%20space`,
        ),
      );
      expect(
        await screen.findByRole("button", {
          name: locale === "ja" ? "コピーしました" : "Copied",
        }),
      ).toBeInTheDocument();
    },
  );
});

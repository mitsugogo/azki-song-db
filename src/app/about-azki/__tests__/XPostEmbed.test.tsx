import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import Script from "next/script";
import XPostEmbed from "../XPostEmbed";

const state = vi.hoisted(() => ({
  theme: "light" as "light" | "dark",
  scriptProps: null as ComponentProps<typeof Script> | null,
}));
vi.mock("@mantine/core", () => ({
  useComputedColorScheme: () => state.theme,
}));
vi.mock("next/script", () => ({
  default: (props: ComponentProps<typeof Script>) => {
    state.scriptProps = props;
    return null;
  },
}));

const url = "https://x.com/AZKi_VDiVA/status/1657760488783233024";
const embed = (locale = "ja") => (
  <XPostEmbed url={url} locale={locale}>
    <blockquote>
      投稿の引用文 <a href={url}>Xの元投稿</a>
    </blockquote>
  </XPostEmbed>
);
const mockWidgets = () => {
  const createTweet = vi.fn(async (_id: string, target: HTMLElement) => {
    const frame = document.createElement("iframe");
    frame.title = "X post";
    target.appendChild(frame);
    return frame;
  });
  vi.stubGlobal("twttr", { widgets: { createTweet } });
  return createTweet;
};
const ready = async () => {
  await act(async () => state.scriptProps?.onReady?.());
};

beforeEach(() => {
  state.theme = "light";
  state.scriptProps = null;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("XPostEmbed", () => {
  it.each([
    ["ja", "light"],
    ["en", "dark"],
  ] as const)(
    "%s/%sで公式スクリプトから投稿を表示する",
    async (locale, theme) => {
      state.theme = theme;
      const createTweet = mockWidgets();
      render(embed(locale));
      expect(screen.getByRole("link", { name: "Xの元投稿" })).toHaveAttribute(
        "href",
        url,
      );
      expect(createTweet).not.toHaveBeenCalled();
      expect(state.scriptProps).toMatchObject({
        src: "https://platform.x.com/widgets.js",
        strategy: "lazyOnload",
      });
      await ready();
      await waitFor(() =>
        expect(screen.queryByText(/投稿の引用文/)).toBeNull(),
      );
      expect(createTweet).toHaveBeenCalledWith(
        "1657760488783233024",
        expect.any(HTMLElement),
        {
          theme,
          lang: locale,
          dnt: true,
          conversation: "none",
          align: "center",
        },
      );
      expect(screen.getByTitle("X post")).toBeInTheDocument();
    },
  );

  it("テーマ変更と再訪で再描画し、iframeを重複させない", async () => {
    const createTweet = mockWidgets();
    const view = render(embed());
    await ready();
    await waitFor(() =>
      expect(screen.getByTitle("X post")).toBeInTheDocument(),
    );
    state.theme = "dark";
    view.rerender(embed());
    await waitFor(() => expect(createTweet).toHaveBeenCalledTimes(2));
    expect(createTweet.mock.calls[0][1].isConnected).toBe(false);
    expect(document.querySelectorAll("iframe")).toHaveLength(1);
    state.theme = "light";
    createTweet.mockRejectedValueOnce(new Error("X unavailable"));
    view.rerender(embed());
    await waitFor(() => expect(createTweet).toHaveBeenCalledTimes(3));
    expect(screen.getByRole("link", { name: "Xの元投稿" })).toBeVisible();
    expect(document.querySelector("iframe")).toBeNull();
    view.unmount();
    render(embed());
    await ready();
    await waitFor(() => expect(createTweet).toHaveBeenCalledTimes(4));
    expect(document.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("Xの読み込みや投稿表示が失敗しても引用文とリンクを残す", async () => {
    const createTweet = mockWidgets();
    createTweet.mockRejectedValue(new Error("X unavailable"));
    render(embed());
    await act(async () => state.scriptProps?.onError?.(new Error("blocked")));
    expect(screen.getByRole("link", { name: "Xの元投稿" })).toBeVisible();
    await ready();
    await waitFor(() => expect(createTweet).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/投稿の引用文/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Xの元投稿" })).toBeVisible();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("移動後に完了した古い埋め込みは現在の画面に追加しない", async () => {
    let finish: ((frame: HTMLIFrameElement) => void) | undefined;
    const createTweet = vi.fn(
      (_id: string, _target: HTMLElement) =>
        new Promise<HTMLIFrameElement>((resolve) => {
          finish = resolve;
        }),
    );
    vi.stubGlobal("twttr", { widgets: { createTweet } });
    const view = render(embed());
    await ready();
    const target = createTweet.mock.calls[0][1];
    view.unmount();
    const frame = document.createElement("iframe");
    target.appendChild(frame);
    await act(async () => finish?.(frame));
    expect(target.isConnected).toBe(false);
    expect(document.querySelector("iframe")).toBeNull();
  });
});

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import jaMessages from "@/messages/ja.json";

vi.mock("@mantine/core", () => {
  const Group = ({ children }: any) => <div>{children}</div>;
  const Box = ({ children }: any) => <div>{children}</div>;
  const Badge = ({ children }: any) => <span>{children}</span>;
  const Tooltip = ({ children, label, opened }: any) => (
    <>
      {children}
      {opened ? <span role="status">{label}</span> : null}
    </>
  );
  const Button = ({
    children,
    component: Component = "button",
    leftSection,
    ...props
  }: any) => (
    <Component {...props}>
      {leftSection}
      {children}
    </Component>
  );
  const ActionIcon = ({
    children,
    component: Component = "button",
    ...props
  }: any) => <Component {...props}>{children}</Component>;
  return { ActionIcon, Badge, Box, Button, Group, Tooltip };
});

import {
  SeichiMapHeaderActions,
  shouldShowNicknameRegistrationPrompt,
} from "../SeichiMapHeaderActions";

describe("SeichiMapHeaderActions", () => {
  it("ニックネーム登録案内と訪問ログ見出しの文言を表示する", () => {
    const messages = jaMessages.SeichiMapComplete;

    expect(messages.profile.registrationPrompt).toBe(
      "ニックネームを登録しましょう！",
    );
    expect(messages.title).toBe("聖地訪問ログ");
    expect(messages.titleWithNickname.replace("{name}", "開拓者A")).toBe(
      "開拓者Aの聖地訪問ログ",
    );
    expect(messages.usage.userCount.replace("{count}", "12")).toBe(
      "12人が利用中",
    );
  });

  it("ログイン済みでニックネーム未登録の場合だけ登録案内を表示する", () => {
    const baseState = {
      isSignedIn: true,
      isSharedView: false,
      profileLookupCompleted: true,
      nickname: null,
      promptDismissed: false,
    };

    expect(shouldShowNicknameRegistrationPrompt(baseState)).toBe(true);
    expect(
      shouldShowNicknameRegistrationPrompt({
        ...baseState,
        profileLookupCompleted: false,
      }),
    ).toBe(false);
    expect(
      shouldShowNicknameRegistrationPrompt({
        ...baseState,
        nickname: "開拓者A",
      }),
    ).toBe(false);
    expect(
      shouldShowNicknameRegistrationPrompt({
        ...baseState,
        promptDismissed: true,
      }),
    ).toBe(false);
  });

  it("設定ボタンにニックネーム登録の吹き出しを表示する", () => {
    render(
      <SeichiMapHeaderActions
        isSharedView={false}
        onOpenSettings={vi.fn()}
        onOpenShare={vi.fn()}
        showNicknamePrompt
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "profile.registrationPrompt",
    );
  });

  it("自分のマップではランキング、共有、設定の順にアイコンだけで表示する", () => {
    const onOpenSettings = vi.fn();
    const onOpenShare = vi.fn();
    const { container } = render(
      <SeichiMapHeaderActions
        isSharedView={false}
        onOpenSettings={onOpenSettings}
        onOpenShare={onOpenShare}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "profile.open" }));
    fireEvent.click(screen.getByRole("button", { name: "share.open" }));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    expect(onOpenShare).toHaveBeenCalledTimes(1);
    const rankingLink = screen.getByRole("link", { name: "ranking.open" });
    expect(rankingLink).toHaveAttribute("href", "/seichi-map/ranking");
    expect(Array.from(container.firstElementChild?.children ?? [])).toEqual([
      rankingLink,
      screen.getByRole("button", { name: "share.open" }),
      screen.getByRole("button", { name: "profile.open" }),
    ]);
    // 操作は名前（aria-label）だけで、文字は出さない
    for (const control of [
      rankingLink,
      screen.getByRole("button", { name: "share.open" }),
      screen.getByRole("button", { name: "profile.open" }),
    ]) {
      expect(control).toHaveTextContent("");
    }
  });

  it("プレイヤーカードは lg 以上のヘッダーの先頭に置き、共有マップでも表示する", () => {
    const card = <button type="button">player-card</button>;
    const { container, rerender } = render(
      <SeichiMapHeaderActions
        isSharedView={false}
        playerCard={card}
        onOpenSettings={vi.fn()}
        onOpenShare={vi.fn()}
      />,
    );

    // lg 以上でだけ見えるように Box で包んでいる。lg 未満は要約帯に出す
    expect(Array.from(container.firstElementChild?.children ?? [])).toEqual([
      screen.getByRole("button", { name: "player-card" }).parentElement,
      screen.getByRole("link", { name: "ranking.open" }),
      screen.getByRole("button", { name: "share.open" }),
      screen.getByRole("button", { name: "profile.open" }),
    ]);

    rerender(
      <SeichiMapHeaderActions
        isSharedView
        playerCard={card}
        onOpenSettings={vi.fn()}
        onOpenShare={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "player-card" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "share.open" }),
    ).not.toBeInTheDocument();
  });

  it("共有マップでは編集操作を隠してランキングだけを残す", () => {
    render(
      <SeichiMapHeaderActions
        isSharedView
        onOpenSettings={vi.fn()}
        onOpenShare={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "profile.open" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "share.open" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ranking.open" })).toBeVisible();
  });
});

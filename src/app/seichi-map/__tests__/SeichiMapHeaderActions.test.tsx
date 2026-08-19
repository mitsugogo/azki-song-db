import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import jaMessages from "@/messages/ja.json";

vi.mock("@mantine/core", () => {
  const Group = ({ children }: any) => <div>{children}</div>;
  const Tooltip = ({ children, label, opened }: any) => (
    <>
      {children}
      {opened ? <span role="status">{label}</span> : null}
    </>
  );
  const Button = ({ children, leftSection, ...props }: any) => (
    <button type="button" {...props}>
      {leftSection}
      {children}
    </button>
  );
  const ActionIcon = ({
    children,
    component: Component = "button",
    ...props
  }: any) => <Component {...props}>{children}</Component>;
  return { ActionIcon, Button, Group, Tooltip };
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

  it("自分のマップでは設定と共有を表示し、共有・ランキングをアイコン操作にする", () => {
    const onOpenSettings = vi.fn();
    const onOpenShare = vi.fn();
    render(
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
    expect(screen.getByRole("link", { name: "ranking.open" })).toHaveAttribute(
      "href",
      "/seichi-map/ranking",
    );
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

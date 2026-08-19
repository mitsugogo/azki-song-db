import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@mantine/core", () => ({
  Stack: ({ children }: any) => <div>{children}</div>,
  Text: ({ children }: any) => <p>{children}</p>,
  TextInput: ({ label, onChange, ...props }: any) => (
    <label>
      {label}
      <input onChange={onChange} {...props} />
    </label>
  ),
  Switch: ({ label, description, onChange, ...props }: any) => (
    <label>
      {label}
      <input type="checkbox" onChange={onChange} {...props} />
      <span>{description}</span>
    </label>
  ),
}));

import {
  resolveSeichiMapNicknameDraft,
  SeichiMapNicknameSettingsFields,
} from "../SeichiMapNicknameSettingsFields";

describe("SeichiMapNicknameSettingsFields", () => {
  it("未登録時はアカウント情報で補完せず空欄にする", () => {
    expect(resolveSeichiMapNicknameDraft(null, null)).toBe("");
    expect(resolveSeichiMapNicknameDraft()).toBe("");
  });

  it("登録済みプロフィールまたは既存共有のニックネームは維持する", () => {
    expect(resolveSeichiMapNicknameDraft("プロフィール名", "共有名")).toBe(
      "プロフィール名",
    );
    expect(resolveSeichiMapNicknameDraft(null, "共有名")).toBe("共有名");
  });

  it("初期公開オンのニックネーム設定を編集できる", () => {
    const onNicknameChange = vi.fn();
    const onVisibilityChange = vi.fn();
    render(
      <SeichiMapNicknameSettingsFields
        nickname="開拓者A"
        onNicknameChange={onNicknameChange}
        showNicknameInRanking
        onShowNicknameInRankingChange={onVisibilityChange}
        showShareNotice
      />,
    );

    fireEvent.change(screen.getByLabelText("nicknameLabel"), {
      target: { value: "開拓者B" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /rankingVisibilityLabel/ }),
    );

    expect(onNicknameChange).toHaveBeenCalledWith("開拓者B");
    expect(onVisibilityChange).toHaveBeenCalledWith(false);
    expect(screen.getByText("shareVisibilityNotice")).toBeVisible();
  });
});

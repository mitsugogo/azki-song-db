import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeSongModeButtons } from "../HomeSongModeButtons";

vi.mock("@mantine/core", () => {
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
  const ActionIcon = ({ children, ...props }: any) => (
    <button type="button" {...props}>
      {children}
    </button>
  );
  const CopyButton = ({ children }: any) =>
    children({ copied: false, copy: vi.fn() });
  const Tooltip = ({ children }: any) => <>{children}</>;

  return {
    __esModule: true,
    ActionIcon,
    Button,
    CopyButton,
    Tooltip,
  };
});

vi.mock("../../lib/notifications", () => ({
  showAppNotification: vi.fn(),
}));

describe("HomeSongModeButtons", () => {
  it("主要4モードだけを初期表示し、残りはさらにみるで展開する", () => {
    render(<HomeSongModeButtons />);

    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(
      screen.getByRole("button", { name: "showMoreSongModes" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("springSongs")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "showMoreSongModes" }));

    expect(screen.getAllByRole("link")).toHaveLength(14);
    expect(screen.getByText("springSongs")).toBeInTheDocument();
    expect(screen.getByText("summerSongs")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "showFewerSongModes" }),
    ).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("button", { name: "showFewerSongModes" }));

    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(screen.queryByText("springSongs")).not.toBeInTheDocument();
  });

  it("全モードのリンクアイコンをPCではホバー時、スマホでは常時表示する", () => {
    render(<HomeSongModeButtons />);
    fireEvent.click(screen.getByRole("button", { name: "showMoreSongModes" }));

    const linkButtons = screen.getAllByRole("button", {
      name: "shareLinkTooltip",
    });

    expect(linkButtons).toHaveLength(14);
    linkButtons.forEach((button) => {
      expect(button).toHaveClass(
        "opacity-40",
        "md:opacity-0",
        "md:group-hover:opacity-70",
      );
    });
    screen.getAllByRole("link").forEach((button) => {
      expect(button).not.toHaveClass("pr-10");
    });
  });
});

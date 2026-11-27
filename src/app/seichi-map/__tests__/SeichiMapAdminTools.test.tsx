import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { useAdminMode } = vi.hoisted(() => ({ useAdminMode: vi.fn() }));
vi.mock("../../context/AdminModeContext", () => ({ useAdminMode }));

import { SeichiMapAdminTools } from "../SeichiMapAdminTools";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;
});

const renderTools = () =>
  render(
    <MantineProvider>
      <SeichiMapAdminTools>
        <p>admin-panel</p>
      </SeichiMapAdminTools>
    </MantineProvider>,
  );

describe("SeichiMapAdminTools", () => {
  beforeEach(() => {
    useAdminMode.mockReset();
  });

  it("管理者モードでなければ何も表示しない", () => {
    useAdminMode.mockReturnValue({ enabled: false });
    renderTools();

    expect(screen.queryByText("admin-panel")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "admin.toggle" }),
    ).not.toBeInTheDocument();
  });

  it("管理者モードでは既定で折りたたみ、ボタンで開閉する", () => {
    useAdminMode.mockReturnValue({ enabled: true });
    renderTools();

    const toggle = screen.getByRole("button", { name: "admin.toggle" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});

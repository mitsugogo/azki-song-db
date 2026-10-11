import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SeichiMapPopupScrollArea } from "../SeichiMapPopupScrollArea";

beforeAll(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

function createPopup(name: string) {
  const popup = document.createElement("div");
  const container = document.createElement("div");
  const body = document.createElement("div");
  body.textContent = name;
  container.appendChild(body);
  popup.appendChild(container);
  document.body.appendChild(popup);
  return { popup, container, body };
}

describe("SeichiMapPopupScrollArea", () => {
  it("本文とリンクをスクロール領域へ移し、操作ボタンを領域の外に保つ", () => {
    const { popup, container, body } = createPopup("鷲山（日本の山）");
    const link = document.createElement("a");
    link.href = "https://www.youtube.com/watch?v=example";
    link.textContent = "YouTube 動画";
    body.appendChild(link);
    const button = document.createElement("button");
    button.textContent = "旅程に追加";
    const onAdd = vi.fn();
    button.addEventListener("click", onAdd);
    popup.appendChild(button);

    const { unmount } = render(
      <MantineProvider>
        <SeichiMapPopupScrollArea container={container} body={body} />
      </MantineProvider>,
    );

    const viewport = container.querySelector("[data-scrollarea-viewport]");
    expect(viewport).toContainElement(body);
    expect(viewport).toContainElement(screen.getByRole("link"));
    expect(screen.getByRole("link")).toHaveAttribute("href", link.href);
    expect(viewport).not.toContainElement(button);
    fireEvent.click(screen.getByRole("button", { name: "旅程に追加" }));
    expect(onAdd).toHaveBeenCalledOnce();

    unmount();
    expect(container).toBeEmptyDOMElement();
    popup.remove();
  });

  it("別の地点へ切り替えたら前の本文を解除し、新しい吹き出しへ表示する", () => {
    const first = createPopup("最初の地点");
    const second = createPopup("次の地点");
    const { rerender, unmount } = render(
      <MantineProvider>
        <SeichiMapPopupScrollArea {...first} />
      </MantineProvider>,
    );

    rerender(
      <MantineProvider>
        <SeichiMapPopupScrollArea {...second} />
      </MantineProvider>,
    );

    expect(first.container).toBeEmptyDOMElement();
    expect(first.body.parentElement).toBeNull();
    expect(screen.queryByText("最初の地点")).not.toBeInTheDocument();
    expect(second.container).toContainElement(screen.getByText("次の地点"));

    unmount();
    expect(second.body.parentElement).toBeNull();
    first.popup.remove();
    second.popup.remove();
  });
});

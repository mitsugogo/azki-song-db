import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SeichiMapItinerary } from "../SeichiMapItinerary";

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

const location = {
  id: "location-a",
  name: "テスト聖地",
  folder: "テストレイヤー",
  latitude: 35.1,
  longitude: 135.1,
};

const nextLocation = {
  id: "location-b",
  name: "次の聖地",
  folder: "テストレイヤー",
  latitude: 35.2,
  longitude: 135.2,
};

const laterLocation = {
  id: "location-c",
  name: "その次の聖地",
  folder: "テストレイヤー",
  latitude: 35.3,
  longitude: 135.3,
};

describe("SeichiMapItinerary", () => {
  it("チェック、地点表示、削除の操作を通知する", () => {
    const onToggle = vi.fn();
    const onOpenLocation = vi.fn();
    const onRemove = vi.fn();

    render(
      <MantineProvider>
        <SeichiMapItinerary
          itinerary={{
            stops: [{ locationId: location.id, checked: true }],
          }}
          locationsById={new Map([[location.id, location]])}
          onClear={vi.fn()}
          onOpenLocation={onOpenLocation}
          onRemove={onRemove}
          onReorder={vi.fn()}
          onToggle={onToggle}
          visitedLocationIds={new Set()}
        />
      </MantineProvider>,
    );

    expect(screen.queryByText("itinerary.visited")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "itinerary.toggleCheck" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "itinerary.openLocation" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "itinerary.removeStop" }),
    );

    expect(onToggle).toHaveBeenCalledWith(location.id);
    expect(onOpenLocation).toHaveBeenCalledWith(location.id);
    expect(onRemove).toHaveBeenCalledWith(location.id);
    expect(
      screen.getByRole("button", { name: "itinerary.openRoute" }),
    ).toBeDisabled();
  });

  it("最初の未チェック地点への現在地からの経路を表示する", () => {
    render(
      <MantineProvider>
        <SeichiMapItinerary
          itinerary={{
            stops: [
              { locationId: location.id, checked: true },
              { locationId: nextLocation.id, checked: false },
              { locationId: laterLocation.id, checked: false },
            ],
          }}
          locationsById={
            new Map([
              [location.id, location],
              [nextLocation.id, nextLocation],
              [laterLocation.id, laterLocation],
            ])
          }
          onClear={vi.fn()}
          onOpenLocation={vi.fn()}
          onRemove={vi.fn()}
          onReorder={vi.fn()}
          onToggle={vi.fn()}
          visitedLocationIds={new Set()}
        />
      </MantineProvider>,
    );

    const routeLink = screen.getByRole("link", {
      name: "itinerary.openRoute",
    });
    const routeUrl = new URL(routeLink.getAttribute("href") ?? "");

    expect(routeUrl.searchParams.has("origin")).toBe(false);
    expect(routeUrl.searchParams.has("waypoints")).toBe(false);
    expect(routeUrl.searchParams.get("destination")).toBe("35.2,135.2");
    expect(screen.getByText("itinerary.nextRouteHelp")).toBeVisible();
  });

  it("訪問済ラベルをチェック状態ではなく訪問記録から表示する", () => {
    render(
      <MantineProvider>
        <SeichiMapItinerary
          itinerary={{
            stops: [{ locationId: location.id, checked: false }],
          }}
          locationsById={new Map([[location.id, location]])}
          onClear={vi.fn()}
          onOpenLocation={vi.fn()}
          onRemove={vi.fn()}
          onReorder={vi.fn()}
          onToggle={vi.fn()}
          visitedLocationIds={new Set([location.id])}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("itinerary.visited")).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: "itinerary.toggleCheck" }),
    ).not.toBeChecked();
  });

  it("旅程をクリアする前にMantineダイアログで確認する", async () => {
    const onClear = vi.fn();

    render(
      <MantineProvider env="test">
        <SeichiMapItinerary
          itinerary={{
            stops: [{ locationId: location.id, checked: false }],
          }}
          locationsById={new Map([[location.id, location]])}
          onClear={onClear}
          onOpenLocation={vi.fn()}
          onRemove={vi.fn()}
          onReorder={vi.fn()}
          onToggle={vi.fn()}
          visitedLocationIds={new Set()}
        />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "itinerary.clear" }));

    expect(await screen.findByText("confirm.clearItinerary")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "modal.cancel" }));
    expect(onClear).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "itinerary.clear" }));
    fireEvent.click(
      (await screen.findAllByRole("button", { name: "itinerary.clear" })).at(
        -1,
      )!,
    );
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("地点が空のときは経路を無効化し、追加方法を表示する", () => {
    render(
      <MantineProvider>
        <SeichiMapItinerary
          itinerary={{ stops: [] }}
          locationsById={new Map()}
          onClear={vi.fn()}
          onOpenLocation={vi.fn()}
          onRemove={vi.fn()}
          onReorder={vi.fn()}
          onToggle={vi.fn()}
          visitedLocationIds={new Set()}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("itinerary.empty")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "itinerary.openRoute" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "itinerary.clear" }),
    ).toBeDisabled();
  });

  it("すべてチェック済みなら次の地点への経路を無効化する", () => {
    render(
      <MantineProvider>
        <SeichiMapItinerary
          itinerary={{
            stops: [{ locationId: location.id, checked: true }],
          }}
          locationsById={new Map([[location.id, location]])}
          onClear={vi.fn()}
          onOpenLocation={vi.fn()}
          onRemove={vi.fn()}
          onReorder={vi.fn()}
          onToggle={vi.fn()}
          visitedLocationIds={new Set()}
        />
      </MantineProvider>,
    );

    expect(
      screen.getByRole("button", { name: "itinerary.openRoute" }),
    ).toBeDisabled();
    expect(
      screen.queryByText("itinerary.nextRouteHelp"),
    ).not.toBeInTheDocument();
  });
});

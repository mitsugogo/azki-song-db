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

describe("SeichiMapItinerary", () => {
  it("出発地点、訪問チェック、地点表示、削除の操作を通知する", () => {
    const onStartLocationChange = vi.fn();
    const onToggle = vi.fn();
    const onOpenLocation = vi.fn();
    const onRemove = vi.fn();

    render(
      <MantineProvider>
        <SeichiMapItinerary
          itinerary={{
            startLocation: "新大阪",
            stops: [{ locationId: location.id, completed: false }],
          }}
          locationsById={new Map([[location.id, location]])}
          onClear={vi.fn()}
          onOpenLocation={onOpenLocation}
          onRemove={onRemove}
          onReorder={vi.fn()}
          onStartLocationChange={onStartLocationChange}
          onToggle={onToggle}
        />
      </MantineProvider>,
    );

    fireEvent.change(screen.getByLabelText("itinerary.startLocationLabel"), {
      target: { value: "大阪駅" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "itinerary.markVisited" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "itinerary.openLocation" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "itinerary.removeStop" }),
    );

    expect(onStartLocationChange).toHaveBeenCalledWith("大阪駅");
    expect(onToggle).toHaveBeenCalledWith(location.id);
    expect(onOpenLocation).toHaveBeenCalledWith(location.id);
    expect(onRemove).toHaveBeenCalledWith(location.id);
    expect(
      screen.getByRole("link", { name: "itinerary.openRoute" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("https://www.google.com/maps/dir/"),
    );
  });

  it("地点が空のときは経路を無効化し、追加方法を表示する", () => {
    render(
      <MantineProvider>
        <SeichiMapItinerary
          itinerary={{ startLocation: "", stops: [] }}
          locationsById={new Map()}
          onClear={vi.fn()}
          onOpenLocation={vi.fn()}
          onRemove={vi.fn()}
          onReorder={vi.fn()}
          onStartLocationChange={vi.fn()}
          onToggle={vi.fn()}
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
});

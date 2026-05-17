import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@mantine/core", () => ({
  __esModule: true,
  Skeleton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../../hook/useYoutubeThumbnailFallback", () => ({
  __esModule: true,
  default: vi.fn(),
}));

import YoutubeThumbnail from "../YoutubeThumbnail";
import useYoutubeThumbnailFallback from "../../hook/useYoutubeThumbnailFallback";

const mockedUseYoutubeThumbnailFallback = vi.mocked(
  useYoutubeThumbnailFallback,
);

describe("YoutubeThumbnail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedUseYoutubeThumbnailFallback.mockReset();
  });

  it("complete 済みの画像なら onLoad を待たずに表示する", async () => {
    mockedUseYoutubeThumbnailFallback.mockReturnValue({
      imageUrl: "https://img.youtube.com/vi/test/maxresdefault.jpg",
      handleError: vi.fn(),
      isExhausted: false,
    });

    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(
      true,
    );
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
      480,
    );
    vi.spyOn(
      HTMLImageElement.prototype,
      "naturalHeight",
      "get",
    ).mockReturnValue(360);

    render(<YoutubeThumbnail videoId="test" alt="test thumbnail" />);

    const image = screen.getByAltText("test thumbnail");

    await waitFor(() => {
      expect(image).toHaveStyle({ opacity: "1" });
    });
  });

  it("complete 済みでも 120x90 の画像ならフォールバックへ進む", async () => {
    const handleError = vi.fn();

    mockedUseYoutubeThumbnailFallback.mockReturnValue({
      imageUrl: "https://img.youtube.com/vi/test/maxresdefault.jpg",
      handleError,
      isExhausted: false,
    });

    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(
      true,
    );
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
      120,
    );
    vi.spyOn(
      HTMLImageElement.prototype,
      "naturalHeight",
      "get",
    ).mockReturnValue(90);

    render(<YoutubeThumbnail videoId="test" alt="test thumbnail" />);

    await waitFor(() => {
      expect(handleError).toHaveBeenCalledTimes(1);
    });
  });
});

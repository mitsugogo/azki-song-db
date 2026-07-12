import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchJsonDedupMock } = vi.hoisted(() => ({
  fetchJsonDedupMock: vi.fn(),
}));

vi.mock("../../lib/fetchDedup", () => ({
  fetchJsonDedup: fetchJsonDedupMock,
}));

import useReleaseViewCounts from "../useReleaseViewCounts";

describe("useReleaseViewCounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchJsonDedupMock.mockResolvedValue({
      data: { statistics: {} },
      headers: {},
    });
  });

  it("videoIdsを付けず期間だけで専用APIを取得する", async () => {
    const { result } = renderHook(() => useReleaseViewCounts("30d"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchJsonDedupMock).toHaveBeenCalledTimes(1);
    expect(fetchJsonDedupMock).toHaveBeenCalledWith(
      "/api/stat/views/releases?period=30d",
    );
  });

  it("無効時はAPIを取得しない", () => {
    const { result } = renderHook(() => useReleaseViewCounts("7d", false));

    expect(result.current.loading).toBe(false);
    expect(fetchJsonDedupMock).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LivePerformance, LiveTitleGroup } from "@/app/types/live";

const { fetchLivesMock, notFoundMock, permanentRedirectMock, getLocaleMock } =
  vi.hoisted(() => ({
    fetchLivesMock: vi.fn(),
    notFoundMock: vi.fn(() => {
      throw new Error("not found");
    }),
    permanentRedirectMock: vi.fn((url: string) => {
      throw new Error(`redirect:${url}`);
    }),
    getLocaleMock: vi.fn(async () => "ja"),
  }));

vi.mock("@/app/lib/server/fetchLives", () => ({
  fetchLiveTitleGroupsFromApi: fetchLivesMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  permanentRedirect: permanentRedirectMock,
}));

vi.mock("next-intl/server", () => ({
  getLocale: getLocaleMock,
  getTranslations: vi.fn(
    async () => (key: string, values?: { title: string }) =>
      key === "detailDescription"
        ? `${values?.title}の公演情報とセットリストを掲載しています。`
        : key,
  ),
}));

import LivePage from "../[liveId]/page";
import PerformancePage, {
  generateMetadata,
} from "../[liveId]/[performanceSlug]/page";

const makePerformance = (
  id: string,
  performance: string,
  performanceSlug: string,
): LivePerformance => ({
  id,
  performanceSlug,
  title: "AZKi Major Debut LiVE 「声音エントロピー」",
  category: "ソロライブ",
  performance,
  date: "2024-08-03",
  doorsTime: "",
  startTime: "",
  venue: "横浜",
  url: "",
  performers: "AZKi",
  ticket: "",
  note: "",
  setlist: [],
});

const group: LiveTitleGroup = {
  canonicalId: "kowairo-entropy-yokohama-day",
  pageSlug: "kowairo-entropy",
  title: "AZKi Major Debut LiVE 「声音エントロピー」",
  category: "ソロライブ",
  latestDate: "2024-09-18",
  totalSongs: 0,
  performances: [
    makePerformance("kowairo-entropy-yokohama-day", "横浜昼", "yokohama-day"),
    makePerformance(
      "kowairo-entropy-yokohama-night",
      "横浜夜",
      "yokohama-night",
    ),
    makePerformance("kowairo-entropy-toyosu-day1", "豊洲Day1", "toyosu-day1"),
    makePerformance("kowairo-entropy-toyosu-day2", "豊洲Day2", "toyosu-day2"),
  ],
};

const sixthGroup: LiveTitleGroup = {
  ...group,
  canonicalId: "hololive-6th-fes-color-rise-harmony-stage2",
  pageSlug: "hololive-6th-fes-color-rise-harmony",
  title: "hololive 6th fes. Color Rise Harmony",
  performances: [
    makePerformance(
      "hololive-6th-fes-color-rise-harmony-stage2",
      "hololive STAGE2",
      "stage2",
    ),
    makePerformance(
      "hololive-6th-fes-color-rise-harmony-creators",
      "CREATORS’ STAGE",
      "creators-stage",
    ),
  ],
};

describe("hierarchical live routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLocaleMock.mockResolvedValue("ja");
    fetchLivesMock.mockResolvedValue([group, sixthGroup]);
  });

  it("タイトルslugから最初の公演へ転送し、既存のperformanceクエリも引き継ぐ", async () => {
    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "kowairo-entropy" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/lives/kowairo-entropy/yokohama-day");

    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "kowairo-entropy" }),
        searchParams: Promise.resolve({ performance: "09ce524" }),
      }),
    ).rejects.toThrow("redirect:/lives/kowairo-entropy/yokohama-night");

    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "kowairo-entropy" }),
        searchParams: Promise.resolve({ performance: "unknown" }),
      }),
    ).rejects.toThrow("redirect:/lives/kowairo-entropy/yokohama-day");
  });

  it("英語ルートでも階層URLへ転送する", async () => {
    getLocaleMock.mockResolvedValue("en");
    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "kowairo-entropy" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/en/lives/kowairo-entropy/yokohama-day");
  });

  it.each([
    ["yokohama-day", "kowairo-entropy-yokohama-day", "横浜昼"],
    ["yokohama-night", "kowairo-entropy-yokohama-night", "横浜夜"],
    ["toyosu-day1", "kowairo-entropy-toyosu-day1", "豊洲Day1"],
    ["toyosu-day2", "kowairo-entropy-toyosu-day2", "豊洲Day2"],
  ])("%s は対応する公演を表示する", async (slug, id, label) => {
    const page = await PerformancePage({
      params: Promise.resolve({
        liveId: "kowairo-entropy",
        performanceSlug: slug,
      }),
    });
    const [breadcrumbs, detail] = page.props.children.props.children;
    expect(breadcrumbs.props.performanceLabel).toBe(label);
    expect(breadcrumbs.props.liveTitleHref).toBe("/lives/kowairo-entropy");
    expect(detail.props.initialPerformanceId).toBe(id);
    expect(detail.props.group.pageSlug).toBe("kowairo-entropy");
  });

  it("未知の公演slugは404にする", async () => {
    await expect(
      PerformancePage({
        params: Promise.resolve({
          liveId: "kowairo-entropy",
          performanceSlug: "unknown",
        }),
      }),
    ).rejects.toThrow("not found");
  });

  it("公演ごとに固有のcanonicalとOG/Xメタデータを返す", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        liveId: "kowairo-entropy",
        performanceSlug: "toyosu-day2",
      }),
    });
    expect(metadata.title).toContain("豊洲Day2");
    expect(metadata.alternates?.canonical?.toString()).toContain(
      "/lives/kowairo-entropy/toyosu-day2",
    );
    expect(metadata.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 1200, height: 630 }),
      ]),
    );
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("6th fes.もシート設定だけで親・公演URLを解決する", async () => {
    await expect(
      LivePage({
        params: Promise.resolve({
          liveId: "hololive-6th-fes-color-rise-harmony",
        }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(
      "redirect:/lives/hololive-6th-fes-color-rise-harmony/stage2",
    );

    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "2ddc7b6" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(
      "redirect:/lives/hololive-6th-fes-color-rise-harmony/creators-stage",
    );

    const page = await PerformancePage({
      params: Promise.resolve({
        liveId: "hololive-6th-fes-color-rise-harmony",
        performanceSlug: "creators-stage",
      }),
    });
    const [, detail] = page.props.children.props.children;
    expect(detail.props.initialPerformanceId).toBe(
      "hololive-6th-fes-color-rise-harmony-creators",
    );

    const metadata = await generateMetadata({
      params: Promise.resolve({
        liveId: "hololive-6th-fes-color-rise-harmony",
        performanceSlug: "creators-stage",
      }),
    });
    expect(metadata.alternates?.canonical?.toString()).toContain(
      "/lives/hololive-6th-fes-color-rise-harmony/creators-stage",
    );
  });

  it("ALLはタイトルごとの比較ページを表示し、固有のcanonicalとOGを持つ", async () => {
    const page = await PerformancePage({
      params: Promise.resolve({
        liveId: "hololive-6th-fes-color-rise-harmony",
        performanceSlug: "all",
      }),
    });
    const [breadcrumbs, comparison] = page.props.children.props.children;
    expect(breadcrumbs.props.liveTitleHref).toBe(
      "/lives/hololive-6th-fes-color-rise-harmony",
    );
    expect(comparison.props.group).toBe(sixthGroup);

    const metadata = await generateMetadata({
      params: Promise.resolve({
        liveId: "hololive-6th-fes-color-rise-harmony",
        performanceSlug: "all",
      }),
    });
    expect(metadata.alternates?.canonical?.toString()).toContain(
      "/lives/hololive-6th-fes-color-rise-harmony/all",
    );
    expect(metadata.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 1200, height: 630 }),
      ]),
    );
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("ALLに残ったperformanceクエリは該当公演URLへ転送する", async () => {
    await expect(
      PerformancePage({
        params: Promise.resolve({
          liveId: "hololive-6th-fes-color-rise-harmony",
          performanceSlug: "all",
        }),
        searchParams: Promise.resolve({
          performance: "hololive-6th-fes-color-rise-harmony-creators",
        }),
      }),
    ).rejects.toThrow(
      "redirect:/lives/hololive-6th-fes-color-rise-harmony/creators-stage",
    );
  });

  it("階層URLに残ったperformanceクエリは正しい公演URLへ転送する", async () => {
    await expect(
      PerformancePage({
        params: Promise.resolve({
          liveId: "hololive-6th-fes-color-rise-harmony",
          performanceSlug: "stage2",
        }),
        searchParams: Promise.resolve({
          performance: "hololive-6th-fes-color-rise-harmony-creators",
        }),
      }),
    ).rejects.toThrow(
      "redirect:/lives/hololive-6th-fes-color-rise-harmony/creators-stage",
    );

    await expect(
      PerformancePage({
        params: Promise.resolve({
          liveId: "hololive-6th-fes-color-rise-harmony",
          performanceSlug: "stage2",
        }),
        searchParams: Promise.resolve({ performance: "unknown" }),
      }),
    ).rejects.toThrow(
      "redirect:/lives/hololive-6th-fes-color-rise-harmony/stage2",
    );
  });
});

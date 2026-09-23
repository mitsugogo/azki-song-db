import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LiveTitleGroup } from "@/app/types/live";

const { fetchLivesMock, notFoundMock, permanentRedirectMock } = vi.hoisted(
  () => ({
    fetchLivesMock: vi.fn(),
    notFoundMock: vi.fn(() => {
      throw new Error("not found");
    }),
    permanentRedirectMock: vi.fn((url: string) => {
      throw new Error(`redirect:${url}`);
    }),
  }),
);

vi.mock("@/app/lib/server/fetchLives", () => ({
  fetchLiveTitleGroupsFromApi: fetchLivesMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  permanentRedirect: permanentRedirectMock,
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(async () => "ja"),
  getTranslations: vi.fn(
    async () => (key: string, values?: any) =>
      key === "detailDescription"
        ? `${values.title}の公演情報とセットリストを掲載しています。`
        : key,
  ),
}));

import LivePage, { generateMetadata } from "../[liveId]/page";
import PerformancePage from "../[liveId]/[performanceSlug]/page";

const group: LiveTitleGroup = {
  canonicalId: "LIVE-018",
  title: "First Gravity",
  category: "ユニットライブ",
  latestDate: "2024-01-27",
  totalSongs: 0,
  performances: [
    {
      id: "LIVE-018",
      title: "First Gravity",
      category: "ユニットライブ",
      performance: "昼公演",
      date: "2024-01-27",
      doorsTime: "",
      startTime: "",
      venue: "CLUB CITTA’",
      url: "",
      performers: "AZKi、ときのそら",
      ticket: "",
      note: "",
      setlist: [],
    },
    {
      id: "LIVE-019",
      title: "First Gravity",
      category: "ユニットライブ",
      performance: "夜公演",
      date: "2024-01-27",
      doorsTime: "",
      startTime: "",
      venue: "CLUB CITTA’",
      url: "",
      performers: "AZKi、ときのそら",
      ticket: "",
      note: "",
      setlist: [],
    },
  ],
};

describe("live detail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchLivesMock.mockResolvedValue([group]);
  });

  it("別公演IDを代表ページのperformanceクエリへ恒久転送する", async () => {
    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "LIVE-019" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/lives/LIVE-018?performance=LIVE-019");
    expect(permanentRedirectMock).toHaveBeenCalledWith(
      "/lives/LIVE-018?performance=LIVE-019",
    );
  });

  it("英語ルートの別公演IDは英語URLへ転送する", async () => {
    const { getLocale } = await import("next-intl/server");
    vi.mocked(getLocale).mockResolvedValueOnce("en");
    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "LIVE-019" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/en/lives/LIVE-018?performance=LIVE-019");
  });

  it("未知のIDを404にする", async () => {
    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "LIVE-404" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("not found");
    expect(notFoundMock).toHaveBeenCalled();
  });

  it("ページslug未設定の複数公演でもALL比較を開け、単独公演には出さない", async () => {
    const page = await PerformancePage({
      params: Promise.resolve({ liveId: "LIVE-018", performanceSlug: "all" }),
    });
    const [, comparison] = page.props.children.props.children;
    expect(comparison.props.group).toBe(group);

    fetchLivesMock.mockResolvedValue([
      { ...group, performances: [group.performances[0]] },
    ]);
    await expect(
      PerformancePage({
        params: Promise.resolve({ liveId: "LIVE-018", performanceSlug: "all" }),
      }),
    ).rejects.toThrow("not found");
  });

  it("旧ハッシュIDから新しいslugへ恒久転送する", async () => {
    const slugGroup = {
      ...group,
      canonicalId: "soraz-first-gravity-day",
      performances: group.performances.map((performance, index) => ({
        ...performance,
        id:
          index === 0 ? "soraz-first-gravity-day" : "soraz-first-gravity-night",
      })),
    };
    fetchLivesMock.mockResolvedValue([slugGroup]);

    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "c4b7795" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(
      "redirect:/lives/soraz-first-gravity-day?performance=soraz-first-gravity-night",
    );

    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "81eebce" }),
        searchParams: Promise.resolve({ performance: "c4b7795" }),
      }),
    ).rejects.toThrow(
      "redirect:/lives/soraz-first-gravity-day?performance=soraz-first-gravity-night",
    );
  });

  it("詳細タイトル固有のcanonicalとOGメタデータを返す", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ liveId: "LIVE-019" }),
    });
    expect(metadata.title).toBe("First Gravity | AZKi Song Database");
    expect(metadata.description).toContain("First Gravity");
    expect(metadata.alternates?.canonical?.toString()).toContain(
      "/lives/LIVE-018",
    );
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("声音エントロピーの旧フラットURLを公演sub slugへ転送する", async () => {
    const entropyGroup: LiveTitleGroup = {
      ...group,
      canonicalId: "kowairo-entropy-yokohama-day",
      pageSlug: "kowairo-entropy",
      performances: [
        {
          ...group.performances[0],
          id: "kowairo-entropy-yokohama-day",
          performanceSlug: "yokohama-day",
        },
        {
          ...group.performances[1],
          id: "kowairo-entropy-yokohama-night",
          performanceSlug: "yokohama-night",
        },
      ],
    };
    fetchLivesMock.mockResolvedValue([entropyGroup]);

    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "kowairo-entropy-yokohama-night" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/lives/kowairo-entropy/yokohama-night");

    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "a98652e" }),
        searchParams: Promise.resolve({ performance: "09ce524" }),
      }),
    ).rejects.toThrow("redirect:/lives/kowairo-entropy/yokohama-night");

    const metadata = await generateMetadata({
      params: Promise.resolve({ liveId: "kowairo-entropy-yokohama-night" }),
    });
    expect(metadata.alternates?.canonical?.toString()).toContain(
      "/lives/kowairo-entropy/yokohama-night",
    );

    await expect(
      LivePage({
        params: Promise.resolve({ liveId: "kowairo-entropy" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/lives/kowairo-entropy/yokohama-day");
  });
});

import { describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
  Noto_Sans_JP: () => ({ variable: "--font-noto-sans" }),
}));

import { buildArchivePageMetadata } from "../archivePageMetadata";

describe("archive page metadata", () => {
  it.each([
    ["/stream-archives", "配信アーカイブ"],
    ["/stream-archives/list", "アーカイブ一覧"],
  ])("sets canonical and social cards for %s", (pathname, title) => {
    const metadata = buildArchivePageMetadata({
      title,
      subtitle: "説明",
      pathname,
      locale: "ja",
    });

    expect(metadata.alternates?.canonical?.toString()).toContain(pathname);
    expect(metadata.openGraph?.url?.toString()).toContain(pathname);
    expect(metadata.openGraph?.title).toContain(title);
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });
});

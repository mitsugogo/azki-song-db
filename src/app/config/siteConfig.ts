export const siteConfig = {
  siteName: "AZKi Song Database",
  shortName: "AZ Song DB",
  siteSlug: "azki-song-db",

  // 推しのチャンネル名、URL
  channelName: "AZKi Channel",
  channelUrl: "https://www.youtube.com/@AZKi",
  // 本番のURL
  siteUrl: "https://azki-song-db.vercel.app/",
};

/**
 * サイトのベースURL
 */
export const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.PUBLIC_BASE_URL ??
  (process.env.NODE_ENV === "development"
    ? `http://localhost:${process.env.PORT ?? 3000}`
    : siteConfig.siteUrl);

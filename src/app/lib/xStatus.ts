const X_STATUS_SNOWFLAKE_EPOCH_MS = BigInt("1288834974657");
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

const normalizeHostname = (hostname: string) =>
  hostname.replace(/^www\./i, "").toLowerCase();

const extractStatusIdFromPathname = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const statusIndex = segments.findIndex((segment) => segment === "status");
  if (statusIndex === -1 || statusIndex + 1 >= segments.length) {
    return null;
  }

  const statusId = segments[statusIndex + 1];
  return /^\d{10,}$/.test(statusId) ? statusId : null;
};

export const parseXStatusSnowflakeId = (rawUrl: string): string | null => {
  try {
    const url = new URL(rawUrl);
    const host = normalizeHostname(url.hostname);
    if (
      host !== "x.com" &&
      host !== "twitter.com" &&
      host !== "mobile.twitter.com"
    ) {
      return null;
    }

    return extractStatusIdFromPathname(url.pathname);
  } catch {
    return null;
  }
};

export const getJstDateFromSnowflake = (snowflakeId: string): string | null => {
  if (!/^\d{10,}$/.test(snowflakeId)) {
    return null;
  }

  const id = BigInt(snowflakeId);
  const timestampMs = Number((id >> BigInt(22)) + X_STATUS_SNOWFLAKE_EPOCH_MS);
  if (!Number.isFinite(timestampMs) || timestampMs < 0) {
    return null;
  }

  const jstDate = new Date(timestampMs + JST_OFFSET_MS);
  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jstDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseXStatusDateFromUrl = (rawUrl: string): string | null => {
  const snowflakeId = parseXStatusSnowflakeId(rawUrl);
  if (!snowflakeId) {
    return null;
  }
  return getJstDateFromSnowflake(snowflakeId);
};

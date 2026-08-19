const OPEN_SETTINGS_QUERY_KEY = "settings";
const OPEN_SETTINGS_QUERY_VALUE = "nickname";

export function buildSettingsCallbackUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.set(OPEN_SETTINGS_QUERY_KEY, OPEN_SETTINGS_QUERY_VALUE);
  return url.toString();
}

export function consumeSettingsRequestFromUrl(href: string): string | null {
  const url = new URL(href);
  if (
    url.searchParams.get(OPEN_SETTINGS_QUERY_KEY) !== OPEN_SETTINGS_QUERY_VALUE
  ) {
    return null;
  }

  url.searchParams.delete(OPEN_SETTINGS_QUERY_KEY);
  return `${url.pathname}${url.search}${url.hash}`;
}

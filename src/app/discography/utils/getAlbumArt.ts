function toPlaylistUrl(playlistIdOrUrl: string): string {
  if (playlistIdOrUrl.startsWith("http")) {
    return playlistIdOrUrl;
  }

  return `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistIdOrUrl)}`;
}

export function extractPlaylistId(playlistIdOrUrl?: string): string | null {
  if (!playlistIdOrUrl) return null;

  if (!playlistIdOrUrl.startsWith("http")) {
    return playlistIdOrUrl;
  }

  try {
    const url = new URL(playlistIdOrUrl);
    return url.searchParams.get("list");
  } catch {
    return null;
  }
}

export async function getAlbumArt(
  playlistIdOrUrl?: string,
): Promise<string | null> {
  const playlistId = extractPlaylistId(playlistIdOrUrl);
  if (!playlistId) return null;

  try {
    const res = await fetch(toPlaylistUrl(playlistId));

    if (!res.ok) return null;

    const html = await res.text();
    const match = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    );

    if (!match?.[1]) return null;

    const imageUrl = match[1];
    if (/=s\d+/.test(imageUrl)) {
      return imageUrl.replace(/=s\d+.*/, "=s1200");
    }

    return imageUrl;
  } catch {
    return null;
  }
}

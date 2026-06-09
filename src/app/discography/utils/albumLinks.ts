import type { Song } from "@/app/types/song";

import { toPlaylistUrl } from "./getAlbumArt";

type AlbumLinkSource = Pick<Song, "album_list_uri" | "album_id">;

export function getAlbumPlaylistUrl(song: AlbumLinkSource): string | null {
  const albumId = song.album_id?.trim();
  if (albumId) return toPlaylistUrl(albumId);

  const legacyAlbumListUri = song.album_list_uri?.trim();
  if (legacyAlbumListUri) return toPlaylistUrl(legacyAlbumListUri);

  return null;
}

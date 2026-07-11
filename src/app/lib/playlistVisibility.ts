export type PlaylistVisibility = "PRIVATE" | "UNLISTED" | "PUBLIC";

export const canViewPlaylist = (
  visibility: PlaylistVisibility,
  ownerUserId: string,
  viewerUserId?: string | null,
) =>
  visibility !== "PRIVATE" ||
  Boolean(viewerUserId && ownerUserId === viewerUserId);

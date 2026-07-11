"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { signIn, useSession } from "next-auth/react";
import { notifications } from "@mantine/notifications";
import { useTranslations } from "next-intl";
import type { Playlist, PlaylistEntry } from "@/app/lib/playlistUrl";

type PendingAction =
  | { type: "favorite"; entry: PlaylistEntry }
  | { type: "playlist-menu"; entry: PlaylistEntry }
  | { type: "create-playlist" };

type LibraryState = { playlists: Playlist[]; favorites: PlaylistEntry[] };
type ContextValue = LibraryState & {
  ready: boolean;
  authenticated: boolean;
  requestSignIn: (action?: PendingAction) => void;
  savePlaylist: (playlist: Playlist) => void;
  updatePlaylist: (playlist: Playlist) => void;
  deletePlaylist: (playlist: Playlist) => void;
  setFavorites: (favorites: PlaylistEntry[]) => void;
};

const PENDING_KEY = "azki-song-db:pending-library-action";
const EMPTY: LibraryState = { playlists: [], favorites: [] };
const UserLibraryContext = createContext<ContextValue | null>(null);

const requestJson = async (
  url: string,
  init?: RequestInit,
): Promise<LibraryState> => {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Library request failed: ${response.status}${errorBody ? ` ${errorBody}` : ""}`,
    );
  }
  return response.json();
};

const readLegacyValue = (key: string, fallback: unknown[]) => {
  const raw = window.localStorage.getItem(key);
  return raw === null ? fallback : JSON.parse(raw);
};

export function UserLibraryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const t = useTranslations("Account");
  const [library, setLibrary] = useState<LibraryState>(EMPTY);
  const [ready, setReady] = useState(false);

  const reportError = useCallback(() => {
    notifications.show({
      title: t("libraryErrorTitle"),
      message: t("libraryErrorMessage"),
      color: "red",
    });
  }, [t]);

  const persistPendingFavorite = useCallback(
    async (entry: PlaylistEntry, current: LibraryState) => {
      const key = `${entry.videoId}\0${entry.start}`;
      if (
        current.favorites.some(
          (item) => `${item.videoId}\0${item.start}` === key,
        )
      )
        return current;
      return requestJson("/api/library/favorites", {
        method: "PUT",
        body: JSON.stringify({ favorites: [...current.favorites, entry] }),
      });
    },
    [],
  );

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setLibrary(EMPTY);
      setReady(status === "unauthenticated");
      return;
    }

    let cancelled = false;
    const initialize = async () => {
      setReady(false);
      try {
        const playlists = readLegacyValue("playlists", []);
        const favorites = readLegacyValue("system-favorites", []);
        if (!Array.isArray(playlists) || !Array.isArray(favorites)) {
          throw new Error("Invalid legacy library storage");
        }
        const hasLegacy = playlists.length > 0 || favorites.length > 0;
        let next = hasLegacy
          ? await requestJson("/api/library/migrate", {
              method: "POST",
              body: JSON.stringify({ playlists, favorites }),
            })
          : await requestJson("/api/library");
        if (hasLegacy) {
          window.localStorage.removeItem("playlists");
          window.localStorage.removeItem("system-favorites");
        }
        const pendingRaw = window.sessionStorage.getItem(PENDING_KEY);
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw) as PendingAction;
          if (pending.type === "favorite")
            next = await persistPendingFavorite(pending.entry, next);
          window.sessionStorage.removeItem(PENDING_KEY);
          if (pending.type !== "favorite") {
            window.dispatchEvent(
              new CustomEvent("azki-library-action", { detail: pending }),
            );
          }
        }
        if (!cancelled) setLibrary(next);
      } catch (error) {
        console.error(error);
        if (!cancelled) reportError();
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void initialize();
    return () => {
      cancelled = true;
    };
  }, [persistPendingFavorite, reportError, status]);

  const requestSignIn = useCallback((action?: PendingAction) => {
    if (action)
      window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(action));
    void signIn("google", { callbackUrl: window.location.href });
  }, []);

  const commit = useCallback(
    async (promise: Promise<LibraryState>) => {
      try {
        setLibrary(await promise);
      } catch (error) {
        console.error(error);
        reportError();
      }
    },
    [reportError],
  );

  const savePlaylist = useCallback(
    (playlist: Playlist) => {
      if (status !== "authenticated") {
        requestSignIn({ type: "create-playlist" });
        return;
      }
      void commit(
        requestJson("/api/library/playlists", {
          method: "POST",
          body: JSON.stringify(playlist),
        }),
      );
    },
    [commit, requestSignIn, status],
  );

  const updatePlaylist = useCallback(
    (playlist: Playlist) => {
      if (!playlist.id) return;
      if (status !== "authenticated") {
        requestSignIn();
        return;
      }
      void commit(
        requestJson(
          `/api/library/playlists/${encodeURIComponent(playlist.id)}`,
          { method: "PUT", body: JSON.stringify(playlist) },
        ),
      );
    },
    [commit, requestSignIn, status],
  );

  const deletePlaylist = useCallback(
    (playlist: Playlist) => {
      if (!playlist.id || status !== "authenticated") return;
      void commit(
        requestJson(
          `/api/library/playlists/${encodeURIComponent(playlist.id)}`,
          { method: "DELETE" },
        ),
      );
    },
    [commit, status],
  );

  const setFavorites = useCallback(
    (favorites: PlaylistEntry[]) => {
      if (status !== "authenticated") return;
      setLibrary((current) => ({ ...current, favorites }));
      void commit(
        requestJson("/api/library/favorites", {
          method: "PUT",
          body: JSON.stringify({ favorites }),
        }),
      );
    },
    [commit, status],
  );

  const value = useMemo<ContextValue>(
    () => ({
      ...library,
      ready,
      authenticated: status === "authenticated",
      requestSignIn,
      savePlaylist,
      updatePlaylist,
      deletePlaylist,
      setFavorites,
    }),
    [
      deletePlaylist,
      library,
      ready,
      requestSignIn,
      savePlaylist,
      setFavorites,
      status,
      updatePlaylist,
    ],
  );

  return (
    <UserLibraryContext.Provider value={value}>
      {children}
    </UserLibraryContext.Provider>
  );
}

export const useUserLibrary = () => {
  const value = useContext(UserLibraryContext);
  if (!value)
    throw new Error("useUserLibrary must be used within UserLibraryProvider");
  return value;
};

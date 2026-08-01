"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { ADMIN_MODE_STORAGE_KEY } from "../lib/adminConfig";

type AdminModeContextValue = {
  isAdmin: boolean;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

const AdminModeContext = createContext<AdminModeContextValue>({
  isAdmin: false,
  enabled: false,
  setEnabled: () => undefined,
});

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [storedEnabled, setStoredEnabled] = useState(false);
  const isAdmin = status === "authenticated" && Boolean(session?.user?.isAdmin);

  useEffect(() => {
    try {
      setStoredEnabled(
        window.localStorage.getItem(ADMIN_MODE_STORAGE_KEY) === "true",
      );
    } catch {
      setStoredEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading" || isAdmin) return;
    setStoredEnabled(false);
    try {
      window.localStorage.removeItem(ADMIN_MODE_STORAGE_KEY);
    } catch {
      // localStorage が使えない環境ではメモリ上の状態だけを使う。
    }
  }, [isAdmin, status]);

  const setEnabled = useCallback((enabled: boolean) => {
    setStoredEnabled(enabled);
    try {
      window.localStorage.setItem(
        ADMIN_MODE_STORAGE_KEY,
        enabled ? "true" : "false",
      );
    } catch {
      // localStorage が使えない環境でもUI操作は継続する。
    }
  }, []);

  const value = useMemo(
    () => ({ isAdmin, enabled: isAdmin && storedEnabled, setEnabled }),
    [isAdmin, setEnabled, storedEnabled],
  );

  return (
    <AdminModeContext.Provider value={value}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  return useContext(AdminModeContext);
}

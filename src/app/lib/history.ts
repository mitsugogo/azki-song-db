// Small helper for programmatic history updates.
// Provides a centralized way to perform replaceState/pushState with a short-lived
// programmatic flag and dispatch a matching event when needed.
export const __PROGRAMMATIC_FLAG_KEY = "__isProgrammaticHistoryUpdate";

export function isProgrammaticHistoryUpdate(): boolean {
  try {
    return Boolean((window as any)[__PROGRAMMATIC_FLAG_KEY]);
  } catch (_e) {
    return false;
  }
}

function setProgrammaticFlag(value: boolean) {
  try {
    (window as any)[__PROGRAMMATIC_FLAG_KEY] = value;
  } catch (_) {}
}

export function replaceUrlIfDifferent(
  newUrl: string,
  opts?: { dispatchEvent?: boolean },
) {
  try {
    if (typeof window === "undefined") return;
    if (window.location.href === newUrl) return;
    setProgrammaticFlag(true);
    window.history.replaceState(null, "", newUrl);
    if (opts?.dispatchEvent ?? true) {
      // Keep using plain Event for compatibility with existing handlers
      window.dispatchEvent(new Event("replacestate"));
    }
  } finally {
    // clear next tick
    setTimeout(() => setProgrammaticFlag(false), 0);
  }
}

export function pushUrlIfDifferent(
  newUrl: string,
  opts?: { dispatchEvent?: boolean },
) {
  try {
    if (typeof window === "undefined") return;
    if (window.location.href === newUrl) return;
    setProgrammaticFlag(true);
    window.history.pushState(null, "", newUrl);
    if (opts?.dispatchEvent ?? true) {
      window.dispatchEvent(new Event("pushstate"));
    }
  } finally {
    // clear next tick
    setTimeout(() => setProgrammaticFlag(false), 0);
  }
}

export default {
  isProgrammaticHistoryUpdate,
  replaceUrlIfDifferent,
  pushUrlIfDifferent,
};

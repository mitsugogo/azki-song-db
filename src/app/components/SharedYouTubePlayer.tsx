"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { YouTubeEvent } from "react-youtube";
import YouTubePlayer from "./YouTubePlayer";

type SharedYouTubePlayerSource = {
  sourceId: string;
  active: boolean;
  videoId?: string;
  startTime?: number;
  playerKey?: number;
  showNativeControls?: boolean;
  zIndex?: number;
  onReady: (event: YouTubeEvent<any>) => void;
  onStateChange: (event: YouTubeEvent<any>) => void;
  onError?: (event: YouTubeEvent<any>) => void;
};

type ActiveSource = Omit<SharedYouTubePlayerSource, "active" | "videoId"> & {
  videoId: string;
};

type ActiveSlot = {
  sourceId: string;
  element: HTMLElement;
};

type PlayerLoad = {
  sourceId: string;
  videoId: string;
  startTime?: number;
  playerKey?: number;
  showNativeControls?: boolean;
};

type SharedYouTubePlayerContextValue = {
  setSource: (source: SharedYouTubePlayerSource) => void;
  clearSource: (sourceId: string) => void;
  setSlot: (slot: ActiveSlot) => void;
  clearSlot: (sourceId: string) => void;
};

const SharedYouTubePlayerContext =
  createContext<SharedYouTubePlayerContextValue | null>(null);

export function SharedYouTubePlayerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeSource, setActiveSource] = useState<ActiveSource | null>(null);
  const [hostElement, setHostElement] = useState<HTMLDivElement | null>(null);
  const activeSlotRef = useRef<ActiveSlot | null>(null);
  const hostElementRef = useRef<HTMLDivElement | null>(null);
  const parkingElementRef = useRef<HTMLDivElement | null>(null);

  const moveHostElement = useCallback((target: HTMLElement | null) => {
    const element = hostElementRef.current;
    if (element && target && element.parentElement !== target) {
      if (
        element.isConnected &&
        target.isConnected &&
        typeof target.moveBefore === "function"
      ) {
        // iframe の browsing context を維持したままスロット間を移動する。
        target.moveBefore(element, null);
      } else {
        target.appendChild(element);
      }
    }
  }, []);

  const setSource = useCallback((source: SharedYouTubePlayerSource) => {
    if (!source.active || !source.videoId) {
      setActiveSource((current) =>
        current?.sourceId === source.sourceId ? null : current,
      );
      return;
    }

    const { active: _active, videoId, ...sourceWithoutActive } = source;
    setActiveSource({ ...sourceWithoutActive, videoId });
  }, []);

  const clearSource = useCallback((sourceId: string) => {
    setActiveSource((current) =>
      current?.sourceId === sourceId ? null : current,
    );
  }, []);

  const setSlot = useCallback(
    (slot: ActiveSlot) => {
      activeSlotRef.current = slot;
      moveHostElement(slot.element);
    },
    [moveHostElement],
  );

  const clearSlot = useCallback(
    (sourceId: string) => {
      if (activeSlotRef.current?.sourceId !== sourceId) return;

      activeSlotRef.current = null;
      moveHostElement(parkingElementRef.current);
    },
    [moveHostElement],
  );

  useEffect(() => {
    const element = document.createElement("div");
    element.style.position = "absolute";
    element.style.inset = "0";
    element.style.width = "100%";
    element.style.height = "100%";

    hostElementRef.current = element;
    moveHostElement(
      activeSlotRef.current?.element ?? parkingElementRef.current,
    );
    setHostElement(element);

    return () => {
      hostElementRef.current = null;
      element.remove();
    };
  }, [moveHostElement]);

  const value = useMemo(
    () => ({
      setSource,
      clearSource,
      setSlot,
      clearSlot,
    }),
    [setSource, clearSource, setSlot, clearSlot],
  );

  return (
    <SharedYouTubePlayerContext.Provider value={value}>
      {children}
      <SharedYouTubePlayerHost
        activeSource={activeSource}
        hostElement={hostElement}
      />
      <div
        ref={parkingElementRef}
        aria-hidden="true"
        data-testid="shared-youtube-player-parking"
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: "1px",
          height: "1px",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      />
    </SharedYouTubePlayerContext.Provider>
  );
}

export function useSharedYouTubePlayerSource(
  source: SharedYouTubePlayerSource,
) {
  const context = useContext(SharedYouTubePlayerContext);

  useEffect(() => {
    if (!context) return;
    context.setSource(source);
  }, [context, source]);

  useEffect(() => {
    if (!context) return;
    return () => {
      context.clearSource(source.sourceId);
    };
  }, [context, source.sourceId]);
}

export function SharedYouTubePlayerSlot({
  sourceId,
  active,
  className,
}: {
  sourceId: string;
  active: boolean;
  className?: string;
}) {
  const context = useContext(SharedYouTubePlayerContext);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const setElement = useCallback(
    (element: HTMLDivElement | null) => {
      if (elementRef.current) {
        context?.clearSlot(sourceId);
      }

      elementRef.current = element;
      if (active && element) {
        context?.setSlot({ sourceId, element });
      }
    },
    [active, context, sourceId],
  );

  return (
    <div
      ref={setElement}
      className={className}
      style={{ position: "relative" }}
      data-testid={`shared-youtube-player-slot-${sourceId}`}
    />
  );
}

function SharedYouTubePlayerHost({
  activeSource,
  hostElement,
}: {
  activeSource: ActiveSource | null;
  hostElement: HTMLDivElement | null;
}) {
  const playerRef = useRef<any>(null);
  const activeSourceRef = useRef<ActiveSource | null>(activeSource);
  const deliveredReadySourceIdRef = useRef<string | null>(null);
  const clearPlayerLoadTimeoutRef = useRef<number | null>(null);
  const [playerLoad, setPlayerLoad] = useState<PlayerLoad | null>(null);
  const [hostZIndex, setHostZIndex] = useState(1);

  activeSourceRef.current = activeSource;

  useEffect(() => {
    if (!activeSource?.videoId) {
      if (clearPlayerLoadTimeoutRef.current !== null) {
        window.clearTimeout(clearPlayerLoadTimeoutRef.current);
      }

      clearPlayerLoadTimeoutRef.current = window.setTimeout(() => {
        if (!activeSourceRef.current?.videoId) {
          setPlayerLoad(null);
          playerRef.current = null;
          deliveredReadySourceIdRef.current = null;
        }
        clearPlayerLoadTimeoutRef.current = null;
      }, 500);
      return;
    }

    if (clearPlayerLoadTimeoutRef.current !== null) {
      window.clearTimeout(clearPlayerLoadTimeoutRef.current);
      clearPlayerLoadTimeoutRef.current = null;
    }

    setHostZIndex(activeSource.zIndex ?? 1);
    setPlayerLoad((current) => {
      if (
        current?.videoId === activeSource.videoId &&
        (current.sourceId !== activeSource.sourceId ||
          current.playerKey === activeSource.playerKey)
      ) {
        return current;
      }

      deliveredReadySourceIdRef.current = null;
      return {
        sourceId: activeSource.sourceId,
        videoId: activeSource.videoId,
        startTime: activeSource.startTime,
        playerKey: activeSource.playerKey,
        showNativeControls: activeSource.showNativeControls,
      };
    });
  }, [activeSource]);

  useEffect(() => {
    return () => {
      if (clearPlayerLoadTimeoutRef.current !== null) {
        window.clearTimeout(clearPlayerLoadTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    deliveredReadySourceIdRef.current = null;
  }, [activeSource?.sourceId]);

  useEffect(() => {
    if (!activeSource || !playerRef.current) return;
    if (deliveredReadySourceIdRef.current === activeSource.sourceId) return;

    const playerVideoId =
      typeof playerRef.current.getVideoData === "function"
        ? (playerRef.current.getVideoData()?.video_id ?? null)
        : null;

    if (
      playerVideoId &&
      activeSource.videoId &&
      playerVideoId !== activeSource.videoId
    ) {
      return;
    }

    deliveredReadySourceIdRef.current = activeSource.sourceId;
    activeSource.onReady({ target: playerRef.current } as YouTubeEvent<any>);
  }, [activeSource]);

  const handleReady = useCallback((event: YouTubeEvent<any>) => {
    const source = activeSourceRef.current;
    playerRef.current = event.target;
    deliveredReadySourceIdRef.current = source?.sourceId ?? null;
    source?.onReady(event);
  }, []);

  const handleStateChange = useCallback((event: YouTubeEvent<any>) => {
    activeSourceRef.current?.onStateChange(event);
  }, []);

  const handleError = useCallback((event: YouTubeEvent<any>) => {
    activeSourceRef.current?.onError?.(event);
  }, []);

  if (!playerLoad || !hostElement) {
    return null;
  }

  return createPortal(
    <div
      data-testid="shared-youtube-player-host"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: hostZIndex,
      }}
    >
      <YouTubePlayer
        key={playerLoad.playerKey}
        video_id={playerLoad.videoId}
        startTime={playerLoad.startTime}
        showNativeControls={playerLoad.showNativeControls}
        onReady={handleReady}
        onStateChange={handleStateChange}
        onError={handleError}
      />
    </div>,
    hostElement,
  );
}

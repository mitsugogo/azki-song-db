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
  // false を返す場合は、遷移途中などでこの ready 通知をまだ受理できないことを表す。
  // 次の source 更新時に同じ iframe の ready を再配送する。
  onReady: (
    event: YouTubeEvent<any> & { isSharedPlayerHandoff?: boolean },
  ) => boolean | void;
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
  const slotResizeObserverRef = useRef<ResizeObserver | null>(null);
  const positionFrameRef = useRef<number | null>(null);
  const positionFramesRemainingRef = useRef(0);

  const positionHostElement = useCallback(() => {
    const host = hostElementRef.current;
    const slot = activeSlotRef.current?.element;
    if (!host) return;

    if (!slot?.isConnected) {
      host.style.visibility = "hidden";
      host.style.pointerEvents = "none";
      return;
    }

    const rect = slot.getBoundingClientRect();
    host.style.left = `${rect.left}px`;
    host.style.top = `${rect.top}px`;
    host.style.width = `${rect.width}px`;
    host.style.height = `${rect.height}px`;
    host.style.visibility = "visible";
    host.style.pointerEvents = "auto";
  }, []);

  const scheduleHostPosition = useCallback(() => {
    positionHostElement();
    if (typeof window.requestAnimationFrame !== "function") return;

    // MiniPlayer の spring animation や Fold の viewport 変化中も、
    // iframe 自体は動かさず固定ホストの矩形だけを追従させる。
    positionFramesRemainingRef.current = 45;
    if (positionFrameRef.current !== null) return;

    const updatePosition = () => {
      positionFrameRef.current = null;
      positionHostElement();
      positionFramesRemainingRef.current -= 1;
      if (positionFramesRemainingRef.current > 0) {
        positionFrameRef.current = window.requestAnimationFrame(updatePosition);
      }
    };

    positionFrameRef.current = window.requestAnimationFrame(updatePosition);
  }, [positionHostElement]);

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
      slotResizeObserverRef.current?.disconnect();
      if (typeof ResizeObserver !== "undefined") {
        slotResizeObserverRef.current = new ResizeObserver(
          scheduleHostPosition,
        );
        slotResizeObserverRef.current.observe(slot.element);
      }
      scheduleHostPosition();
    },
    [scheduleHostPosition],
  );

  const clearSlot = useCallback(
    (sourceId: string) => {
      if (activeSlotRef.current?.sourceId !== sourceId) return;

      activeSlotRef.current = null;
      slotResizeObserverRef.current?.disconnect();
      slotResizeObserverRef.current = null;
      positionFramesRemainingRef.current = 0;
      if (positionFrameRef.current !== null) {
        window.cancelAnimationFrame(positionFrameRef.current);
        positionFrameRef.current = null;
      }
      positionHostElement();
    },
    [positionHostElement],
  );

  useEffect(() => {
    window.addEventListener("resize", scheduleHostPosition);
    window.addEventListener("scroll", scheduleHostPosition, true);

    return () => {
      window.removeEventListener("resize", scheduleHostPosition);
      window.removeEventListener("scroll", scheduleHostPosition, true);
      slotResizeObserverRef.current?.disconnect();
      if (positionFrameRef.current !== null) {
        window.cancelAnimationFrame(positionFrameRef.current);
      }
      positionFramesRemainingRef.current = 0;
    };
  }, [scheduleHostPosition]);

  const setHostElementRef = useCallback(
    (element: HTMLDivElement | null) => {
      hostElementRef.current = element;
      setHostElement(element);
      if (element) {
        scheduleHostPosition();
      }
    },
    [scheduleHostPosition],
  );

  useEffect(() => {
    if (!hostElement) return;
    hostElement.style.zIndex = String(activeSource?.zIndex ?? 1);
  }, [activeSource?.zIndex, hostElement]);

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
        ref={setHostElementRef}
        data-testid="shared-youtube-player-surface"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          visibility: "hidden",
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
  const lastReadySourceIdRef = useRef<string | null>(null);
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
          lastReadySourceIdRef.current = null;
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
      lastReadySourceIdRef.current = null;
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

    const isSharedPlayerHandoff = Boolean(
      lastReadySourceIdRef.current &&
      lastReadySourceIdRef.current !== activeSource.sourceId,
    );
    const accepted = activeSource.onReady({
      target: playerRef.current,
      isSharedPlayerHandoff,
    } as YouTubeEvent<any> & { isSharedPlayerHandoff: boolean });
    if (accepted !== false) {
      deliveredReadySourceIdRef.current = activeSource.sourceId;
      lastReadySourceIdRef.current = activeSource.sourceId;
    }
  }, [activeSource]);

  const handleReady = useCallback((event: YouTubeEvent<any>) => {
    const source = activeSourceRef.current;
    playerRef.current = event.target;
    const accepted = source?.onReady(event);
    deliveredReadySourceIdRef.current =
      accepted === false ? null : (source?.sourceId ?? null);
    if (accepted !== false) {
      lastReadySourceIdRef.current = source?.sourceId ?? null;
    }
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

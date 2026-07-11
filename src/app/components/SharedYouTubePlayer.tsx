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

const rectHasChanged = (
  current: Pick<DOMRect, "left" | "top" | "width" | "height"> | null,
  next: Pick<DOMRect, "left" | "top" | "width" | "height">,
) => {
  if (!current) return true;
  return (
    Math.abs(current.left - next.left) > 0.5 ||
    Math.abs(current.top - next.top) > 0.5 ||
    Math.abs(current.width - next.width) > 0.5 ||
    Math.abs(current.height - next.height) > 0.5
  );
};

export function SharedYouTubePlayerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeSource, setActiveSource] = useState<ActiveSource | null>(null);
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);

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

  const setSlot = useCallback((slot: ActiveSlot) => {
    setActiveSlot(slot);
  }, []);

  const clearSlot = useCallback((sourceId: string) => {
    setActiveSlot((current) =>
      current?.sourceId === sourceId ? null : current,
    );
  }, []);

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
        activeSlot={activeSlot}
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
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!context) return;
    if (!active || !element) {
      context.clearSlot(sourceId);
      return;
    }

    context.setSlot({ sourceId, element });
    return () => {
      context.clearSlot(sourceId);
    };
  }, [active, context, element, sourceId]);

  return (
    <div
      ref={setElement}
      className={className}
      data-testid={`shared-youtube-player-slot-${sourceId}`}
    />
  );
}

function SharedYouTubePlayerHost({
  activeSource,
  activeSlot,
}: {
  activeSource: ActiveSource | null;
  activeSlot: ActiveSlot | null;
}) {
  const playerRef = useRef<any>(null);
  const activeSourceRef = useRef<ActiveSource | null>(activeSource);
  const deliveredReadySourceIdRef = useRef<string | null>(null);
  const clearPlayerLoadTimeoutRef = useRef<number | null>(null);
  const [rect, setRect] = useState<Pick<
    DOMRect,
    "left" | "top" | "width" | "height"
  > | null>(null);
  const [playerLoad, setPlayerLoad] = useState<PlayerLoad | null>(null);
  const [hostZIndex, setHostZIndex] = useState(1);
  const slotElement =
    activeSource && activeSlot?.sourceId === activeSource.sourceId
      ? activeSlot.element
      : null;

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
        current.playerKey === activeSource.playerKey
      ) {
        return current;
      }

      deliveredReadySourceIdRef.current = null;
      return {
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
    if (!slotElement) {
      return;
    }

    let frameId = 0;
    const updateRect = () => {
      const nextRect = slotElement.getBoundingClientRect();
      const next = {
        left: nextRect.left,
        top: nextRect.top,
        width: nextRect.width,
        height: nextRect.height,
      };
      setRect((current) => (rectHasChanged(current, next) ? next : current));
      frameId = window.requestAnimationFrame(updateRect);
    };

    updateRect();
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [slotElement]);

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

  if (!playerLoad || !rect || rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return (
    <div
      data-testid="shared-youtube-player-host"
      style={{
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
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
    </div>
  );
}

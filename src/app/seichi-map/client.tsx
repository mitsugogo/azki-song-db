"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "dayjs/locale/ja";
import { useLocale, useTranslations } from "next-intl";
import { signIn, signOut } from "next-auth/react";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Center,
  Checkbox,
  Grid,
  Group,
  Loader,
  Modal,
  NavLink,
  Paper,
  Progress,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { HiChevronRight, HiHome } from "react-icons/hi";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiEdit3,
  FiExternalLink,
  FiLogIn,
  FiLogOut,
  FiMapPin,
  FiSearch,
  FiShare2,
  FiTrash2,
} from "react-icons/fi";
import { DatePickerInput } from "@mantine/dates";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses, pageClasses } from "../theme";
import type { ArchiveItem } from "../types/archiveItem";
import type { SeichiMapLocation } from "../lib/seichiMap";
import { parseXStatusDateFromUrl } from "../lib/xStatus";

type LocationOption = SeichiMapLocation & {
  key: string;
};

type VisitedItem = {
  id: string;
  locationId: string;
  locationName: string;
  visitedAt: string;
  note: string;
  updatedAt: string;
  url: string;
};

type YouTubeReference = {
  rawUrl: string;
  href: string;
  videoId: string;
  startSeconds: number | null;
  timestampLabel: string | null;
};

type ArchiveVideoMeta = {
  title: string;
  thumbnailUrl: string;
  streamDateLabel: string | null;
};

type HoveredLocation = {
  name: string;
  x: number;
  y: number;
};

type YouTubeVideoInfo = {
  videoId?: string;
  title?: string;
  thumbnailUrl?: string;
};

type ShareInfo = {
  shareId: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  isSignedIn: boolean;
  initialShareId?: string | null;
  userName: string;
};

declare global {
  interface Window {
    google?: any;
    __azkiSeichiMapScriptPromise?: Promise<GoogleMapsLibraries>;
    __azkiSeichiMapLoaderVersion?: number;
    __azkiSeichiMapLoaderLanguage?: string;
  }
}

const defaultCenter = {
  lat: 36.204824,
  lng: 138.252924,
};

const DEFAULT_MAP_ZOOM = 5;
const MIN_SHARED_MAP_ZOOM = 1;
const MAX_SHARED_MAP_ZOOM = 21;
const VISITED_PAGE_SIZE = 50;
const DEFAULT_GOOGLE_MAPS_MAP_ID = "DEMO_MAP_ID";
const GOOGLE_MAPS_LOADER_VERSION = 3;
const LAST_VISITED_DATE_STORAGE_KEY = "azki-seichi-map:last-visited-date";
const HIDDEN_LAYERS_STORAGE_KEY = "azki-seichi-map:hidden-layers";
const urlPattern = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%#]+/g;
const timestampPattern = /(?:^|\s)(\d{1,2}:\d{2}(?::\d{2})?)~?/;

type GoogleMapsLibraries = {
  core: any;
  maps: any;
};

type CanvasOverlayHandle = {
  setLocations: (locations: LocationOption[]) => void;
  setSelectedLocationId: (locationId: string | null) => void;
  setMap: (map: any | null) => void;
  findLocationAtLatLng: (latLng: any) => LocationOption | null;
  draw: () => void;
};

type CanvasHitPoint = {
  location: LocationOption;
  x: number;
  y: number;
};

type LayerCompletion = {
  total: number;
  done: number;
  percent: number;
};

const sleep = (milliseconds: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

const installGoogleMapsLoader = (apiKey: string, language: string) => {
  const googleGlobal = (window.google ??= {});
  const mapsGlobal = (googleGlobal.maps ??= {});
  const requestedLibraries = new Set<string>();
  let scriptPromise: Promise<void> | undefined;

  if (mapsGlobal.importLibrary) {
    return;
  }

  mapsGlobal.importLibrary = (libraryName: string) => {
    requestedLibraries.add(libraryName);
    scriptPromise ??= new Promise<void>((resolve, reject) => {
      const params = new URLSearchParams({
        key: apiKey,
        language,
        loading: "async",
        region: "JP",
        v: "weekly",
      });
      const callbackName = `__azkiSeichiMapInit_${Date.now()}`;
      params.set("callback", `google.maps.${callbackName}`);

      mapsGlobal[callbackName] = () => {
        resolve();
        delete mapsGlobal[callbackName];
      };

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}&libraries=${Array.from(
        requestedLibraries,
      ).join(",")}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("google_maps_load_failed"));
      document.head.appendChild(script);
    });

    return scriptPromise.then(() => mapsGlobal.importLibrary(libraryName));
  };
};

const normalizeSearchText = (value: string) =>
  value.normalize("NFKC").toLowerCase();

const getLocationLayerName = (
  location: LocationOption,
  uncategorizedLayerName: string,
) => location.folder.trim() || uncategorizedLayerName;

const roundCompletionPercent = (done: number, total: number) =>
  total === 0 ? 0 : Math.round((done / total) * 1000) / 10;

const formatCompletionPercent = (percent: number) => percent.toFixed(1);

const readHiddenLayerNames = () => {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(HIDDEN_LAYERS_STORAGE_KEY);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    );
  } catch {
    return [];
  }
};

const stripHtmlToLines = (value: string) => {
  return value
    .replace(/&amp;lt;br\s*\/?&amp;gt;/gi, "\n")
    .replace(/&lt;br\s*\/?&gt;/gi, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(div|p|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
};

const appendLinkedText = (container: HTMLElement, text: string) => {
  const lines = stripHtmlToLines(text).split(/\r?\n/);

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      container.appendChild(document.createElement("br"));
    }

    let lastIndex = 0;
    for (const match of line.matchAll(urlPattern)) {
      const url = match[0];
      const index = match.index ?? 0;
      if (index > lastIndex) {
        container.appendChild(
          document.createTextNode(line.slice(lastIndex, index)),
        );
      }

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = url;
      container.appendChild(anchor);
      lastIndex = index + url.length;
    }

    if (lastIndex < line.length) {
      container.appendChild(document.createTextNode(line.slice(lastIndex)));
    }
  });
};

const parseYouTubeSeconds = (value: string | null) => {
  if (!value) return null;
  const normalized = value.trim().replace(/s$/i, "");
  if (/^\d+$/.test(normalized)) return Number(normalized);

  const match = normalized.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
  if (!match) return null;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds > 0 ? totalSeconds : null;
};

const formatTimestamp = (seconds: number | null) => {
  if (seconds === null) return null;
  const normalizedSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const remainingSeconds = normalizedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const getYouTubeVideoId = (url: URL) => {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (host !== "youtube.com" && host !== "m.youtube.com") {
    return null;
  }

  const watchId = url.searchParams.get("v");
  if (watchId) return watchId;

  const [type, videoId] = url.pathname.split("/").filter(Boolean);
  if (["embed", "live", "shorts"].includes(type ?? "") && videoId) {
    return videoId;
  }

  return null;
};

const toYouTubeReference = (rawUrl: string): YouTubeReference | null => {
  try {
    const url = new URL(rawUrl);
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;

    const startSeconds =
      parseYouTubeSeconds(url.searchParams.get("t")) ??
      parseYouTubeSeconds(url.searchParams.get("start"));
    const href = new URL("https://www.youtube.com/watch");
    href.searchParams.set("v", videoId);
    if (startSeconds !== null) {
      href.searchParams.set("t", `${startSeconds}s`);
    }

    return {
      rawUrl,
      href: href.toString(),
      videoId,
      startSeconds,
      timestampLabel: formatTimestamp(startSeconds),
    };
  } catch {
    return null;
  }
};

const extractYouTubeReferences = (value: string) => {
  const references: YouTubeReference[] = [];
  for (const match of stripHtmlToLines(value).matchAll(urlPattern)) {
    const reference = toYouTubeReference(match[0]);
    if (reference) {
      references.push(reference);
    }
  }
  return references;
};

const extractYouTubeVideoIdsFromLocations = (
  locations: Pick<SeichiMapLocation, "description">[],
) => {
  const videoIds = new Set<string>();
  locations.forEach((location) => {
    extractYouTubeReferences(location.description).forEach((reference) => {
      videoIds.add(reference.videoId);
    });
  });
  return [...videoIds];
};

const getDescriptionWithoutYouTubeLinks = (value: string) => {
  return stripHtmlToLines(value)
    .split(/\r?\n/)
    .map((line) => {
      let nextLine = line;
      for (const match of line.matchAll(urlPattern)) {
        if (!toYouTubeReference(match[0])) continue;
        nextLine = nextLine.replace(match[0], "").replace(timestampPattern, "");
      }
      return nextLine.replace(/[~〜]+/g, "").trim();
    })
    .filter((line) => line.length > 0)
    .join("\n");
};

const getYouTubeThumbnailUrl = (videoId: string) =>
  `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`;

const formatArchiveStreamDateLabel = (value?: string) => {
  if (!value) return null;
  const datePart = value.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePart) {
    return datePart.replace(/-/g, "/");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const styleInfoWindowButton = (
  element: HTMLAnchorElement | HTMLButtonElement,
  variant: "filled" | "light" | "outline",
) => {
  element.style.alignItems = "center";
  element.style.borderRadius = "6px";
  element.style.boxSizing = "border-box";
  element.style.display = "inline-flex";
  element.style.fontSize = "13px";
  element.style.fontWeight = "600";
  element.style.gap = "6px";
  element.style.height = "32px";
  element.style.justifyContent = "center";
  element.style.lineHeight = "1";
  element.style.padding = "0 12px";
  element.style.textDecoration = "none";
  element.style.transition =
    "background-color 120ms ease, border-color 120ms ease";

  if (variant === "filled") {
    element.style.background = "#d63384";
    element.style.border = "1px solid #d63384";
    element.style.color = "#ffffff";
    return;
  }

  if (variant === "light") {
    element.style.background = "#fff0f6";
    element.style.border = "1px solid transparent";
    element.style.color = "#c2255c";
    return;
  }

  element.style.background = "#ffffff";
  element.style.border = "1px solid #dee2e6";
  element.style.color = "#343a40";
};

const createSeichiCanvasOverlay = ({
  coreApi,
  mapsApi,
  map,
  isVisited,
  getSelectedLocationId,
}: {
  coreApi: any;
  mapsApi: any;
  map: any;
  isVisited: (location: LocationOption) => boolean;
  getSelectedLocationId: () => string | null;
}) => {
  class SeichiCanvasOverlay
    extends mapsApi.OverlayView
    implements CanvasOverlayHandle
  {
    private canvas: HTMLCanvasElement | null = null;
    private locations: LocationOption[] = [];
    private hitPoints: CanvasHitPoint[] = [];
    private drawFrame: number | null = null;

    setMap(nextMap: any | null) {
      super.setMap(nextMap);
    }

    onAdd() {
      this.canvas = document.createElement("canvas");
      this.canvas.style.position = "absolute";
      this.canvas.style.pointerEvents = "none";
      this.canvas.style.zIndex = "1";
      this.getPanes()?.overlayLayer.appendChild(this.canvas);
    }

    onRemove() {
      if (this.drawFrame !== null) {
        window.cancelAnimationFrame(this.drawFrame);
        this.drawFrame = null;
      }
      this.canvas?.remove();
      this.canvas = null;
      this.hitPoints = [];
    }

    setLocations(locations: LocationOption[]) {
      this.locations = locations;
      this.draw();
    }

    setSelectedLocationId(_locationId: string | null) {
      this.draw();
    }

    draw() {
      if (this.drawFrame !== null) return;

      this.drawFrame = window.requestAnimationFrame(() => {
        this.drawFrame = null;
        this.render();
      });
    }

    private render() {
      const canvas = this.canvas;
      const projection = this.getProjection?.();
      const mapBounds = map.getBounds?.();
      if (!canvas || !projection || !mapBounds) return;

      const northEast = projection.fromLatLngToDivPixel(
        mapBounds.getNorthEast(),
      );
      const southWest = projection.fromLatLngToDivPixel(
        mapBounds.getSouthWest(),
      );
      if (!northEast || !southWest) return;

      const left = southWest.x;
      const top = northEast.y;
      const width = Math.max(1, northEast.x - southWest.x);
      const height = Math.max(1, southWest.y - northEast.y);
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.style.left = `${left}px`;
      canvas.style.top = `${top}px`;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const canvasWidth = Math.ceil(width * pixelRatio);
      const canvasHeight = Math.ceil(height * pixelRatio);
      if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
      if (canvas.height !== canvasHeight) canvas.height = canvasHeight;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      this.hitPoints = [];

      const selectedLocationId = getSelectedLocationId();
      for (const location of this.locations) {
        const point = projection.fromLatLngToDivPixel(
          new coreApi.LatLng(location.latitude, location.longitude),
        );
        if (!point) continue;

        const x = point.x - left;
        const y = point.y - top;
        if (x < -16 || x > width + 16 || y < -16 || y > height + 16) {
          continue;
        }

        const visited = isVisited(location);
        const selected = location.id === selectedLocationId;
        const markerColor = visited ? "#d63384" : "#1c7ed6";
        const radius = selected ? 8 : 6;

        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = markerColor;
        context.fill();
        context.lineWidth = selected ? 3 : 2;
        context.strokeStyle = "#ffffff";
        context.stroke();

        if (selected) {
          context.beginPath();
          context.arc(x, y, 12, 0, Math.PI * 2);
          context.lineWidth = 2;
          context.strokeStyle = markerColor;
          context.stroke();
        }

        this.hitPoints.push({ location, x: point.x, y: point.y });
      }
    }

    findLocationAtLatLng(latLng: any) {
      const projection = this.getProjection?.();
      if (!projection) return null;

      const point = projection.fromLatLngToDivPixel(latLng);
      if (!point) return null;

      let nearestLocation: LocationOption | null = null;
      let nearestDistance = 14 * 14;

      for (const hitPoint of this.hitPoints) {
        const distance =
          (hitPoint.x - point.x) ** 2 + (hitPoint.y - point.y) ** 2;
        if (distance <= nearestDistance) {
          nearestDistance = distance;
          nearestLocation = hitPoint.location;
        }
      }

      return nearestLocation;
    }
  }

  const overlay = new SeichiCanvasOverlay();
  overlay.setMap(map);
  return overlay;
};

const ensureGoogleMapsLibraries = async (): Promise<GoogleMapsLibraries> => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const mapsApi = window.google?.maps;

    if (mapsApi?.importLibrary) {
      const [core, maps] = await Promise.all([
        mapsApi.importLibrary("core"),
        mapsApi.importLibrary("maps"),
      ]);
      return { core, maps };
    }

    if (mapsApi?.Map && mapsApi.OverlayView) {
      return { core: mapsApi, maps: mapsApi };
    }

    await sleep(50);
  }

  throw new Error("google_maps_load_failed");
};

const loadGoogleMapsScript = (apiKey: string, language: string) => {
  if (
    window.__azkiSeichiMapLoaderVersion !== GOOGLE_MAPS_LOADER_VERSION ||
    window.__azkiSeichiMapLoaderLanguage !== language
  ) {
    window.__azkiSeichiMapScriptPromise = undefined;
    window.__azkiSeichiMapLoaderVersion = GOOGLE_MAPS_LOADER_VERSION;
    window.__azkiSeichiMapLoaderLanguage = language;
  }

  if (window.__azkiSeichiMapScriptPromise) {
    return window.__azkiSeichiMapScriptPromise;
  }

  installGoogleMapsLoader(apiKey, language);
  window.__azkiSeichiMapScriptPromise = ensureGoogleMapsLibraries().catch(
    (error) => {
      window.__azkiSeichiMapScriptPromise = undefined;
      throw error;
    },
  );

  return window.__azkiSeichiMapScriptPromise;
};

const toVisitedDateInput = (value: string) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.slice(0, 10);
};

const shouldAutoRestoreVisitedDate = (value: string) => {
  return value === new Date().toISOString().slice(0, 10);
};

const handleVisitUrlChange = (
  value: string,
  currentVisitedDate: string,
  setVisitUrl: (value: string) => void,
  setVisitedDate: (value: string) => void,
) => {
  setVisitUrl(value);
  if (!shouldAutoRestoreVisitedDate(currentVisitedDate)) {
    return;
  }

  const restoredDate = parseXStatusDateFromUrl(value.trim());
  if (restoredDate) {
    setVisitedDate(restoredDate);
  }
};

const formatVisitedDateLabel = (value: string) => {
  const datePart = value.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePart) {
    return datePart.replace(/-/g, "/");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const toLocalDateInputValue = (value: Date | string | null) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isDateInputValue = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isShareIdValue = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
const normalizeShareId = (value?: string | null) => {
  const shareId = value?.trim().toLowerCase();
  return shareId && isShareIdValue(shareId) ? shareId : null;
};

const toFiniteNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const formatUrlNumber = (value: number, fractionDigits: number) => {
  return value.toFixed(fractionDigits).replace(/\.?0+$/, "");
};

const readSharedMapViewport = () => {
  if (typeof window === "undefined") {
    return { center: defaultCenter, zoom: DEFAULT_MAP_ZOOM };
  }

  const params = new URLSearchParams(window.location.search);
  const lat = toFiniteNumber(params.get("lat"));
  const lng = toFiniteNumber(params.get("lng") ?? params.get("lang"));
  const zoom = toFiniteNumber(params.get("zoom"));

  return {
    center:
      lat !== null && lng !== null
        ? {
            lat: clampNumber(lat, -90, 90),
            lng: clampNumber(lng, -180, 180),
          }
        : defaultCenter,
    zoom:
      zoom !== null
        ? clampNumber(zoom, MIN_SHARED_MAP_ZOOM, MAX_SHARED_MAP_ZOOM)
        : DEFAULT_MAP_ZOOM,
  };
};

const readShareIdFromUrl = () => {
  if (typeof window === "undefined") return null;

  return normalizeShareId(
    new URLSearchParams(window.location.search).get("share"),
  );
};

const buildSeichiMapShareUrl = (shareId: string) => {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set("share", shareId);
  return url.toString();
};

const buildSeichiMapShareApiUrl = (shareId: string) => {
  const params = new URLSearchParams({ shareId });
  return `/api/seichi-map/share?${params.toString()}`;
};

const syncMapViewportToUrl = (
  map: any,
  options?: { keepViewport?: boolean },
) => {
  if (typeof window === "undefined") return;

  if (options?.keepViewport === false) {
    const params = new URLSearchParams(window.location.search);
    params.delete("lat");
    params.delete("lng");
    params.delete("lang");
    params.delete("zoom");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${
      window.location.hash
    }`;

    if (
      nextUrl !==
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    ) {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
    return;
  }

  const center = map.getCenter?.();
  const zoom = map.getZoom?.();
  if (!center || typeof zoom !== "number") return;

  const lat = typeof center.lat === "function" ? center.lat() : center.lat;
  const lng = typeof center.lng === "function" ? center.lng() : center.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const params = new URLSearchParams(window.location.search);
  params.set("lat", formatUrlNumber(lat, 6));
  params.set("lng", formatUrlNumber(lng, 6));
  params.delete("lang");
  params.set("zoom", formatUrlNumber(zoom, 2));

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${
    window.location.hash
  }`;

  if (
    nextUrl !==
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  ) {
    window.history.replaceState(window.history.state, "", nextUrl);
  }
};

export default function SeichiMapCompleteClient({
  initialShareId,
  isSignedIn,
  userName,
}: Props) {
  const t = useTranslations("SeichiMapComplete");
  const locale = useLocale();
  const htmlLocale = locale.replace("_", "-");
  const mapsLanguage = locale === "ja" ? "ja" : "en";
  const datePickerLocale = locale === "ja" ? "ja" : "en";
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const mapOverlayRef = useRef<CanvasOverlayHandle | null>(null);
  const mapClickListenerRef = useRef<any>(null);
  const mapMouseMoveListenerRef = useRef<any>(null);
  const mapIdleListenerRef = useRef<any>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const isMapDraggingRef = useRef(false);
  const infoWindowRef = useRef<any>(null);
  const isLocationVisitedRef = useRef<(location: LocationOption) => boolean>(
    () => false,
  );
  const isSharedViewRef = useRef(false);
  const openLocationInfoWindowRef = useRef<(location: LocationOption) => void>(
    () => undefined,
  );
  const selectedLocationIdRef = useRef<string | null>(null);

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [visited, setVisited] = useState<VisitedItem[]>([]);
  const [archiveVideoMetaById, setArchiveVideoMetaById] = useState<
    Record<string, ArchiveVideoMeta>
  >({});
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [selectedVisitedId, setSelectedVisitedId] = useState<string | null>(
    null,
  );
  const [hoveredLocation, setHoveredLocation] =
    useState<HoveredLocation | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [visitedSearchQuery, setVisitedSearchQuery] = useState("");
  const [visibleVisitedCount, setVisibleVisitedCount] =
    useState(VISITED_PAGE_SIZE);
  const [hiddenLayerNames, setHiddenLayerNames] = useState<string[]>(() =>
    readHiddenLayerNames(),
  );
  const serverShareId = normalizeShareId(initialShareId);
  const [viewShareId, setViewShareId] = useState<string | null>(serverShareId);
  const [sharedViewInfo, setSharedViewInfo] = useState<ShareInfo | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [shareNickname, setShareNickname] = useState(userName);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [visitedDate, setVisitedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [lastVisitedDate, setLastVisitedDate] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [visitUrl, setVisitUrl] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLayerSelectorOpen, setIsLayerSelectorOpen] = useState(false);
  const [listMode, setListMode] = useState<"locations" | "visited">(
    "locations",
  );

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const mapsMapId =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || DEFAULT_GOOGLE_MAPS_MAP_ID;
  const effectiveShareId = viewShareId ?? serverShareId;
  const isSharedView = Boolean(effectiveShareId);
  const canEditVisits = isSignedIn && !isSharedView;
  const canViewVisitedList = canEditVisits || isSharedView;
  const sharedViewNickname = sharedViewInfo?.nickname ?? t("share.loadingUser");
  const pageTitle = isSharedView
    ? t("share.sharedTitle", { nickname: sharedViewNickname })
    : t("title");
  const pageDescription = isSharedView
    ? t("share.sharedDescription")
    : t("description");
  const progressTitle = isSharedView
    ? t("progress.sharedTitle", { nickname: sharedViewNickname })
    : t("progress.title");
  const recordedListTitle = isSharedView
    ? t("list.sharedRecordedTitle", { nickname: sharedViewNickname })
    : t("list.recordedTitle");
  const uncategorizedLayerName = t("list.uncategorized");

  useEffect(() => {
    try {
      window.localStorage.setItem(
        HIDDEN_LAYERS_STORAGE_KEY,
        JSON.stringify(hiddenLayerNames),
      );
    } catch {
      // localStorage may be unavailable in private browsing contexts.
    }
  }, [hiddenLayerNames]);

  useEffect(() => {
    isSharedViewRef.current = isSharedView;
  }, [isSharedView]);

  useEffect(() => {
    if (!isSharedView) {
      setSharedViewInfo(null);
    }
  }, [isSharedView]);

  useLayoutEffect(() => {
    const nextShareId = readShareIdFromUrl() ?? serverShareId;
    setViewShareId((current) =>
      current === nextShareId ? current : nextShareId,
    );
  }, [serverShareId]);

  useLayoutEffect(() => {
    const syncShareIdFromUrl = () => {
      const nextShareId = readShareIdFromUrl() ?? serverShareId;
      setViewShareId((current) =>
        current === nextShareId ? current : nextShareId,
      );
    };

    syncShareIdFromUrl();
    window.addEventListener("popstate", syncShareIdFromUrl);
    return () => {
      window.removeEventListener("popstate", syncShareIdFromUrl);
    };
  }, [serverShareId]);

  const visitedByLocationId = useMemo(() => {
    const map = new Map<string, VisitedItem>();
    visited.forEach((item) => {
      if (item.locationId) {
        map.set(item.locationId, item);
      }
    });
    return map;
  }, [visited]);

  const visitedByLocationName = useMemo(() => {
    const map = new Map<string, VisitedItem>();
    visited.forEach((item) => {
      if (item.locationName) {
        map.set(item.locationName, item);
      }
    });
    return map;
  }, [visited]);

  const getVisitedItemForLocation = useCallback(
    (location: LocationOption) => {
      return (
        visitedByLocationId.get(location.id) ??
        visitedByLocationName.get(location.name)
      );
    },
    [visitedByLocationId, visitedByLocationName],
  );

  const isLocationVisited = useCallback(
    (location: LocationOption) => {
      return Boolean(getVisitedItemForLocation(location));
    },
    [getVisitedItemForLocation],
  );

  const locationById = useMemo(() => {
    const map = new Map<string, LocationOption>();
    locations.forEach((location) => {
      map.set(location.id, location);
    });
    return map;
  }, [locations]);

  const locationByName = useMemo(() => {
    const map = new Map<string, LocationOption>();
    locations.forEach((location) => {
      map.set(location.name, location);
    });
    return map;
  }, [locations]);

  const layerNames = useMemo(() => {
    return Array.from(
      new Set(
        locations.map((location) =>
          getLocationLayerName(location, uncategorizedLayerName),
        ),
      ),
    ).sort((a, b) => a.localeCompare(b, htmlLocale));
  }, [htmlLocale, locations, uncategorizedLayerName]);

  const hiddenLayerNameSet = useMemo(
    () => new Set(hiddenLayerNames),
    [hiddenLayerNames],
  );

  const hiddenVisibleLayerCount = useMemo(() => {
    return layerNames.filter((layerName) => hiddenLayerNameSet.has(layerName))
      .length;
  }, [hiddenLayerNameSet, layerNames]);

  const visibleLocations = useMemo(() => {
    if (hiddenLayerNameSet.size === 0) return locations;

    return locations.filter(
      (location) =>
        !hiddenLayerNameSet.has(
          getLocationLayerName(location, uncategorizedLayerName),
        ),
    );
  }, [hiddenLayerNameSet, locations, uncategorizedLayerName]);

  const completion = useMemo(() => {
    if (visibleLocations.length === 0) {
      return { total: 0, done: 0, percent: 0 };
    }

    const done = visibleLocations.filter(isLocationVisited).length;
    return {
      total: visibleLocations.length,
      done,
      percent: roundCompletionPercent(done, visibleLocations.length),
    };
  }, [isLocationVisited, visibleLocations]);

  const layerStatsByName = useMemo(() => {
    const stats = new Map<string, LayerCompletion>();
    for (const location of locations) {
      const layerName = getLocationLayerName(location, uncategorizedLayerName);
      const layerStats = stats.get(layerName) ?? {
        total: 0,
        done: 0,
        percent: 0,
      };
      layerStats.total += 1;
      if (isLocationVisited(location)) {
        layerStats.done += 1;
      }
      stats.set(layerName, layerStats);
    }

    for (const layerStats of stats.values()) {
      layerStats.percent = roundCompletionPercent(
        layerStats.done,
        layerStats.total,
      );
    }

    return stats;
  }, [isLocationVisited, locations, uncategorizedLayerName]);

  const toggleLayerVisibility = useCallback((layerName: string) => {
    setHiddenLayerNames((current) => {
      if (current.includes(layerName)) {
        return current.filter((item) => item !== layerName);
      }
      return [...current, layerName];
    });
  }, []);

  const showAllLayers = useCallback(() => {
    setHiddenLayerNames([]);
  }, []);

  const hideAllLayers = useCallback(() => {
    setHiddenLayerNames(layerNames);
  }, [layerNames]);

  const filteredLocations = useMemo(() => {
    const query = normalizeSearchText(locationSearchQuery.trim());
    if (!query) return visibleLocations;

    return visibleLocations.filter((item) => {
      return normalizeSearchText(
        `${item.name} ${item.folder} ${stripHtmlToLines(item.description)}`,
      ).includes(query);
    });
  }, [locationSearchQuery, visibleLocations]);

  const groupedLocations = useMemo(() => {
    const groups: Record<string, LocationOption[]> = {};
    for (const location of filteredLocations) {
      const folder = getLocationLayerName(location, uncategorizedLayerName);
      groups[folder] ??= [];
      groups[folder].push(location);
    }
    Object.values(groups).forEach((items) => {
      items.sort((a, b) => a.name.localeCompare(b.name, htmlLocale));
    });
    return groups;
  }, [filteredLocations, htmlLocale, uncategorizedLayerName]);

  const filteredVisited = useMemo(() => {
    const query = normalizeSearchText(visitedSearchQuery.trim());
    const layerFilteredVisited =
      hiddenLayerNameSet.size === 0
        ? visited
        : visited.filter((item) => {
            const location =
              locationById.get(item.locationId) ??
              locationByName.get(item.locationName);
            if (!location) return true;
            return !hiddenLayerNameSet.has(
              getLocationLayerName(location, uncategorizedLayerName),
            );
          });

    if (!query) return layerFilteredVisited;

    return layerFilteredVisited.filter((item) => {
      const localizedDate = item.visitedAt
        ? new Date(item.visitedAt).toLocaleDateString(htmlLocale)
        : "";
      return normalizeSearchText(
        `${item.locationName} ${item.note} ${item.url} ${item.visitedAt.slice(0, 10)} ${localizedDate}`,
      ).includes(query);
    });
  }, [
    hiddenLayerNameSet,
    htmlLocale,
    locationById,
    locationByName,
    uncategorizedLayerName,
    visited,
    visitedSearchQuery,
  ]);

  const visibleVisited = useMemo(() => {
    return filteredVisited.slice(0, visibleVisitedCount);
  }, [filteredVisited, visibleVisitedCount]);

  const selectedLocation = useMemo(() => {
    return locations.find((location) => location.id === selectedLocationId);
  }, [locations, selectedLocationId]);

  const clearHoveredLocationPreview = useCallback(() => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const resetForm = useCallback(() => {
    setSelectedVisitedId(null);
    setSelectedLocationId(null);
    setVisitedDate(new Date().toISOString().slice(0, 10));
    setNote("");
    setVisitUrl("");
  }, []);

  useEffect(() => {
    try {
      const storedDate = window.sessionStorage.getItem(
        LAST_VISITED_DATE_STORAGE_KEY,
      );
      if (storedDate && isDateInputValue(storedDate)) {
        setLastVisitedDate(storedDate);
      }
    } catch {
      setLastVisitedDate(null);
    }
  }, []);

  useEffect(() => {
    setShareNickname((current) => current || userName);
  }, [userName]);

  useEffect(() => {
    if (!shareInfo) {
      setShareUrl("");
      return;
    }
    setShareUrl(buildSeichiMapShareUrl(shareInfo.shareId));
  }, [shareInfo]);

  const loadShareInfo = useCallback(async () => {
    if (!isSignedIn || isSharedView) {
      setShareInfo(null);
      return;
    }

    try {
      const response = await fetch("/api/seichi-map/share", {
        cache: "no-store",
      });
      if (!response.ok) return;

      const payload = (await response.json().catch(() => ({}))) as {
        item?: ShareInfo | null;
      };
      setShareInfo(payload.item ?? null);
      if (payload.item?.nickname) {
        setShareNickname(payload.item.nickname);
      }
    } catch (error) {
      console.error(error);
    }
  }, [isSharedView, isSignedIn]);

  useEffect(() => {
    void loadShareInfo();
  }, [loadShareInfo]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const locationsRequest = fetch("/api/seichi-map/locations", {
        cache: "no-store",
      });
      const archivesRequest = fetch("/api/archives").catch(() => null);
      const visitedRequest = effectiveShareId
        ? fetch(buildSeichiMapShareApiUrl(effectiveShareId), {
            cache: "no-store",
          })
        : isSignedIn
          ? fetch("/api/seichi-map/visited", { cache: "no-store" })
          : Promise.resolve(null);

      const [locationsResponse, archivesResponse, visitedResponse] =
        await Promise.all([locationsRequest, archivesRequest, visitedRequest]);

      if (!locationsResponse.ok) {
        throw new Error(t("errors.locationsFetchFailed"));
      }

      const locationItems =
        (await locationsResponse.json()) as SeichiMapLocation[];
      let visitedItems: VisitedItem[] = [];
      let archiveVideoMeta: Record<string, ArchiveVideoMeta> = {};
      let nextSharedViewInfo: ShareInfo | null = null;
      let visitedLoadError: string | null = null;

      if (visitedResponse) {
        if (!visitedResponse.ok) {
          const fallbackMessage = effectiveShareId
            ? t("errors.sharedVisitedFetchFailed")
            : t("errors.visitedFetchFailed");
          const payload = (await visitedResponse
            .clone()
            .json()
            .catch(async () => {
              const text = await visitedResponse.text().catch(() => "");
              return { error: text.trim() };
            })) as {
            error?: string;
          };
          visitedLoadError = payload.error || fallbackMessage;
        } else {
          const visitedData = (await visitedResponse.json()) as {
            share?: ShareInfo;
            items?: VisitedItem[];
          };
          visitedItems = visitedData.items ?? [];
          nextSharedViewInfo = visitedData.share ?? null;
        }
      }

      if (archivesResponse?.ok) {
        const archivesData = (await archivesResponse
          .json()
          .catch(() => [])) as Partial<ArchiveItem>[];
        archiveVideoMeta = archivesData.reduce<
          Record<string, ArchiveVideoMeta>
        >((map, item) => {
          const videoId = item.video_id?.trim();
          if (!videoId || !item.title) return map;
          map[videoId] = {
            title: item.title,
            thumbnailUrl: getYouTubeThumbnailUrl(videoId),
            streamDateLabel: formatArchiveStreamDateLabel(
              item.stream_started_at || item.published_at,
            ),
          };
          return map;
        }, {});
      }

      const missingYouTubeVideoIds = extractYouTubeVideoIdsFromLocations(
        locationItems,
      ).filter((videoId) => !archiveVideoMeta[videoId]);
      if (missingYouTubeVideoIds.length > 0) {
        const ytInfoResponse = await fetch(
          `/api/yt/info?videoIds=${encodeURIComponent(
            missingYouTubeVideoIds.join(","),
          )}`,
        ).catch(() => null);
        if (ytInfoResponse?.ok) {
          const ytInfoItems = (await ytInfoResponse.json().catch(() => [])) as
            YouTubeVideoInfo[] | null;
          ytInfoItems?.forEach((item) => {
            const videoId = item.videoId?.trim();
            const title = item.title?.trim();
            if (!videoId || !title || archiveVideoMeta[videoId]) return;
            archiveVideoMeta[videoId] = {
              title,
              thumbnailUrl:
                item.thumbnailUrl?.trim() || getYouTubeThumbnailUrl(videoId),
              streamDateLabel: null,
            };
          });
        }
      }

      setLocations(
        locationItems.map((item) => ({
          ...item,
          key: item.id,
        })),
      );
      setVisited(visitedItems);
      setSharedViewInfo(nextSharedViewInfo);
      setArchiveVideoMetaById(archiveVideoMeta);
      if (visitedLoadError) {
        setErrorMessage(visitedLoadError);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : t("errors.dataLoadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [effectiveShareId, isSignedIn, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setVisibleVisitedCount(VISITED_PAGE_SIZE);
  }, [visitedSearchQuery]);

  useEffect(() => {
    if (!mapsKey || !mapElementRef.current) {
      setMapLoading(false);
      return;
    }

    let cancelled = false;
    setMapLoading(true);
    loadGoogleMapsScript(mapsKey, mapsLanguage)
      .then((libraries) => {
        if (cancelled || !mapElementRef.current) {
          return;
        }
        if (!mapRef.current) {
          const { Map, InfoWindow } = libraries.maps;
          const initialViewport = readSharedMapViewport();
          mapRef.current = new Map(mapElementRef.current, {
            center: initialViewport.center,
            zoom: initialViewport.zoom,
            mapId: mapsMapId,
            mapTypeControl: false,
            clickableIcons: false,
            fullscreenControl: true,
            streetViewControl: false,
          });
          infoWindowRef.current = new InfoWindow();
          mapOverlayRef.current = createSeichiCanvasOverlay({
            coreApi: libraries.core,
            mapsApi: libraries.maps,
            map: mapRef.current,
            isVisited: (location) => isLocationVisitedRef.current(location),
            getSelectedLocationId: () => selectedLocationIdRef.current,
          });
          mapClickListenerRef.current = mapRef.current.addListener(
            "click",
            (event: any) => {
              if (!event.latLng) return;
              const location = mapOverlayRef.current?.findLocationAtLatLng(
                event.latLng,
              );
              if (location) {
                event.stop?.();
                openLocationInfoWindowRef.current(location);
              }
            },
          );
          mapRef.current.addListener("mousedown", () => {
            isMapDraggingRef.current = true;
            clearHoveredLocationPreview();
            setHoveredLocation(null);
          });
          mapRef.current.addListener("dragstart", () => {
            isMapDraggingRef.current = true;
            clearHoveredLocationPreview();
            setHoveredLocation(null);
          });
          mapRef.current.addListener("mouseup", () => {
            isMapDraggingRef.current = false;
          });
          mapRef.current.addListener("dragend", () => {
            isMapDraggingRef.current = false;
          });
          mapMouseMoveListenerRef.current = mapRef.current.addListener(
            "mousemove",
            (event: any) => {
              const mapElement = mapElementRef.current;
              const mouseEvent = event.domEvent as MouseEvent | undefined;
              clearHoveredLocationPreview();

              if (isMapDraggingRef.current) {
                setHoveredLocation(null);
                return;
              }

              if (!event.latLng || !mapElement || !mouseEvent) {
                setHoveredLocation(null);
                return;
              }

              const location = mapOverlayRef.current?.findLocationAtLatLng(
                event.latLng,
              );

              if (!location) {
                setHoveredLocation(null);
                return;
              }

              const mapRect = mapElement.getBoundingClientRect();
              hoverTimerRef.current = window.setTimeout(() => {
                setHoveredLocation({
                  name: location.name,
                  x: mouseEvent.clientX - mapRect.left,
                  y: mouseEvent.clientY - mapRect.top,
                });
              }, 300);
            },
          );
          mapIdleListenerRef.current = mapRef.current.addListener(
            "idle",
            () => {
              clearHoveredLocationPreview();
              setHoveredLocation(null);
              syncMapViewportToUrl(mapRef.current, {
                keepViewport: !isSharedViewRef.current,
              });
            },
          );
        }
        setMapReady(true);
      })
      .catch((error) => {
        console.error(error);
        setErrorMessage(t("errors.googleMapsLoadFailed"));
      })
      .finally(() => {
        if (!cancelled) setMapLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mapsKey, mapsLanguage, mapsMapId, t]);

  useEffect(() => {
    const mapElement = mapElementRef.current;
    if (!mapElement) return;

    const clearHoveredLocation = () => {
      clearHoveredLocationPreview();
      setHoveredLocation(null);
    };

    mapElement.addEventListener("mouseleave", clearHoveredLocation);
    return () => {
      mapElement.removeEventListener("mouseleave", clearHoveredLocation);
    };
  }, [clearHoveredLocationPreview]);

  useEffect(() => {
    return () => {
      clearHoveredLocationPreview();
      mapIdleListenerRef.current?.remove?.();
      mapMouseMoveListenerRef.current?.remove?.();
      mapClickListenerRef.current?.remove?.();
      infoWindowRef.current?.close?.();
      mapOverlayRef.current?.setMap(null);
      mapOverlayRef.current = null;
      mapRef.current = null;
    };
  }, [clearHoveredLocationPreview]);

  const openRecordModal = useCallback(
    (location: LocationOption, visitedItem?: VisitedItem) => {
      setSelectedLocationId(location.id);
      setSelectedVisitedId(visitedItem?.id ?? null);
      setVisitedDate(toVisitedDateInput(visitedItem?.visitedAt ?? ""));
      setNote(visitedItem?.note ?? "");
      setVisitUrl(visitedItem?.url ?? "");
      setShowModal(true);
    },
    [],
  );

  const deleteVisited = useCallback(
    async (visitedId: string) => {
      if (!confirm(t("confirm.deleteVisited"))) {
        return;
      }

      try {
        const response = await fetch(
          `/api/seichi-map/visited?id=${encodeURIComponent(visitedId)}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error || t("errors.deleteFailed"));
        }
        setVisited((current) =>
          current.filter((item) => item.id !== visitedId),
        );
        infoWindowRef.current?.close?.();
        mapOverlayRef.current?.draw();
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error ? error.message : t("errors.deleteFailed"),
        );
      }
    },
    [t],
  );

  const createInfoWindowContent = useCallback(
    (location: LocationOption, visitedItemOverride?: VisitedItem) => {
      const visitedItem =
        visitedItemOverride ?? getVisitedItemForLocation(location);
      const youtubeReferences = extractYouTubeReferences(location.description);
      const displayDescription = getDescriptionWithoutYouTubeLinks(
        location.description,
      );
      const content = document.createElement("div");
      content.style.color = "#212529";
      content.style.fontFamily =
        "var(--mantine-font-family, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)";
      content.style.fontSize = "13px";
      content.style.fontWeight = "500";
      content.style.lineHeight = "1.55";
      content.style.maxWidth = "350px";
      content.style.minWidth = "280px";
      content.style.padding = "2px 2px 4px";

      const title = document.createElement("strong");
      title.style.color = "#1a1b1e";
      title.style.display = "block";
      title.style.fontSize = "15px";
      title.style.fontWeight = "700";
      title.style.lineHeight = "1.45";
      title.textContent = location.name;
      content.appendChild(title);

      const folder = document.createElement("div");
      folder.textContent = location.folder;
      folder.style.marginTop = "4px";
      folder.style.fontSize = "12px";
      folder.style.fontWeight = "600";
      folder.style.color = "#868e96";
      content.appendChild(folder);

      if (visitedItem) {
        const visitedDateLabel = formatVisitedDateLabel(visitedItem.visitedAt);
        const visitedStatus = document.createElement("div");
        visitedStatus.style.borderTop = "1px solid #e9ecef";
        visitedStatus.style.color = "#c2255c";
        visitedStatus.style.fontSize = "13px";
        visitedStatus.style.fontWeight = "700";
        visitedStatus.style.marginTop = "10px";
        visitedStatus.style.paddingTop = "8px";
        visitedStatus.textContent = visitedDateLabel
          ? t("popup.visitedAt", { date: visitedDateLabel })
          : t("popup.visited");
        content.appendChild(visitedStatus);
      }

      if (displayDescription) {
        const description = document.createElement("div");
        description.style.marginTop = "10px";
        description.style.fontSize = "13px";
        description.style.fontWeight = "500";
        description.style.lineHeight = "1.55";
        description.style.whiteSpace = "normal";
        appendLinkedText(description, displayDescription);
        content.appendChild(description);
      }

      youtubeReferences.forEach((reference) => {
        const meta = archiveVideoMetaById[reference.videoId];
        const card = document.createElement("a");
        card.href = reference.href;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        card.style.alignItems = "stretch";
        card.style.background = "#f8f9fa";
        card.style.border = "1px solid #e9ecef";
        card.style.borderRadius = "8px";
        card.style.color = "inherit";
        card.style.display = "block";
        card.style.marginTop = "12px";
        card.style.overflow = "hidden";
        card.style.padding = "0";
        card.style.textDecoration = "none";

        const thumbnailWrap = document.createElement("div");
        thumbnailWrap.style.aspectRatio = "16 / 9";
        thumbnailWrap.style.background = "#111";
        thumbnailWrap.style.overflow = "hidden";
        thumbnailWrap.style.position = "relative";

        const thumbnail = document.createElement("img");
        thumbnail.src =
          meta?.thumbnailUrl ?? getYouTubeThumbnailUrl(reference.videoId);
        thumbnail.alt = meta?.title ?? t("popup.youtubeThumbnailAlt");
        thumbnail.loading = "lazy";
        thumbnail.decoding = "async";
        thumbnail.style.display = "block";
        thumbnail.style.height = "100%";
        thumbnail.style.objectFit = "cover";
        thumbnail.style.width = "100%";
        thumbnailWrap.appendChild(thumbnail);

        if (reference.timestampLabel) {
          const timeBadge = document.createElement("span");
          timeBadge.textContent = reference.timestampLabel;
          timeBadge.style.background = "rgba(0, 0, 0, 0.78)";
          timeBadge.style.borderRadius = "4px";
          timeBadge.style.bottom = "4px";
          timeBadge.style.color = "#fff";
          timeBadge.style.fontSize = "11px";
          timeBadge.style.fontWeight = "700";
          timeBadge.style.lineHeight = "1";
          timeBadge.style.padding = "3px 5px";
          timeBadge.style.position = "absolute";
          timeBadge.style.right = "4px";
          thumbnailWrap.appendChild(timeBadge);
        }

        const cardBody = document.createElement("div");
        cardBody.style.display = "flex";
        cardBody.style.flexDirection = "column";
        cardBody.style.gap = "5px";
        cardBody.style.minWidth = "0";
        cardBody.style.padding = "8px 10px 10px";

        const videoLabel = document.createElement("div");
        videoLabel.textContent = t("popup.youtube");
        videoLabel.style.color = "#d63384";
        videoLabel.style.fontSize = "11px";
        videoLabel.style.fontWeight = "700";
        videoLabel.style.letterSpacing = "0";
        cardBody.appendChild(videoLabel);

        const videoTitle = document.createElement("div");
        videoTitle.textContent = meta?.title ?? t("popup.youtubeVideo");
        videoTitle.style.color = "#212529";
        videoTitle.style.display = "-webkit-box";
        videoTitle.style.fontSize = "13.5px";
        videoTitle.style.fontWeight = "700";
        videoTitle.style.lineHeight = "1.4";
        videoTitle.style.overflow = "hidden";
        videoTitle.style.setProperty("-webkit-box-orient", "vertical");
        videoTitle.style.setProperty("-webkit-line-clamp", "2");
        cardBody.appendChild(videoTitle);

        if (meta?.streamDateLabel) {
          const streamDate = document.createElement("div");
          streamDate.textContent = t("popup.streamedAt", {
            date: meta.streamDateLabel,
          });
          streamDate.style.color = "#868e96";
          streamDate.style.fontSize = "12px";
          streamDate.style.fontWeight = "700";
          cardBody.appendChild(streamDate);
        }

        if (reference.timestampLabel) {
          const timestamp = document.createElement("div");
          timestamp.textContent = t("popup.playFrom", {
            timestamp: reference.timestampLabel,
          });
          timestamp.style.color = "#495057";
          timestamp.style.fontSize = "12px";
          timestamp.style.fontWeight = "600";
          cardBody.appendChild(timestamp);
        }

        card.appendChild(thumbnailWrap);
        card.appendChild(cardBody);
        content.appendChild(card);
      });

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.flexWrap = "wrap";
      actions.style.gap = "8px";
      actions.style.marginTop = "14px";

      const mapsLink = document.createElement("a");
      mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${location.latitude},${location.longitude}`,
      )}`;
      mapsLink.target = "_blank";
      mapsLink.rel = "noopener noreferrer";
      mapsLink.textContent = t("popup.googleMaps");
      styleInfoWindowButton(mapsLink, "outline");
      actions.appendChild(mapsLink);

      if (!isSharedView) {
        const recordButton = document.createElement("button");
        recordButton.type = "button";
        recordButton.textContent = visitedItem
          ? t("popup.editVisit")
          : t("popup.recordVisit");
        recordButton.style.cursor = "pointer";
        styleInfoWindowButton(recordButton, visitedItem ? "light" : "filled");
        recordButton.addEventListener("click", () => {
          if (!isSignedIn) {
            void signIn("google", { callbackUrl: "/seichi-map" });
            return;
          }

          openRecordModal(location, visitedItem);
        });
        actions.appendChild(recordButton);
      }

      if (canEditVisits && visitedItem) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = t("popup.deleteVisited");
        deleteButton.style.cursor = "pointer";
        styleInfoWindowButton(deleteButton, "outline");
        deleteButton.style.color = "#e03131";
        deleteButton.addEventListener("click", () => {
          void deleteVisited(visitedItem.id);
        });
        actions.appendChild(deleteButton);
      }

      content.appendChild(actions);
      return content;
    },
    [
      archiveVideoMetaById,
      canEditVisits,
      deleteVisited,
      getVisitedItemForLocation,
      isSignedIn,
      isSharedView,
      openRecordModal,
      t,
    ],
  );

  const openLocationInfoWindow = useCallback(
    (location: LocationOption) => {
      const map = mapRef.current;
      if (!map) return;

      setSelectedLocationId(location.id);
      infoWindowRef.current?.setContent(createInfoWindowContent(location));
      infoWindowRef.current?.setPosition({
        lat: location.latitude,
        lng: location.longitude,
      });
      infoWindowRef.current?.open({ map });
    },
    [createInfoWindowContent],
  );

  useEffect(() => {
    openLocationInfoWindowRef.current = openLocationInfoWindow;
  }, [openLocationInfoWindow]);

  useEffect(() => {
    isLocationVisitedRef.current = isLocationVisited;
    mapOverlayRef.current?.draw();
  }, [isLocationVisited]);

  useEffect(() => {
    selectedLocationIdRef.current = selectedLocationId;
    mapOverlayRef.current?.setSelectedLocationId(selectedLocationId);
  }, [selectedLocationId]);

  useEffect(() => {
    if (!mapReady) return;
    mapOverlayRef.current?.setLocations(visibleLocations);
  }, [mapReady, visibleLocations]);

  useEffect(() => {
    if (!selectedLocation) return;
    if (
      hiddenLayerNameSet.has(
        getLocationLayerName(selectedLocation, uncategorizedLayerName),
      )
    ) {
      setSelectedLocationId(null);
      infoWindowRef.current?.close();
      setHoveredLocation(null);
    }
  }, [hiddenLayerNameSet, selectedLocation, uncategorizedLayerName]);

  const showLocationOnMap = useCallback(
    (location: LocationOption) => {
      const map = mapRef.current;
      if (!map) return;

      setSelectedLocationId(location.id);
      map.panTo({ lat: location.latitude, lng: location.longitude });
      map.setZoom(Math.max(map.getZoom() ?? DEFAULT_MAP_ZOOM, 12));
      openLocationInfoWindow(location);
    },
    [openLocationInfoWindow],
  );

  const onEditVisited = useCallback(
    (item: VisitedItem) => {
      const location =
        locationById.get(item.locationId) ??
        locationByName.get(item.locationName);
      if (!location) return;
      showLocationOnMap(location);
      openRecordModal(location, item);
    },
    [locationById, locationByName, openRecordModal, showLocationOnMap],
  );

  const showVisitedItemOnMap = useCallback(
    (item: VisitedItem) => {
      const location =
        locationById.get(item.locationId) ??
        locationByName.get(item.locationName);
      if (!location) return;
      showLocationOnMap(location);
    },
    [locationById, locationByName, showLocationOnMap],
  );

  const onVisitedItemClick = useCallback(
    (item: VisitedItem) => {
      if (canEditVisits) {
        onEditVisited(item);
        return;
      }
      showVisitedItemOnMap(item);
    },
    [canEditVisits, onEditVisited, showVisitedItemOnMap],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEditVisits) {
      await signIn("google", { callbackUrl: "/seichi-map" });
      return;
    }
    if (!selectedLocation) {
      setErrorMessage(t("errors.locationNotSelected"));
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/seichi-map/visited", {
        method: selectedVisitedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(selectedVisitedId ? { id: selectedVisitedId } : {}),
          locationId: selectedLocation.id,
          locationName: selectedLocation.name,
          visitedAt: `${visitedDate}T00:00:00.000Z`,
          note,
          url: visitUrl,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          payload.error ||
            (selectedVisitedId
              ? t("errors.updateFailed")
              : t("errors.saveFailed")),
        );
      }

      const payload = (await response.json().catch(() => ({}))) as {
        item?: VisitedItem;
      };
      if (isDateInputValue(visitedDate)) {
        try {
          window.sessionStorage.setItem(
            LAST_VISITED_DATE_STORAGE_KEY,
            visitedDate,
          );
        } catch {
          // sessionStorage may be unavailable in private browsing contexts.
        }
        setLastVisitedDate(visitedDate);
      }
      const savedItem = payload.item;
      if (savedItem) {
        setVisited((current) => {
          const nextItems = current.filter((item) => {
            if (item.id === savedItem.id) return false;
            if (
              savedItem.locationId &&
              item.locationId === savedItem.locationId
            ) {
              return false;
            }
            return !(
              !savedItem.locationId &&
              !item.locationId &&
              item.locationName === savedItem.locationName
            );
          });
          return [savedItem, ...nextItems].sort((a, b) =>
            a.visitedAt < b.visitedAt ? 1 : -1,
          );
        });
        infoWindowRef.current?.setContent(
          createInfoWindowContent(selectedLocation, savedItem),
        );
        mapOverlayRef.current?.draw();
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : t("errors.submitFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openShareModal = useCallback(() => {
    setShareNickname(shareInfo?.nickname || userName);
    setShareUrl(shareInfo ? buildSeichiMapShareUrl(shareInfo.shareId) : "");
    setShareCopied(false);
    setShowShareModal(true);
  }, [shareInfo, userName]);

  const saveShareSettings = useCallback(async () => {
    const nickname = shareNickname.trim();
    if (!nickname) {
      setErrorMessage(t("errors.shareNicknameRequired"));
      return;
    }

    setShareSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/seichi-map/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error || t("errors.shareSaveFailed"));
      }

      const payload = (await response.json().catch(() => ({}))) as {
        item?: ShareInfo;
      };
      if (!payload.item) {
        throw new Error(t("errors.shareSaveFailed"));
      }

      setShareInfo(payload.item);
      setShareUrl(buildSeichiMapShareUrl(payload.item.shareId));
      setShareCopied(false);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : t("errors.shareSaveFailed"),
      );
    } finally {
      setShareSubmitting(false);
    }
  }, [shareNickname, t]);

  const copyShareUrl = useCallback(async () => {
    if (!shareInfo) return;

    const nextShareUrl = buildSeichiMapShareUrl(shareInfo.shareId);
    setShareUrl(nextShareUrl);
    try {
      await navigator.clipboard.writeText(nextShareUrl);
      setShareCopied(true);
    } catch (error) {
      console.error(error);
      setErrorMessage(t("errors.shareCopyFailed"));
    }
  }, [shareInfo, t]);

  const stopSharing = useCallback(async () => {
    if (!confirm(t("confirm.stopSharing"))) {
      return;
    }

    setShareSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/seichi-map/share", {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error || t("errors.shareDeleteFailed"));
      }
      setShareInfo(null);
      setShareUrl("");
      setShareCopied(false);
      setShowShareModal(false);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : t("errors.shareDeleteFailed"),
      );
    } finally {
      setShareSubmitting(false);
    }
  }, [t]);

  return (
    <main className={pageClasses.shellFlushBottom}>
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="mr-1.5 h-4 w-4" /> HOME
        </Link>
        <Link href="/seichi-map" className={breadcrumbClasses.link}>
          {t("breadcrumb")}
        </Link>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-start" gap="md" mb="md">
        <Box>
          <h1 className={pageClasses.heading}>{pageTitle}</h1>
          <p className={pageClasses.description}>{pageDescription}</p>
          <Text size="sm" c="dimmed" mt={-16} mb="md">
            {t("credit.prefix")}
            <Anchor
              href="https://note.com/yspione/n/nccf2fbbdc0dc"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("credit.linkLabel")}
            </Anchor>
            {t("credit.suffix")}
          </Text>
        </Box>
        <Group gap="xs">
          {isSharedView ? null : isSignedIn ? (
            <>
              <Badge variant="light" color="pink" size="lg">
                {userName}
              </Badge>
              <Button
                variant="light"
                color="pink"
                leftSection={<FiShare2 size={16} />}
                onClick={openShareModal}
              >
                {t("share.open")}
              </Button>
              <Tooltip label={t("auth.logoutTooltip")}>
                <Button
                  variant="light"
                  color="gray"
                  leftSection={<FiLogOut size={16} />}
                  onClick={() => void signOut({ callbackUrl: "/seichi-map" })}
                >
                  {t("auth.logout")}
                </Button>
              </Tooltip>
            </>
          ) : (
            <Button
              leftSection={<FiLogIn size={16} />}
              onClick={() =>
                void signIn("google", { callbackUrl: "/seichi-map" })
              }
            >
              {t("auth.loginWithGoogle")}
            </Button>
          )}
        </Group>
      </Group>

      {isSharedView ? (
        <Alert
          mb="md"
          color="pink"
          variant="light"
          icon={<FiShare2 size={16} />}
        >
          <Group justify="space-between" gap="sm" wrap="wrap">
            <Box>
              <Text fw={700}>{t("share.viewMode")}</Text>
              <Text size="sm">
                {t("share.viewing", { nickname: sharedViewNickname })}
              </Text>
            </Box>
            <Button
              component={Link}
              href="/seichi-map"
              variant="white"
              color="pink"
              size="xs"
              leftSection={<FiMapPin size={14} />}
            >
              {t("share.backToMyMap")}
            </Button>
          </Group>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert
          mb="md"
          color="red"
          variant="light"
          icon={<FiAlertCircle size={16} />}
        >
          {errorMessage}
        </Alert>
      ) : null}

      <Grid gap="md" align="stretch">
        <Grid.Col span={{ base: 12, xl: 8 }}>
          <Paper
            withBorder
            radius="md"
            shadow="sm"
            className="relative overflow-hidden bg-white/90 dark:bg-gray-900/80"
            style={{ height: "70vh", minHeight: 460 }}
          >
            <Box ref={mapElementRef} className="h-full w-full" />
            {hoveredLocation ? (
              <Box
                className="pointer-events-none absolute z-2 max-w-65 -translate-x-1/2 -translate-y-full rounded-md bg-gray-900/92 px-2.5 py-1.5 text-xs font-semibold leading-tight text-white shadow-lg"
                style={{
                  left: hoveredLocation.x,
                  top: hoveredLocation.y - 12,
                }}
              >
                {hoveredLocation.name}
              </Box>
            ) : null}
            <Box
              className="pointer-events-none absolute inset-0 bg-white/80 dark:bg-gray-900/70"
              style={{
                display: mapLoading || loading ? "block" : "none",
              }}
            >
              {mapLoading || loading ? (
                <Center h="100%">
                  <Stack align="center" gap="xs">
                    <Loader color="pink" />
                    <Text size="sm" c="dimmed">
                      {t("loading.map")}
                    </Text>
                  </Stack>
                </Center>
              ) : null}
            </Box>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, xl: 4 }}>
          <Paper
            withBorder
            radius="md"
            shadow="sm"
            p="md"
            className="bg-white/90 dark:bg-gray-900/80"
            style={{ height: "70vh", minHeight: 460 }}
          >
            <Stack gap="md" h="100%">
              <Stack gap={4}>
                <Group justify="space-between" align="center">
                  <Title order={2} size="h3">
                    {progressTitle}
                  </Title>
                  <Badge variant="light" color="gray">
                    {completion.done} / {completion.total}
                  </Badge>
                </Group>
                <Progress
                  value={completion.percent}
                  color="pink"
                  radius="xl"
                  size="lg"
                />
                <Text size="xs" c="dimmed">
                  {t("progress.percent", { percent: completion.percent })}
                </Text>
              </Stack>

              {layerNames.length > 0 ? (
                isLayerSelectorOpen ? (
                  <Paper
                    withBorder
                    radius="md"
                    p="xs"
                    className="min-h-0 flex-1 bg-white/70 dark:bg-white/3"
                  >
                    <Stack gap="xs" h="100%" className="min-h-0">
                      <Group justify="space-between" gap="xs" wrap="nowrap">
                        <Text size="sm" fw={700}>
                          {t("layers.summary", {
                            visible:
                              layerNames.length - hiddenVisibleLayerCount,
                            total: layerNames.length,
                          })}
                        </Text>
                        <Button
                          variant="subtle"
                          color="gray"
                          size="compact-xs"
                          rightSection={<FiChevronUp size={14} />}
                          onClick={() => setIsLayerSelectorOpen(false)}
                        >
                          {t("layers.collapse")}
                        </Button>
                      </Group>
                      <Group gap={6}>
                        <Button
                          variant="light"
                          color="gray"
                          size="compact-xs"
                          onClick={showAllLayers}
                        >
                          {t("layers.showAll")}
                        </Button>
                        <Button
                          variant="subtle"
                          color="gray"
                          size="compact-xs"
                          onClick={hideAllLayers}
                        >
                          {t("layers.hideAll")}
                        </Button>
                      </Group>
                      <ScrollArea
                        className="min-h-0 flex-1"
                        h="100%"
                        offsetScrollbars
                        scrollbarSize={6}
                      >
                        <Stack gap={8} pr="xs">
                          {layerNames.map((layerName) => {
                            const layerStats = layerStatsByName.get(
                              layerName,
                            ) ?? {
                              total: 0,
                              done: 0,
                              percent: 0,
                            };
                            return (
                              <Checkbox
                                key={layerName}
                                size="sm"
                                checked={!hiddenLayerNameSet.has(layerName)}
                                onChange={() =>
                                  toggleLayerVisibility(layerName)
                                }
                                label={
                                  <Group
                                    justify="space-between"
                                    gap="xs"
                                    wrap="nowrap"
                                    className="min-w-0"
                                  >
                                    <Text size="sm" fw={600} lineClamp={1}>
                                      {layerName}
                                    </Text>
                                    <Text
                                      size="xs"
                                      c="dimmed"
                                      className="shrink-0"
                                    >
                                      {t("list.layerProgress", {
                                        done: layerStats.done,
                                        total: layerStats.total,
                                        percent: formatCompletionPercent(
                                          layerStats.percent,
                                        ),
                                      })}
                                    </Text>
                                  </Group>
                                }
                              />
                            );
                          })}
                        </Stack>
                      </ScrollArea>
                    </Stack>
                  </Paper>
                ) : (
                  <Button
                    variant="light"
                    color="gray"
                    fullWidth
                    justify="space-between"
                    rightSection={<FiChevronDown size={16} />}
                    aria-expanded={isLayerSelectorOpen}
                    aria-label={t("layers.expand")}
                    onClick={() => setIsLayerSelectorOpen(true)}
                  >
                    {t("layers.summary", {
                      visible: layerNames.length - hiddenVisibleLayerCount,
                      total: layerNames.length,
                    })}
                  </Button>
                )
              ) : null}

              {isLayerSelectorOpen ? null : (
                <SegmentedControl
                  value={listMode}
                  onChange={(value) =>
                    setListMode(value as "locations" | "visited")
                  }
                  data={[
                    { label: t("tabs.locations"), value: "locations" },
                    { label: t("tabs.visited"), value: "visited" },
                  ]}
                  fullWidth
                />
              )}

              {isLayerSelectorOpen ? null : listMode === "locations" ? (
                <>
                  <TextInput
                    label={t("search.locationLabel")}
                    placeholder={t("search.locationPlaceholder")}
                    value={locationSearchQuery}
                    onChange={(event) =>
                      setLocationSearchQuery(event.target.value)
                    }
                    leftSection={<FiSearch size={16} />}
                  />

                  <Paper
                    withBorder
                    radius="md"
                    p="xs"
                    className="min-h-0 flex-1 bg-white/60 dark:bg-gray-950/20"
                  >
                    <ScrollArea h="100%" offsetScrollbars scrollbarSize={6}>
                      <Stack gap="sm">
                        {loading ? (
                          <Center py="xl">
                            <Loader size="sm" color="pink" />
                          </Center>
                        ) : Object.keys(groupedLocations).length === 0 ? (
                          <Text size="sm" c="dimmed" px="xs" py="sm">
                            {t("list.emptyLocations")}
                          </Text>
                        ) : (
                          Object.keys(groupedLocations)
                            .sort((a, b) => a.localeCompare(b, htmlLocale))
                            .map((folder) => (
                              <Paper
                                key={folder}
                                radius="sm"
                                p="xs"
                                className="bg-primary-50/40 dark:bg-white/3"
                              >
                                <Stack gap={6}>
                                  <Group justify="space-between" gap="xs">
                                    <Badge variant="light">{folder}</Badge>
                                    <Text size="xs" c="dimmed">
                                      {t("list.layerProgress", {
                                        done:
                                          layerStatsByName.get(folder)?.done ??
                                          0,
                                        total:
                                          layerStatsByName.get(folder)?.total ??
                                          groupedLocations[folder].length,
                                        percent: formatCompletionPercent(
                                          layerStatsByName.get(folder)
                                            ?.percent ?? 0,
                                        ),
                                      })}
                                    </Text>
                                  </Group>
                                  <Stack gap={1}>
                                    {groupedLocations[folder].map((item) => {
                                      const visitedLocation =
                                        isLocationVisited(item);
                                      return (
                                        <NavLink
                                          key={item.key}
                                          variant="light"
                                          color={
                                            visitedLocation ? "green" : "pink"
                                          }
                                          active={
                                            selectedLocationId === item.id
                                          }
                                          onClick={() =>
                                            showLocationOnMap(item)
                                          }
                                          label={item.name}
                                          description={
                                            item.description ? (
                                              <Text
                                                size="xs"
                                                c="dimmed"
                                                lineClamp={1}
                                              >
                                                {stripHtmlToLines(
                                                  item.description,
                                                )}
                                              </Text>
                                            ) : undefined
                                          }
                                          leftSection={
                                            <ThemeIcon
                                              size={30}
                                              radius="xl"
                                              variant="light"
                                              color={
                                                visitedLocation
                                                  ? "green"
                                                  : "pink"
                                              }
                                            >
                                              <FiMapPin size={14} />
                                            </ThemeIcon>
                                          }
                                          rightSection={
                                            visitedLocation ? (
                                              <Badge
                                                variant="light"
                                                color="green"
                                                size="xs"
                                              >
                                                {t("list.visitedBadge")}
                                              </Badge>
                                            ) : null
                                          }
                                        />
                                      );
                                    })}
                                  </Stack>
                                </Stack>
                              </Paper>
                            ))
                        )}
                      </Stack>
                    </ScrollArea>
                  </Paper>
                </>
              ) : canViewVisitedList ? (
                <Stack gap="sm" className="min-h-0 flex-1">
                  <Group justify="space-between" align="end">
                    <Title order={3} size="h5">
                      {recordedListTitle}
                    </Title>
                    <Badge variant="light" color="gray">
                      {t("list.recordedCount", {
                        visible: visibleVisited.length,
                        total: filteredVisited.length,
                      })}
                    </Badge>
                  </Group>

                  <TextInput
                    placeholder={t("search.visitedPlaceholder")}
                    value={visitedSearchQuery}
                    onChange={(event) =>
                      setVisitedSearchQuery(event.target.value)
                    }
                    leftSection={<FiSearch size={16} />}
                  />

                  {filteredVisited.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      {t("list.emptyVisited")}
                    </Text>
                  ) : (
                    <Stack gap="sm" className="min-h-0 flex-1">
                      <ScrollArea
                        className="min-h-0 flex-1"
                        h="100%"
                        offsetScrollbars
                        scrollbarSize={6}
                      >
                        <Stack gap="sm" pr="xs">
                          {visibleVisited.map((item) => (
                            <UnstyledButton
                              key={item.id}
                              component="div"
                              role="button"
                              tabIndex={0}
                              onClick={() => onVisitedItemClick(item)}
                              style={{ width: "100%", cursor: "pointer" }}
                            >
                              <Paper
                                withBorder
                                radius="md"
                                p="sm"
                                className="bg-white/80 dark:bg-white/3"
                              >
                                <Group
                                  justify="space-between"
                                  align="flex-start"
                                  wrap="nowrap"
                                >
                                  <Stack gap={4} className="min-w-0 flex-1">
                                    <Text fw={600} lineClamp={2}>
                                      {item.locationName}
                                    </Text>
                                    <Group gap={6}>
                                      <FiCalendar size={12} />
                                      <Text size="xs" c="dimmed">
                                        {new Date(
                                          item.visitedAt,
                                        ).toLocaleDateString(htmlLocale)}
                                      </Text>
                                    </Group>
                                  </Stack>
                                  {canEditVisits ? (
                                    <Group gap={4} wrap="nowrap">
                                      <Button
                                        variant="subtle"
                                        color="pink"
                                        size="compact-sm"
                                        aria-label={t("aria.edit")}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          onEditVisited(item);
                                        }}
                                      >
                                        <FiEdit3 size={14} />
                                      </Button>
                                      <Button
                                        variant="subtle"
                                        color="red"
                                        size="compact-sm"
                                        aria-label={t("aria.delete")}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          void deleteVisited(item.id);
                                        }}
                                      >
                                        <FiTrash2 size={14} />
                                      </Button>
                                    </Group>
                                  ) : null}
                                </Group>
                                {item.note ? (
                                  <Text size="sm" mt="xs" lineClamp={3}>
                                    {item.note}
                                  </Text>
                                ) : null}
                                {item.url ? (
                                  <Text
                                    component="a"
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="xs"
                                    c="blue"
                                    mt={6}
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <FiExternalLink className="mr-1 inline" />
                                    {t("list.openPostLink")}
                                  </Text>
                                ) : null}
                              </Paper>
                            </UnstyledButton>
                          ))}
                        </Stack>
                      </ScrollArea>

                      {visibleVisitedCount < filteredVisited.length ? (
                        <Button
                          variant="light"
                          color="gray"
                          fullWidth
                          onClick={() =>
                            setVisibleVisitedCount(
                              (current) => current + VISITED_PAGE_SIZE,
                            )
                          }
                        >
                          {t("list.loadMore", { count: VISITED_PAGE_SIZE })}
                        </Button>
                      ) : null}
                    </Stack>
                  )}
                </Stack>
              ) : (
                <Alert color="pink" variant="light">
                  {t("alerts.loginRequired")}
                </Alert>
              )}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <Modal
        opened={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={t("share.title")}
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            {t("share.description")}
          </Text>
          <TextInput
            label={t("share.nicknameLabel")}
            value={shareNickname}
            onChange={(event) => setShareNickname(event.target.value)}
            maxLength={40}
            required
          />
          {shareInfo ? (
            <TextInput
              label={t("share.urlLabel")}
              value={shareUrl}
              readOnly
              rightSection={
                shareCopied ? (
                  <FiCheck color="var(--mantine-color-green-6)" size={16} />
                ) : null
              }
            />
          ) : null}
          <Group justify="space-between" mt="sm">
            {shareInfo ? (
              <Button
                variant="subtle"
                color="red"
                onClick={() => void stopSharing()}
                loading={shareSubmitting}
              >
                {t("share.stop")}
              </Button>
            ) : (
              <Box />
            )}
            <Group gap="xs">
              {shareInfo ? (
                <Button
                  variant="light"
                  color="gray"
                  leftSection={<FiCopy size={16} />}
                  onClick={() => void copyShareUrl()}
                >
                  {shareCopied ? t("share.copied") : t("share.copy")}
                </Button>
              ) : null}
              <Button
                leftSection={<FiShare2 size={16} />}
                onClick={() => void saveShareSettings()}
                loading={shareSubmitting}
              >
                {shareInfo ? t("share.update") : t("share.publish")}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={
          selectedVisitedId ? t("modal.editTitle") : t("modal.recordTitle")
        }
        centered
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <TextInput
              label={t("modal.locationLabel")}
              value={selectedLocation?.name ?? ""}
              readOnly
            />
            <Group align="end" gap="xs" wrap="nowrap">
              <DatePickerInput
                className="min-w-0 flex-1"
                label={t("modal.visitedDateLabel")}
                value={visitedDate || null}
                valueFormat="YYYY/MM/DD (ddd)"
                locale={datePickerLocale}
                firstDayOfWeek={0}
                leftSection={<FiCalendar size={16} />}
                popoverProps={{ withinPortal: true }}
                onChange={(value) =>
                  setVisitedDate(toLocalDateInputValue(value))
                }
                required
              />
              {lastVisitedDate ? (
                <Button
                  variant="light"
                  color="pink"
                  onClick={() => setVisitedDate(lastVisitedDate)}
                >
                  {t("modal.sameDate")}
                </Button>
              ) : null}
            </Group>
            <Textarea
              label={t("modal.noteLabel")}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              maxLength={500}
            />
            <TextInput
              label={t("modal.urlLabel")}
              placeholder={t("modal.urlPlaceholder")}
              type="url"
              value={visitUrl}
              onChange={(event) =>
                handleVisitUrlChange(
                  event.target.value,
                  visitedDate,
                  setVisitUrl,
                  setVisitedDate,
                )
              }
            />
            <Group justify="flex-end" mt="sm">
              <Button
                variant="outline"
                color="gray"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                {t("modal.cancel")}
              </Button>
              <Button type="submit" loading={submitting}>
                {selectedVisitedId ? t("modal.update") : t("modal.save")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </main>
  );
}

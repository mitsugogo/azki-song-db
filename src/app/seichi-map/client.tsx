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
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import type * as Leaflet from "leaflet";
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Center,
  Checkbox,
  Divider,
  Group,
  Indicator,
  Loader,
  Modal,
  NavLink,
  Paper,
  Pill,
  Progress,
  Radio,
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
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { FaXTwitter } from "react-icons/fa6";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiCircle,
  FiCopy,
  FiEdit3,
  FiExternalLink,
  FiLayers,
  FiLogIn,
  FiMap,
  FiMaximize,
  FiMapPin,
  FiMinimize,
  FiSearch,
  FiShare2,
  FiTrash2,
} from "react-icons/fi";
import { DatePickerInput } from "@mantine/dates";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses, pageClasses } from "../theme";
import type { ArchiveItem } from "../types/archiveItem";
import type { SeichiMapLocation } from "../lib/seichiMap";
import { removeYouTubeLinksFromDescription } from "./description";
import {
  SeichiMapPopupScrollArea,
  type SeichiMapPopupScrollContent,
} from "./SeichiMapPopupScrollArea";
import {
  parseSeichiMapUserCount,
  SEICHI_MAP_USER_COUNT_HEADER,
} from "../lib/seichiMapHeaders";
import { parseXStatusDateFromUrl } from "../lib/xStatus";
import {
  formatStraightLineDistance,
  getNearbyLocations,
  requestCurrentLocation as startCurrentLocationRequest,
  updateCurrentLocationControl,
} from "./currentLocation";
import {
  getMapFullscreenMode,
  getGoogleMapFullscreenPortalTarget,
  isIosDevice,
  setViewportFullscreenPageLock,
  toggleElementFullscreen,
} from "./fullscreen";
import {
  DEFAULT_SEICHI_MAP_PROVIDER,
  getLeafletTileLayerConfig,
  isLeafletMapProvider,
  readSeichiMapProvider,
  saveSeichiMapProvider,
  type SeichiMapProvider,
} from "./mapProvider";
import {
  compareSeichiMapMarkerPresentations,
  getSeichiMapMarkerPresentation,
  SEICHI_MAP_EVERYONE_DARK_COLOR,
  SEICHI_MAP_EVERYONE_LIGHT_COLOR,
  SEICHI_MAP_EVERYONE_SINGLE_VISITOR_COLOR,
  SEICHI_MAP_SELF_VISITED_COLOR,
  SEICHI_MAP_UNVISITED_COLOR,
  type SeichiMapMarkerPresentation,
  type SeichiMapPointLayer,
} from "./pointLayer";
import {
  buildSettingsCallbackUrl,
  consumeSettingsRequestFromUrl,
} from "./profileSettingsUrl";
import {
  SeichiMapHeaderActions,
  shouldShowNicknameRegistrationPrompt,
} from "./SeichiMapHeaderActions";
import {
  resolveSeichiMapNicknameDraft,
  SeichiMapNicknameSettingsFields,
} from "./SeichiMapNicknameSettingsFields";
import {
  addSeichiMapItineraryStop,
  createEmptySeichiMapItinerary,
  readSeichiMapItinerary,
  removeSeichiMapItineraryStop,
  reorderSeichiMapItineraryStops,
  saveSeichiMapItinerary,
  toggleSeichiMapItineraryStop,
} from "./itinerary";
import { buildDokoAzPostUrl } from "./xShare";
import { SeichiMapAdminTools } from "./SeichiMapAdminTools";
import { SeichiMapBottomSheetHandle } from "./SeichiMapBottomSheetHandle";
import { SeichiMapLayerDialog } from "./SeichiMapLayerDialog";
import { SeichiMapVisitFilterMenu } from "./SeichiMapVisitFilterMenu";
import type { SeichiMapSheetSnap } from "./sheetSnap";
import classes from "./SeichiMapStage.module.css";
import { deleteSeichiMapVisit, saveSeichiMapVisit } from "./visitApi";
import {
  filterSeichiMapLocationsByIds,
  filterSeichiMapLocationsByVisit,
  readSeichiMapVisitFilter,
  saveSeichiMapVisitFilter,
  type SeichiMapVisitFilter,
} from "./visitFilter";
import { SeichiMapIdentityAdmin } from "./SeichiMapIdentityAdmin";
import { SeichiMapAchievementAdmin } from "./SeichiMapAchievementAdmin";
import {
  SeichiMapAchievementsModal,
  useSeichiMapAchievements,
} from "./SeichiMapAchievements";
import { SeichiMapPlayerCard } from "./SeichiMapPlayerCard";
import type {
  SeichiMapAchievementView,
  SeichiMapLocalizedText,
  SeichiMapUnlockedAchievement,
} from "../types/seichiMapAchievements";
import { pickSeichiMapLocalizedText } from "./achievementText";

const SeichiMapItinerary = dynamic(() =>
  import("./SeichiMapItinerary").then((module) => module.SeichiMapItinerary),
);

type LocationOption = SeichiMapLocation & {
  key: string;
  uniqueVisitorCount: number;
  singleVisitorNickname: string | null;
};

type ListMode = "locations" | "nearby" | "visited" | "itinerary";

type NearbyLocationStatus = "idle" | "locating" | "ready" | "unavailable";

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

type ProfileInfo = {
  nickname: string;
  showNicknameInRanking: boolean;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  isSignedIn: boolean;
  initialLocationId?: string | null;
  initialShareId?: string | null;
};

type GoogleLatLngLike = {
  lat: (() => number) | number;
  lng: (() => number) | number;
};

type GooglePointLike = {
  x: number;
  y: number;
};

type GoogleMapBoundsLike = {
  getNorthEast: () => GoogleLatLngLike;
  getSouthWest: () => GoogleLatLngLike;
};

type GoogleMapProjectionLike = {
  fromLatLngToDivPixel: (latLng: GoogleLatLngLike) => GooglePointLike | null;
};

type GoogleMapsEventListener = {
  remove: () => void;
};

type GoogleMapsEventApi = {
  trigger: (
    instance: object,
    eventName: string,
    ...eventArguments: unknown[]
  ) => void;
};

type GoogleMapsControlArrayLike = {
  push: (element: HTMLElement) => number;
};

type GoogleMapMouseEvent = {
  latLng?: GoogleLatLngLike;
  domEvent?: MouseEvent;
  stop?: () => void;
};

type GoogleMapInstance = {
  controls: Record<number, GoogleMapsControlArrayLike>;
  getBounds: () => GoogleMapBoundsLike | null;
  getCenter: () => GoogleLatLngLike | null;
  getZoom: () => number | undefined;
  panTo: (latLng: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  addListener: (
    eventName: string,
    handler: (event?: GoogleMapMouseEvent) => void,
  ) => GoogleMapsEventListener;
};

type GoogleInfoWindow = {
  setContent: (content: string | Node) => void;
  setPosition: (latLng: { lat: number; lng: number }) => void;
  open: (options: { map: GoogleMapInstance }) => void;
  close: () => void;
  addListener?: (
    eventName: string,
    handler: () => void,
  ) => GoogleMapsEventListener;
};

type GoogleOverlayViewBase = {
  setMap(map: GoogleMapInstance | null): void;
  getProjection?(): GoogleMapProjectionLike | null;
  getPanes?(): { overlayMouseTarget: Element } | null;
};

type GoogleMapsCoreLibrary = {
  ControlPosition: {
    RIGHT_BOTTOM: number;
  };
  LatLng: new (lat: number, lng: number) => GoogleLatLngLike;
};

type GoogleMapsMapsLibrary = {
  OverlayView: new () => GoogleOverlayViewBase;
  Map: new (
    mapElement: HTMLElement,
    options: {
      center: { lat: number; lng: number };
      zoom: number;
      mapId: string;
      mapTypeControl: boolean;
      clickableIcons: boolean;
      fullscreenControl: boolean;
      streetViewControl: boolean;
    },
  ) => GoogleMapInstance;
  InfoWindow: new () => GoogleInfoWindow;
};

type GoogleAdvancedMarkerElement = {
  map: GoogleMapInstance | null;
  position: { lat: number; lng: number };
};

type GoogleMapsMarkerLibrary = {
  AdvancedMarkerElement: new (options: {
    map: GoogleMapInstance;
    position: { lat: number; lng: number };
    title: string;
    content: HTMLElement;
    zIndex: number;
  }) => GoogleAdvancedMarkerElement;
};

type GoogleMapsDynamicGlobal = GoogleMapsMapsLibrary & {
  event?: GoogleMapsEventApi;
  importLibrary?: (libraryName: string) => Promise<unknown>;
  marker?: GoogleMapsMarkerLibrary;
  [key: string]: unknown;
};

type GoogleWindowGlobal = {
  maps?: GoogleMapsDynamicGlobal;
  [key: string]: unknown;
};

declare global {
  interface Window {
    google?: GoogleWindowGlobal;
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
const CURRENT_LOCATION_MAP_ZOOM = 15;
const LEAFLET_CURRENT_LOCATION_PANE = "seichi-current-location";
const MIN_SHARED_MAP_ZOOM = 1;
const MAX_SHARED_MAP_ZOOM = 21;
const VISITED_PAGE_SIZE = 50;
const DEFAULT_GOOGLE_MAPS_MAP_ID = "DEMO_MAP_ID";
const GOOGLE_MAPS_LOADER_VERSION = 3;
const LAST_VISITED_DATE_STORAGE_KEY = "azki-seichi-map:last-visited-date";
const HIDDEN_LAYERS_STORAGE_KEY = "azki-seichi-map:hidden-layers";
const NICKNAME_PROMPT_DISMISSED_STORAGE_KEY =
  "azki-seichi-map:nickname-prompt-dismissed";
const urlPattern = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%#]+/g;

type GoogleMapsLibraries = {
  core: GoogleMapsCoreLibrary;
  maps: GoogleMapsMapsLibrary;
};

type CanvasOverlayHandle = {
  setLocations: (locations: LocationOption[]) => void;
  setSelectedLocationId: (locationId: string | null) => void;
  setMap: (map: GoogleMapInstance | null) => void;
  findLocationAtLatLng: (latLng: GoogleLatLngLike) => LocationOption | null;
  draw: () => void;
};

type CanvasHitPoint = {
  location: LocationOption;
  x: number;
  y: number;
};

type MapViewport = {
  center: { lat: number; lng: number };
  zoom: number;
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

const createCurrentLocationMarkerContent = () => {
  const marker = document.createElement("div");
  marker.setAttribute("aria-hidden", "true");
  marker.style.width = "18px";
  marker.style.height = "18px";
  marker.style.border = "3px solid #fff";
  marker.style.borderRadius = "50%";
  marker.style.background = "#1a73e8";
  marker.style.pointerEvents = "none";
  marker.style.boxShadow =
    "0 1px 4px rgba(0, 0, 0, 0.45), 0 0 0 8px rgba(26, 115, 232, 0.2)";
  return marker;
};

const createCurrentLocationControl = (label: string, onClick: () => void) => {
  const button = document.createElement("button");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const iconPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );

  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "24");
  icon.setAttribute("height", "24");
  icon.style.display = "block";
  icon.style.pointerEvents = "none";
  iconPath.setAttribute(
    "d",
    "M11 1h2v2.06A9.01 9.01 0 0 1 20.94 11H23v2h-2.06A9.01 9.01 0 0 1 13 20.94V23h-2v-2.06A9.01 9.01 0 0 1 3.06 13H1v-2h2.06A9.01 9.01 0 0 1 11 3.06V1Zm1 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z",
  );
  iconPath.setAttribute("fill", "currentColor");
  icon.append(iconPath);

  button.type = "button";
  button.className = "seichi-map-current-location-control--google";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.style.width = "40px";
  button.style.height = "40px";
  button.style.margin = "10px";
  button.style.padding = "0";
  button.style.border = "0";
  button.style.borderRadius = "2px";
  button.style.background = "#fff";
  button.style.color = "#3c4043";
  button.style.cursor = "pointer";
  button.style.display = "grid";
  button.style.placeItems = "center";
  button.style.boxShadow = "0 1px 4px rgba(0, 0, 0, 0.3)";
  button.append(icon);
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
};

const installGoogleMapsLoader = (apiKey: string, language: string) => {
  const googleGlobal = (window.google ??= {} as GoogleWindowGlobal);
  const mapsGlobal = (googleGlobal.maps ??= {} as GoogleMapsDynamicGlobal);
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

    return scriptPromise.then(() => {
      const importLibrary = mapsGlobal.importLibrary;
      if (!importLibrary) {
        throw new Error("google_maps_load_failed");
      }
      return importLibrary(libraryName);
    });
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
  return removeYouTubeLinksFromDescription(
    stripHtmlToLines(value),
    extractYouTubeReferences(value).map((reference) => reference.rawUrl),
  );
};

const getYouTubeThumbnailUrl = (videoId: string) =>
  `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`;

const loadArchiveVideoMeta = async (
  locations: Pick<SeichiMapLocation, "description">[],
): Promise<Record<string, ArchiveVideoMeta>> => {
  const archivesResponse = await fetch("/api/archives").catch(() => null);
  const archiveVideoMeta: Record<string, ArchiveVideoMeta> = {};

  if (archivesResponse?.ok) {
    const archivesData = (await archivesResponse
      .json()
      .catch(() => [])) as Partial<ArchiveItem>[];
    archivesData.forEach((item) => {
      const videoId = item.video_id?.trim();
      if (!videoId || !item.title) return;
      archiveVideoMeta[videoId] = {
        title: item.title,
        thumbnailUrl: getYouTubeThumbnailUrl(videoId),
        streamDateLabel: formatArchiveStreamDateLabel(
          item.stream_started_at || item.published_at,
        ),
      };
    });
  }

  const missingYouTubeVideoIds = extractYouTubeVideoIdsFromLocations(
    locations,
  ).filter((videoId) => !archiveVideoMeta[videoId]);
  if (missingYouTubeVideoIds.length === 0) return archiveVideoMeta;

  const ytInfoResponse = await fetch(
    `/api/yt/info?videoIds=${encodeURIComponent(
      missingYouTubeVideoIds.join(","),
    )}`,
  ).catch(() => null);
  if (!ytInfoResponse?.ok) return archiveVideoMeta;

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

  return archiveVideoMeta;
};

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
  color: "pink" | "cyan" = "pink",
) => {
  element.dataset.variant = variant;
  element.dataset.color = color;
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
    element.style.background = color === "cyan" ? "#e3fafc" : "#fff0f6";
    element.style.border = "1px solid transparent";
    element.style.color = color === "cyan" ? "#0b7285" : "#c2255c";
    return;
  }

  element.style.background = "#ffffff";
  element.style.border = "1px solid #dee2e6";
  element.style.color = "#343a40";
};

const buildGoogleMapsSearchUrl = (location: LocationOption) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${location.latitude},${location.longitude}`,
  )}`;

/** X（旧 Twitter）のロゴ。ポップアップは DOM を直接組み立てるので、SVG も要素として作る。 */
const createXLogoIconElement = (): SVGSVGElement => {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(svgNamespace, "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "14");
  icon.setAttribute("height", "14");
  icon.setAttribute("fill", "currentColor");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svgNamespace, "path");
  path.setAttribute(
    "d",
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  );
  icon.appendChild(path);
  return icon;
};

/** 鉛筆のアイコン（Feather の edit-2）。ポップアップ用に SVG を要素として作る。 */
const createPencilIconElement = (): SVGSVGElement => {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(svgNamespace, "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svgNamespace, "path");
  path.setAttribute(
    "d",
    "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z",
  );
  icon.appendChild(path);
  return icon;
};

const createLuCrownIconElement = (): SVGSVGElement => {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(svgNamespace, "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "#f08c00");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  icon.style.flexShrink = "0";

  const crown = document.createElementNS(svgNamespace, "path");
  crown.setAttribute(
    "d",
    "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",
  );
  const base = document.createElementNS(svgNamespace, "path");
  base.setAttribute("d", "M5 21h14");
  icon.append(crown, base);

  return icon;
};

const createSeichiCanvasOverlay = ({
  coreApi,
  mapsApi,
  map,
  getMarkerPresentation,
  getSelectedLocationId,
}: {
  coreApi: GoogleMapsCoreLibrary;
  mapsApi: GoogleMapsMapsLibrary;
  map: GoogleMapInstance;
  getMarkerPresentation: (
    location: LocationOption,
  ) => SeichiMapMarkerPresentation;
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

    setMap(nextMap: GoogleMapInstance | null) {
      super.setMap(nextMap);
    }

    onAdd() {
      this.canvas = document.createElement("canvas");
      this.canvas.style.position = "absolute";
      this.canvas.style.pointerEvents = "none";
      this.canvas.style.zIndex = "1";
      // 聖地ピンは現在地マーカーより手前、情報ウィンドウより奥に置く。
      this.getPanes?.()?.overlayMouseTarget?.appendChild(this.canvas);
      this.draw();
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
      // Canvas は後から描いたピンほど手前に表示される。
      const locationsInPaintOrder = this.locations
        .map((location) => ({
          location,
          presentation: getMarkerPresentation(location),
        }))
        .sort((left, right) =>
          compareSeichiMapMarkerPresentations(
            left.presentation,
            right.presentation,
          ),
        );

      for (const { location, presentation } of locationsInPaintOrder) {
        const point = projection.fromLatLngToDivPixel(
          new coreApi.LatLng(location.latitude, location.longitude),
        );
        if (!point) continue;

        const x = point.x - left;
        const y = point.y - top;
        if (x < -16 || x > width + 16 || y < -16 || y > height + 16) {
          continue;
        }

        const selected = location.id === selectedLocationId;
        const markerColor = presentation.color;
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

    findLocationAtLatLng(latLng: GoogleLatLngLike) {
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
      return {
        core: core as GoogleMapsCoreLibrary,
        maps: maps as GoogleMapsMapsLibrary,
      };
    }

    if (
      mapsApi?.Map &&
      mapsApi.OverlayView &&
      mapsApi.InfoWindow &&
      mapsApi.LatLng
    ) {
      return {
        core: mapsApi as unknown as GoogleMapsCoreLibrary,
        maps: mapsApi as unknown as GoogleMapsMapsLibrary,
      };
    }

    await sleep(50);
  }

  throw new Error("google_maps_load_failed");
};

const loadGoogleMapsMarkerLibrary = async () => {
  const mapsApi = window.google?.maps;
  if (mapsApi?.marker?.AdvancedMarkerElement) {
    return mapsApi.marker;
  }

  const markerLibrary = await mapsApi?.importLibrary?.("marker");
  if (!markerLibrary) {
    throw new Error("google_maps_marker_load_failed");
  }
  return markerLibrary as GoogleMapsMarkerLibrary;
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
  viewport: MapViewport,
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

  const { lat, lng } = viewport.center;
  const { zoom } = viewport;
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
  initialLocationId,
  initialShareId,
  isSignedIn,
}: Props) {
  const t = useTranslations("SeichiMapComplete");
  const locale = useLocale();
  const htmlLocale = locale.replace("_", "-");
  const mapsLanguage = locale === "ja" ? "ja" : "en";
  const datePickerLocale = locale === "ja" ? "ja" : "en";
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const stageTopRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  // 地図の枠の上端（ページ先頭からの距離）。lg 未満は画面の残りいっぱいを地図にするために使う
  const [stageTop, setStageTop] = useState<number | null>(null);
  // 地図の枠の上端から、main の下端（フッターの手前）までの高さ。PC は残りいっぱいを地図とパネルにする
  const [stageRoom, setStageRoom] = useState<number | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const leafletApiRef = useRef<typeof import("leaflet") | null>(null);
  const leafletMapRef = useRef<Leaflet.Map | null>(null);
  const leafletMarkerLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletCanvasRendererRef = useRef<Leaflet.Renderer | null>(null);
  const leafletCurrentLocationMarkerRef = useRef<Leaflet.CircleMarker | null>(
    null,
  );
  const leafletPopupRef = useRef<Leaflet.Popup | null>(null);
  const mapOverlayRef = useRef<CanvasOverlayHandle | null>(null);
  const mapClickListenerRef = useRef<GoogleMapsEventListener | null>(null);
  const mapMouseMoveListenerRef = useRef<GoogleMapsEventListener | null>(null);
  const mapIdleListenerRef = useRef<GoogleMapsEventListener | null>(null);
  const infoWindowCloseClickListenerRef =
    useRef<GoogleMapsEventListener | null>(null);
  const currentLocationMarkerRef = useRef<GoogleAdvancedMarkerElement | null>(
    null,
  );
  const currentLocationMarkerLibraryRef =
    useRef<GoogleMapsMarkerLibrary | null>(null);
  const currentLocationControlRef = useRef<HTMLButtonElement | null>(null);
  const cancelCurrentLocationRequestRef = useRef<(() => void) | null>(null);
  const requestCurrentLocationRef = useRef<() => void>(() => undefined);
  const hoverTimerRef = useRef<number | null>(null);
  const isMapDraggingRef = useRef(false);
  const infoWindowRef = useRef<GoogleInfoWindow | null>(null);
  // 地点のポップアップが開いているか。モーダルを閉じて選択だけが外れても、開いたままのポップアップの本文は消さない
  const isLocationPopupOpenRef = useRef(false);

  const quickRecordVisitRef = useRef<(location: LocationOption) => void>(
    () => undefined,
  );
  const [popupScrollContent, setPopupScrollContent] =
    useState<SeichiMapPopupScrollContent | null>(null);
  const getMarkerPresentationRef = useRef<
    (location: LocationOption) => SeichiMapMarkerPresentation
  >(() =>
    getSeichiMapMarkerPresentation({
      pointLayer: "self",
      isVisited: false,
      uniqueVisitorCount: 0,
      maxUniqueVisitorCount: 0,
    }),
  );
  const isSharedViewRef = useRef(false);
  const openLocationInfoWindowRef = useRef<
    (location: LocationOption, options?: { keepSheet?: boolean }) => void
  >(() => undefined);
  const selectedLocationIdRef = useRef<string | null>(null);
  const itineraryLocationIdsRef = useRef<ReadonlySet<string>>(new Set());
  const focusedInitialLocationIdRef = useRef<string | null>(null);

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [visited, setVisited] = useState<VisitedItem[]>([]);
  const [itinerary, setItinerary] = useState(createEmptySeichiMapItinerary);
  const [itineraryLoaded, setItineraryLoaded] = useState(false);
  const [archiveVideoMetaById, setArchiveVideoMetaById] = useState<
    Record<string, ArchiveVideoMeta>
  >({});
  const [loading, setLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapProvider, setMapProvider] = useState<SeichiMapProvider>(
    DEFAULT_SEICHI_MAP_PROVIDER,
  );
  const [pointLayer, setPointLayer] = useState<SeichiMapPointLayer>("self");
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
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [profileLookupCompleted, setProfileLookupCompleted] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [profileNickname, setProfileNickname] = useState("");
  const [nicknamePromptDismissed, setNicknamePromptDismissed] = useState(true);
  const [showNicknameInRanking, setShowNicknameInRanking] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(
    null,
  );
  const [shareCopied, setShareCopied] = useState(false);
  const [visitedDate, setVisitedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [lastVisitedDate, setLastVisitedDate] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [visitUrl, setVisitUrl] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [recordModalPortalTarget, setRecordModalPortalTarget] =
    useState<HTMLElement | null>(null);
  const isSmallScreen = useMediaQuery("(max-width: 48em)");
  const [isLayerDialogOpen, setIsLayerDialogOpen] = useState(false);
  const [sheetSnap, setSheetSnap] = useState<SeichiMapSheetSnap>("peek");
  const [visitFilter, setVisitFilter] = useState<SeichiMapVisitFilter>("all");
  // バッジの達成条件の対象地点だけに絞るときの状態。locationIds が null の間は取得中
  const [badgeFilter, setBadgeFilter] = useState<{
    achievementId: string;
    name: SeichiMapLocalizedText;
    locationIds: ReadonlySet<string> | null;
  } | null>(null);
  const [isMapProviderMenuOpen, setIsMapProviderMenuOpen] = useState(false);
  const [isIosMapDevice, setIsIosMapDevice] = useState<boolean | null>(null);
  const [isNativeMapFullscreen, setIsNativeMapFullscreen] = useState(false);
  const [isViewportMapFullscreen, setIsViewportMapFullscreen] = useState(false);
  const [listMode, setListMode] = useState<ListMode>("locations");
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [nearbyLocationStatus, setNearbyLocationStatus] =
    useState<NearbyLocationStatus>("idle");

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const mapsMapId =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || DEFAULT_GOOGLE_MAPS_MAP_ID;

  useEffect(() => {
    setIsIosMapDevice(isIosDevice());
  }, []);

  useEffect(() => {
    const storedProvider = readSeichiMapProvider(window.localStorage);
    setMapProvider(
      storedProvider === "google" && !mapsKey
        ? DEFAULT_SEICHI_MAP_PROVIDER
        : storedProvider,
    );
  }, [mapsKey]);

  useEffect(() => {
    setItinerary(readSeichiMapItinerary(window.localStorage));
    setItineraryLoaded(true);
  }, []);

  useEffect(() => {
    if (!itineraryLoaded) return;
    saveSeichiMapItinerary(window.localStorage, itinerary);
  }, [itinerary, itineraryLoaded]);

  const selectMapProvider = useCallback(
    (provider: SeichiMapProvider) => {
      if (provider === "google" && !mapsKey) return;
      setErrorMessage(null);
      setMapProvider(provider);
      setIsMapProviderMenuOpen(false);
      saveSeichiMapProvider(window.localStorage, provider);
    },
    [mapsKey],
  );

  useEffect(() => {
    const element = stageTopRef.current;
    if (!element) return;
    const measure = () => {
      // 枠の上端は、上の領域の下端ではなく地図の枠そのものから測る（余白の折り返しを含めるため）
      const stage = stageRef.current;
      if (!stage) return;
      // main がスクロールしていても、一番上までスクロールした状態の位置になるよう補正する
      const scroller = stage.closest("main");
      const next = Math.round(
        stage.getBoundingClientRect().top +
          window.scrollY +
          (scroller?.scrollTop ?? 0),
      );
      setStageTop((current) => (current === next ? current : next));
      if (scroller) {
        // 画面の下端、main の下端、画面下に固定されたフッターの上端のうち、いちばん上にあるものまでが使える範囲
        let bottom = Math.min(
          window.innerHeight,
          scroller.getBoundingClientRect().bottom,
        );
        const footer = document.querySelector("footer");
        if (footer && getComputedStyle(footer).position === "fixed") {
          const footerTop = footer.getBoundingClientRect().top;
          if (footerTop > 0) bottom = Math.min(bottom, footerTop);
        }
        const room = Math.round(bottom - (next - window.scrollY));
        setStageRoom((current) => (current === room ? current : room));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    if (typeof ResizeObserver === "undefined") {
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);

  const refreshMapViewport = useCallback(() => {
    window.requestAnimationFrame(() => {
      leafletMapRef.current?.invalidateSize({ pan: false });

      const currentMap = mapRef.current;
      if (!currentMap) return;

      const center = currentMap.getCenter();
      window.google?.maps?.event?.trigger(currentMap, "resize");
      if (!center) return;

      const lat = typeof center.lat === "function" ? center.lat() : center.lat;
      const lng = typeof center.lng === "function" ? center.lng() : center.lng;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      currentMap.panTo({ lat, lng });
    });
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen =
        document.fullscreenElement === mapContainerRef.current;
      setIsNativeMapFullscreen(isFullscreen);
      refreshMapViewport();
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleFullscreenChange);
    window.addEventListener("focus", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleFullscreenChange);
      window.removeEventListener("focus", handleFullscreenChange);
    };
  }, [refreshMapViewport]);

  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer || typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(refreshMapViewport);
    resizeObserver.observe(mapContainer);
    return () => resizeObserver.disconnect();
  }, [refreshMapViewport]);

  useEffect(() => {
    if (!isViewportMapFullscreen) return;

    setViewportFullscreenPageLock(true);
    refreshMapViewport();
    return () => {
      setViewportFullscreenPageLock(false);
      refreshMapViewport();
    };
  }, [isViewportMapFullscreen, refreshMapViewport]);

  const toggleMapFullscreen = useCallback(async () => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    if (getMapFullscreenMode(isIosMapDevice === true) === "viewport") {
      setIsViewportMapFullscreen((isFullscreen) => !isFullscreen);
      return;
    }

    try {
      await toggleElementFullscreen(mapContainer);
    } catch (error) {
      console.error(error);
      setErrorMessage(t("errors.fullscreenFailed"));
    }
  }, [isIosMapDevice, t]);

  const isMapFullscreen = isNativeMapFullscreen || isViewportMapFullscreen;
  const showCustomFullscreenControl =
    isIosMapDevice === true ||
    (isIosMapDevice === false && isLeafletMapProvider(mapProvider));

  const effectiveShareId = viewShareId ?? serverShareId;
  const isSharedView = Boolean(effectiveShareId);
  const effectivePointLayer: SeichiMapPointLayer = isSharedView
    ? "self"
    : pointLayer;
  const canEditVisits = isSignedIn && !isSharedView;
  const canViewVisitedList = canEditVisits || isSharedView;
  const {
    data: achievementData,
    loading: achievementsLoading,
    error: achievementsError,
    refresh: refreshAchievements,
    handleUnlocked: handleAchievementsUnlocked,
    updateTitle: updateAchievementTitle,
    titleUpdating: achievementTitleUpdating,
  } = useSeichiMapAchievements({
    // 共有マップでは持ち主の、自分のマップでは本人のバッジ状況を出す
    enabled: canEditVisits || isSharedView,
    shareId: isSharedView ? effectiveShareId : null,
  });
  const achievementProfile = achievementData?.profile ?? null;
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const handleOpenAchievements = useCallback(() => {
    setShowAchievementsModal(true);
    void refreshAchievements();
  }, [refreshAchievements]);
  const sharedViewNickname = sharedViewInfo?.nickname ?? t("share.loadingUser");
  const registeredNickname =
    resolveSeichiMapNicknameDraft(profileInfo?.nickname, shareInfo?.nickname) ||
    null;
  const showNicknamePrompt = shouldShowNicknameRegistrationPrompt({
    isSignedIn,
    isSharedView,
    profileLookupCompleted,
    nickname: registeredNickname,
    promptDismissed: nicknamePromptDismissed,
  });
  const pageTitle = isSharedView
    ? t("share.sharedTitle", { nickname: sharedViewNickname })
    : registeredNickname
      ? t("titleWithNickname", { name: registeredNickname })
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
    if (!showNicknamePrompt) return;

    const dismissNicknamePrompt = () => {
      setNicknamePromptDismissed(true);
      try {
        window.sessionStorage.setItem(
          NICKNAME_PROMPT_DISMISSED_STORAGE_KEY,
          "1",
        );
      } catch {
        // The prompt still stays dismissed until this page is unloaded.
      }
    };

    document.addEventListener("pointerdown", dismissNicknamePrompt, {
      once: true,
    });
    return () => {
      document.removeEventListener("pointerdown", dismissNicknamePrompt);
    };
  }, [showNicknamePrompt]);

  useEffect(() => {
    setVisitFilter(readSeichiMapVisitFilter(window.localStorage));
  }, []);

  const changeVisitFilter = useCallback((filter: SeichiMapVisitFilter) => {
    setVisitFilter(filter);
    saveSeichiMapVisitFilter(window.localStorage, filter);
  }, []);

  const clearBadgeFilter = useCallback(() => setBadgeFilter(null), []);

  const startBadgeFilter = useCallback(
    async (achievement: SeichiMapAchievementView) => {
      setBadgeFilter({
        achievementId: achievement.id,
        name: achievement.name,
        locationIds: null,
      });
      try {
        const response = await fetch(
          `/api/seichi-map/achievements/${encodeURIComponent(achievement.id)}/locations`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("Failed to load target locations");
        const payload = (await response.json()) as { locationIds?: string[] };
        const ids = new Set(payload.locationIds ?? []);
        // 取得中に別のバッジへ切り替えたり解除したりしていたら、結果は捨てる
        setBadgeFilter((current) =>
          current?.achievementId === achievement.id
            ? { ...current, locationIds: ids }
            : current,
        );
      } catch (error) {
        console.error(error);
        setBadgeFilter((current) =>
          current?.achievementId === achievement.id ? null : current,
        );
        notifications.show({
          color: "red",
          message: t("badgeFilter.loadFailed"),
        });
      }
    },
    [t],
  );

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

  const itineraryLocationIds = useMemo(
    () => new Set(itinerary.stops.map((stop) => stop.locationId)),
    [itinerary.stops],
  );

  useEffect(() => {
    itineraryLocationIdsRef.current = itineraryLocationIds;
  }, [itineraryLocationIds]);

  const addLocationToItinerary = useCallback((locationId: string) => {
    setItinerary((current) => addSeichiMapItineraryStop(current, locationId));
    setListMode("itinerary");
  }, []);

  const toggleItineraryStop = useCallback((locationId: string) => {
    setItinerary((current) =>
      toggleSeichiMapItineraryStop(current, locationId),
    );
  }, []);

  const removeItineraryStop = useCallback((locationId: string) => {
    setItinerary((current) =>
      removeSeichiMapItineraryStop(current, locationId),
    );
  }, []);

  const reorderItineraryStops = useCallback(
    (activeLocationId: string, overLocationId: string) => {
      setItinerary((current) =>
        reorderSeichiMapItineraryStops(
          current,
          activeLocationId,
          overLocationId,
        ),
      );
    },
    [],
  );

  const clearItinerary = useCallback(() => {
    setItinerary(createEmptySeichiMapItinerary());
  }, []);

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
  const visitedLocationIds = useMemo(
    () => new Set(visitedByLocationId.keys()),
    [visitedByLocationId],
  );

  const getVisitedItemForLocation = useCallback(
    (location: LocationOption) => visitedByLocationId.get(location.id),
    [visitedByLocationId],
  );

  const isLocationVisited = useCallback(
    (location: LocationOption) => {
      return Boolean(getVisitedItemForLocation(location));
    },
    [getVisitedItemForLocation],
  );

  const maxUniqueVisitorCount = useMemo(
    () =>
      Math.max(0, ...locations.map((location) => location.uniqueVisitorCount)),
    [locations],
  );

  const getMarkerPresentation = useCallback(
    (location: LocationOption) =>
      getSeichiMapMarkerPresentation({
        pointLayer: effectivePointLayer,
        isVisited: isLocationVisited(location),
        uniqueVisitorCount: location.uniqueVisitorCount,
        maxUniqueVisitorCount,
      }),
    [effectivePointLayer, isLocationVisited, maxUniqueVisitorCount],
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

  // 訪問状況の絞り込みは、見られる状態（自分のログイン済み・共有マップ）のときだけ効かせる
  const effectiveVisitFilter: SeichiMapVisitFilter = canViewVisitedList
    ? visitFilter
    : "all";

  // 地図・一覧・近隣に出す地点。進捗率（completion）は絞り込み前の visibleLocations で数える
  const badgeLocationIds = badgeFilter?.locationIds ?? null;
  // バッジで絞るときは、非表示にしているレイヤーの地点も対象にする（条件の対象を見落とさないため）
  const mapLocations = useMemo(
    () =>
      filterSeichiMapLocationsByVisit(
        badgeLocationIds
          ? filterSeichiMapLocationsByIds(locations, badgeLocationIds)
          : visibleLocations,
        isLocationVisited,
        effectiveVisitFilter,
      ),
    [
      badgeLocationIds,
      effectiveVisitFilter,
      isLocationVisited,
      locations,
      visibleLocations,
    ],
  );

  // バッジで絞っているときの、対象地点の訪問状況
  const badgeCompletion = useMemo(() => {
    if (!badgeLocationIds) return null;
    const scoped = filterSeichiMapLocationsByIds(locations, badgeLocationIds);
    const done = scoped.filter(isLocationVisited).length;
    return {
      total: scoped.length,
      done,
      percent: roundCompletionPercent(done, scoped.length),
    };
  }, [badgeLocationIds, isLocationVisited, locations]);

  const nearbyLocations = useMemo(() => {
    if (!currentPosition) return [];
    return getNearbyLocations(currentPosition, mapLocations);
  }, [currentPosition, mapLocations]);

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
    if (!query) return mapLocations;

    return mapLocations.filter((item) => {
      return normalizeSearchText(
        `${item.name} ${item.folder} ${stripHtmlToLines(item.description)}`,
      ).includes(query);
    });
  }, [locationSearchQuery, mapLocations]);

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
        `${locationById.get(item.locationId)?.name ?? item.locationName} ${item.note} ${item.url} ${item.visitedAt.slice(0, 10)} ${localizedDate}`,
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
    try {
      setNicknamePromptDismissed(
        window.sessionStorage.getItem(NICKNAME_PROMPT_DISMISSED_STORAGE_KEY) ===
          "1",
      );
    } catch {
      setNicknamePromptDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (!shareInfo) {
      setShareUrl("");
      return;
    }
    setShareUrl(buildSeichiMapShareUrl(shareInfo.shareId));
  }, [shareInfo]);

  const loadAccountSettings = useCallback(async () => {
    if (!isSignedIn || isSharedView) {
      setShareInfo(null);
      setProfileInfo(null);
      setProfileLookupCompleted(false);
      return;
    }

    setProfileLookupCompleted(false);
    try {
      const [shareResult, profileResult] = await Promise.allSettled([
        fetch("/api/seichi-map/share", { cache: "no-store" }),
        fetch("/api/seichi-map/profile", { cache: "no-store" }),
      ]);
      const shareResponse =
        shareResult.status === "fulfilled" ? shareResult.value : null;
      const profileResponse =
        profileResult.status === "fulfilled" ? profileResult.value : null;
      const sharePayload = (
        shareResponse?.ok ? await shareResponse.json().catch(() => ({})) : {}
      ) as {
        item?: ShareInfo | null;
      };
      const profilePayload = (
        profileResponse?.ok
          ? await profileResponse.json().catch(() => ({}))
          : {}
      ) as {
        item?: ProfileInfo | null;
      };
      const nextShareInfo = sharePayload.item ?? null;
      const nextProfileInfo = profilePayload.item ?? null;
      setShareInfo(nextShareInfo);
      setProfileInfo(nextProfileInfo);
      setProfileLookupCompleted(Boolean(profileResponse?.ok));
      if (nextProfileInfo) {
        setProfileNickname(nextProfileInfo.nickname);
        setShowNicknameInRanking(nextProfileInfo.showNicknameInRanking);
      } else if (nextShareInfo?.nickname) {
        setProfileNickname(nextShareInfo.nickname);
      }
    } catch (error) {
      console.error(error);
    }
  }, [isSharedView, isSignedIn]);

  useEffect(() => {
    void loadAccountSettings();
  }, [loadAccountSettings]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLocationsLoading(true);
    setUserCount(null);
    setErrorMessage(null);

    try {
      const locationsRequest = fetch("/api/seichi-map/locations", {
        cache: "no-store",
      });
      const visitedRequest = effectiveShareId
        ? fetch(buildSeichiMapShareApiUrl(effectiveShareId), {
            cache: "no-store",
          })
        : isSignedIn
          ? fetch("/api/seichi-map/visited", { cache: "no-store" })
          : Promise.resolve(null);

      const locationsResponse = await locationsRequest;

      if (!locationsResponse.ok) {
        throw new Error(t("errors.locationsFetchFailed"));
      }

      setUserCount(
        parseSeichiMapUserCount(
          locationsResponse.headers.get(SEICHI_MAP_USER_COUNT_HEADER),
        ),
      );

      const locationItems =
        (await locationsResponse.json()) as (SeichiMapLocation & {
          uniqueVisitorCount?: number;
          singleVisitorNickname?: string | null;
        })[];

      setLocations(
        locationItems.map((item) => ({
          ...item,
          key: item.id,
          uniqueVisitorCount: item.uniqueVisitorCount ?? 0,
          singleVisitorNickname: item.singleVisitorNickname?.trim() || null,
        })),
      );
      setLocationsLoading(false);

      void loadArchiveVideoMeta(locationItems)
        .then(setArchiveVideoMetaById)
        .catch((error) => console.error(error));

      const visitedResponse = await visitedRequest;

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
          setErrorMessage(payload.error || fallbackMessage);
        } else {
          const visitedData = (await visitedResponse.json()) as {
            share?: ShareInfo;
            items?: VisitedItem[];
          };
          setVisited(visitedData.items ?? []);
          setSharedViewInfo(visitedData.share ?? null);
        }
      }
      setLoading(false);
      return true;
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : t("errors.dataLoadFailed"),
      );
      setLocationsLoading(false);
      setLoading(false);
      return false;
    }
  }, [effectiveShareId, isSignedIn, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setVisibleVisitedCount(VISITED_PAGE_SIZE);
  }, [visitedSearchQuery]);

  const requestCurrentLocation = useCallback(() => {
    const control = currentLocationControlRef.current;
    setListMode("nearby");
    if (!navigator.geolocation) {
      if (control) {
        updateCurrentLocationControl(
          control,
          t("currentLocation.unsupported"),
          false,
        );
      }
      setCurrentPosition(null);
      setNearbyLocationStatus("unavailable");
      return;
    }

    const startRequest = () => {
      cancelCurrentLocationRequestRef.current?.();
      setCurrentPosition(null);
      setNearbyLocationStatus("locating");
      cancelCurrentLocationRequestRef.current = startCurrentLocationRequest({
        control,
        geolocation: navigator.geolocation,
        labels: {
          locating: t("currentLocation.locating"),
          show: t("currentLocation.show"),
          unavailable: t("currentLocation.unavailable"),
        },
        onSuccess: (coords) => {
          setCurrentPosition({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          setNearbyLocationStatus("ready");
          setListMode("nearby");
        },
        onUnavailable: () => {
          setCurrentPosition(null);
          setNearbyLocationStatus("unavailable");
        },
      });
    };

    if (isLeafletMapProvider(mapProvider)) {
      startRequest();
      return;
    }

    if (currentLocationMarkerLibraryRef.current) {
      startRequest();
      return;
    }

    void loadGoogleMapsMarkerLibrary()
      .then((markerLibrary) => {
        currentLocationMarkerLibraryRef.current = markerLibrary;
        startRequest();
      })
      .catch((error) => {
        console.error(error);
        if (control) {
          updateCurrentLocationControl(
            control,
            t("currentLocation.unavailable"),
            false,
          );
        }
        setCurrentPosition(null);
        setNearbyLocationStatus("unavailable");
      });
  }, [mapProvider, t]);

  useEffect(() => {
    requestCurrentLocationRef.current = requestCurrentLocation;
  }, [requestCurrentLocation]);

  useEffect(() => {
    if (mapProvider !== "google" || isIosMapDevice === null) {
      return;
    }

    setMapReady(false);
    if (!mapsKey || !mapElementRef.current) {
      setErrorMessage(t("errors.googleMapsUnavailable"));
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
            fullscreenControl: !isIosMapDevice,
            streetViewControl: true,
          });
          infoWindowRef.current = new InfoWindow();
          infoWindowCloseClickListenerRef.current =
            infoWindowRef.current.addListener?.("closeclick", () => {
              isLocationPopupOpenRef.current = false;
              setSelectedLocationId(null);
            }) ?? null;
          mapOverlayRef.current = createSeichiCanvasOverlay({
            coreApi: libraries.core,
            mapsApi: libraries.maps,
            map: mapRef.current,
            getMarkerPresentation: (location) =>
              getMarkerPresentationRef.current(location),
            getSelectedLocationId: () => selectedLocationIdRef.current,
          });
          currentLocationControlRef.current = createCurrentLocationControl(
            t("currentLocation.show"),
            () => requestCurrentLocationRef.current(),
          );
          mapRef.current.controls[
            libraries.core.ControlPosition.RIGHT_BOTTOM
          ].push(currentLocationControlRef.current);
          mapClickListenerRef.current = mapRef.current.addListener(
            "click",
            (event?: GoogleMapMouseEvent) => {
              if (!event?.latLng) return;
              const location = mapOverlayRef.current?.findLocationAtLatLng(
                event.latLng,
              );
              if (location) {
                event.stop?.();
                openLocationInfoWindowRef.current(location);
                return;
              }

              setSelectedLocationId(null);
              infoWindowRef.current?.close?.();
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
            (event?: GoogleMapMouseEvent) => {
              const mapElement = mapElementRef.current;
              const mouseEvent = event?.domEvent;
              clearHoveredLocationPreview();

              if (isMapDraggingRef.current) {
                setHoveredLocation(null);
                return;
              }

              if (!event?.latLng || !mapElement || !mouseEvent) {
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
              if (!mapRef.current) return;
              clearHoveredLocationPreview();
              setHoveredLocation(null);
              const center = mapRef.current.getCenter();
              const zoom = mapRef.current.getZoom();
              if (!center || typeof zoom !== "number") return;
              const lat =
                typeof center.lat === "function" ? center.lat() : center.lat;
              const lng =
                typeof center.lng === "function" ? center.lng() : center.lng;
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
              syncMapViewportToUrl(
                {
                  center: { lat, lng },
                  zoom,
                },
                {
                  keepViewport: !isSharedViewRef.current,
                },
              );
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
      setMapReady(false);
      infoWindowCloseClickListenerRef.current?.remove?.();
      infoWindowCloseClickListenerRef.current = null;
      mapIdleListenerRef.current?.remove?.();
      mapIdleListenerRef.current = null;
      mapMouseMoveListenerRef.current?.remove?.();
      mapMouseMoveListenerRef.current = null;
      mapClickListenerRef.current?.remove?.();
      mapClickListenerRef.current = null;
      infoWindowRef.current?.close?.();
      infoWindowRef.current = null;
      setPopupScrollContent(null);
      const currentLocationControl = currentLocationControlRef.current;
      if (
        currentLocationControl &&
        mapElementRef.current?.contains(currentLocationControl)
      ) {
        currentLocationControl.remove();
        currentLocationControlRef.current = null;
      }
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.map = null;
        currentLocationMarkerRef.current = null;
      }
      currentLocationMarkerLibraryRef.current = null;
      mapOverlayRef.current?.setMap(null);
      mapOverlayRef.current = null;
      mapRef.current = null;
      mapElementRef.current?.replaceChildren();
    };
  }, [isIosMapDevice, mapProvider, mapsKey, mapsLanguage, mapsMapId, t]);

  useEffect(() => {
    if (!isLeafletMapProvider(mapProvider) || !mapElementRef.current) {
      return;
    }

    let cancelled = false;
    setMapReady(false);
    setMapLoading(true);
    setErrorMessage(null);

    void import("leaflet")
      .then((leaflet) => {
        if (cancelled || !mapElementRef.current) return;

        leafletApiRef.current = leaflet;
        const initialViewport = readSharedMapViewport();
        const map = leaflet.map(mapElementRef.current, {
          center: [initialViewport.center.lat, initialViewport.center.lng],
          zoom: initialViewport.zoom,
          zoomControl: true,
        });
        const tileLayer = getLeafletTileLayerConfig(mapProvider);
        leaflet
          .tileLayer(tileLayer.url, {
            attribution: tileLayer.attribution,
            maxZoom: tileLayer.maxZoom,
          })
          .addTo(map);
        leafletCanvasRendererRef.current = leaflet
          .canvas({ padding: 0.5 })
          .addTo(map);
        leafletMarkerLayerRef.current = leaflet.layerGroup().addTo(map);
        const currentLocationPane = map.createPane(
          LEAFLET_CURRENT_LOCATION_PANE,
        );
        currentLocationPane.style.zIndex = "390";
        leafletMapRef.current = map;

        map.on("click", () => {
          setSelectedLocationId(null);
          map.closePopup();
        });
        map.on("movestart", () => {
          isMapDraggingRef.current = true;
          clearHoveredLocationPreview();
          setHoveredLocation(null);
        });
        map.on("moveend", () => {
          isMapDraggingRef.current = false;
          clearHoveredLocationPreview();
          setHoveredLocation(null);
          const center = map.getCenter();
          syncMapViewportToUrl(
            {
              center: { lat: center.lat, lng: center.lng },
              zoom: map.getZoom(),
            },
            { keepViewport: !isSharedViewRef.current },
          );
        });
        map.on("popupclose", (event) => {
          if (leafletPopupRef.current !== event.popup) return;

          leafletPopupRef.current = null;
          isLocationPopupOpenRef.current = false;
          setSelectedLocationId(null);
        });
        setMapReady(true);
      })
      .catch((error) => {
        console.error(error);
        setErrorMessage(t("errors.leafletMapLoadFailed"));
      })
      .finally(() => {
        if (!cancelled) setMapLoading(false);
      });

    return () => {
      cancelled = true;
      setMapReady(false);
      leafletPopupRef.current = null;
      leafletCurrentLocationMarkerRef.current = null;
      setPopupScrollContent(null);
      leafletCanvasRendererRef.current = null;
      leafletMarkerLayerRef.current = null;
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
      leafletApiRef.current = null;
      mapElementRef.current?.replaceChildren();
    };
  }, [clearHoveredLocationPreview, mapProvider, t]);

  useEffect(() => {
    if (isLeafletMapProvider(mapProvider)) {
      const map = leafletMapRef.current;
      const leaflet = leafletApiRef.current;
      if (!currentPosition || !mapReady || !map || !leaflet) return;

      const position: Leaflet.LatLngExpression = [
        currentPosition.latitude,
        currentPosition.longitude,
      ];
      if (leafletCurrentLocationMarkerRef.current) {
        leafletCurrentLocationMarkerRef.current.setLatLng(position);
      } else {
        leafletCurrentLocationMarkerRef.current = leaflet
          .circleMarker(position, {
            radius: 9,
            color: "#ffffff",
            weight: 3,
            fillColor: "#1a73e8",
            fillOpacity: 1,
            pane: LEAFLET_CURRENT_LOCATION_PANE,
          })
          .bindTooltip(t("currentLocation.markerTitle"))
          .addTo(map);
      }
      map.setView(position, CURRENT_LOCATION_MAP_ZOOM);
      return;
    }

    const currentMap = mapRef.current;
    const markerLibrary = currentLocationMarkerLibraryRef.current;
    if (!currentPosition || !mapReady || !currentMap || !markerLibrary) return;

    const position = {
      lat: currentPosition.latitude,
      lng: currentPosition.longitude,
    };
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.position = position;
      currentLocationMarkerRef.current.map = currentMap;
    } else {
      currentLocationMarkerRef.current =
        new markerLibrary.AdvancedMarkerElement({
          map: currentMap,
          position,
          title: t("currentLocation.markerTitle"),
          content: createCurrentLocationMarkerContent(),
          zIndex: 1000,
        });
    }

    currentMap.panTo(position);
    currentMap.setZoom(CURRENT_LOCATION_MAP_ZOOM);
  }, [currentPosition, mapProvider, mapReady, t]);

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
      infoWindowCloseClickListenerRef.current?.remove?.();
      mapIdleListenerRef.current?.remove?.();
      mapMouseMoveListenerRef.current?.remove?.();
      mapClickListenerRef.current?.remove?.();
      infoWindowRef.current?.close?.();
      cancelCurrentLocationRequestRef.current?.();
      cancelCurrentLocationRequestRef.current = null;
      requestCurrentLocationRef.current = () => undefined;
      currentLocationControlRef.current?.remove();
      currentLocationControlRef.current = null;
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.map = null;
        currentLocationMarkerRef.current = null;
      }
      currentLocationMarkerLibraryRef.current = null;
      mapOverlayRef.current?.setMap(null);
      mapOverlayRef.current = null;
      mapRef.current = null;
    };
  }, [clearHoveredLocationPreview]);

  const openRecordModal = useCallback(
    (location: LocationOption, visitedItem?: VisitedItem) => {
      setRecordModalPortalTarget(
        getGoogleMapFullscreenPortalTarget(mapElementRef.current),
      );
      setSelectedLocationId(location.id);
      setSelectedVisitedId(visitedItem?.id ?? null);
      setVisitedDate(toVisitedDateInput(visitedItem?.visitedAt ?? ""));
      setNote(visitedItem?.note ?? "");
      setVisitUrl(visitedItem?.url ?? "");
      setShowModal(true);
    },
    [],
  );

  const upsertVisitedItem = useCallback((savedItem: VisitedItem) => {
    setVisited((current) => {
      const nextItems = current.filter((item) => {
        if (item.id === savedItem.id) return false;
        if (savedItem.locationId && item.locationId === savedItem.locationId) {
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
  }, []);

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
        isLocationPopupOpenRef.current = false;
        infoWindowRef.current?.close?.();
        leafletMapRef.current?.closePopup();
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

  const recordLocationVisit = useCallback(
    (location: LocationOption, visitedItem?: VisitedItem) => {
      if (!isSignedIn) {
        void signIn("google", { callbackUrl: "/seichi-map" });
        return;
      }

      openRecordModal(location, visitedItem);
    },
    [isSignedIn, openRecordModal],
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
      content.className = "seichi-map-popup";
      content.style.color = "#212529";
      content.style.fontFamily =
        "var(--mantine-font-family, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)";
      content.style.fontSize = "13px";
      content.style.fontWeight = "500";
      content.style.lineHeight = "1.55";

      const body = document.createElement("div");
      body.className = "seichi-map-popup__body";
      const scrollContainer = document.createElement("div");
      scrollContainer.className = "seichi-map-popup__scroll-area";

      const title = document.createElement("strong");
      title.style.color = "#1a1b1e";
      title.style.display = "block";
      title.style.fontSize = "15px";
      title.style.fontWeight = "700";
      title.style.lineHeight = "1.45";
      title.textContent = location.name;
      body.appendChild(title);

      const folder = document.createElement("div");
      folder.textContent = location.folder;
      folder.style.marginTop = "4px";
      folder.style.fontSize = "12px";
      folder.style.fontWeight = "600";
      folder.style.color = "#868e96";
      body.appendChild(folder);

      if (location.uniqueVisitorCount > 0) {
        const visitorSummary = document.createElement("div");
        visitorSummary.style.color = "#2b8a3e";
        visitorSummary.style.fontSize = "12px";
        visitorSummary.style.fontWeight = "700";
        visitorSummary.style.marginTop = "2px";

        if (
          location.uniqueVisitorCount === 1 &&
          location.singleVisitorNickname
        ) {
          visitorSummary.className = "seichi-map-popup__single-visitor";
          visitorSummary.style.alignItems = "center";
          visitorSummary.style.display = "flex";
          visitorSummary.style.gap = "4px";
          visitorSummary.setAttribute(
            "aria-label",
            t("popup.singleVisitorAccessibleLabel", {
              nickname: location.singleVisitorNickname,
            }),
          );

          const nickname = document.createElement("span");
          nickname.textContent = location.singleVisitorNickname;
          visitorSummary.append(createLuCrownIconElement(), nickname);
        } else {
          visitorSummary.className = "seichi-map-popup__visitor-count";
          visitorSummary.textContent = t("popup.uniqueVisitors", {
            count: location.uniqueVisitorCount,
          });
        }

        body.appendChild(visitorSummary);
      }

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
        body.appendChild(visitedStatus);
      }

      if (displayDescription) {
        const description = document.createElement("div");
        description.style.marginTop = "10px";
        description.style.fontSize = "13px";
        description.style.fontWeight = "500";
        description.style.lineHeight = "1.55";
        description.style.whiteSpace = "normal";
        appendLinkedText(description, displayDescription);
        body.appendChild(description);
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
        body.appendChild(card);
      });

      // 主な操作（記録・旅程）を上の1行に、補助の操作（地図・投稿・詳細記録・削除）を下の文字リンクにまとめる
      const actions = document.createElement("div");
      actions.className = "seichi-map-popup__actions";
      const primaryRow = document.createElement("div");
      primaryRow.className = "seichi-map-popup__primary";
      const secondaryRow = document.createElement("div");
      secondaryRow.className = "seichi-map-popup__secondary";

      if (!isSharedView) {
        const recordButton = document.createElement("button");
        recordButton.type = "button";
        recordButton.textContent = visitedItem
          ? t("popup.editVisit")
          : t("popup.recordVisit");
        recordButton.style.cursor = "pointer";
        recordButton.style.flex = "1 1 auto";
        styleInfoWindowButton(recordButton, visitedItem ? "light" : "filled");
        recordButton.style.height = "36px";
        recordButton.addEventListener("click", () => {
          if (visitedItem) {
            recordLocationVisit(location, visitedItem);
            return;
          }
          quickRecordVisitRef.current(location);
        });
        if (visitedItem) {
          primaryRow.appendChild(recordButton);
        } else {
          // 「訪問を記録」（一発記録）と、日付・メモ付きで記録する鉛筆を1つのボタンのようにつなげる
          recordButton.style.borderRadius = "6px 0 0 6px";
          const detailsButton = document.createElement("button");
          detailsButton.type = "button";
          detailsButton.setAttribute(
            "aria-label",
            t("popup.recordWithDetails"),
          );
          detailsButton.title = t("popup.recordWithDetails");
          detailsButton.style.cursor = "pointer";
          styleInfoWindowButton(detailsButton, "filled");
          detailsButton.style.borderRadius = "0 6px 6px 0";
          detailsButton.style.borderInlineStart =
            "1px solid rgba(255, 255, 255, 0.45)";
          detailsButton.style.height = "36px";
          detailsButton.style.padding = "0";
          detailsButton.style.width = "36px";
          detailsButton.style.flex = "0 0 auto";
          detailsButton.appendChild(createPencilIconElement());
          detailsButton.addEventListener("click", () => {
            recordLocationVisit(location);
          });
          const split = document.createElement("div");
          split.className = "seichi-map-popup__split";
          split.append(recordButton, detailsButton);
          primaryRow.appendChild(split);
        }
      }

      const itineraryButton = document.createElement("button");
      itineraryButton.type = "button";
      const isInItinerary = itineraryLocationIdsRef.current.has(location.id);
      itineraryButton.textContent = isInItinerary
        ? t("popup.inItinerary")
        : t("popup.addToItinerary");
      itineraryButton.disabled = isInItinerary;
      itineraryButton.style.cursor = isInItinerary ? "default" : "pointer";
      itineraryButton.style.opacity = isInItinerary ? "0.65" : "1";
      itineraryButton.style.flex = isSharedView ? "1 1 auto" : "0 0 auto";
      styleInfoWindowButton(itineraryButton, "light", "cyan");
      itineraryButton.style.height = "36px";
      itineraryButton.addEventListener("click", () => {
        addLocationToItinerary(location.id);
        itineraryButton.disabled = true;
        itineraryButton.style.cursor = "default";
        itineraryButton.style.opacity = "0.65";
        itineraryButton.textContent = t("popup.inItinerary");
      });
      primaryRow.appendChild(itineraryButton);

      const mapsLink = document.createElement("a");
      mapsLink.href = buildGoogleMapsSearchUrl(location);
      mapsLink.target = "_blank";
      mapsLink.rel = "noopener noreferrer";
      mapsLink.className = "seichi-map-popup__link";
      mapsLink.textContent = t("popup.googleMaps");
      secondaryRow.appendChild(mapsLink);

      const xPostLink = document.createElement("a");
      xPostLink.href = buildDokoAzPostUrl(location.name);
      xPostLink.target = "_blank";
      xPostLink.rel = "noopener noreferrer";
      xPostLink.className =
        "seichi-map-popup__link seichi-map-popup__link--icon";
      xPostLink.setAttribute("aria-label", t("popup.postDokoAz"));
      xPostLink.title = t("popup.postDokoAz");
      xPostLink.appendChild(createXLogoIconElement());
      primaryRow.appendChild(xPostLink);

      if (canEditVisits && visitedItem) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className =
          "seichi-map-popup__link seichi-map-popup__link--danger";
        deleteButton.textContent = t("popup.deleteVisited");
        deleteButton.addEventListener("click", () => {
          void deleteVisited(visitedItem.id);
        });
        secondaryRow.appendChild(deleteButton);
      }

      actions.append(primaryRow, secondaryRow);

      // Keep content available for the map's initial popup size measurement.
      scrollContainer.appendChild(body);
      content.append(scrollContainer, actions);
      setPopupScrollContent({ container: scrollContainer, body });
      return content;
    },
    [
      archiveVideoMetaById,
      addLocationToItinerary,
      canEditVisits,
      deleteVisited,
      getVisitedItemForLocation,
      isSharedView,
      recordLocationVisit,
      t,
    ],
  );

  const quickRecordVisit = useCallback(
    async (location: LocationOption) => {
      if (isSharedView) return;
      if (!isSignedIn) {
        void signIn("google", { callbackUrl: "/seichi-map" });
        return;
      }
      const existing = getVisitedItemForLocation(location);
      if (existing) {
        openRecordModal(location, existing);
        return;
      }

      const refreshPopup = (item?: VisitedItem) => {
        const content = createInfoWindowContent(location, item);
        infoWindowRef.current?.setContent(content);
        leafletPopupRef.current?.setContent(content);
        mapOverlayRef.current?.draw();
      };

      try {
        const payload = await saveSeichiMapVisit<
          VisitedItem,
          SeichiMapUnlockedAchievement
        >(
          {
            locationId: location.id,
            locationName: location.name,
            visitedDate: toLocalDateInputValue(new Date()),
            note: "",
            url: "",
          },
          {
            saveFailed: t("errors.saveFailed"),
            updateFailed: t("errors.updateFailed"),
          },
        );
        handleAchievementsUnlocked(payload.unlockedAchievements);
        const saved = payload.item;
        if (!saved) return;
        upsertVisitedItem(saved);
        refreshPopup(saved);

        const notificationId = `seichi-map-quick-record-${saved.id}`;
        notifications.show({
          id: notificationId,
          color: "pink",
          title: t("quickRecord.saved"),
          autoClose: 8000,
          message: (
            <Stack gap={6}>
              <Text size="sm" lineClamp={2}>
                {location.name}
              </Text>
              <Group gap="xs">
                <Button
                  size="compact-xs"
                  variant="light"
                  color="gray"
                  onClick={() => {
                    notifications.hide(notificationId);
                    void deleteSeichiMapVisit(
                      saved.id,
                      t("errors.deleteFailed"),
                    )
                      .then(() => {
                        setVisited((current) =>
                          current.filter((item) => item.id !== saved.id),
                        );
                        refreshPopup();
                      })
                      .catch((error) => {
                        console.error(error);
                        setErrorMessage(
                          error instanceof Error
                            ? error.message
                            : t("errors.deleteFailed"),
                        );
                      });
                  }}
                >
                  {t("quickRecord.undo")}
                </Button>
                <Button
                  size="compact-xs"
                  variant="light"
                  color="pink"
                  onClick={() => {
                    notifications.hide(notificationId);
                    openRecordModal(location, saved);
                  }}
                >
                  {t("quickRecord.addNote")}
                </Button>
              </Group>
            </Stack>
          ),
        });
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error ? error.message : t("errors.saveFailed"),
        );
      }
    },
    [
      createInfoWindowContent,
      getVisitedItemForLocation,
      handleAchievementsUnlocked,
      isSharedView,
      isSignedIn,
      openRecordModal,
      t,
      upsertVisitedItem,
    ],
  );

  useEffect(() => {
    quickRecordVisitRef.current = (location) => {
      void quickRecordVisit(location);
    };
  }, [quickRecordVisit]);

  // 訪問記録が変わったら、開いているポップアップの内容（「訪問を記録」か「編集」か）も更新する。
  // 記録・編集・削除・取り消しのどの経路でも、また記録の読み込みが後から終わった場合でも揃うようにする。
  useEffect(() => {
    const locationId = selectedLocationIdRef.current;
    if (!locationId || !isLocationPopupOpenRef.current) return;
    const location = locationById.get(locationId);
    if (!location) return;
    const content = createInfoWindowContent(location);
    leafletPopupRef.current?.setContent(content);
    infoWindowRef.current?.setContent(content);
    // visited の変化だけを契機にする（popup の内容は createInfoWindowContent が最新の状態から作る）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visited]);

  const openLocationInfoWindow = useCallback(
    (location: LocationOption, options?: { keepSheet?: boolean }) => {
      // lg 未満ではシートが地図の下側を覆うので、ピンを選んだらシートを畳み、
      // ポップアップがシートの陰に入らないよう自動パンの余白を取る
      const isSheetLayout =
        window.matchMedia?.("(max-width: 74.99em)").matches ?? false;
      // 一覧から選んだ場合は、続けて一覧を操作できるようシートを開いたままにする
      if (isSheetLayout && !options?.keepSheet) setSheetSnap("peek");
      isLocationPopupOpenRef.current = true;

      if (isLeafletMapProvider(mapProvider)) {
        const map = leafletMapRef.current;
        const leaflet = leafletApiRef.current;
        if (!map || !leaflet) return;

        const popup = leaflet
          .popup(
            isSheetLayout
              ? {
                  autoPanPaddingTopLeft: [16, 16],
                  autoPanPaddingBottomRight: [16, 176],
                }
              : undefined,
          )
          .setLatLng([location.latitude, location.longitude])
          .setContent(createInfoWindowContent(location));
        leafletPopupRef.current = popup;
        popup.openOn(map);
        setSelectedLocationId(location.id);
        return;
      }

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
    [createInfoWindowContent, mapProvider],
  );

  useEffect(() => {
    openLocationInfoWindowRef.current = openLocationInfoWindow;
  }, [openLocationInfoWindow]);

  useEffect(() => {
    getMarkerPresentationRef.current = getMarkerPresentation;
    mapOverlayRef.current?.draw();
  }, [getMarkerPresentation]);

  useEffect(() => {
    selectedLocationIdRef.current = selectedLocationId;
    mapOverlayRef.current?.setSelectedLocationId(selectedLocationId);
    if (!selectedLocationId && !isLocationPopupOpenRef.current) {
      setPopupScrollContent(null);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    if (!mapReady || mapLoading) return;
    mapOverlayRef.current?.setLocations(mapLocations);
  }, [mapLoading, mapProvider, mapReady, mapLocations]);

  useEffect(() => {
    if (!isLeafletMapProvider(mapProvider) || !mapReady || mapLoading) return;
    const leaflet = leafletApiRef.current;
    const map = leafletMapRef.current;
    const markerLayer = leafletMarkerLayerRef.current;
    const canvasRenderer = leafletCanvasRendererRef.current;
    if (!leaflet || !map || !markerLayer || !canvasRenderer) return;

    markerLayer.clearLayers();
    const locationsInPaintOrder = mapLocations
      .map((location) => ({
        location,
        presentation: getMarkerPresentation(location),
      }))
      .sort((left, right) =>
        compareSeichiMapMarkerPresentations(
          left.presentation,
          right.presentation,
        ),
      );

    for (const { location, presentation } of locationsInPaintOrder) {
      const selected = location.id === selectedLocationId;
      const marker = leaflet.circleMarker(
        [location.latitude, location.longitude],
        {
          renderer: canvasRenderer,
          radius: selected ? 8 : 6,
          color: selected ? presentation.color : "#ffffff",
          weight: selected ? 3 : 2,
          fillColor: presentation.color,
          fillOpacity: 1,
        },
      );
      marker.on("click", (event) => {
        leaflet.DomEvent.stopPropagation(event);
        openLocationInfoWindowRef.current(location);
      });
      marker.on("mouseover", () => {
        if (isMapDraggingRef.current) return;
        const point = map.latLngToContainerPoint([
          location.latitude,
          location.longitude,
        ]);
        setHoveredLocation({ name: location.name, x: point.x, y: point.y });
      });
      marker.on("mouseout", () => setHoveredLocation(null));
      marker.addTo(markerLayer);
    }
  }, [
    getMarkerPresentation,
    mapLoading,
    mapProvider,
    mapReady,
    selectedLocationId,
    mapLocations,
  ]);

  useEffect(() => {
    if (!selectedLocation) return;
    if (
      hiddenLayerNameSet.has(
        getLocationLayerName(selectedLocation, uncategorizedLayerName),
      )
    ) {
      isLocationPopupOpenRef.current = false;
      setSelectedLocationId(null);
      infoWindowRef.current?.close();
      leafletMapRef.current?.closePopup();
      setHoveredLocation(null);
    }
  }, [hiddenLayerNameSet, selectedLocation, uncategorizedLayerName]);

  const showLocationOnMap = useCallback(
    (location: LocationOption) => {
      if (isLeafletMapProvider(mapProvider)) {
        const map = leafletMapRef.current;
        if (!map) return;

        setSelectedLocationId(location.id);
        map.setView(
          [location.latitude, location.longitude],
          Math.max(map.getZoom(), 12),
        );
        openLocationInfoWindow(location, { keepSheet: true });
        return;
      }

      const map = mapRef.current;
      if (!map) return;

      setSelectedLocationId(location.id);
      map.panTo({ lat: location.latitude, lng: location.longitude });
      map.setZoom(Math.max(map.getZoom() ?? DEFAULT_MAP_ZOOM, 12));
      openLocationInfoWindow(location, { keepSheet: true });
    },
    [mapProvider, openLocationInfoWindow],
  );

  useEffect(() => {
    if (!initialLocationId || !mapReady || locationsLoading) return;
    if (focusedInitialLocationIdRef.current === initialLocationId) return;

    const location = locationById.get(initialLocationId);
    if (!location) {
      focusedInitialLocationIdRef.current = initialLocationId;
      return;
    }

    const layerName = getLocationLayerName(location, uncategorizedLayerName);
    if (hiddenLayerNameSet.has(layerName)) {
      setHiddenLayerNames((current) =>
        current.filter((name) => name !== layerName),
      );
      return;
    }

    focusedInitialLocationIdRef.current = initialLocationId;
    setListMode("locations");
    showLocationOnMap(location);
  }, [
    hiddenLayerNameSet,
    initialLocationId,
    locationsLoading,
    locationById,
    mapReady,
    showLocationOnMap,
    uncategorizedLayerName,
  ]);

  const handleListModeChange = useCallback(
    (value: string) => {
      const nextMode = value as ListMode;
      setListMode(nextMode);
      if (nextMode === "nearby") {
        requestCurrentLocation();
      }
    },
    [requestCurrentLocation],
  );

  const openItineraryLocation = useCallback(
    (locationId: string) => {
      const location = locationById.get(locationId);
      if (!location) return;
      const layerName = getLocationLayerName(location, uncategorizedLayerName);
      if (hiddenLayerNameSet.has(layerName)) {
        setHiddenLayerNames((current) =>
          current.filter((name) => name !== layerName),
        );
      }
      showLocationOnMap(location);
    },
    [
      hiddenLayerNameSet,
      locationById,
      showLocationOnMap,
      uncategorizedLayerName,
    ],
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
      const payload = await saveSeichiMapVisit<
        VisitedItem,
        SeichiMapUnlockedAchievement
      >(
        {
          id: selectedVisitedId ?? undefined,
          locationId: selectedLocation.id,
          locationName: selectedLocation.name,
          visitedDate,
          note,
          url: visitUrl,
        },
        {
          saveFailed: t("errors.saveFailed"),
          updateFailed: t("errors.updateFailed"),
        },
      );
      handleAchievementsUnlocked(payload.unlockedAchievements);
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
        upsertVisitedItem(savedItem);
        const savedContent = createInfoWindowContent(
          selectedLocation,
          savedItem,
        );
        infoWindowRef.current?.setContent(savedContent);
        leafletPopupRef.current?.setContent(savedContent);
        mapOverlayRef.current?.draw();
      }

      setShowModal(false);
      setRecordModalPortalTarget(null);
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

  const resetProfileDraft = useCallback(() => {
    setProfileNickname(
      resolveSeichiMapNicknameDraft(profileInfo?.nickname, shareInfo?.nickname),
    );
    setShowNicknameInRanking(profileInfo?.showNicknameInRanking ?? true);
    setProfileErrorMessage(null);
  }, [profileInfo, shareInfo]);

  const openSettingsModal = useCallback(() => {
    resetProfileDraft();
    setShowSettingsModal(true);
  }, [resetProfileDraft]);

  const openShareModal = useCallback(() => {
    resetProfileDraft();
    setShareUrl(shareInfo ? buildSeichiMapShareUrl(shareInfo.shareId) : "");
    setShareCopied(false);
    setShowShareModal(true);
  }, [resetProfileDraft, shareInfo]);

  const handleOpenSettings = useCallback(() => {
    if (isSignedIn) {
      openSettingsModal();
      return;
    }
    void signIn("google", {
      callbackUrl: buildSettingsCallbackUrl(window.location.href),
    });
  }, [isSignedIn, openSettingsModal]);

  const handleOpenShare = useCallback(() => {
    if (isSignedIn) {
      openShareModal();
      return;
    }
    void signIn("google", { callbackUrl: window.location.href });
  }, [isSignedIn, openShareModal]);

  useEffect(() => {
    if (!isSignedIn || isSharedView) return;
    const nextUrl = consumeSettingsRequestFromUrl(window.location.href);
    if (!nextUrl) return;
    window.history.replaceState(window.history.state, "", nextUrl);
    openSettingsModal();
  }, [isSharedView, isSignedIn, openSettingsModal]);

  const saveProfileSettings = useCallback(async () => {
    const nickname = profileNickname.trim();
    if (!nickname) {
      setProfileErrorMessage(t("errors.profileNicknameRequired"));
      return;
    }

    setProfileSubmitting(true);
    setProfileErrorMessage(null);
    try {
      const response = await fetch("/api/seichi-map/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, showNicknameInRanking }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        item?: ProfileInfo;
        error?: string;
      };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error || t("errors.profileSaveFailed"));
      }

      setProfileInfo(payload.item);
      setProfileLookupCompleted(true);
      setProfileNickname(payload.item.nickname);
      setShowNicknameInRanking(payload.item.showNicknameInRanking);
      setShareInfo((current) =>
        current
          ? {
              ...current,
              nickname: payload.item!.nickname,
              updatedAt: payload.item!.updatedAt,
            }
          : current,
      );
      setShowSettingsModal(false);
    } catch (error) {
      console.error(error);
      setProfileErrorMessage(
        error instanceof Error ? error.message : t("errors.profileSaveFailed"),
      );
    } finally {
      setProfileSubmitting(false);
    }
  }, [profileNickname, showNicknameInRanking, t]);

  const saveShareSettings = useCallback(async () => {
    const nickname = profileNickname.trim();
    if (!nickname) {
      setProfileErrorMessage(t("errors.profileNicknameRequired"));
      return;
    }

    setShareSubmitting(true);
    setProfileErrorMessage(null);
    try {
      const response = await fetch("/api/seichi-map/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, showNicknameInRanking }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error || t("errors.shareSaveFailed"));
      }

      const payload = (await response.json().catch(() => ({}))) as {
        item?: ShareInfo;
        profile?: ProfileInfo;
      };
      if (!payload.item || !payload.profile) {
        throw new Error(t("errors.shareSaveFailed"));
      }

      setShareInfo(payload.item);
      setProfileInfo(payload.profile);
      setProfileLookupCompleted(true);
      setProfileNickname(payload.profile.nickname);
      setShowNicknameInRanking(payload.profile.showNicknameInRanking);
      setShareUrl(buildSeichiMapShareUrl(payload.item.shareId));
      setShareCopied(false);
    } catch (error) {
      console.error(error);
      setProfileErrorMessage(
        error instanceof Error ? error.message : t("errors.shareSaveFailed"),
      );
    } finally {
      setShareSubmitting(false);
    }
  }, [profileNickname, showNicknameInRanking, t]);

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

  const renderMobileLocationActions = (location: LocationOption) => {
    const visitedItem = getVisitedItemForLocation(location);
    const isInItinerary = itineraryLocationIds.has(location.id);

    // 主な操作（記録・旅程）を上の1行に、補助の操作を下の文字リンクにまとめる（地図のポップアップと同じ構成）。
    // ボトムシート表示（lg 未満）の間は、地図のポップアップがシートの陰に入るので、行の下にも操作を出す。
    return (
      <Stack className="seichi-map-list-actions" gap={4} hiddenFrom="lg" p="xs">
        <Group gap="xs" wrap="nowrap">
          {!isSharedView ? (
            visitedItem ? (
              <Button
                variant="light"
                color="pink"
                style={{ flex: 1 }}
                onClick={() => recordLocationVisit(location, visitedItem)}
              >
                {t("popup.editVisit")}
              </Button>
            ) : (
              // 「訪問を記録」（一発記録）と、日付・メモ付きで記録する鉛筆を1つのボタンのようにつなげる
              <Button.Group style={{ flex: 1 }}>
                <Button
                  variant="filled"
                  color="pink"
                  style={{ flex: 1 }}
                  onClick={() => void quickRecordVisit(location)}
                >
                  {t("popup.recordVisit")}
                </Button>
                <Button
                  variant="filled"
                  color="pink"
                  px="xs"
                  aria-label={t("popup.recordWithDetails")}
                  title={t("popup.recordWithDetails")}
                  onClick={() => recordLocationVisit(location)}
                >
                  <FiEdit3 size={14} aria-hidden="true" />
                </Button>
              </Button.Group>
            )
          ) : null}
          <Button
            variant="light"
            color="cyan"
            style={isSharedView ? { flex: 1 } : undefined}
            disabled={isInItinerary}
            onClick={() => addLocationToItinerary(location.id)}
          >
            {isInItinerary ? t("popup.inItinerary") : t("popup.addToItinerary")}
          </Button>
          <ActionIcon
            component="a"
            href={buildDokoAzPostUrl(location.name)}
            target="_blank"
            rel="noopener noreferrer"
            variant="filled"
            color="dark"
            size={30}
            aria-label={t("popup.postDokoAz")}
            title={t("popup.postDokoAz")}
          >
            <FaXTwitter size={14} aria-hidden="true" />
          </ActionIcon>
        </Group>
        <Group gap="md" wrap="wrap" justify="flex-start">
          <Anchor
            href={buildGoogleMapsSearchUrl(location)}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            fw={600}
            c="dimmed"
            underline="hover"
            className="inline-flex items-center gap-1"
          >
            {t("popup.googleMaps")}
            <FiExternalLink size={11} aria-hidden="true" />
          </Anchor>

          {canEditVisits && visitedItem ? (
            <Anchor
              component="button"
              type="button"
              size="xs"
              fw={600}
              c="red.7"
              underline="hover"
              ml="auto"
              onClick={() => void deleteVisited(visitedItem.id)}
            >
              {t("popup.deleteVisited")}
            </Anchor>
          ) : null}
        </Group>
      </Stack>
    );
  };

  const quickRecordButton = (location: LocationOption) => (
    <Tooltip label={t("popup.recordVisit")} withArrow>
      <ActionIcon
        component="span"
        role="button"
        tabIndex={0}
        variant="subtle"
        color="gray"
        size="md"
        aria-label={t("quickRecord.rowLabel", { name: location.name })}
        onClick={(event: React.MouseEvent) => {
          event.stopPropagation();
          void quickRecordVisit(location);
        }}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          void quickRecordVisit(location);
        }}
      >
        <FiCircle size={18} />
      </ActionIcon>
    </Tooltip>
  );

  // 一覧の右端のチェック。訪問済みは緑のチェック、未訪問は空の丸（押すと記録）。同じ大きさの枠に入れて右端をそろえる
  const renderVisitMark = (location: LocationOption, visited: boolean) =>
    visited ? (
      <ThemeIcon
        variant="transparent"
        color="green"
        size="md"
        role="img"
        aria-label={t("list.visitedBadge")}
      >
        <FiCheckCircle size={18} />
      </ThemeIcon>
    ) : canEditVisits ? (
      quickRecordButton(location)
    ) : null;

  const visitFilterMenu = canViewVisitedList ? (
    <SeichiMapVisitFilterMenu
      value={visitFilter}
      onChange={changeVisitFilter}
      label={t("filter.label")}
      badge={{
        active: badgeFilter !== null,
        pickLabel: t("badgeFilter.pick"),
        clearLabel: t("badgeFilter.clear"),
        onPick: achievementData?.ready
          ? () => setShowAchievementsModal(true)
          : undefined,
        onClear: clearBadgeFilter,
      }}
      options={[
        { value: "all", label: t("filter.all") },
        {
          value: "unvisited",
          label: t("filter.unvisited", {
            count: completion.total - completion.done,
          }),
        },
        {
          value: "visited",
          label: t("filter.visited", { count: completion.done }),
        },
      ]}
    />
  ) : null;

  const shownCompletion = badgeCompletion ?? completion;
  const badgeFilterChip = badgeFilter ? (
    <Pill
      size="sm"
      withRemoveButton
      onRemove={clearBadgeFilter}
      removeButtonProps={{ "aria-label": t("badgeFilter.clear") }}
      style={{ maxWidth: "60%" }}
    >
      {pickSeichiMapLocalizedText(badgeFilter.name, locale)}
    </Pill>
  ) : null;

  const layerSummaryLabel = t("layers.summary", {
    visible: layerNames.length - hiddenVisibleLayerCount,
    total: layerNames.length,
  });
  const layerButton =
    layerNames.length > 0 && !badgeFilter ? (
      <Indicator
        color="pink"
        size={8}
        offset={3}
        disabled={hiddenVisibleLayerCount === 0}
      >
        <ActionIcon
          variant="light"
          color="gray"
          aria-label={layerSummaryLabel}
          title={layerSummaryLabel}
          onClick={() => setIsLayerDialogOpen(true)}
        >
          <FiLayers size={16} />
        </ActionIcon>
      </Indicator>
    ) : null;

  const achievementPlayerCard = achievementProfile ? (
    <SeichiMapPlayerCard
      profile={achievementProfile}
      onClick={handleOpenAchievements}
      label={
        isSharedView
          ? t("achievements.openOf", { name: sharedViewNickname })
          : t("achievements.open")
      }
    />
  ) : null;

  return (
    <main className="grow overflow-auto px-2 pt-3 pb-0 sm:px-6 sm:py-5 lg:p-6 lg:pb-0">
      {popupScrollContent && (
        <SeichiMapPopupScrollArea {...popupScrollContent} />
      )}
      <div ref={stageTopRef}>
        <Breadcrumbs
          aria-label="Breadcrumb"
          className={breadcrumbClasses.root}
          visibleFrom="sm"
          separator={<HiChevronRight className={breadcrumbClasses.separator} />}
        >
          <Link href="/" className={breadcrumbClasses.link}>
            <HiHome className="mr-1.5 h-4 w-4" /> HOME
          </Link>
          <Link href="/seichi-map" className={breadcrumbClasses.link}>
            {t("breadcrumb")}
          </Link>
        </Breadcrumbs>

        <Group
          className="px-1 sm:px-0"
          justify="space-between"
          align="flex-start"
          wrap="nowrap"
          gap="xs"
          mb={{ base: "xs", sm: 0 }}
        >
          <Box style={{ minWidth: 0 }}>
            <h1 className={`${pageClasses.heading} max-sm:mb-0 max-sm:text-xl`}>
              {pageTitle}
            </h1>
            <p className={`${pageClasses.description} hidden sm:block`}>
              {pageDescription}
            </p>
          </Box>
          <SeichiMapHeaderActions
            isSharedView={isSharedView}
            playerCard={achievementPlayerCard}
            onOpenSettings={handleOpenSettings}
            onOpenShare={handleOpenShare}
            showNicknamePrompt={showNicknamePrompt}
          />
        </Group>

        <Group
          className="px-1 sm:px-0"
          justify="space-between"
          align="flex-start"
          wrap="nowrap"
          gap="xs"
          mb="sm"
        >
          <Text size="xs" c="dimmed">
            {t("credit.prefix")}
            <Anchor
              href="https://note.com/yspione/n/nccf2fbbdc0dc"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("credit.linkLabel")}
            </Anchor>
            {t("credit.suffix")}
            <span aria-hidden="true"> · </span>
            <Anchor
              href="https://www.geoguessr.com/ja/maps/69b79020d61d81a4c952ba6e"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 align-bottom"
            >
              {t("geoguessr.open")}
              <FiExternalLink size={12} aria-hidden="true" />
            </Anchor>
          </Text>
          {userCount !== null ? (
            <Badge variant="light" color="gray" size="sm" className="shrink-0">
              {t("usage.userCount", { count: userCount })}
            </Badge>
          ) : null}
        </Group>

        <SeichiMapAdminTools>
          <SeichiMapIdentityAdmin onReload={loadData} />
          <SeichiMapAchievementAdmin />
        </SeichiMapAdminTools>
        <SeichiMapAchievementsModal
          opened={showAchievementsModal}
          onClose={() => setShowAchievementsModal(false)}
          data={achievementData}
          loading={achievementsLoading}
          error={achievementsError}
          editable={canEditVisits}
          ownerName={isSharedView ? sharedViewNickname : null}
          titleUpdating={achievementTitleUpdating}
          onSelectTitle={(selection) => void updateAchievementTitle(selection)}
          onFilterMap={(achievement) => {
            setShowAchievementsModal(false);
            setListMode("locations");
            setSheetSnap((current) => (current === "peek" ? "half" : current));
            void startBadgeFilter(achievement);
          }}
        />

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

        {!isSignedIn && !isSharedView ? (
          <Alert
            mb="sm"
            color="pink"
            variant="light"
            py="xs"
            icon={<FiLogIn size={16} />}
          >
            <Group justify="space-between" gap="xs" wrap="wrap">
              <Text size="sm" style={{ flex: "1 1 12rem" }}>
                {t("alerts.loginRequired")}
              </Text>
              <Button
                color="pink"
                size="compact-sm"
                className="shrink-0"
                onClick={() =>
                  void signIn("google", { callbackUrl: "/seichi-map" })
                }
              >
                {t("alerts.login")}
              </Button>
            </Group>
          </Alert>
        ) : null}

        {achievementPlayerCard ? (
          <Box hiddenFrom="lg" mb="xs">
            {achievementPlayerCard}
          </Box>
        ) : null}
      </div>

      <div
        ref={stageRef}
        className={classes.stage}
        style={
          stageTop === null
            ? undefined
            : ({
                "--stage-top": `${stageTop}px`,
                ...(stageRoom === null
                  ? {}
                  : { "--stage-room": `${stageRoom}px` }),
              } as React.CSSProperties)
        }
      >
        <Paper
          ref={mapContainerRef}
          withBorder
          radius="md"
          shadow="sm"
          className={`seichi-map-fullscreen-surface relative isolate overflow-hidden bg-white/90 dark:bg-gray-900/80${
            isViewportMapFullscreen
              ? " seichi-map-fullscreen-surface--viewport"
              : ""
          }`}
          data-viewport-fullscreen={
            isViewportMapFullscreen ? "true" : undefined
          }
          data-point-layer={effectivePointLayer}
        >
          <Box
            className={`seichi-map-provider-control seichi-map-provider-control--${
              mapProvider === "google" ? "google" : "leaflet"
            } absolute right-3 flex flex-col items-end`}
            style={{
              top: mapProvider === "google" ? 56 : 12,
              right: 12,
              zIndex: 1000,
            }}
          >
            <Button
              variant="white"
              color="gray"
              size="sm"
              px={0}
              className="h-11 w-11 p-0 shadow-md"
              aria-label={t("mapProvider.openMenu")}
              title={t("mapProvider.openMenu")}
              onClick={() => setIsMapProviderMenuOpen((isOpen) => !isOpen)}
            >
              <FiLayers size={22} aria-hidden="true" />
            </Button>
            {isMapProviderMenuOpen ? (
              <Paper
                withBorder
                radius="sm"
                shadow="md"
                p="xs"
                mt={6}
                miw={230}
                className="bg-white/95 dark:bg-gray-900/95"
              >
                <Text size="xs" fw={700} mb={4}>
                  {t("mapProvider.title")}
                </Text>
                <Stack gap={2}>
                  <Radio
                    checked={mapProvider === "gsi"}
                    label={t("mapProvider.gsi")}
                    onChange={() => selectMapProvider("gsi")}
                  />
                  <Radio
                    checked={mapProvider === "osm"}
                    label={t("mapProvider.osm")}
                    onChange={() => selectMapProvider("osm")}
                  />
                  <Radio
                    checked={mapProvider === "google"}
                    label={t("mapProvider.google")}
                    disabled={!mapsKey}
                    onChange={() => selectMapProvider("google")}
                  />
                </Stack>
                {!mapsKey ? (
                  <Text size="xs" c="dimmed" mt={6}>
                    {t("mapProvider.googleUnavailable")}
                  </Text>
                ) : null}
                {!isSharedView ? (
                  <>
                    <Divider my="xs" />
                    <Text size="xs" fw={700} mb={4}>
                      {t("pointLayer.title")}
                    </Text>
                    <Radio.Group
                      name="seichi-map-point-layer"
                      value={pointLayer}
                      aria-label={t("pointLayer.title")}
                      onChange={(value) => {
                        if (value === "self" || value === "everyone") {
                          setPointLayer(value);
                        }
                      }}
                    >
                      <Stack gap={2}>
                        <Radio value="self" label={t("pointLayer.self")} />
                        <Radio
                          value="everyone"
                          label={t("pointLayer.everyone")}
                        />
                      </Stack>
                    </Radio.Group>
                    <Stack
                      gap={4}
                      mt="xs"
                      aria-label={t("pointLayer.legend.title")}
                    >
                      <Text size="xs" fw={600} c="dimmed">
                        {t("pointLayer.legend.title")}
                      </Text>
                      <Group gap="xs" wrap="wrap">
                        {pointLayer === "self" ? (
                          <>
                            <Group gap={4} wrap="nowrap">
                              <Box
                                w={10}
                                h={10}
                                aria-hidden="true"
                                style={{
                                  borderRadius: "50%",
                                  backgroundColor: SEICHI_MAP_UNVISITED_COLOR,
                                }}
                              />
                              <Text size="xs" c="dimmed">
                                {t("pointLayer.legend.unvisited")}
                              </Text>
                            </Group>
                            <Group gap={4} wrap="nowrap">
                              <Box
                                w={10}
                                h={10}
                                aria-hidden="true"
                                style={{
                                  borderRadius: "50%",
                                  backgroundColor:
                                    SEICHI_MAP_SELF_VISITED_COLOR,
                                }}
                              />
                              <Text size="xs" c="dimmed">
                                {t("pointLayer.legend.visited")}
                              </Text>
                            </Group>
                          </>
                        ) : (
                          <>
                            <Group gap={4} wrap="nowrap">
                              <Box
                                w={10}
                                h={10}
                                aria-hidden="true"
                                style={{
                                  borderRadius: "50%",
                                  backgroundColor: SEICHI_MAP_UNVISITED_COLOR,
                                }}
                              />
                              <Text size="xs" c="dimmed">
                                {t("pointLayer.legend.none")}
                              </Text>
                            </Group>
                            <Group gap={4} wrap="nowrap">
                              <Box
                                w={10}
                                h={10}
                                aria-hidden="true"
                                style={{
                                  borderRadius: "50%",
                                  backgroundColor:
                                    SEICHI_MAP_EVERYONE_SINGLE_VISITOR_COLOR,
                                }}
                              />
                              <Text size="xs" c="dimmed">
                                {t("pointLayer.legend.one")}
                              </Text>
                            </Group>
                            <Group gap={4} wrap="nowrap">
                              <Box
                                w={24}
                                h={10}
                                aria-hidden="true"
                                style={{
                                  borderRadius: 999,
                                  background: `linear-gradient(90deg, ${SEICHI_MAP_EVERYONE_LIGHT_COLOR}, ${SEICHI_MAP_EVERYONE_DARK_COLOR})`,
                                }}
                              />
                              <Text size="xs" c="dimmed">
                                {t("pointLayer.legend.multiple")}
                              </Text>
                            </Group>
                          </>
                        )}
                      </Group>
                    </Stack>
                  </>
                ) : null}
              </Paper>
            ) : null}
          </Box>
          {showCustomFullscreenControl ? (
            <button
              type="button"
              className={`seichi-map-fullscreen-control seichi-map-fullscreen-control--${
                mapProvider === "google" ? "google" : "leaflet"
              } absolute top-3 z-10 grid h-11 w-11 place-items-center rounded-sm border-0 bg-white text-[#3c4043] shadow-md hover:bg-gray-50 ${
                mapProvider === "google" ? "right-3" : "right-16"
              }`}
              style={{ zIndex: 1000 }}
              title={
                isMapFullscreen ? t("fullscreen.exit") : t("fullscreen.enter")
              }
              aria-label={
                isMapFullscreen ? t("fullscreen.exit") : t("fullscreen.enter")
              }
              aria-pressed={isMapFullscreen}
              onClick={() => void toggleMapFullscreen()}
            >
              {isMapFullscreen ? (
                <FiMinimize size={20} aria-hidden="true" />
              ) : (
                <FiMaximize size={20} aria-hidden="true" />
              )}
            </button>
          ) : null}
          {isLeafletMapProvider(mapProvider) ? (
            <button
              ref={currentLocationControlRef}
              type="button"
              className="seichi-map-current-location-control--leaflet absolute right-3 bottom-3 z-10 grid h-11 w-11 place-items-center rounded-sm border-0 bg-white text-[#3c4043] shadow-md disabled:cursor-wait disabled:opacity-70"
              style={{ zIndex: 1000 }}
              title={t("currentLocation.show")}
              aria-label={t("currentLocation.show")}
              onClick={() => requestCurrentLocationRef.current()}
            >
              <FiMapPin size={20} aria-hidden="true" />
            </button>
          ) : null}
          <Box ref={mapElementRef} className="h-full w-full" />
          {hoveredLocation ? (
            <Box
              className="pointer-events-none absolute z-2 max-w-65 -translate-x-1/2 -translate-y-full rounded-md bg-gray-900/92 px-2.5 py-1.5 text-xs font-semibold leading-tight text-white shadow-lg"
              style={{
                left: hoveredLocation.x,
                top: hoveredLocation.y - 12,
                zIndex: 1000,
              }}
            >
              {hoveredLocation.name}
            </Box>
          ) : null}
          <Box
            className="pointer-events-none absolute inset-0 bg-white/80 dark:bg-gray-900/70"
            style={{
              display: mapLoading || locationsLoading ? "block" : "none",
            }}
          >
            {mapLoading || locationsLoading ? (
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
        <Paper
          withBorder
          radius="md"
          shadow="sm"
          className={classes.sheet}
          data-snap={sheetSnap}
          data-hidden={isMapFullscreen ? "true" : undefined}
        >
          <SeichiMapBottomSheetHandle
            snap={sheetSnap}
            onSnapChange={setSheetSnap}
            label={t("sheet.toggle")}
          />
          <Stack gap="md" className={classes.sheetBody}>
            <Stack gap={4} visibleFrom="lg">
              <Group justify="space-between" align="center">
                <Title order={2} size="h3">
                  {progressTitle}
                </Title>
                <Group gap={6} wrap="nowrap">
                  <Badge variant="light" color="gray">
                    {shownCompletion.done} / {shownCompletion.total}
                  </Badge>
                  {layerButton}
                </Group>
              </Group>
              <Progress
                value={shownCompletion.percent}
                color="pink"
                radius="xl"
                size="lg"
              />
              {badgeFilterChip ? (
                <Group gap="xs">{badgeFilterChip}</Group>
              ) : (
                <Text size="xs" c="dimmed">
                  {t("progress.percent", { percent: completion.percent })}
                </Text>
              )}
            </Stack>

            <Group hiddenFrom="lg" gap="xs" wrap="nowrap">
              {badgeFilterChip}
              <Text size="xs" fw={700} className="shrink-0">
                {shownCompletion.done} / {shownCompletion.total}
              </Text>
              <Progress
                value={shownCompletion.percent}
                color="pink"
                radius="xl"
                size="sm"
                className="min-w-0 flex-1"
              />
              {badgeFilterChip ? null : (
                <Text size="xs" c="dimmed" className="shrink-0">
                  {completion.percent}%
                </Text>
              )}
              {layerButton}
            </Group>

            {
              <Group gap="xs" wrap="nowrap">
                <SegmentedControl
                  className="min-w-0 flex-1"
                  value={listMode}
                  onChange={(value) => {
                    handleListModeChange(value);
                    setSheetSnap((current) =>
                      current === "peek" ? "half" : current,
                    );
                  }}
                  data={[
                    { label: t("tabs.locations"), value: "locations" },
                    { label: t("tabs.nearby"), value: "nearby" },
                    { label: t("tabs.visited"), value: "visited" },
                  ]}
                  size="xs"
                  fullWidth
                />
                <Tooltip label={t("tabs.itinerary")}>
                  <ActionIcon
                    variant={listMode === "itinerary" ? "filled" : "light"}
                    color="pink"
                    size="lg"
                    aria-label={t("tabs.itinerary")}
                    aria-pressed={listMode === "itinerary"}
                    onClick={() => {
                      setListMode("itinerary");
                      setSheetSnap((current) =>
                        current === "peek" ? "half" : current,
                      );
                    }}
                  >
                    <FiMap size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            }

            {listMode === "locations" ? (
              <>
                <Group gap="xs" wrap="nowrap">
                  <TextInput
                    aria-label={t("search.locationLabel")}
                    placeholder={t("search.locationPlaceholder")}
                    value={locationSearchQuery}
                    onChange={(event) =>
                      setLocationSearchQuery(event.target.value)
                    }
                    leftSection={<FiSearch size={16} />}
                    className="min-w-0 flex-1"
                  />
                  {visitFilterMenu}
                </Group>

                <ScrollArea
                  className="min-h-0 flex-1"
                  h="100%"
                  offsetScrollbars
                  scrollbarSize={6}
                >
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
                          <Stack key={folder} gap={2}>
                            <Group
                              justify="space-between"
                              gap="xs"
                              px="xs"
                              pt="xs"
                              wrap="nowrap"
                            >
                              <Text size="xs" fw={700} c="pink.7" lineClamp={1}>
                                {folder}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {t("list.layerProgress", {
                                  done: layerStatsByName.get(folder)?.done ?? 0,
                                  total:
                                    layerStatsByName.get(folder)?.total ??
                                    groupedLocations[folder].length,
                                  percent: formatCompletionPercent(
                                    layerStatsByName.get(folder)?.percent ?? 0,
                                  ),
                                })}
                              </Text>
                            </Group>
                            <Stack gap={1}>
                              {groupedLocations[folder].map((item) => {
                                const visitedLocation = isLocationVisited(item);
                                return (
                                  <Box key={item.key}>
                                    <NavLink
                                      className={classes.navLink}
                                      variant="light"
                                      color="pink"
                                      active={selectedLocationId === item.id}
                                      onClick={() => showLocationOnMap(item)}
                                      label={item.name}
                                      description={
                                        item.description ? (
                                          <Text
                                            size="xs"
                                            c="dimmed"
                                            lineClamp={1}
                                          >
                                            {stripHtmlToLines(item.description)}
                                          </Text>
                                        ) : undefined
                                      }
                                      leftSection={
                                        <FiMapPin
                                          size={16}
                                          color="var(--mantine-color-pink-6)"
                                          aria-hidden="true"
                                        />
                                      }
                                      rightSection={renderVisitMark(
                                        item,
                                        visitedLocation,
                                      )}
                                    />
                                    {selectedLocationId === item.id
                                      ? renderMobileLocationActions(item)
                                      : null}
                                  </Box>
                                );
                              })}
                            </Stack>
                          </Stack>
                        ))
                    )}
                  </Stack>
                </ScrollArea>
              </>
            ) : listMode === "nearby" ? (
              <Stack gap="sm" className="min-h-0 flex-1">
                <Group justify="space-between" gap="xs">
                  <Text size="sm" c="dimmed">
                    {t("list.nearbySummary")}
                  </Text>
                  <Group gap="xs" wrap="nowrap">
                    {nearbyLocationStatus === "ready" ? (
                      <Badge variant="light" color="blue">
                        {t("list.nearbyCount", {
                          count: nearbyLocations.length,
                        })}
                      </Badge>
                    ) : null}
                    {visitFilterMenu}
                  </Group>
                </Group>

                {nearbyLocationStatus === "locating" ||
                nearbyLocationStatus === "idle" ? (
                  <Center py="xl">
                    <Stack gap="xs" align="center">
                      <Loader size="sm" color="pink" />
                      <Text size="sm" c="dimmed">
                        {t("list.nearbyLoading")}
                      </Text>
                    </Stack>
                  </Center>
                ) : nearbyLocationStatus === "unavailable" ? (
                  <Alert
                    color="orange"
                    variant="light"
                    icon={<FiAlertCircle size={16} />}
                  >
                    {t("currentLocation.unavailable")}
                  </Alert>
                ) : nearbyLocations.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    {t("list.emptyNearby")}
                  </Text>
                ) : (
                  <ScrollArea
                    className="min-h-0 flex-1"
                    h="100%"
                    offsetScrollbars
                    scrollbarSize={6}
                  >
                    <Stack gap={1}>
                      {nearbyLocations.map(
                        ({ location: item, distanceMeters }) => {
                          const visitedLocation = isLocationVisited(item);
                          return (
                            <Box key={item.key}>
                              <NavLink
                                className={classes.navLink}
                                variant="light"
                                color="pink"
                                active={selectedLocationId === item.id}
                                onClick={() => showLocationOnMap(item)}
                                label={item.name}
                                description={
                                  <Stack gap={0}>
                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                      {getLocationLayerName(
                                        item,
                                        uncategorizedLayerName,
                                      )}
                                    </Text>
                                    {item.description ? (
                                      <Text size="xs" c="dimmed" lineClamp={1}>
                                        {stripHtmlToLines(item.description)}
                                      </Text>
                                    ) : null}
                                  </Stack>
                                }
                                leftSection={
                                  <FiMapPin
                                    size={16}
                                    color="var(--mantine-color-pink-6)"
                                    aria-hidden="true"
                                  />
                                }
                                rightSection={
                                  <Group gap={4} wrap="nowrap">
                                    <Badge variant="light" color="blue">
                                      {formatStraightLineDistance(
                                        distanceMeters,
                                      )}
                                    </Badge>
                                    {renderVisitMark(item, visitedLocation)}
                                  </Group>
                                }
                              />
                              {selectedLocationId === item.id
                                ? renderMobileLocationActions(item)
                                : null}
                            </Box>
                          );
                        },
                      )}
                    </Stack>
                  </ScrollArea>
                )}
              </Stack>
            ) : listMode === "itinerary" ? (
              <SeichiMapItinerary
                itinerary={itinerary}
                locationsById={locationById}
                onClear={clearItinerary}
                onOpenLocation={openItineraryLocation}
                onRemove={removeItineraryStop}
                onReorder={reorderItineraryStops}
                onToggle={toggleItineraryStop}
                visitedLocationIds={visitedLocationIds}
              />
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
                                    {locationById.get(item.locationId)?.name ??
                                      item.locationName}
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
                <div className="mt-2 -ml-1.5">
                  {!isSignedIn ? (
                    <Button
                      color="pink"
                      size="xs"
                      className="ml-2"
                      leftSection={<FiLogIn size={14} />}
                      onClick={() =>
                        void signIn("google", { callbackUrl: "/seichi-map" })
                      }
                    >
                      {t("alerts.login")}
                    </Button>
                  ) : null}
                </div>
              </Alert>
            )}
          </Stack>
        </Paper>
      </div>

      <SeichiMapLayerDialog
        opened={isLayerDialogOpen}
        onClose={() => setIsLayerDialogOpen(false)}
        layers={layerNames.map((layerName) => {
          const layerStats = layerStatsByName.get(layerName) ?? {
            total: 0,
            done: 0,
            percent: 0,
          };
          return {
            name: layerName,
            visible: !hiddenLayerNameSet.has(layerName),
            progressLabel: t("list.layerProgress", {
              done: layerStats.done,
              total: layerStats.total,
              percent: formatCompletionPercent(layerStats.percent),
            }),
          };
        })}
        onToggle={toggleLayerVisibility}
        onShowAll={showAllLayers}
        onHideAll={hideAllLayers}
      />

      <Modal
        opened={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title={t("profile.title")}
        fullScreen={Boolean(isSmallScreen)}
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            {t("profile.description")}
          </Text>
          <SeichiMapNicknameSettingsFields
            nickname={profileNickname}
            onNicknameChange={setProfileNickname}
            showNicknameInRanking={showNicknameInRanking}
            onShowNicknameInRankingChange={setShowNicknameInRanking}
          />
          {profileErrorMessage ? (
            <Alert color="red" variant="light">
              {profileErrorMessage}
            </Alert>
          ) : null}
          <Group justify="flex-end" mt="sm">
            <Button
              variant="default"
              onClick={() => setShowSettingsModal(false)}
            >
              {t("profile.cancel")}
            </Button>
            <Button
              color="pink"
              onClick={() => void saveProfileSettings()}
              loading={profileSubmitting}
            >
              {t("profile.save")}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={t("share.title")}
        fullScreen={Boolean(isSmallScreen)}
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            {t("share.description")}
          </Text>
          <SeichiMapNicknameSettingsFields
            nickname={profileNickname}
            onNicknameChange={setProfileNickname}
            showNicknameInRanking={showNicknameInRanking}
            onShowNicknameInRankingChange={setShowNicknameInRanking}
            showShareNotice
          />
          {profileErrorMessage ? (
            <Alert color="red" variant="light">
              {profileErrorMessage}
            </Alert>
          ) : null}
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
          setRecordModalPortalTarget(null);
          resetForm();
        }}
        zIndex={2000}
        portalProps={
          recordModalPortalTarget
            ? { target: recordModalPortalTarget }
            : undefined
        }
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
                popoverProps={{
                  zIndex: 2001,
                  withinPortal: true,
                  portalProps: recordModalPortalTarget
                    ? { target: recordModalPortalTarget }
                    : undefined,
                }}
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
                  setRecordModalPortalTarget(null);
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

import type { SeichiMapLocation } from "../lib/seichiMap";

export const SEICHI_MAP_ITINERARY_STORAGE_KEY = "azki-seichi-map:itinerary:v1";

export type SeichiMapItineraryStop = {
  locationId: string;
  checked: boolean;
};

export type SeichiMapItinerary = {
  stops: SeichiMapItineraryStop[];
};

export const createEmptySeichiMapItinerary = (): SeichiMapItinerary => ({
  stops: [],
});

export function parseSeichiMapItinerary(
  value: string | null,
): SeichiMapItinerary {
  if (!value) return createEmptySeichiMapItinerary();

  try {
    const parsed = JSON.parse(value) as {
      stops?: unknown;
    };
    const seenLocationIds = new Set<string>();
    const stops = Array.isArray(parsed.stops)
      ? parsed.stops.flatMap((stop) => {
          if (!stop || typeof stop !== "object") return [];
          const candidate = stop as {
            locationId?: unknown;
            checked?: unknown;
            completed?: unknown;
          };
          if (
            typeof candidate.locationId !== "string" ||
            !candidate.locationId ||
            seenLocationIds.has(candidate.locationId)
          ) {
            return [];
          }
          seenLocationIds.add(candidate.locationId);
          return [
            {
              locationId: candidate.locationId,
              checked:
                typeof candidate.checked === "boolean"
                  ? candidate.checked
                  : candidate.completed === true,
            },
          ];
        })
      : [];

    return { stops };
  } catch {
    return createEmptySeichiMapItinerary();
  }
}

export function readSeichiMapItinerary(
  storage: Pick<Storage, "getItem">,
): SeichiMapItinerary {
  try {
    return parseSeichiMapItinerary(
      storage.getItem(SEICHI_MAP_ITINERARY_STORAGE_KEY),
    );
  } catch {
    return createEmptySeichiMapItinerary();
  }
}

export function saveSeichiMapItinerary(
  storage: Pick<Storage, "setItem">,
  itinerary: SeichiMapItinerary,
) {
  try {
    storage.setItem(
      SEICHI_MAP_ITINERARY_STORAGE_KEY,
      JSON.stringify(itinerary),
    );
  } catch {
    // localStorage may be unavailable in private browsing contexts.
  }
}

export function addSeichiMapItineraryStop(
  itinerary: SeichiMapItinerary,
  locationId: string,
): SeichiMapItinerary {
  if (
    !locationId ||
    itinerary.stops.some((stop) => stop.locationId === locationId)
  ) {
    return itinerary;
  }
  return {
    ...itinerary,
    stops: [...itinerary.stops, { locationId, checked: false }],
  };
}

export function toggleSeichiMapItineraryStop(
  itinerary: SeichiMapItinerary,
  locationId: string,
): SeichiMapItinerary {
  return {
    ...itinerary,
    stops: itinerary.stops.map((stop) =>
      stop.locationId === locationId
        ? { ...stop, checked: !stop.checked }
        : stop,
    ),
  };
}

export function removeSeichiMapItineraryStop(
  itinerary: SeichiMapItinerary,
  locationId: string,
): SeichiMapItinerary {
  return {
    ...itinerary,
    stops: itinerary.stops.filter((stop) => stop.locationId !== locationId),
  };
}

export function reorderSeichiMapItineraryStops(
  itinerary: SeichiMapItinerary,
  activeLocationId: string,
  overLocationId: string,
): SeichiMapItinerary {
  const oldIndex = itinerary.stops.findIndex(
    (stop) => stop.locationId === activeLocationId,
  );
  const newIndex = itinerary.stops.findIndex(
    (stop) => stop.locationId === overLocationId,
  );
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return itinerary;

  const stops = [...itinerary.stops];
  const [movedStop] = stops.splice(oldIndex, 1);
  stops.splice(newIndex, 0, movedStop);
  return { ...itinerary, stops };
}

export function buildSeichiMapItineraryGoogleMapsUrl(
  stops: readonly Pick<SeichiMapLocation, "latitude" | "longitude">[],
) {
  if (stops.length === 0) return null;

  const coordinates = stops.map(
    (location) => `${location.latitude},${location.longitude}`,
  );
  const params = new URLSearchParams({
    api: "1",
    destination: coordinates.at(-1) ?? "",
  });
  if (coordinates.length > 1) {
    params.set("waypoints", coordinates.slice(0, -1).join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

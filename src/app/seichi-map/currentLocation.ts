export const CURRENT_LOCATION_REQUEST_TIMEOUT_MS = 10_000;
export const NEARBY_LOCATION_MAX_DISTANCE_METERS = 10_000;

type Coordinates = {
  latitude: number;
  longitude: number;
};

type CurrentLocationLabels = {
  locating: string;
  show: string;
  unavailable: string;
};

type RequestCurrentLocationOptions = {
  control: HTMLButtonElement | null;
  geolocation: Pick<Geolocation, "getCurrentPosition">;
  labels: CurrentLocationLabels;
  onSuccess: (coords: GeolocationCoordinates) => void;
  onUnavailable?: () => void;
  timeoutMs?: number;
};

export const updateCurrentLocationControl = (
  control: HTMLButtonElement,
  label: string,
  loading: boolean,
) => {
  control.disabled = loading;
  control.style.cursor = loading ? "wait" : "pointer";
  control.style.opacity = loading ? "0.7" : "1";
  control.title = label;
  control.setAttribute("aria-label", label);
};

export const requestCurrentLocation = ({
  control,
  geolocation,
  labels,
  onSuccess,
  onUnavailable,
  timeoutMs = CURRENT_LOCATION_REQUEST_TIMEOUT_MS,
}: RequestCurrentLocationOptions) => {
  let active = true;
  let timeoutId: number | null = null;

  const complete = (label: string) => {
    if (!active) return false;

    active = false;
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (control) {
      updateCurrentLocationControl(control, label, false);
    }
    return true;
  };

  if (control) {
    updateCurrentLocationControl(control, labels.locating, true);
  }
  timeoutId = window.setTimeout(() => {
    if (complete(labels.unavailable)) {
      onUnavailable?.();
    }
  }, timeoutMs);

  geolocation.getCurrentPosition(
    ({ coords }) => {
      if (!complete(labels.show)) return;
      onSuccess(coords);
    },
    () => {
      if (complete(labels.unavailable)) {
        onUnavailable?.();
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: timeoutMs,
    },
  );

  return () => {
    if (!active) return;
    active = false;
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (control) {
      updateCurrentLocationControl(control, labels.show, false);
    }
  };
};

export const getStraightLineDistanceMeters = (
  from: Coordinates,
  to: Coordinates,
) => {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  const clampedHaversine = Math.min(1, haversine);

  return (
    earthRadiusMeters *
    2 *
    Math.atan2(Math.sqrt(clampedHaversine), Math.sqrt(1 - clampedHaversine))
  );
};

export const formatStraightLineDistance = (distanceMeters: number) => {
  if (distanceMeters < 1_000) {
    return `${Math.round(distanceMeters)}m`;
  }

  const distanceKilometers = Math.round(distanceMeters / 100) / 10;
  return `${distanceKilometers}km`;
};

export const getNearbyLocations = <
  T extends { latitude: number; longitude: number },
>(
  currentPosition: Coordinates,
  locations: T[],
  maxDistanceMeters = NEARBY_LOCATION_MAX_DISTANCE_METERS,
) => {
  return locations
    .map((location) => ({
      location,
      distanceMeters: getStraightLineDistanceMeters(currentPosition, location),
    }))
    .filter(({ distanceMeters }) => distanceMeters <= maxDistanceMeters)
    .sort((left, right) => left.distanceMeters - right.distanceMeters);
};

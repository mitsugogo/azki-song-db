"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useTranslations } from "next-intl";
import { FiExternalLink, FiMenu, FiTrash2 } from "react-icons/fi";
import type { SeichiMapLocation } from "../lib/seichiMap";
import {
  buildSeichiMapItineraryGoogleMapsUrl,
  type SeichiMapItinerary,
  type SeichiMapItineraryStop,
} from "./itinerary";

type ItineraryLocation = Pick<
  SeichiMapLocation,
  "id" | "name" | "folder" | "latitude" | "longitude"
>;

type SortableItineraryStopProps = {
  index: number;
  location?: ItineraryLocation;
  onOpenLocation: (locationId: string) => void;
  onRemove: (locationId: string) => void;
  onToggle: (locationId: string) => void;
  stop: SeichiMapItineraryStop;
};

function SortableItineraryStop({
  index,
  location,
  onOpenLocation,
  onRemove,
  onToggle,
  stop,
}: SortableItineraryStopProps) {
  const t = useTranslations("SeichiMapComplete");
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: stop.locationId });
  const locationName = location?.name ?? t("itinerary.missingLocation");

  return (
    <Paper
      ref={setNodeRef}
      withBorder
      radius="md"
      p="xs"
      style={{
        opacity: stop.completed ? 0.72 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Group gap="xs" wrap="nowrap">
        <Checkbox
          checked={stop.completed}
          onChange={() => onToggle(stop.locationId)}
          aria-label={t("itinerary.markVisited", { name: locationName })}
        />
        <Badge variant="light" color="pink" circle>
          {index + 1}
        </Badge>
        <UnstyledButton
          className="min-w-0 flex-1"
          disabled={!location}
          onClick={() => onOpenLocation(stop.locationId)}
          aria-label={t("itinerary.openLocation", { name: locationName })}
        >
          <Text
            fw={600}
            size="sm"
            lineClamp={2}
            td={stop.completed ? "line-through" : undefined}
          >
            {locationName}
          </Text>
          {location ? (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {location.folder}
            </Text>
          ) : null}
        </UnstyledButton>
        <Tooltip label={t("itinerary.reorderStop")}>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={t("itinerary.reorderStop")}
            {...attributes}
            {...listeners}
          >
            <FiMenu size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("itinerary.removeStop")}>
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label={t("itinerary.removeStop")}
            onClick={() => onRemove(stop.locationId)}
          >
            <FiTrash2 size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  );
}

type Props = {
  itinerary: SeichiMapItinerary;
  locationsById: ReadonlyMap<string, ItineraryLocation>;
  onClear: () => void;
  onOpenLocation: (locationId: string) => void;
  onRemove: (locationId: string) => void;
  onReorder: (activeLocationId: string, overLocationId: string) => void;
  onStartLocationChange: (value: string) => void;
  onToggle: (locationId: string) => void;
};

export function SeichiMapItinerary({
  itinerary,
  locationsById,
  onClear,
  onOpenLocation,
  onRemove,
  onReorder,
  onStartLocationChange,
  onToggle,
}: Props) {
  const t = useTranslations("SeichiMapComplete");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const completedCount = itinerary.stops.filter(
    (stop) => stop.completed,
  ).length;
  const routeLocations = itinerary.stops.flatMap((stop) => {
    const location = locationsById.get(stop.locationId);
    return location ? [location] : [];
  });
  const routeUrl = buildSeichiMapItineraryGoogleMapsUrl(
    itinerary.startLocation,
    routeLocations,
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  };

  return (
    <Stack gap="sm" className="min-h-0 flex-1">
      <TextInput
        label={t("itinerary.startLocationLabel")}
        placeholder={t("itinerary.startLocationPlaceholder")}
        value={itinerary.startLocation}
        maxLength={200}
        onChange={(event) => onStartLocationChange(event.currentTarget.value)}
      />

      <Group justify="space-between" gap="xs">
        <Text fw={700}>{t("itinerary.visitOrder")}</Text>
        <Badge variant="light" color="pink">
          {t("itinerary.completedCount", {
            completed: completedCount,
            total: itinerary.stops.length,
          })}
        </Badge>
      </Group>

      {itinerary.stops.length === 0 ? (
        <Paper withBorder radius="md" p="md">
          <Text size="sm" c="dimmed" ta="center">
            {t("itinerary.empty")}
          </Text>
        </Paper>
      ) : (
        <>
          <Text size="xs" c="dimmed">
            {t("itinerary.reorderHelp")}
          </Text>
          <ScrollArea
            className="min-h-0 flex-1"
            offsetScrollbars
            scrollbarSize={6}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={itinerary.stops.map((stop) => stop.locationId)}
                strategy={verticalListSortingStrategy}
              >
                <Stack gap="xs" pr="xs">
                  {itinerary.stops.map((stop, index) => (
                    <SortableItineraryStop
                      key={stop.locationId}
                      index={index}
                      location={locationsById.get(stop.locationId)}
                      onOpenLocation={onOpenLocation}
                      onRemove={onRemove}
                      onToggle={onToggle}
                      stop={stop}
                    />
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
          </ScrollArea>
        </>
      )}

      <Group gap="xs" align="stretch">
        {routeUrl ? (
          <Button
            component="a"
            href={routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            color="pink"
            leftSection={<FiExternalLink size={14} />}
            style={{ flex: "2 1 240px" }}
          >
            {t("itinerary.openRoute")}
          </Button>
        ) : (
          <Button
            disabled
            variant="light"
            color="pink"
            style={{ flex: "2 1 240px" }}
          >
            {t("itinerary.openRoute")}
          </Button>
        )}
        <Button
          variant="subtle"
          color="red"
          disabled={itinerary.stops.length === 0 && !itinerary.startLocation}
          onClick={onClear}
          style={{ flex: "1 1 120px" }}
        >
          {t("itinerary.clear")}
        </Button>
      </Group>
    </Stack>
  );
}

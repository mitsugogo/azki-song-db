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
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
  visited: boolean;
};

function SortableItineraryStop({
  index,
  location,
  onOpenLocation,
  onRemove,
  onToggle,
  stop,
  visited,
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
        opacity: stop.checked ? 0.72 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Group gap="xs" wrap="nowrap">
        <Checkbox
          checked={stop.checked}
          onChange={() => onToggle(stop.locationId)}
          aria-label={t("itinerary.toggleCheck", { name: locationName })}
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
            td={stop.checked ? "line-through" : undefined}
          >
            {locationName}
          </Text>
          {location ? (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {location.folder}
            </Text>
          ) : null}
          {visited ? (
            <Badge mt={4} size="xs" variant="light" color="green">
              {t("itinerary.visited")}
            </Badge>
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
  onToggle: (locationId: string) => void;
  visitedLocationIds: ReadonlySet<string>;
};

export function SeichiMapItinerary({
  itinerary,
  locationsById,
  onClear,
  onOpenLocation,
  onRemove,
  onReorder,
  onToggle,
  visitedLocationIds,
}: Props) {
  const t = useTranslations("SeichiMapComplete");
  const [isClearDialogOpen, setClearDialogOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const checkedCount = itinerary.stops.filter((stop) => stop.checked).length;
  const nextStop = itinerary.stops.find((stop) => !stop.checked);
  const nextLocation = nextStop
    ? locationsById.get(nextStop.locationId)
    : undefined;
  const routeUrl = nextLocation
    ? buildSeichiMapItineraryGoogleMapsUrl([nextLocation])
    : null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  };

  return (
    <Stack gap="sm" className="min-h-0 flex-1">
      <Group justify="space-between" gap="xs">
        <Text fw={700}>{t("itinerary.visitOrder")}</Text>
        <Badge variant="light" color="pink">
          {t("itinerary.checkedCount", {
            checked: checkedCount,
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
                      visited={visitedLocationIds.has(stop.locationId)}
                    />
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
          </ScrollArea>
        </>
      )}

      <Stack gap={4}>
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
            disabled={itinerary.stops.length === 0}
            onClick={() => setClearDialogOpen(true)}
            style={{ flex: "1 1 120px" }}
          >
            {t("itinerary.clear")}
          </Button>
        </Group>
        {routeUrl ? (
          <Text size="xs" c="dimmed">
            {t("itinerary.nextRouteHelp")}
          </Text>
        ) : null}
      </Stack>

      <Modal
        opened={isClearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        title={t("itinerary.clear")}
        centered
      >
        <Stack gap="sm">
          <Text size="sm">{t("confirm.clearItinerary")}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setClearDialogOpen(false)}>
              {t("modal.cancel")}
            </Button>
            <Button
              color="red"
              onClick={() => {
                setClearDialogOpen(false);
                onClear();
              }}
            >
              {t("itinerary.clear")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

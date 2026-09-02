"use client";

import {
  Avatar,
  Group,
  MultiSelect,
  Pill,
  Text,
  Tooltip,
  type ComboboxItem,
  type ComboboxItemGroup,
  type ComboboxLikeRenderOptionInput,
  type ComboboxRenderPillInput,
} from "@mantine/core";
import { memo, useCallback, useMemo } from "react";
import {
  holoGenerationGroupOrder,
  resolveHoloGenerationGroup,
} from "../config/holoGenerations";
import type { ArchiveParticipantEntry } from "../lib/archiveParticipants";

type ArchiveCastFilterProps = {
  options: ArchiveParticipantEntry[];
  value: string[];
  placeholder: string;
  nothingFoundMessage: string;
  selectedCountLabel: string;
  onChange: (value: string[]) => void;
};

function ArchiveCastFilter({
  options,
  value,
  placeholder,
  nothingFoundMessage,
  selectedCountLabel,
  onChange,
}: ArchiveCastFilterProps) {
  const data = useMemo(() => {
    const itemsByGroupKey = new Map<
      string,
      { label: string; items: ComboboxItem[] }
    >();

    options.forEach(({ name, channel }) => {
      const group = resolveHoloGenerationGroup(channel);
      const entry = itemsByGroupKey.get(group.key);
      const item = { value: name, label: name };
      if (entry) {
        entry.items.push(item);
      } else {
        itemsByGroupKey.set(group.key, { label: group.label, items: [item] });
      }
    });

    return holoGenerationGroupOrder.reduce<ComboboxItemGroup<ComboboxItem>[]>(
      (groups, groupKey) => {
        const entry = itemsByGroupKey.get(groupKey);
        if (entry) {
          groups.push({ group: entry.label, items: entry.items });
        }
        return groups;
      },
      [],
    );
  }, [options]);
  const optionsByName = useMemo(
    () => new Map(options.map((option) => [option.name, option])),
    [options],
  );
  const renderOption = useCallback(
    ({ option }: ComboboxLikeRenderOptionInput<ComboboxItem>) => {
      const castMember = optionsByName.get(String(option.value));
      const channel = castMember?.channel;

      return (
        <Group gap="sm" wrap="nowrap">
          {channel ? (
            <Avatar
              src={channel.iconUrl || null}
              alt=""
              aria-hidden="true"
              radius="xl"
              size="xs"
              color="pink"
            >
              {Array.from(castMember.name)[0]}
            </Avatar>
          ) : null}
          <Text size="sm">{option.label}</Text>
        </Group>
      );
    },
    [optionsByName],
  );
  const renderPill = useCallback(
    ({
      option,
      value: pillValue,
      onRemove,
      disabled,
    }: ComboboxRenderPillInput<string>) => {
      if (value.length >= 3) {
        if (pillValue !== value[0]) {
          return null;
        }

        const selectedNames = value.join(", ");

        return (
          <Tooltip
            label={selectedNames}
            multiline
            maw={320}
            withArrow
            events={{ hover: true, focus: true, touch: false }}
          >
            <Pill
              tabIndex={0}
              aria-label={`${selectedCountLabel}: ${selectedNames}`}
              style={{
                flex: "0 1 auto",
                maxWidth: "calc(100% - 44px)",
              }}
            >
              {selectedCountLabel}
            </Pill>
          </Tooltip>
        );
      }

      return (
        <Pill
          withRemoveButton={!disabled && !option?.disabled}
          onRemove={onRemove}
          disabled={disabled || option?.disabled}
        >
          {option?.label ?? pillValue}
        </Pill>
      );
    },
    [selectedCountLabel, value],
  );

  return (
    <MultiSelect
      data={data}
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      searchable
      clearable
      checkIconPosition="right"
      withAlignedLabels={false}
      maxDropdownHeight={320}
      nothingFoundMessage={nothingFoundMessage}
      renderOption={renderOption}
      renderPill={renderPill}
      styles={{
        pillsList:
          value.length >= 3
            ? { flexWrap: "nowrap", overflow: "hidden" }
            : undefined,
        inputField: value.length > 0 ? { minWidth: 36 } : undefined,
      }}
      onChange={onChange}
    />
  );
}

export default memo(ArchiveCastFilter);

"use client";

import {
  Avatar,
  Combobox,
  Group,
  Pill,
  PillsInput,
  ScrollArea,
  Text,
  Tooltip,
  useCombobox,
} from "@mantine/core";
import { memo, useCallback, useMemo, useState } from "react";
import { HiCheck } from "react-icons/hi";
import {
  holoGenerationGroupOrder,
  resolveHoloGenerationGroups,
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

type GroupedCastOption = ArchiveParticipantEntry & {
  value: string;
};

type GroupedCastOptions = {
  key: string;
  label: string;
  items: GroupedCastOption[];
};

function ArchiveCastFilter({
  options,
  value,
  placeholder,
  nothingFoundMessage,
  selectedCountLabel,
  onChange,
}: ArchiveCastFilterProps) {
  const [search, setSearch] = useState("");
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearch("");
    },
  });
  const data = useMemo(() => {
    const itemsByGroupKey = new Map<
      string,
      { label: string; items: Map<string, ArchiveParticipantEntry> }
    >();

    options.forEach((participant) => {
      resolveHoloGenerationGroups(participant.channel).forEach((group) => {
        const entry = itemsByGroupKey.get(group.key);
        if (entry) {
          entry.items.set(participant.name, participant);
        } else {
          itemsByGroupKey.set(group.key, {
            label: group.label,
            items: new Map([[participant.name, participant]]),
          });
        }
      });
    });

    let optionIndex = 0;

    return holoGenerationGroupOrder.reduce<GroupedCastOptions[]>(
      (groups, groupKey) => {
        const entry = itemsByGroupKey.get(groupKey);
        if (entry) {
          groups.push({
            key: groupKey,
            label: entry.label,
            items: Array.from(entry.items.values()).map((participant) => ({
              ...participant,
              value: `${groupKey}-${optionIndex++}`,
            })),
          });
        }
        return groups;
      },
      [],
    );
  }, [options]);
  const optionsByValue = useMemo(() => {
    const result = new Map<string, GroupedCastOption>();

    data.forEach((group) => {
      group.items.forEach((option) => result.set(option.value, option));
    });

    return result;
  }, [data]);
  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("ja-JP");

    return data.flatMap((group) => {
      const items = normalizedSearch
        ? group.items.filter((option) =>
            option.name.toLocaleLowerCase("ja-JP").includes(normalizedSearch),
          )
        : group.items;

      return items.length > 0 ? [{ ...group, items }] : [];
    });
  }, [data, search]);
  const handleOptionSubmit = useCallback(
    (optionValue: string) => {
      const option = optionsByValue.get(optionValue);
      if (!option) {
        return;
      }

      onChange(
        value.includes(option.name)
          ? value.filter((name) => name !== option.name)
          : [...value, option.name],
      );
      setSearch("");
      combobox.updateSelectedOptionIndex("selected");
    },
    [combobox, onChange, optionsByValue, value],
  );
  const handleValueRemove = useCallback(
    (name: string) =>
      onChange(value.filter((selectedName) => selectedName !== name)),
    [onChange, value],
  );
  const pills =
    value.length >= 3 ? (
      <Tooltip
        label={value.join(", ")}
        multiline
        maw={320}
        withArrow
        events={{ hover: true, focus: true, touch: false }}
      >
        <Pill
          tabIndex={0}
          aria-label={`${selectedCountLabel}: ${value.join(", ")}`}
          style={{ flex: "0 1 auto", maxWidth: "calc(100% - 44px)" }}
        >
          {selectedCountLabel}
        </Pill>
      </Tooltip>
    ) : (
      value.map((name) => (
        <Pill
          key={name}
          withRemoveButton
          onRemove={() => handleValueRemove(name)}
        >
          {name}
        </Pill>
      ))
    );

  return (
    <Combobox store={combobox} onOptionSubmit={handleOptionSubmit}>
      <Combobox.DropdownTarget>
        <PillsInput
          onClick={() => combobox.openDropdown()}
          data-expanded={combobox.dropdownOpened || undefined}
          rightSection={
            value.length > 0 ? (
              <Combobox.ClearButton
                onClear={() => {
                  onChange([]);
                  setSearch("");
                }}
              />
            ) : (
              <Combobox.Chevron />
            )
          }
          rightSectionPointerEvents={value.length > 0 ? "all" : "none"}
        >
          <Pill.Group
            style={
              value.length >= 3
                ? { flexWrap: "nowrap", overflow: "hidden" }
                : undefined
            }
          >
            {pills}
            <Combobox.EventsTarget withExpandedAttribute>
              <PillsInput.Field
                aria-label={placeholder}
                placeholder={placeholder}
                type="visible"
                value={search}
                style={value.length > 0 ? { minWidth: 36 } : undefined}
                onFocus={() => combobox.openDropdown()}
                onBlur={() => {
                  combobox.closeDropdown();
                  setSearch("");
                }}
                onChange={(event) => {
                  setSearch(event.currentTarget.value);
                  combobox.openDropdown();
                  combobox.updateSelectedOptionIndex();
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Backspace" &&
                    search.length === 0 &&
                    value.length > 0
                  ) {
                    event.preventDefault();
                    handleValueRemove(value[value.length - 1]);
                  }
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options aria-label={placeholder}>
          <ScrollArea.Autosize
            mah={320}
            type="scroll"
            scrollbarSize="var(--combobox-padding)"
            offsetScrollbars="y"
          >
            {filteredData.map((group) => (
              <Combobox.Group key={group.key} label={group.label}>
                {group.items.map((option) => {
                  const selected = value.includes(option.name);

                  return (
                    <Combobox.Option
                      key={option.value}
                      value={option.value}
                      active={selected}
                      aria-selected={selected}
                    >
                      <Group justify="space-between" gap="sm" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap">
                          {option.channel ? (
                            <Avatar
                              src={option.channel.iconUrl || null}
                              alt=""
                              aria-hidden="true"
                              radius="xl"
                              size="xs"
                              color="pink"
                            >
                              {Array.from(option.name)[0]}
                            </Avatar>
                          ) : null}
                          <Text size="sm">{option.name}</Text>
                        </Group>
                        {selected ? (
                          <HiCheck
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0"
                          />
                        ) : null}
                      </Group>
                    </Combobox.Option>
                  );
                })}
              </Combobox.Group>
            ))}
          </ScrollArea.Autosize>
          {filteredData.length === 0 ? (
            <Combobox.Empty>{nothingFoundMessage}</Combobox.Empty>
          ) : null}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

export default memo(ArchiveCastFilter);

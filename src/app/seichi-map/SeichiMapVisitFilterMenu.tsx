"use client";

import { ActionIcon, Indicator, Menu } from "@mantine/core";
import { FiAward, FiCheck, FiFilter, FiX } from "react-icons/fi";
import type { SeichiMapVisitFilter } from "./visitFilter";

export type SeichiMapVisitFilterOption = {
  value: SeichiMapVisitFilter;
  label: string;
};

/** バッジの達成条件の対象地点で絞り込む操作 */
export type SeichiMapBadgeFilterControls = {
  /** バッジで絞り込み中か */
  active: boolean;
  pickLabel: string;
  clearLabel: string;
  /** バッジを選ぶ画面を開く。バッジの情報がまだ無いときは省略して項目を隠す */
  onPick?: () => void;
  onClear: () => void;
};

type Props = {
  value: SeichiMapVisitFilter;
  onChange: (value: SeichiMapVisitFilter) => void;
  options: SeichiMapVisitFilterOption[];
  label: string;
  badge?: SeichiMapBadgeFilterControls;
};

/**
 * 訪問状況で絞り込むメニュー。リストの上に行を増やさないよう、検索欄の横のアイコンにまとめる。
 * 「すべて」以外を選んでいる間は、アイコンに印を付けて絞り込み中だと分かるようにする。
 */
export function SeichiMapVisitFilterMenu({
  value,
  onChange,
  options,
  label,
  badge,
}: Props) {
  return (
    <Menu position="bottom-end" withArrow shadow="md">
      <Menu.Target>
        <Indicator
          color="pink"
          size={9}
          offset={4}
          disabled={value === "all" && !badge?.active}
        >
          <ActionIcon
            variant="default"
            size={36}
            aria-label={label}
            title={label}
          >
            <FiFilter size={16} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{label}</Menu.Label>
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            onClick={() => onChange(option.value)}
            rightSection={
              option.value === value ? <FiCheck size={14} /> : undefined
            }
            fw={option.value === value ? 700 : undefined}
          >
            {option.label}
          </Menu.Item>
        ))}
        {badge && (badge.onPick || badge.active) ? (
          <>
            <Menu.Divider />
            {badge.onPick ? (
              <Menu.Item
                leftSection={<FiAward size={14} />}
                onClick={badge.onPick}
              >
                {badge.pickLabel}
              </Menu.Item>
            ) : null}
            {badge.active ? (
              <Menu.Item
                color="red"
                leftSection={<FiX size={14} />}
                onClick={badge.onClear}
              >
                {badge.clearLabel}
              </Menu.Item>
            ) : null}
          </>
        ) : null}
      </Menu.Dropdown>
    </Menu>
  );
}

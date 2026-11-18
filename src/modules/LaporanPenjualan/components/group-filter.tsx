import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Chip, ChipGroup, Sheet } from '@/shared/ui';

import type { GroupSummary } from '../types';
import { levelBadge } from './level';

/** `ChipGroup` values are strings, so "no filter" is an empty one. */
const ALL = '';

/** Levels the server sends today, in the order of the badge. Others it adds later are appended. */
const KNOWN_LEVELS = ['below', 'near', 'achieved'];

export type GroupFilters = { level: string; group: string };

export const NO_GROUP_FILTERS: GroupFilters = { level: ALL, group: ALL };

/** Keeps the groups that match every chosen filter. */
export function filterGroups(groups: GroupSummary[], filters: GroupFilters): GroupSummary[] {
  return groups.filter(
    (item) =>
      (filters.level === ALL || item.achievement.level === filters.level) &&
      (filters.group === ALL || item.group === filters.group),
  );
}

export interface GroupFilterProps {
  /** Every group of the period, so the options do not shrink as the list is filtered. */
  groups: GroupSummary[];
  value: GroupFilters;
  onChange: (value: GroupFilters) => void;
}

/** Two chips, status and group. Each opens a sheet where one tap picks an option and closes it. */
export function GroupFilter({ groups, value, onChange }: GroupFilterProps) {
  const [open, setOpen] = useState<'level' | 'group' | null>(null);

  const extraLevels = groups
    .map((item) => item.achievement.level)
    .filter((level, index, all) => !KNOWN_LEVELS.includes(level) && all.indexOf(level) === index);
  const levelOptions = [
    { value: ALL, label: 'All statuses' },
    ...[...KNOWN_LEVELS, ...extraLevels].map((level) => ({
      value: level,
      label: levelBadge(level).label,
    })),
  ];
  const groupOptions = [
    { value: ALL, label: 'All groups' },
    ...groups.map((item) => ({ value: item.group, label: item.group })),
  ];

  const levelLabel = levelOptions.find((option) => option.value === value.level)?.label;
  const choose = (next: Partial<GroupFilters>) => {
    onChange({ ...value, ...next });
    setOpen(null);
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2">
        <Chip
          outlined
          label={value.level === ALL ? 'Status' : `Status: ${levelLabel ?? value.level}`}
          selected={value.level !== ALL}
          aria-label="Filter groups by status"
          onPress={() => setOpen('level')}
        />
        <Chip
          outlined
          label={value.group === ALL ? 'Group' : `Group: ${value.group}`}
          selected={value.group !== ALL}
          aria-label="Filter groups by group"
          onPress={() => setOpen('group')}
        />
      </ScrollView>
      <Sheet visible={open === 'level'} title="Status" onClose={() => setOpen(null)}>
        <View>
          <ChipGroup
            label="Status"
            options={levelOptions}
            value={value.level}
            onChange={(level) => choose({ level })}
          />
        </View>
      </Sheet>
      <Sheet visible={open === 'group'} title="Group" onClose={() => setOpen(null)}>
        <View>
          <ChipGroup
            label="Group"
            options={groupOptions}
            value={value.group}
            onChange={(group) => choose({ group })}
          />
        </View>
      </Sheet>
    </>
  );
}

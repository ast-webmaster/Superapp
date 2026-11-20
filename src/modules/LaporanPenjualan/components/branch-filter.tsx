import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Chip, ChipGroup, Sheet } from '@/shared/ui';

import type { BranchAchievement } from '../types';
import { ALL, statusOptions } from './group-filter';

export type BranchFilters = { level: string; branch: string };

export const NO_BRANCH_FILTERS: BranchFilters = { level: ALL, branch: ALL };

/** Keeps the branches that match every chosen filter. */
export function filterBranches(
  branches: BranchAchievement[],
  filters: BranchFilters,
): BranchAchievement[] {
  return branches.filter(
    (item) =>
      (filters.level === ALL || item.achievement.level === filters.level) &&
      (filters.branch === ALL || item.branch === filters.branch),
  );
}

export interface BranchFilterProps {
  /** Every branch of the group, so the options do not shrink as the list is filtered. */
  branches: BranchAchievement[];
  value: BranchFilters;
  onChange: (value: BranchFilters) => void;
}

/** Two chips, status and branch. Each opens a sheet where one tap picks an option and closes it. */
export function BranchFilter({ branches, value, onChange }: BranchFilterProps) {
  const [open, setOpen] = useState<'level' | 'branch' | null>(null);

  const levelOptions = statusOptions(branches.map((item) => item.achievement.level));
  const branchOptions = [
    { value: ALL, label: 'All branches' },
    ...branches.map((item) => ({ value: item.branch, label: item.branch })),
  ];

  const levelLabel = levelOptions.find((option) => option.value === value.level)?.label;
  const choose = (next: Partial<BranchFilters>) => {
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
          aria-label="Filter branches by status"
          onPress={() => setOpen('level')}
        />
        <Chip
          outlined
          label={value.branch === ALL ? 'Branch' : `Branch: ${value.branch}`}
          selected={value.branch !== ALL}
          aria-label="Filter branches by branch"
          onPress={() => setOpen('branch')}
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
      <Sheet visible={open === 'branch'} title="Branch" onClose={() => setOpen(null)}>
        <View>
          <ChipGroup
            label="Branch"
            options={branchOptions}
            value={value.branch}
            onChange={(branch) => choose({ branch })}
          />
        </View>
      </Sheet>
    </>
  );
}

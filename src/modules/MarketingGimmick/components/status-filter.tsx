import { ChipGroup } from '@/shared/ui';

import type { FlowConfig } from '../flows';
import { statusLabel } from './status';

function quickOptions(flow: FlowConfig) {
  return [
    { value: 'all', label: 'All' },
    { value: flow.awaitingStatuses, label: 'Awaiting' },
    { value: flow.doneStatus, label: statusLabel(flow.doneStatus) },
  ];
}

/** The status values the toolbar chips cover; any other value is set from the filter sheet. */
export function quickStatuses(flow: FlowConfig): readonly string[] {
  return quickOptions(flow).map(({ value }) => value);
}

type StatusFilterProps = {
  flow: FlowConfig;
  value: string;
  onChange: (value: string) => void;
};

/** Status chips in one row. `ListToolbar` scrolls them beside its buttons. */
export function StatusFilter({ flow, value, onChange }: StatusFilterProps) {
  return (
    <ChipGroup
      label="Filter by status"
      options={quickOptions(flow)}
      value={value}
      onChange={onChange}
      className="flex-nowrap"
    />
  );
}

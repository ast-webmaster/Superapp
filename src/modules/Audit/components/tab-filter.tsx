import { useCan } from '@/core/permissions';
import { ChipGroup } from '@/shared/ui';

import type { AuditListFilters } from '../types';

type TabValue = AuditListFilters['tab'];

type TabOption = { value: TabValue; label: string; permission?: string };

// Planned and On progress are the user's own cards, which only an auditor has. Approval is the
// approver's queue. Follow up (Responsibility) and Findings (PIC) are for anyone who is named.
const TABS: readonly TabOption[] = [
  { value: 'all', label: 'All' },
  { value: 'planned', label: 'Planned', permission: 'create_audit' },
  { value: 'on_progress', label: 'On progress', permission: 'create_audit' },
  { value: 'follow_up', label: 'Follow up' },
  { value: 'finding', label: 'Findings' },
  { value: 'approval', label: 'Approval', permission: 'approve_audit' },
];

type TabFilterProps = {
  value: TabValue;
  onChange: (value: TabValue) => void;
};

/** The list tabs as chips in one row. `ListToolbar` scrolls them beside its buttons. */
export function TabFilter({ value, onChange }: TabFilterProps) {
  const can = useCan();
  const options = TABS.filter((tab) => can(tab.permission)).map(({ value, label }) => ({
    value,
    label,
  }));

  return (
    <ChipGroup
      label="Filter by tab"
      options={options}
      value={value}
      onChange={(next) => onChange(next as TabValue)}
      className="flex-nowrap"
    />
  );
}

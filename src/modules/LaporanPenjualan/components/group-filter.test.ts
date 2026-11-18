import type { GroupSummary } from '../types';
import { filterGroups, NO_GROUP_FILTERS } from './group-filter';

function group(name: string, level: string): GroupSummary {
  return {
    group: name,
    achievement: { value: 0, percentage: 0, level },
    target: { monthly_amount: 0, daily_amount: 0, balance: 0, day_left: 0, balance_daily: 0 },
    weekly: [],
  };
}

const groups = [group('Alpha', 'below'), group('Beta', 'achieved'), group('Gamma', 'below')];

describe('filterGroups', () => {
  it('keeps every group when nothing is chosen', () => {
    expect(filterGroups(groups, NO_GROUP_FILTERS)).toHaveLength(3);
  });

  it('filters by status', () => {
    const result = filterGroups(groups, { level: 'below', group: '' });
    expect(result.map((item) => item.group)).toEqual(['Alpha', 'Gamma']);
  });

  it('filters by group', () => {
    const result = filterGroups(groups, { level: '', group: 'Beta' });
    expect(result.map((item) => item.group)).toEqual(['Beta']);
  });

  it('needs both to match when both are chosen', () => {
    expect(filterGroups(groups, { level: 'below', group: 'Beta' })).toEqual([]);
  });
});

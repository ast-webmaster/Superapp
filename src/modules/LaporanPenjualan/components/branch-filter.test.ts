import type { BranchAchievement } from '../types';
import { filterBranches, NO_BRANCH_FILTERS } from './branch-filter';
import { statusOptions } from './group-filter';

function branch(name: string, level: string): BranchAchievement {
  return {
    branch: name,
    achievement: { value: 0, percentage: 0, level },
    target: { monthly_amount: 0, daily_amount: 0, balance: 0 },
    daily: [],
  };
}

const branches = [branch('JKT', 'below'), branch('SBY', 'achieved'), branch('BDG', 'below')];

describe('filterBranches', () => {
  it('keeps every branch when nothing is chosen', () => {
    expect(filterBranches(branches, NO_BRANCH_FILTERS)).toHaveLength(3);
  });

  it('filters by status', () => {
    const result = filterBranches(branches, { level: 'below', branch: '' });
    expect(result.map((item) => item.branch)).toEqual(['JKT', 'BDG']);
  });

  it('filters by branch', () => {
    const result = filterBranches(branches, { level: '', branch: 'SBY' });
    expect(result.map((item) => item.branch)).toEqual(['SBY']);
  });

  it('needs both to match when both are chosen', () => {
    expect(filterBranches(branches, { level: 'below', branch: 'SBY' })).toEqual([]);
  });
});

describe('statusOptions', () => {
  it('lists the known levels after "All statuses"', () => {
    expect(statusOptions([]).map((option) => option.value)).toEqual([
      '',
      'below',
      'near',
      'achieved',
    ]);
  });

  it('appends a level the server added, once', () => {
    const values = statusOptions(['below', 'exceeded', 'exceeded']).map((option) => option.value);
    expect(values).toEqual(['', 'below', 'near', 'achieved', 'exceeded']);
  });
});

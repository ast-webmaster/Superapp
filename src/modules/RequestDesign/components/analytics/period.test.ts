import {
  achievementTone,
  currentPeriod,
  formatPoints,
  isAfter,
  periodLabel,
  shiftPeriod,
} from './period';

describe('shiftPeriod', () => {
  it('moves by whole months across year ends', () => {
    expect(shiftPeriod({ month: 1, year: 2026 }, -1)).toEqual({ month: 12, year: 2025 });
    expect(shiftPeriod({ month: 12, year: 2026 }, 1)).toEqual({ month: 1, year: 2027 });
    expect(shiftPeriod({ month: 11, year: 2026 }, -11)).toEqual({ month: 12, year: 2025 });
    expect(shiftPeriod({ month: 6, year: 2026 }, 0)).toEqual({ month: 6, year: 2026 });
  });
});

describe('isAfter and currentPeriod', () => {
  it('knows a later month from an earlier or the same one', () => {
    const now = currentPeriod(new Date(2026, 10, 20));
    expect(now).toEqual({ month: 11, year: 2026 });
    expect(isAfter({ month: 12, year: 2026 }, now)).toBe(true);
    expect(isAfter({ month: 1, year: 2027 }, now)).toBe(true);
    expect(isAfter(now, now)).toBe(false);
    expect(isAfter({ month: 12, year: 2025 }, now)).toBe(false);
  });
});

describe('labels and figures', () => {
  it('names the month and trims points to one decimal', () => {
    expect(periodLabel({ month: 11, year: 2026 })).toBe('November 2026');
    expect(formatPoints(42.5)).toBe('42.5');
    expect(formatPoints(42)).toBe('42');
    expect(formatPoints(42.04)).toBe('42');
    expect(formatPoints(0.25)).toBe('0.3');
  });

  it('colors the achievement by how near the target is', () => {
    expect(achievementTone(120)).toBe('success');
    expect(achievementTone(100)).toBe('success');
    expect(achievementTone(71)).toBe('info');
    expect(achievementTone(49.9)).toBe('warning');
  });
});

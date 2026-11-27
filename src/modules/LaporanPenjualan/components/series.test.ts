import { dayBars, groupSeries, weekBars, weeklySeries } from './series';

const group = (...values: number[]) => ({
  weekly: values.map((value, index) => ({
    week: `W-${index + 1}`,
    value,
    percentage: 0,
    dates: [],
  })),
});

describe('weeklySeries', () => {
  it('sums the groups week by week', () => {
    expect(weeklySeries([group(10, 20, 30), group(1, 2, 3)])).toEqual([11, 22, 33]);
  });

  it('stops at the last week with sales', () => {
    expect(weeklySeries([group(10, 20, 0, 0)])).toEqual([10, 20]);
  });

  it('keeps a quiet week in the middle', () => {
    expect(weeklySeries([group(10, 0, 5, 0)])).toEqual([10, 0, 5]);
  });

  it('is empty when there are no sales or no groups', () => {
    expect(weeklySeries([group(0, 0)])).toEqual([]);
    expect(weeklySeries([])).toEqual([]);
  });
});

describe('groupSeries', () => {
  it('plots the days when the server sends them', () => {
    const daily = [
      { date: '2026-10-01', amount: 5 },
      { date: '2026-10-02', amount: 7 },
    ];
    expect(groupSeries({ ...group(100, 200), daily_totals: daily })).toEqual([5, 7]);
  });

  it('falls back to the weeks when there are no days', () => {
    expect(groupSeries(group(10, 20, 0))).toEqual([10, 20]);
    expect(groupSeries({ ...group(10, 20), daily_totals: [] })).toEqual([10, 20]);
  });
});

describe('dayBars', () => {
  const days = Array.from({ length: 9 }, (_, index) => ({
    date: `2026-10-0${index + 1}`,
    amount: index * 10,
  }));

  it('keeps the last seven days and marks those that reached the target', () => {
    const bars = dayBars(days, 70);

    expect(bars.map((bar) => bar.label)).toEqual(['3', '4', '5', '6', '7', '8', '9']);
    expect(bars.filter((bar) => bar.hit).map((bar) => bar.value)).toEqual([70, 80]);
  });

  it('marks none without a daily target', () => {
    expect(dayBars(days, 0).some((bar) => bar.hit)).toBe(false);
  });
});

describe('weekBars', () => {
  it('names the weeks and stops at the last one with sales', () => {
    expect(weekBars([group(10, 20, 0)]).map((bar) => [bar.label, bar.value])).toEqual([
      ['W-1', 10],
      ['W-2', 20],
    ]);
  });
});

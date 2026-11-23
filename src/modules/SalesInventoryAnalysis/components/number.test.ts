import { formatMoh, formatNumber, formatPercent, formatSignedPercent } from './number';

describe('formatNumber', () => {
  it('groups thousands and keeps at most one decimal', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(120)).toBe('120');
    expect(formatNumber(1.25)).toBe('1.3');
    expect(formatNumber(-1500)).toBe('-1,500');
  });
});

describe('percent and months on hand', () => {
  it('shows a dash for a missing value', () => {
    expect(formatPercent(null)).toBe('-');
    expect(formatSignedPercent(null)).toBe('-');
    expect(formatMoh(null)).toBe('-');
  });

  it('signs a change', () => {
    expect(formatSignedPercent(6.25)).toBe('+6.3%');
    expect(formatSignedPercent(-20)).toBe('-20%');
    expect(formatSignedPercent(0)).toBe('0%');
  });

  it('writes months on hand short', () => {
    expect(formatMoh(2)).toBe('2 mo');
  });
});

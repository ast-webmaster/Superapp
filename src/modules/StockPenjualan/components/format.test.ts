import { formatHqStock, formatQuantity } from './format';

describe('formatQuantity', () => {
  it('groups thousands', () => {
    expect(formatQuantity(0)).toBe('0');
    expect(formatQuantity(35)).toBe('35');
    expect(formatQuantity(1234567)).toBe('1,234,567');
    expect(formatQuantity(-1200)).toBe('-1,200');
  });

  it('shows a dash for a missing figure', () => {
    expect(formatQuantity(null)).toBe('-');
  });
});

describe('formatHqStock', () => {
  it('shows "> 100" instead of a number from 100 up', () => {
    expect(formatHqStock({ stock_hq: null, stock_hq_over_100: true })).toBe('> 100');
  });

  it('shows the figure below 100, zero included', () => {
    expect(formatHqStock({ stock_hq: 35, stock_hq_over_100: false })).toBe('35');
    expect(formatHqStock({ stock_hq: 0, stock_hq_over_100: false })).toBe('0');
  });
});

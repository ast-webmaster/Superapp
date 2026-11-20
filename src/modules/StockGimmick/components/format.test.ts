import { formatQuantity, formatSignedQuantity } from './format';

describe('formatQuantity', () => {
  it('groups thousands', () => {
    expect(formatQuantity(0)).toBe('0');
    expect(formatQuantity(120)).toBe('120');
    expect(formatQuantity(1234567)).toBe('1,234,567');
  });
});

describe('formatSignedQuantity', () => {
  it('always shows the direction of a movement', () => {
    expect(formatSignedQuantity(140)).toBe('+140');
    expect(formatSignedQuantity(-1200)).toBe('-1,200');
    expect(formatSignedQuantity(0)).toBe('0');
  });
});

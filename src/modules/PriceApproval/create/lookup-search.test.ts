import { lookupSearchTerm } from './lookup-search';

it('trims, and treats text under two characters as no search', () => {
  expect(lookupSearchTerm('  pump ')).toBe('pump');
  expect(lookupSearchTerm('p')).toBe('');
  expect(lookupSearchTerm('  p ')).toBe('');
  expect(lookupSearchTerm('')).toBe('');
});

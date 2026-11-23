import type { PointCategoryOption } from '../types';
import { linkProblem } from './files';
import { countedQty, pointsProblem } from './points';

const categories: PointCategoryOption[] = [
  { uuid: 'new', name: 'NEW DESIGN', point: 1 },
  { uuid: 'tpl', name: 'TEMPLATE READY', point: 0.5 },
  { uuid: 'opt', name: 'OPTIONAL', point: 0.25 },
];

describe('pointsProblem', () => {
  it('counts the pieces of every category except OPTIONAL against the request', () => {
    expect(countedQty(categories, { new: '2', tpl: '1', opt: '9' })).toBe(3);
    expect(pointsProblem(categories, { new: '2', tpl: '1', opt: '9' }, 3)).toBeUndefined();
  });

  it('refuses more pieces than were requested', () => {
    expect(pointsProblem(categories, { new: '3', tpl: '1' }, 3)).toMatch(/more than the 3 pieces/);
  });

  it('treats an empty category as 0 and refuses a quantity above 500', () => {
    expect(pointsProblem(categories, {}, 3)).toBeUndefined();
    expect(pointsProblem(categories, { opt: '501' }, 1000)).toMatch(/0 to 500/);
  });
});

describe('linkProblem', () => {
  it('takes a full http or https link', () => {
    expect(linkProblem('https://drive.example.com/hasil-desain')).toBeUndefined();
    expect(linkProblem(' http://example.com ')).toBeUndefined();
  });

  it('refuses an empty text, a text that is not a link and another scheme', () => {
    expect(linkProblem('  ')).toBeDefined();
    expect(linkProblem('drive.example.com')).toBeDefined();
    expect(linkProblem('ftp://example.com/file')).toBeDefined();
    expect(linkProblem(`https://example.com/${'x'.repeat(2000)}`)).toBeDefined();
  });
});

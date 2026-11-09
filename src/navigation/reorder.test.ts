import { moveId } from './reorder';

describe('moveId', () => {
  const ids = ['a', 'b', 'c'];

  it('swaps an id with its neighbour', () => {
    expect(moveId(ids, 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveId(ids, 'b', 1)).toEqual(['a', 'c', 'b']);
  });

  it('keeps the order at the edges and for an unknown id', () => {
    expect(moveId(ids, 'a', -1)).toEqual(ids);
    expect(moveId(ids, 'c', 1)).toEqual(ids);
    expect(moveId(ids, 'x', 1)).toEqual(ids);
  });

  it('does not change the list it was given', () => {
    moveId(ids, 'b', 1);

    expect(ids).toEqual(['a', 'b', 'c']);
  });
});

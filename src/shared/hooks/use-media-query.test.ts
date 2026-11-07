import { renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { useMediaQuery } from './use-media-query';

function setWindowWidth(width: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 800, scale: 1, fontScale: 1 });
}

describe('useMediaQuery', () => {
  afterEach(() => jest.restoreAllMocks());

  it('matches at and above the minimum width', async () => {
    setWindowWidth(900);
    const { result } = await renderHook(() => useMediaQuery({ minWidth: 900 }));

    expect(result.current).toBe(true);
  });

  it('does not match below the minimum width', async () => {
    setWindowWidth(390);
    const { result } = await renderHook(() => useMediaQuery({ minWidth: 900 }));

    expect(result.current).toBe(false);
  });
});

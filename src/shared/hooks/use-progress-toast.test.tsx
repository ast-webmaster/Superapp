import { renderHook } from '@testing-library/react-native';

import { useProgressToast } from './use-progress-toast';

const mockDone = jest.fn();
const mockProgress = jest.fn(() => mockDone);
const mockToast = { show: jest.fn(), progress: mockProgress };

jest.mock('@/shared/ui', () => ({ useToast: () => mockToast }));

beforeEach(() => {
  mockDone.mockReset();
  mockProgress.mockClear();
});

async function setup() {
  const { result } = await renderHook(() => useProgressToast());
  return result.current;
}

describe('useProgressToast', () => {
  it('shows the message while the work runs and ends it with the result', async () => {
    const withProgress = await setup();
    const work = jest.fn(async () => {
      expect(mockDone).not.toHaveBeenCalled();
      return 'bytes';
    });

    await expect(withProgress('Downloading a.pdf', work)).resolves.toBe('bytes');

    expect(mockProgress).toHaveBeenCalledWith('Downloading a.pdf');
    expect(mockDone).toHaveBeenCalledTimes(1);
  });

  it('ends the toast and passes the error on when the work fails', async () => {
    const withProgress = await setup();

    await expect(
      withProgress('Downloading a.pdf', () => Promise.reject(new Error('offline'))),
    ).rejects.toThrow('offline');

    expect(mockDone).toHaveBeenCalledTimes(1);
  });
});

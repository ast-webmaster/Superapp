import { act, renderHook } from '@testing-library/react-native';

import type { AuthStatus } from '@/core/auth';

import { ZOOM_DURATION_MS } from './splash-config';
import { pulseWaitMs, useSplashSequence } from './use-splash-sequence';

describe('pulseWaitMs', () => {
  it('always waits for at least one full cycle', () => {
    expect(pulseWaitMs(0)).toBe(800);
    expect(pulseWaitMs(300)).toBe(500);
  });

  it('finishes the running cycle instead of cutting it', () => {
    expect(pulseWaitMs(800)).toBe(0);
    expect(pulseWaitMs(1000)).toBe(600);
  });
});

describe('useSplashSequence', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const setup = (initial: AuthStatus, reduceMotion = false) =>
    renderHook(({ status }: { status: AuthStatus }) => useSplashSequence(status, reduceMotion), {
      initialProps: { status: initial },
    });

  it('stays booting until the overlay has laid out', async () => {
    const { result } = await setup('authenticated');

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.phase).toBe('booting');
  });

  it('pulses while the session is restoring, then zooms and finishes', async () => {
    const { result, rerender } = await setup('restoring');
    await act(async () => result.current.start());
    expect(result.current.phase).toBe('pulsing');

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.phase).toBe('pulsing');

    await rerender({ status: 'unauthenticated' });
    await act(async () => {
      jest.advanceTimersByTime(800);
    });
    expect(result.current.phase).toBe('zooming');

    await act(async () => {
      jest.advanceTimersByTime(ZOOM_DURATION_MS);
    });
    expect(result.current.phase).toBe('done');
    expect(result.current.covered).toBe(true);
  });

  it('waits out the minimum pulse when the status is already known', async () => {
    const { result } = await setup('authenticated');
    await act(async () => result.current.start());

    await act(async () => {
      jest.advanceTimersByTime(799);
    });
    expect(result.current.phase).toBe('pulsing');

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.phase).toBe('zooming');
  });

  it('ignores a second layout', async () => {
    const { result, rerender } = await setup('restoring');
    await act(async () => result.current.start());
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => result.current.start());

    // The pulse clock was not restarted: 400ms are already spent, 400 remain.
    await rerender({ status: 'authenticated' });
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(result.current.phase).toBe('zooming');
  });

  it('only fades when reduce motion is on', async () => {
    const { result } = await setup('authenticated', true);
    await act(async () => result.current.start());
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    expect(result.current.phase).toBe('zooming');

    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current.phase).toBe('done');
  });

  it('clears its timers on unmount', async () => {
    const { result, unmount } = await setup('authenticated');
    await act(async () => result.current.start());
    const clear = jest.spyOn(global, 'clearTimeout');

    await unmount();

    expect(clear).toHaveBeenCalled();
    clear.mockRestore();
  });
});

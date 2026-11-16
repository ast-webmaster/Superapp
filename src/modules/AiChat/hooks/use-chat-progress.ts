import { useEffect, useState } from 'react';

import { aiChatApi } from '../api/aiChatApi';
import type { ProgressStep } from '../types';

const FAST_MS = 700;
const SLOW_MS = 1800;
const FAST_POLLS = 10;

/**
 * The AI's steps for the send with this trace id, polled while it waits: fast at first, slower
 * after ten polls to spare mobile data (the web chat's rhythm). The only polling in the app.
 * Progress is cosmetic, so a failed poll is ignored.
 */
export function useChatProgress(traceId: string | null): ProgressStep[] {
  const [progress, setProgress] = useState<{ traceId: string; steps: ProgressStep[] } | null>(null);

  useEffect(() => {
    if (!traceId) return;
    let alive = true;
    let polls = 0;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const tick = async () => {
      try {
        const result = await aiChatApi.progress(traceId, controller.signal);
        if (alive) setProgress({ traceId, steps: result.steps ?? [] });
      } catch {
        // Ignored: the next poll tries again.
      }
      polls += 1;
      if (alive) timer = setTimeout(tick, polls >= FAST_POLLS ? SLOW_MS : FAST_MS);
    };
    timer = setTimeout(tick, FAST_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [traceId]);

  return traceId && progress?.traceId === traceId ? progress.steps : [];
}

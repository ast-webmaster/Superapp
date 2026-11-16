import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes } from '@/shared/theme/tokens';

import { announce } from '../announce';
import { ProgressBar } from '../progress-bar/progress-bar';
import { AppText } from '../text/text';
import { Alert, type AlertTone } from './alert';

const MAX_VISIBLE = 2;
const AUTO_DISMISS_MS = 5000;

interface Toast {
  id: number;
  tone: AlertTone;
  message: string;
  /** Stays, with a moving bar, until it is dismissed from code. */
  busy: boolean;
}

interface ToastApi {
  show: (toast: { tone: AlertTone; message: string }) => void;
  /**
   * A toast with a moving bar for work of unknown length, such as a download. It stays until
   * the returned function is called, so call that when the work ends, whether it worked or not.
   */
  progress: (message: string) => () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const api = use(ToastContext);
  if (!api) throw new Error('useToast must be used inside ToastProvider');
  return api;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const { top } = useSafeAreaInsets();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const api = useMemo<ToastApi>(() => {
    const add = (toast: Omit<Toast, 'id'>) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, ...toast }].slice(-MAX_VISIBLE));
      return id;
    };

    return {
      show: ({ tone, message }) => void add({ tone, message, busy: false }),
      progress: (message) => {
        const id = add({ tone: 'info', message, busy: true });
        return () => dismiss(id);
      },
    };
  }, [dismiss]);

  return (
    <ToastContext value={api}>
      {children}
      <View
        pointerEvents="box-none"
        className="absolute right-5 left-5 gap-2"
        style={{ top: top + sizes.toastOffset }}>
        {toasts.map((toast) =>
          toast.busy ? (
            <ProgressToast key={toast.id} message={toast.message} />
          ) : (
            <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
          ),
        )}
      </View>
    </ToastContext>
  );
}

/** The message over a moving bar. No dismiss button and no timer: the code that asked ends it. */
function ProgressToast({ message }: { message: string }) {
  useEffect(() => {
    announce(message);
  }, [message]);

  return (
    <View className="gap-3 rounded-lg bg-primary-soft px-4 py-3">
      <AppText role="status" aria-live="polite">
        {message}
      </AppText>
      <ProgressBar label={message} />
    </View>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

/** Auto-dismisses, keeping the remaining time while hovered or while focus is inside. */
function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remaining = useRef(AUTO_DISMISS_MS);
  const paused = hovered || focused;
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (paused) return;

    const startedAt = Date.now();
    const timer = setTimeout(() => dismissRef.current(), remaining.current);

    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [paused]);

  // Focus events bubble through the View on web, so focus on the dismiss button pauses too.
  const focusHandlers = {
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  } as ViewProps;

  return (
    <Pressable
      focusable={false}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}>
      <View {...focusHandlers}>
        <Alert tone={toast.tone} message={toast.message} onDismiss={onDismiss} />
      </View>
    </Pressable>
  );
}

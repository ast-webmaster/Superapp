import { clsx } from 'clsx';
import { createContext, use, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';

import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { colors } from '@/shared/theme/tokens';

import { Button } from '../button/button';
import { Icon, type IconName } from '../icon/icon';
import { Sheet } from '../sheet/sheet';
import { AppText } from '../text/text';
import { TextField } from '../text-field/text-field';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: IconName;
  /** Colors the icon red, for an action that is hard to undo. The confirm button stays black. */
  destructive?: boolean;
  /** Adds a text field to the dialog. `onConfirm` receives the trimmed text. */
  reason?: {
    label: string;
    required: boolean;
    maxLength?: number;
    /** Fewest characters (after trimming) a required reason may have. Defaults to 1. */
    minLength?: number;
    requiredMessage?: string;
  };
  /**
   * Runs when the user confirms. Return the request's promise and the sheet stays open: its content
   * slides to a loading state, then to success (or to the error, with a retry). Return nothing and
   * the sheet closes at once.
   */
  onConfirm: (reason: string) => void | Promise<unknown>;
  /** Shown when a returned promise resolves. The title defaults to "Done". */
  success?: { title: string; message?: string };
}

const ConfirmContext = createContext<((options: ConfirmOptions) => void) | null>(null);

export function useConfirm() {
  const confirm = use(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider');
  return confirm;
}

/** How long the success state stays before the sheet closes on its own. */
const DONE_MS = 1600;

/**
 * Hosts the confirm sheet, so any screen can ask with `useConfirm()` on every platform. The sheet
 * stays mounted after it closes, so it slides away instead of vanishing; the next ask remounts it
 * (the `id` key) with fresh text and error. A sheet only ever closes itself (by `id`), so an ask
 * made from inside `onConfirm` is not closed by the one before it.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<{
    id: number;
    options: ConfirmOptions;
    open: boolean;
  } | null>(null);
  const confirm = useMemo(
    () => (options: ConfirmOptions) =>
      setPending((current) => ({ id: (current?.id ?? 0) + 1, options, open: true })),
    [],
  );

  return (
    <ConfirmContext value={confirm}>
      {children}
      {pending ? (
        <ConfirmSheet
          key={pending.id}
          {...pending.options}
          visible={pending.open}
          onClose={() =>
            setPending((current) =>
              current?.id === pending.id ? { ...current, open: false } : current,
            )
          }
        />
      ) : null}
    </ConfirmContext>
  );
}

type Phase = 'ask' | 'busy' | 'done' | 'failed';

interface ConfirmSheetProps extends ConfirmOptions {
  visible: boolean;
  onClose: () => void;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown> | undefined)?.then === 'function';
}

function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  icon = 'info',
  destructive = false,
  reason,
  success,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const [phase, setPhase] = useState<Phase>('ask');
  const [failure, setFailure] = useState('');
  const reducedMotion = useReducedMotion();
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const submit = () => {
    const trimmed = text.trim();
    if (reason?.required && trimmed.length < (reason.minLength ?? 1)) {
      setError(reason.requiredMessage ?? 'Enter a reason.');
      return;
    }
    const result = onConfirm(trimmed);
    if (!isThenable(result)) {
      onClose();
      return;
    }
    setPhase('busy');
    result.then(
      () => {
        setPhase('done');
        closeTimer.current = setTimeout(onClose, DONE_MS);
      },
      (cause: unknown) => {
        setFailure(cause instanceof Error && cause.message ? cause.message : 'Please try again.');
        setPhase('failed');
      },
    );
  };

  const slide = reducedMotion ? FadeIn.duration(150) : SlideInRight.duration(260);
  const slideOut = reducedMotion ? FadeOut.duration(150) : SlideOutLeft.duration(260);

  const pane = {
    ask: {
      title,
      well: destructive ? 'bg-danger-bg' : 'bg-primary-soft',
      glyph: <Icon name={icon} size={40} color={destructive ? 'danger' : 'primary'} />,
      text: message,
    },
    busy: {
      title: 'Working on it',
      well: 'bg-primary-soft',
      glyph: <ActivityIndicator size="large" color={colors.primary} />,
      text: 'This only takes a moment.',
    },
    done: {
      title: success?.title ?? 'Done',
      well: 'bg-success-bg',
      glyph: <Icon name="check" size={40} color="success" />,
      text: success?.message,
    },
    failed: {
      title: 'Something went wrong',
      well: 'bg-danger-bg',
      glyph: <Icon name="alert" size={40} color="danger" />,
      text: failure,
    },
  }[phase];

  const footer =
    phase === 'busy' ? (
      <Button block loading>
        {confirmLabel}
      </Button>
    ) : phase === 'done' ? (
      <Button block onPress={onClose}>
        Done
      </Button>
    ) : (
      <View className="flex-row gap-3">
        <Button variant="outline" block className="flex-1" onPress={onClose}>
          {phase === 'failed' ? 'Close' : cancelLabel}
        </Button>
        <Button block className="flex-1" onPress={submit}>
          {phase === 'failed' ? 'Try again' : confirmLabel}
        </Button>
      </View>
    );

  return (
    <Sheet
      visible={visible}
      title={pane.title}
      onClose={onClose}
      role="alertdialog"
      closeButton={false}
      dismissible={phase !== 'busy'}
      footer={footer}>
      {/* Only the content slides: the sheet stays put while the question gives way to the result. */}
      <View className="overflow-hidden">
        <Animated.View
          key={phase}
          entering={phase === 'ask' ? undefined : slide}
          exiting={slideOut}
          className="items-center gap-4 pt-2">
          <View className={clsx('size-24 items-center justify-center rounded-pill', pane.well)}>
            {pane.glyph}
          </View>
          {pane.text ? (
            <AppText variant="caption" tone="muted" className="text-center">
              {pane.text}
            </AppText>
          ) : null}
          {phase === 'ask' && reason ? (
            <TextField
              label={reason.label}
              value={text}
              onChangeText={(value) => {
                setText(value);
                setError(undefined);
              }}
              error={error}
              multiline
              maxLength={reason.maxLength}
              className="self-stretch"
            />
          ) : null}
        </Animated.View>
      </View>
    </Sheet>
  );
}

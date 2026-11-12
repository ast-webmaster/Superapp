import { clsx } from 'clsx';
import { createContext, use, useMemo, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';
import { TextField } from '../text-field/text-field';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: IconName;
  /** Colors the icon and the confirm action red, for an action that is hard to undo. */
  destructive?: boolean;
  /** Adds a text field to the dialog. `onConfirm` receives the trimmed text. */
  reason?: { label: string; required: boolean; maxLength?: number; requiredMessage?: string };
  onConfirm: (reason: string) => void;
}

const ConfirmContext = createContext<((options: ConfirmOptions) => void) | null>(null);

export function useConfirm() {
  const confirm = use(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider');
  return confirm;
}

/** Hosts the confirm dialog, so any screen can ask with `useConfirm()` on every platform. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const confirm = useMemo(() => (options: ConfirmOptions) => setPending(options), []);

  const close = () => setPending(null);

  return (
    <ConfirmContext value={confirm}>
      {children}
      {pending ? (
        <ConfirmDialog
          {...pending}
          onCancel={close}
          onConfirm={(reason) => {
            close();
            pending.onConfirm(reason);
          }}
        />
      ) : null}
    </ConfirmContext>
  );
}

interface ConfirmDialogProps extends ConfirmOptions {
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  icon = 'info',
  destructive = false,
  reason,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();

  const submit = () => {
    const trimmed = text.trim();
    if (reason?.required && !trimmed) {
      setError(reason.requiredMessage ?? 'Enter a reason.');
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 items-center justify-center bg-scrim px-5">
        <Pressable
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-0"
          onPress={onCancel}
        />
        <View
          accessible
          role="alertdialog"
          aria-modal
          aria-label={title}
          className="w-full max-w-dialog overflow-hidden rounded-xl bg-surface border border-border">
          <View className="items-center gap-3 px-6 pb-6 pt-8">
            <View
              className={clsx(
                'size-14 items-center justify-center rounded-pill',
                destructive ? 'bg-danger-bg' : 'bg-primary-soft',
              )}>
              <Icon name={icon} color={destructive ? 'danger' : 'primary'} />
            </View>
            <AppText variant="module-title" role="heading" className="text-center">
              {title}
            </AppText>
            {message ? (
              <AppText variant="caption" tone="muted" className="text-center">
                {message}
              </AppText>
            ) : null}
            {reason ? (
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
                className="mt-2 self-stretch"
              />
            ) : null}
          </View>
          <View className="flex-row bg-primary-soft">
            <DialogAction label={cancelLabel} onPress={onCancel} />
            <View aria-hidden className="w-px bg-lavender" />
            <DialogAction
              label={confirmLabel}
              tone={destructive ? 'danger' : 'primary'}
              onPress={submit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface DialogActionProps {
  label: string;
  tone?: 'muted' | 'primary' | 'danger';
  onPress: () => void;
}

function DialogAction({ label, tone = 'muted', onPress }: DialogActionProps) {
  return (
    <Pressable
      role="button"
      onPress={onPress}
      className={clsx('min-h-control flex-1 items-center justify-center px-4', focusRing)}>
      <AppText variant="button" tone={tone}>
        {label}
      </AppText>
    </Pressable>
  );
}

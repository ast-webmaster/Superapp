import { useEffect, useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';

import type { PickedFile } from '@/core/files';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import {
  Alert,
  Button,
  EmptyState,
  IconButton,
  Screen,
  Skeleton,
  SkeletonGroup,
  TopAppBar,
  useBottomNavInset,
} from '@/shared/ui';

import { AssistantCard } from '../components/assistant-card';
import { Composer } from '../components/composer';
import { DayDivider } from '../components/day-divider';
import { FailedSendRow } from '../components/failed-send-row';
import { PendingReply } from '../components/pending-reply';
import { SessionSheet } from '../components/session-sheet';
import { UserBubble } from '../components/user-bubble';
import { useChatFile } from '../hooks/use-chat-file';
import { useChatMessages } from '../hooks/use-chat-messages';
import { useChatProgress } from '../hooks/use-chat-progress';
import { useSendChatMessage } from '../hooks/use-send-chat-message';
import { useAiChatStore, type PendingSend } from '../store/aiChatStore';
import type { ChatMessage } from '../types';
import { dayLabel, isSameDay } from '../utils/day-label';
import { MicButton } from '../voice/mic-button';
import { useVoiceInput } from '../voice/use-voice-input';
import { useFollowLatest } from './use-follow-latest';

/** Space between the composer and the keyboard once the bottom nav is covered. */
const KEYBOARD_GAP = 8;

type Item =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage }
  | { kind: 'pending'; key: string; pending: PendingSend }
  | { kind: 'failed'; key: string };

function buildItems(messages: ChatMessage[], pending: PendingSend | null, failed: boolean): Item[] {
  const items: Item[] = [];
  let previous: string | null = null;
  for (const message of messages) {
    if (previous === null || !isSameDay(previous, message.created_at)) {
      items.push({ kind: 'day', key: `day-${message.uuid}`, label: dayLabel(message.created_at) });
    }
    items.push({ kind: 'message', key: message.uuid, message });
    previous = message.created_at;
  }
  if (pending) {
    const now = new Date().toISOString();
    if (previous === null || !isSameDay(previous, now)) {
      items.push({ kind: 'day', key: 'day-pending', label: dayLabel(now) });
    }
    items.push({ kind: 'pending', key: `pending-${pending.traceId}`, pending });
  }
  if (failed) items.push({ kind: 'failed', key: 'failed' });
  return items;
}

function syncedAt(timestamp: number) {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/** The AI chat: one conversation, its history in a sheet, and a composer above the bottom nav. */
export function AiChatScreen() {
  const activeUuid = useAiChatStore((state) => state.activeSessionUuid);
  const pending = useAiChatStore((state) => state.pending);
  const failedDraft = useAiChatStore((state) => state.failedDraft);
  const setActiveSession = useAiChatStore((state) => state.setActiveSession);
  const setFailedDraft = useAiChatStore((state) => state.setFailedDraft);

  const history = useChatMessages(activeUuid);
  const { send, isPending } = useSendChatMessage();
  const steps = useChatProgress(pending?.traceId ?? null);
  const files = useChatFile();
  const online = useIsOnline();

  const [text, setText] = useState('');
  const [draftFiles, setDraftFiles] = useState<PickedFile[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const voice = useVoiceInput(text, setText);

  const navInset = useBottomNavInset();
  const keyboardVisible = useKeyboardVisible();
  const { listRef, onScroll, onContentSizeChange, followNow } = useFollowLatest<Item>();

  // The message on its way belongs to the chat it was sent from (or to a new chat being made).
  const shownPending =
    pending && (pending.sessionUuid === null || pending.sessionUuid === activeUuid)
      ? pending
      : null;
  const items = buildItems(history.data?.messages ?? [], shownPending, failedDraft !== null);
  const loading = activeUuid !== null && history.isPending && !shownPending;
  // Sending into a chat that has not loaded would leave nothing to compare a lost send against.
  const historyReady = activeUuid === null || history.data !== undefined;

  const submit = () => {
    const message = text.trim();
    if (!message && draftFiles.length === 0) return;
    // Words still on their way from the recognizer must not refill the field after the send.
    voice.cancel();
    void send(message, draftFiles);
    setText('');
    setDraftFiles([]);
    followNow();
  };

  const restore = () => {
    if (!failedDraft) return;
    setText(failedDraft.message);
    setDraftFiles(failedDraft.files);
    setFailedDraft(null);
  };

  const renderItem = ({ item }: { item: Item }) => {
    switch (item.kind) {
      case 'day':
        return <DayDivider label={item.label} />;
      case 'message': {
        const { message } = item;
        return message.role === 'user' ? (
          <UserBubble
            message={message.message}
            attachments={message.attachments}
            onOpenAttachment={(index) => {
              const file = message.attachments[index];
              if (file) files.downloadAttachment(file);
            }}
          />
        ) : (
          <AssistantCard
            message={message}
            onExport={() => files.exportMessage(message.uuid)}
            exporting={files.exportingUuid === message.uuid}
          />
        );
      }
      case 'pending':
        return (
          <View className="gap-4">
            <UserBubble message={item.pending.message} attachments={item.pending.files} />
            <PendingReply steps={steps} />
          </View>
        );
      case 'failed':
        return <FailedSendRow error={failedDraft?.error} onRestore={restore} />;
    }
  };

  let body;
  if (loading) {
    body = (
      <SkeletonGroup label="Loading the chat" className="flex-1 gap-4 px-5">
        <Skeleton className="h-12 w-3/5 self-end rounded-xl" />
        <Skeleton className="h-28 w-4/5 rounded-xl" />
        <Skeleton className="h-12 w-1/2 self-end rounded-xl" />
      </SkeletonGroup>
    );
  } else if (activeUuid !== null && history.isError && !history.data) {
    body = (
      <EmptyState
        icon="alert"
        title={online ? 'Could not load this chat' : 'You are offline'}
        description={online ? history.error.message : 'Connect to load this chat.'}
        className="flex-1">
        <Button variant="secondary" onPress={() => void history.refetch()}>
          Try again
        </Button>
      </EmptyState>
    );
  } else if (items.length === 0) {
    body = (
      <EmptyState
        icon="ai"
        title="Ask me anything"
        description="Ask about your sales, stock or documents, or attach a file."
        className="flex-1"
      />
    );
  } else {
    body = (
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-4"
        onScroll={onScroll}
        scrollEventThrottle={100}
        onContentSizeChange={onContentSizeChange}
        ListHeaderComponent={
          !online && history.data ? (
            <Alert
              tone="warning"
              message={`You are offline. Showing messages from ${syncedAt(history.dataUpdatedAt)}.`}
            />
          ) : undefined
        }
      />
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <TopAppBar
          title="AI chat"
          right={
            <View className="flex-row gap-2">
              <IconButton
                icon="history"
                label="Chat history"
                disabled={isPending}
                onPress={() => setHistoryOpen(true)}
              />
              <IconButton
                icon="pencil"
                label="New chat"
                disabled={isPending || (activeUuid === null && !failedDraft)}
                onPress={() => setActiveSession(null)}
              />
            </View>
          }
        />
        {body}
        <View
          className="px-5 pt-2"
          style={{ paddingBottom: keyboardVisible ? KEYBOARD_GAP : navInset }}>
          <Composer
            value={text}
            onChangeText={setText}
            files={draftFiles}
            onChangeFiles={setDraftFiles}
            onSend={submit}
            busy={isPending || !historyReady}
            listening={voice.listening}
            mic={<MicButton voice={voice} />}
          />
        </View>
      </KeyboardAvoidingView>
      <SessionSheet
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onOpen={setActiveSession}
      />
    </Screen>
  );
}

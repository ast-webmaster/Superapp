import { View } from 'react-native';

import {
  AppText,
  Button,
  EmptyState,
  IconButton,
  ListGroup,
  ListRow,
  Sheet,
  Skeleton,
  SkeletonGroup,
  useConfirm,
  useToast,
} from '@/shared/ui';

import { useChatSessions } from '../hooks/use-chat-sessions';
import { useDeleteChatSession } from '../hooks/use-delete-chat-session';
import { localDate } from '../utils/day-label';

export interface SessionSheetProps {
  visible: boolean;
  onClose: () => void;
  onOpen: (uuid: string) => void;
}

/** The user's past chats: tap one to open it, or delete it. */
export function SessionSheet({ visible, onClose, onOpen }: SessionSheetProps) {
  const sessions = useChatSessions(visible);
  const remove = useDeleteChatSession();
  const confirm = useConfirm();
  const toast = useToast();

  const askDelete = (uuid: string) =>
    confirm({
      title: 'Delete this chat?',
      message: 'The messages and files in it are removed.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () =>
        remove.mutate(uuid, {
          onSuccess: () => toast.show({ tone: 'success', message: 'Chat deleted.' }),
          onError: (error) => toast.show({ tone: 'danger', message: error.message }),
        }),
    });

  let body;
  if (sessions.isPending) {
    body = (
      <SkeletonGroup label="Loading chats">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </SkeletonGroup>
    );
  } else if (sessions.isError && !sessions.data) {
    body = (
      <EmptyState
        icon="alert"
        title="Could not load your chats"
        description={sessions.error.message}>
        <Button variant="secondary" onPress={() => void sessions.refetch()}>
          Try again
        </Button>
      </EmptyState>
    );
  } else if (sessions.data.length === 0) {
    body = <EmptyState icon="chat" title="No chats yet" description="Your chats will show here." />;
  } else {
    body = (
      <>
        <ListGroup>
          {sessions.data.map((session) => (
            <View key={session.uuid} className="flex-row items-center">
              <ListRow
                label={session.title}
                value={localDate(session.created_at)}
                onPress={() => {
                  onOpen(session.uuid);
                  onClose();
                }}
                className="flex-1"
              />
              <IconButton
                icon="x"
                size="xs"
                label={`Delete ${session.title}`}
                disabled={remove.isPending}
                onPress={() => askDelete(session.uuid)}
              />
            </View>
          ))}
        </ListGroup>
        <AppText variant="caption" tone="muted">
          Your 20 newest chats.
        </AppText>
      </>
    );
  }

  return (
    <Sheet visible={visible} title="Chat history" onClose={onClose} fullHeight>
      {body}
    </Sheet>
  );
}

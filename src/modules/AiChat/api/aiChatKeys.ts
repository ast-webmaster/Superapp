export const aiChatKeys = {
  all: ['ai-chat'] as const,
  sessions: () => [...aiChatKeys.all, 'sessions'] as const,
  messages: (uuid: string) => [...aiChatKeys.all, 'messages', uuid] as const,
};

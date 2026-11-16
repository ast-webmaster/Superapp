import { AI_CHAT_PERMISSIONS } from './permissions';

it('matches the backend list (AiChatConversationService::READ_PERMISSIONS)', () => {
  expect(AI_CHAT_PERMISSIONS).toEqual([
    'read_aichat',
    'read_all_aichat',
    'approve_product_borrowing_as_product_manager',
    'approve_product_borrowing_as_manager',
    'process_product_borrowing',
    'process_product_borrowing_as_logistic',
  ]);
});

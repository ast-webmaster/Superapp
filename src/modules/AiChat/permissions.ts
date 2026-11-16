/**
 * Any one opens the AI chat. The same list guards the API on the server
 * (`AiChatConversationService::READ_PERMISSIONS`); keep the two in step.
 */
export const AI_CHAT_PERMISSIONS = [
  'read_aichat',
  'read_all_aichat',
  'approve_product_borrowing_as_product_manager',
  'approve_product_borrowing_as_manager',
  'process_product_borrowing',
  'process_product_borrowing_as_logistic',
] as const;

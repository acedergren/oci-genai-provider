/**
 * Converts AI SDK messages to Cohere chat format.
 *
 * Cohere API structure:
 * - message: string (the latest user input)
 * - chat_history: Array of previous messages with role and message fields
 */

import type { OCIMessage } from './messages';

interface CohereMessage {
  role: 'USER' | 'CHATBOT';
  message: string;
}

interface CohereChatRequest {
  message: string;
  chat_history?: CohereMessage[];
}

/**
 * Converts generic OCI messages to Cohere format.
 * Extracts the last user message as 'message' and converts previous messages to 'chat_history'.
 */
export function convertToCohereFormat(messages: OCIMessage[]): CohereChatRequest {
  if (messages.length === 0) {
    throw new Error('At least one message is required');
  }

  // Find the last user message
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf('USER');

  if (lastUserIndex === -1) {
    throw new Error('At least one USER message is required');
  }

  // Extract the current message (last user message)
  const currentMessage = messages[lastUserIndex];
  const messageText = currentMessage.content
    .filter((c) => c.type === 'TEXT')
    .map((c) => c.text)
    .join('\n');

  // Convert previous messages to chat_history (excluding system messages for now)
  const chat_history: CohereMessage[] = [];

  for (let i = 0; i < lastUserIndex; i++) {
    const msg = messages[i];

    // Skip system messages (Cohere handles them differently)
    if (msg.role === 'SYSTEM') {
      continue;
    }

    const text = msg.content
      .filter((c) => c.type === 'TEXT')
      .map((c) => c.text)
      .join('\n');

    chat_history.push({
      role: msg.role === 'USER' ? 'USER' : 'CHATBOT',
      message: text,
    });
  }

  return {
    message: messageText,
    ...(chat_history.length > 0 ? { chat_history } : {}),
  };
}

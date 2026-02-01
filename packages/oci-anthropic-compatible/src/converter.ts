/**
 * Message Format Converter
 *
 * Converts between Anthropic Messages API format and OCI GenAI format
 */

import type { CoreMessage, ImagePart, TextPart } from 'ai';
import type {
  AnthropicMessagesRequest,
  AnthropicMessagesResponse,
  AnthropicMessage,
  ContentBlock,
  AnthropicResponseContent,
} from './types.js';
import { mapModel } from './types.js';

/**
 * Convert Anthropic content block to AI SDK format
 */
function convertContentBlock(block: ContentBlock): TextPart | ImagePart {
  if (typeof block === 'string') {
    return { type: 'text', text: block };
  }

  if (block.type === 'text') {
    return { type: 'text', text: block.text };
  }

  if (block.type === 'image') {
    return {
      type: 'image',
      image: `data:${block.source.media_type};base64,${block.source.data}`,
    };
  }

  // Fallback for unknown types
  return { type: 'text', text: JSON.stringify(block) };
}

/**
 * Convert Anthropic message to AI SDK CoreMessage format
 */
function convertMessage(msg: AnthropicMessage): CoreMessage {
  const content = Array.isArray(msg.content) ? msg.content.map(convertContentBlock) : msg.content;

  if (msg.role === 'user') {
    return { role: 'user', content };
  }

  // Assistant messages
  if (typeof content === 'string') {
    return { role: 'assistant', content };
  }

  // Convert parts to string for assistant (AI SDK expects string for assistant)
  const textContent = content
    .filter((p): p is TextPart => p.type === 'text')
    .map((p) => p.text)
    .join('');

  return { role: 'assistant', content: textContent };
}

/**
 * Convert Anthropic Messages API request to AI SDK format
 */
export function convertRequest(request: AnthropicMessagesRequest): {
  model: string;
  messages: CoreMessage[];
  maxTokens: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
} {
  const messages: CoreMessage[] = [];

  // Add system message if present
  if (request.system) {
    messages.push({ role: 'system', content: request.system });
  }

  // Convert messages
  for (const msg of request.messages) {
    messages.push(convertMessage(msg));
  }

  return {
    model: mapModel(request.model),
    messages,
    maxTokens: request.max_tokens,
    temperature: request.temperature,
    topP: request.top_p,
    topK: request.top_k,
    stopSequences: request.stop_sequences,
  };
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `msg_${timestamp}${random}`;
}

/**
 * Convert AI SDK response to Anthropic Messages API format
 */
export function convertResponse(
  text: string,
  model: string,
  finishReason: string,
  usage: { promptTokens: number; completionTokens: number }
): AnthropicMessagesResponse {
  const content: AnthropicResponseContent[] = [
    {
      type: 'text',
      text,
    },
  ];

  // Map finish reason to Anthropic stop_reason
  let stopReason: AnthropicMessagesResponse['stop_reason'] = 'end_turn';
  if (finishReason === 'length') {
    stopReason = 'max_tokens';
  } else if (finishReason === 'stop') {
    stopReason = 'stop_sequence';
  }

  return {
    id: generateMessageId(),
    type: 'message',
    role: 'assistant',
    content,
    model,
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: usage.promptTokens,
      output_tokens: usage.completionTokens,
    },
  };
}

/**
 * Create an Anthropic error response
 */
export function createErrorResponse(
  type: string,
  message: string
): { type: 'error'; error: { type: string; message: string } } {
  return {
    type: 'error',
    error: {
      type,
      message,
    },
  };
}

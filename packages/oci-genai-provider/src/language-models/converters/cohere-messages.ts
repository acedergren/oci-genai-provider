/**
 * Converts AI SDK messages to Cohere chat format.
 *
 * Cohere API structure:
 * - message: string (the latest user input)
 * - chatHistory: Array of previous messages with role, message, and optional toolCalls
 * - toolResults: Array of tool execution results (when continuing after tool calls)
 *
 * Reference: OCI SDK CohereChatRequest documentation
 */

import type { OCIMessage } from './messages';

/**
 * Tool call format for Cohere API (in chatHistory)
 */
interface CohereToolCall {
  name: string;
  parameters: Record<string, unknown>;
}

/**
 * Cohere message in chat history
 */
interface CohereMessage {
  role: 'USER' | 'CHATBOT';
  message: string;
  toolCalls?: CohereToolCall[];
}

/**
 * Tool result format for Cohere API
 * Structure: { call: {name, parameters}, outputs: [{result}] }
 */
interface CohereToolResult {
  call: {
    name: string;
    parameters: Record<string, unknown>;
  };
  outputs: Array<{ result: string } | Record<string, unknown>>;
}

/**
 * Cohere chat request format
 */
interface CohereChatRequest {
  message: string;
  chatHistory?: CohereMessage[];
  preambleOverride?: string;
  toolResults?: CohereToolResult[];
}

/**
 * Converts generic OCI messages to Cohere format.
 * Extracts the last user message as 'message', converts all other messages to 'chatHistory',
 * and extracts tool results from TOOL messages. This preserves tool-call/tool-result turns
 * that occur after the latest user message during AI SDK tool loops.
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

  // Extract system messages into preamble
  const systemMessages = messages
    .filter((m) => m.role === 'SYSTEM')
    .map((m) => m.content.filter((c) => c.type === 'TEXT').map((c) => c.text))
    .flat()
    .join('\n');

  // Extract the current message (last user message)
  const currentMessage = messages[lastUserIndex];
  const messageText = currentMessage.content
    .filter((c) => c.type === 'TEXT')
    .map((c) => c.text)
    .join('\n');

  // Build a map of tool calls by ID for matching with results
  const toolCallsById = new Map<string, { name: string; parameters: Record<string, unknown> }>();

  // Convert all non-current messages to chatHistory and collect tool results.
  // During automatic tool loops, assistant/tool messages can occur after the latest
  // user message, and they still need to be preserved for Cohere follow-up requests.
  const chatHistory: CohereMessage[] = [];
  const toolResults: CohereToolResult[] = [];

  for (let i = 0; i < messages.length; i++) {
    if (i === lastUserIndex) {
      continue;
    }

    const msg = messages[i];

    // Skip system messages (handled by preambleOverride)
    if (msg.role === 'SYSTEM') {
      continue;
    }

    // Handle TOOL messages - extract tool results
    if (msg.role === 'TOOL') {
      const resultText = msg.content
        .filter((c) => c.type === 'TEXT')
        .map((c) => c.text)
        .join('\n');

      // Find the matching tool call
      const toolCallId = msg.toolCallId;
      if (toolCallId) {
        const toolCall = toolCallsById.get(toolCallId);
        if (toolCall) {
          toolResults.push({
            call: {
              name: toolCall.name,
              parameters: toolCall.parameters,
            },
            outputs: normalizeCohereToolOutputs(resultText),
          });
        }
      }
      continue;
    }

    // Extract text content
    const text = msg.content
      .filter((c) => c.type === 'TEXT')
      .map((c) => c.text)
      .join('\n');

    // Handle ASSISTANT messages - may have tool calls
    if (msg.role === 'ASSISTANT') {
      const cohereMessage: CohereMessage = {
        role: 'CHATBOT',
        message: text,
      };

      // Convert tool calls to Cohere format and store for later matching
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        const cohereToolCalls: CohereToolCall[] = msg.toolCalls.map((tc) => {
          // Parse arguments from JSON string to object
          let parameters: Record<string, unknown> = {};
          try {
            if (tc.arguments) {
              parameters = JSON.parse(tc.arguments) as Record<string, unknown>;
            }
          } catch {
            parameters = {};
          }

          // Store for matching with tool results
          toolCallsById.set(tc.id, {
            name: tc.name,
            parameters,
          });

          return {
            name: tc.name,
            parameters,
          };
        });

        cohereMessage.toolCalls = cohereToolCalls;
      }

      chatHistory.push(cohereMessage);
      continue;
    }

    // Handle USER messages
    if (msg.role === 'USER') {
      chatHistory.push({
        role: 'USER',
        message: text,
      });
    }
  }

  return {
    message: messageText,
    ...(chatHistory.length > 0 ? { chatHistory } : {}),
    ...(systemMessages ? { preambleOverride: systemMessages } : {}),
    ...(toolResults.length > 0 ? { toolResults } : {}),
  };
}

function normalizeCohereToolOutputs(
  resultText: string
): Array<{ result: string } | Record<string, unknown>> {
  const normalized = tryNormalizeAISDKToolResult(resultText);

  return [normalized ?? { result: resultText }];
}

function tryNormalizeAISDKToolResult(
  resultText: string
): { result: string } | Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(resultText) as unknown;

    if (
      parsed &&
      typeof parsed === 'object' &&
      'type' in parsed &&
      'value' in parsed &&
      typeof parsed.type === 'string'
    ) {
      return normalizeAISDKToolResultValue(parsed.type, parsed.value);
    }
  } catch {
    // Non-JSON tool outputs should remain plain result strings.
  }

  return undefined;
}

function normalizeAISDKToolResultValue(
  type: string,
  value: unknown
): { result: string } | Record<string, unknown> {
  if (type === 'json' && value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (type === 'text' && typeof value === 'string') {
    return { result: value };
  }

  return {
    result: typeof value === 'string' ? value : JSON.stringify(value),
  };
}

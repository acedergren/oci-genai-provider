import type {
  LanguageModelV3Prompt,
  LanguageModelV3ToolCallPart,
  LanguageModelV3ToolResultPart,
} from '@ai-sdk/provider';

export interface OCIMessage {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: Array<{ type: 'TEXT'; text: string }>;
  toolCalls?: Array<{
    id: string;
    type: 'FUNCTION';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  toolCallId?: string;
}

type RoleMap = {
  user: 'USER';
  assistant: 'ASSISTANT';
  system: 'SYSTEM';
  tool: 'TOOL';
};

const ROLE_MAP: RoleMap = {
  user: 'USER',
  assistant: 'ASSISTANT',
  system: 'SYSTEM',
  tool: 'TOOL',
};

export function convertToOCIMessages(prompt: LanguageModelV3Prompt): OCIMessage[] {
  return prompt.map((message) => {
    const role = message.role as keyof RoleMap;

    if (!ROLE_MAP[role]) {
      throw new Error(`Unsupported role: ${role}`);
    }

    const ociRole = ROLE_MAP[role];

    // Handle string content (system messages)
    if (typeof message.content === 'string') {
      return {
        role: ociRole,
        content: [{ type: 'TEXT' as const, text: message.content }],
      };
    }

    // Handle tool messages with tool-result parts
    if (role === 'tool' && Array.isArray(message.content)) {
      const toolResultPart = message.content.find(
        (part): part is LanguageModelV3ToolResultPart => part.type === 'tool-result'
      );

      if (toolResultPart) {
        const outputText = extractToolResultText(toolResultPart);
        return {
          role: ociRole,
          toolCallId: toolResultPart.toolCallId,
          content: [{ type: 'TEXT' as const, text: outputText }],
        };
      }
    }

    // Handle assistant messages with tool-call parts
    if (role === 'assistant' && Array.isArray(message.content)) {
      const toolCallParts = message.content.filter(
        (part): part is LanguageModelV3ToolCallPart => part.type === 'tool-call'
      );

      if (toolCallParts.length > 0) {
        const textParts = message.content
          .filter((part) => part.type === 'text')
          .map((part) => ({
            type: 'TEXT' as const,
            text: (part as { text: string }).text,
          }));

        return {
          role: ociRole,
          content: textParts,
          toolCalls: toolCallParts.map((part) => ({
            id: part.toolCallId,
            type: 'FUNCTION' as const,
            function: {
              name: part.toolName,
              // AI SDK v3 uses 'input' which can be any type, stringify it
              arguments:
                typeof part.input === 'string' ? part.input : JSON.stringify(part.input ?? {}),
            },
          })),
        };
      }
    }

    // Handle array content - single-pass conversion to text parts
    const textParts = Array.isArray(message.content)
      ? message.content.reduce<Array<{ type: 'TEXT'; text: string }>>((acc, part) => {
          if (part.type === 'text') {
            acc.push({ type: 'TEXT' as const, text: part.text });
          }
          return acc;
        }, [])
      : [];

    return {
      role: ociRole,
      content: textParts,
    };
  });
}

/**
 * Extract text from tool result output.
 * AI SDK v3 uses { type: 'text', value: string } format.
 */
function extractToolResultText(part: LanguageModelV3ToolResultPart): string {
  const output = part.output;
  if (output.type === 'text') {
    return output.value;
  }
  // For other output types (file, base64), stringify the content
  return JSON.stringify(output);
}

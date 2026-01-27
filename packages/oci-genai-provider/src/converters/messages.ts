import type { LanguageModelV3Prompt } from '@ai-sdk/provider';

export interface OCIMessage {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: Array<{ type: 'TEXT'; text: string }>;
}

type RoleMap = {
  user: 'USER';
  assistant: 'ASSISTANT';
  system: 'SYSTEM';
};

const ROLE_MAP: RoleMap = {
  user: 'USER',
  assistant: 'ASSISTANT',
  system: 'SYSTEM',
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

    // Handle array content - filter to text parts only
    const textParts = Array.isArray(message.content)
      ? message.content
          .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
          .map((part) => ({ type: 'TEXT' as const, text: part.text }))
      : [];

    return {
      role: ociRole,
      content: textParts,
    };
  });
}

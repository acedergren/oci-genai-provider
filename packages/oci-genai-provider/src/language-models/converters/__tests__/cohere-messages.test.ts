/**
 * Tests for Cohere message format conversion with tool calling support.
 *
 * These tests verify the conversion from AI SDK messages to Cohere's specific format,
 * including proper handling of tool calls and tool results.
 *
 * Cohere API requires:
 * - toolResults: Array of {call: {name, parameters}, outputs: [{result}]}
 * - toolCalls in chatHistory for CHATBOT messages that made tool calls
 * - isForceSingleStep: true when toolResults are present (handled by caller)
 */
import { describe, it, expect } from '@jest/globals';
import { convertToCohereFormat } from '../cohere-messages';
import type { OCIMessage } from '../messages';

describe('convertToCohereFormat', () => {
  describe('basic message conversion', () => {
    it('should convert simple user message', () => {
      const messages: OCIMessage[] = [
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Hello' }],
        },
      ];

      const result = convertToCohereFormat(messages);

      expect(result.message).toBe('Hello');
      expect(result.chatHistory).toBeUndefined();
    });

    it('should extract system message as preambleOverride', () => {
      const messages: OCIMessage[] = [
        {
          role: 'SYSTEM',
          content: [{ type: 'TEXT', text: 'You are helpful.' }],
        },
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Hi' }],
        },
      ];

      const result = convertToCohereFormat(messages);

      expect(result.preambleOverride).toBe('You are helpful.');
      expect(result.message).toBe('Hi');
    });

    it('should convert chat history correctly', () => {
      const messages: OCIMessage[] = [
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'First question' }],
        },
        {
          role: 'ASSISTANT',
          content: [{ type: 'TEXT', text: 'First answer' }],
        },
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Second question' }],
        },
      ];

      const result = convertToCohereFormat(messages);

      expect(result.message).toBe('Second question');
      expect(result.chatHistory).toHaveLength(2);
      expect(result.chatHistory![0]).toMatchObject({
        role: 'USER',
        message: 'First question',
      });
      expect(result.chatHistory![1]).toMatchObject({
        role: 'CHATBOT',
        message: 'First answer',
      });
    });
  });

  describe('tool call handling', () => {
    it('should include toolCalls in chatHistory for assistant messages with tool calls', () => {
      const messages: OCIMessage[] = [
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'What is the weather?' }],
        },
        {
          role: 'ASSISTANT',
          content: [{ type: 'TEXT', text: 'Let me check the weather.' }],
          toolCalls: [
            {
              id: 'call_123',
              type: 'FUNCTION',
              name: 'get_weather',
              arguments: '{"city": "London"}',
            },
          ],
        },
        {
          role: 'TOOL',
          content: [{ type: 'TEXT', text: '{"temperature": 15, "condition": "cloudy"}' }],
          toolCallId: 'call_123',
        },
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Thanks!' }],
        },
      ];

      const result = convertToCohereFormat(messages);

      expect(result.message).toBe('Thanks!');
      expect(result.chatHistory).toBeDefined();

      // Find the CHATBOT message with tool calls
      const chatbotWithTools = result.chatHistory!.find((m) => m.role === 'CHATBOT' && m.toolCalls);
      expect(chatbotWithTools).toBeDefined();
      expect(chatbotWithTools!.toolCalls).toHaveLength(1);
      expect(chatbotWithTools!.toolCalls![0]).toMatchObject({
        name: 'get_weather',
        parameters: { city: 'London' },
      });
    });

    it('should extract toolResults from TOOL messages', () => {
      const messages: OCIMessage[] = [
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'What is the weather?' }],
        },
        {
          role: 'ASSISTANT',
          content: [{ type: 'TEXT', text: 'Let me check.' }],
          toolCalls: [
            {
              id: 'call_weather',
              type: 'FUNCTION',
              name: 'get_weather',
              arguments: '{"city": "Paris"}',
            },
          ],
        },
        {
          role: 'TOOL',
          content: [{ type: 'TEXT', text: '{"temp": 20}' }],
          toolCallId: 'call_weather',
        },
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Great!' }],
        },
      ];

      const result = convertToCohereFormat(messages);

      expect(result.toolResults).toBeDefined();
      expect(result.toolResults).toHaveLength(1);
      expect(result.toolResults![0]).toMatchObject({
        call: {
          name: 'get_weather',
          parameters: { city: 'Paris' },
        },
        outputs: [{ result: '{"temp": 20}' }],
      });
    });

    it('should handle multiple tool calls and results', () => {
      const messages: OCIMessage[] = [
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Compare weather in London and Paris' }],
        },
        {
          role: 'ASSISTANT',
          content: [{ type: 'TEXT', text: 'I will check both cities.' }],
          toolCalls: [
            {
              id: 'call_1',
              type: 'FUNCTION',
              name: 'get_weather',
              arguments: '{"city": "London"}',
            },
            {
              id: 'call_2',
              type: 'FUNCTION',
              name: 'get_weather',
              arguments: '{"city": "Paris"}',
            },
          ],
        },
        {
          role: 'TOOL',
          content: [{ type: 'TEXT', text: '{"temp": 10}' }],
          toolCallId: 'call_1',
        },
        {
          role: 'TOOL',
          content: [{ type: 'TEXT', text: '{"temp": 18}' }],
          toolCallId: 'call_2',
        },
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Which is warmer?' }],
        },
      ];

      const result = convertToCohereFormat(messages);

      expect(result.toolResults).toHaveLength(2);
      expect(result.toolResults![0].call.parameters).toEqual({ city: 'London' });
      expect(result.toolResults![1].call.parameters).toEqual({ city: 'Paris' });
    });

    it('should set hasToolResults flag when tool results are present', () => {
      const messages: OCIMessage[] = [
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Run a command' }],
        },
        {
          role: 'ASSISTANT',
          content: [{ type: 'TEXT', text: 'Running...' }],
          toolCalls: [
            {
              id: 'call_bash',
              type: 'FUNCTION',
              name: 'bash',
              arguments: '{"command": "pwd"}',
            },
          ],
        },
        {
          role: 'TOOL',
          content: [{ type: 'TEXT', text: '/Users/test' }],
          toolCallId: 'call_bash',
        },
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'What was the result?' }],
        },
      ];

      const result = convertToCohereFormat(messages);

      // The caller (OCILanguageModel) should check hasToolResults to set isForceSingleStep
      expect(result.hasToolResults).toBe(true);
      expect(result.toolResults).toBeDefined();
      expect(result.toolResults!.length).toBeGreaterThan(0);
    });

    it('should not set hasToolResults when no tool results present', () => {
      const messages: OCIMessage[] = [
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Hello' }],
        },
      ];

      const result = convertToCohereFormat(messages);

      expect(result.hasToolResults).toBe(false);
      expect(result.toolResults).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle assistant message with tool calls but no text', () => {
      const messages: OCIMessage[] = [
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Get weather' }],
        },
        {
          role: 'ASSISTANT',
          content: [], // No text content
          toolCalls: [
            {
              id: 'call_1',
              type: 'FUNCTION',
              name: 'get_weather',
              arguments: '{}',
            },
          ],
        },
        {
          role: 'TOOL',
          content: [{ type: 'TEXT', text: 'sunny' }],
          toolCallId: 'call_1',
        },
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Thanks' }],
        },
      ];

      const result = convertToCohereFormat(messages);

      // Assistant message should still appear in chatHistory with toolCalls
      const chatbotMessage = result.chatHistory!.find((m) => m.toolCalls);
      expect(chatbotMessage).toBeDefined();
      expect(chatbotMessage!.message).toBe(''); // Empty message is OK
      expect(chatbotMessage!.toolCalls).toHaveLength(1);
    });

    it('should handle tool call with empty arguments', () => {
      const messages: OCIMessage[] = [
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'List files' }],
        },
        {
          role: 'ASSISTANT',
          content: [{ type: 'TEXT', text: 'Listing...' }],
          toolCalls: [
            {
              id: 'call_ls',
              type: 'FUNCTION',
              name: 'ls',
              arguments: '', // Empty arguments string
            },
          ],
        },
        {
          role: 'TOOL',
          content: [{ type: 'TEXT', text: 'file1.txt\nfile2.txt' }],
          toolCallId: 'call_ls',
        },
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Good' }],
        },
      ];

      const result = convertToCohereFormat(messages);

      expect(result.toolResults![0].call.parameters).toEqual({});
    });

    it('should throw error if no messages provided', () => {
      expect(() => convertToCohereFormat([])).toThrow('At least one message is required');
    });

    it('should throw error if no USER message present', () => {
      const messages: OCIMessage[] = [
        {
          role: 'SYSTEM',
          content: [{ type: 'TEXT', text: 'System prompt' }],
        },
      ];

      expect(() => convertToCohereFormat(messages)).toThrow(
        'At least one USER message is required'
      );
    });
  });
});

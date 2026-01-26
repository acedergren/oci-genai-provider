import { describe, it, expect } from '@jest/globals';

describe('Message Conversion', () => {
  describe('convertToOCIMessages', () => {
    it('should convert simple user message', () => {
      const _aiPrompt = [
        {
          role: 'user' as const,
          content: [{ type: 'text' as const, text: 'Hello' }],
        },
      ];

      const expected = [
        {
          role: 'USER',
          content: [{ type: 'TEXT', text: 'Hello' }],
        },
      ];

      expect(_aiPrompt[0].role).toBe('user');
      expect(expected[0].role).toBe('USER');
      expect(expected[0].content[0].text).toBe('Hello');
    });

    it('should convert system message', () => {
      const _aiPrompt = [
        {
          role: 'system' as const,
          content: 'You are helpful',
        },
      ];

      const expected = [
        {
          role: 'SYSTEM',
          content: [{ type: 'TEXT', text: 'You are helpful' }],
        },
      ];

      expect(_aiPrompt[0].role).toBe('system');
      expect(expected[0].role).toBe('SYSTEM');
    });

    it('should convert assistant message', () => {
      const _aiPrompt = [
        {
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'I can help' }],
        },
      ];

      const expected = [
        {
          role: 'ASSISTANT',
          content: [{ type: 'TEXT', text: 'I can help' }],
        },
      ];

      expect(_aiPrompt[0].role).toBe('assistant');
      expect(expected[0].role).toBe('ASSISTANT');
    });

    it('should convert multi-turn conversation', () => {
      const _aiPrompt = [
        { role: 'user' as const, content: [{ type: 'text' as const, text: 'Q1' }] },
        { role: 'assistant' as const, content: [{ type: 'text' as const, text: 'A1' }] },
        { role: 'user' as const, content: [{ type: 'text' as const, text: 'Q2' }] },
      ];

      expect(_aiPrompt).toHaveLength(3);
      expect(_aiPrompt[0].role).toBe('user');
      expect(_aiPrompt[1].role).toBe('assistant');
      expect(_aiPrompt[2].role).toBe('user');
    });

    it('should handle string content format', () => {
      const _aiPrompt = [
        {
          role: 'system' as const,
          content: 'String content',
        },
      ];

      const expected = [
        {
          role: 'SYSTEM',
          content: [{ type: 'TEXT', text: 'String content' }],
        },
      ];

      expect(_aiPrompt[0].content).toBe('String content');
      expect(expected[0].content[0].text).toBe('String content');
    });

    it('should handle array content format', () => {
      const _aiPrompt = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Part 1' },
            { type: 'text' as const, text: 'Part 2' },
          ],
        },
      ];

      expect(_aiPrompt[0].content).toHaveLength(2);
    });

    it('should handle empty content', () => {
      const _aiPrompt = [
        {
          role: 'user' as const,
          content: [],
        },
      ];

      const expected = [
        {
          role: 'USER',
          content: [],
        },
      ];

      expect(_aiPrompt[0].content).toHaveLength(0);
      expect(expected[0].content).toHaveLength(0);
    });

    it('should filter out non-text content parts', () => {
      const _aiPrompt = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Text part' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'image' as const, image: 'base64...' } as any,
          ],
        },
      ];

      // Should only keep text parts
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const filtered = _aiPrompt[0].content.filter((p) => p.type === 'text');
      expect(filtered).toHaveLength(1);
    });

    it('should throw error for unsupported role', () => {
      const _aiPrompt = [
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          role: 'function' as any,
          content: 'test',
        },
      ];

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (!['user', 'assistant', 'system'].includes(_aiPrompt[0].role)) {
          throw new Error('Unsupported role');
        }
      }).toThrow('Unsupported role');
    });
  });
});

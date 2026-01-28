import { describe, it, expect } from '@jest/globals';
import { convertToOCIMessages } from '../messages';

describe('Message Conversion', () => {
  describe('convertToOCIMessages', () => {
    it('should convert simple user message', () => {
      const aiPrompt = [
        {
          role: 'user' as const,
          content: [{ type: 'text' as const, text: 'Hello' }],
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      expect(result[0].role).toBe('USER');
      expect(result[0].content[0].text).toBe('Hello');
    });

    it('should convert system message', () => {
      const aiPrompt = [
        {
          role: 'system' as const,
          content: 'You are helpful',
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      expect(result[0].role).toBe('SYSTEM');
      expect(result[0].content[0].text).toBe('You are helpful');
    });

    it('should convert assistant message', () => {
      const aiPrompt = [
        {
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'I can help' }],
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      expect(result[0].role).toBe('ASSISTANT');
      expect(result[0].content[0].text).toBe('I can help');
    });

    it('should convert multi-turn conversation', () => {
      const aiPrompt = [
        { role: 'user' as const, content: [{ type: 'text' as const, text: 'Q1' }] },
        { role: 'assistant' as const, content: [{ type: 'text' as const, text: 'A1' }] },
        { role: 'user' as const, content: [{ type: 'text' as const, text: 'Q2' }] },
      ];

      const result = convertToOCIMessages(aiPrompt);

      expect(result).toHaveLength(3);
      expect(result[0].role).toBe('USER');
      expect(result[1].role).toBe('ASSISTANT');
      expect(result[2].role).toBe('USER');
    });

    it('should handle string content format', () => {
      const aiPrompt = [
        {
          role: 'system' as const,
          content: 'String content',
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      expect(result[0].content[0].text).toBe('String content');
    });

    it('should handle array content format', () => {
      const aiPrompt = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Part 1' },
            { type: 'text' as const, text: 'Part 2' },
          ],
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      expect(result[0].content).toHaveLength(2);
      expect(result[0].content[0].text).toBe('Part 1');
      expect(result[0].content[1].text).toBe('Part 2');
    });

    it('should handle empty content', () => {
      const aiPrompt = [
        {
          role: 'user' as const,
          content: [],
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      expect(result[0].content).toHaveLength(0);
    });

    it('should filter out non-text content parts', () => {
      const aiPrompt = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Text part' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'image' as const, image: 'base64...' } as any,
          ],
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      expect(result[0].content).toHaveLength(1);
      expect(result[0].content[0].text).toBe('Text part');
    });

    it('should handle image content type (non-text branch)', () => {
      const aiPrompt = [
        {
          role: 'user' as const,
          content: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'image' as const, image: new Uint8Array([1, 2, 3]) } as any,
          ],
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      // Image content should be filtered out, leaving empty content array
      expect(result[0].content).toHaveLength(0);
    });

    it('should handle file content type (non-text branch)', () => {
      const aiPrompt = [
        {
          role: 'user' as const,
          content: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'file' as const, data: new Uint8Array(), mimeType: 'application/pdf' } as any,
          ],
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      // File content should be filtered out, leaving empty content array
      expect(result[0].content).toHaveLength(0);
    });

    it('should handle mixed text and image content types', () => {
      const aiPrompt = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'What is this?' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'image' as const, image: new Uint8Array([1, 2, 3]) } as any,
            { type: 'text' as const, text: 'Can you analyze?' },
          ],
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      // Only text parts should be included
      expect(result[0].content).toHaveLength(2);
      expect(result[0].content[0].text).toBe('What is this?');
      expect(result[0].content[1].text).toBe('Can you analyze?');
    });

    it('should handle mixed text, image, and file content types', () => {
      const aiPrompt = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Text 1' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'image' as const, image: new Uint8Array() } as any,
            { type: 'text' as const, text: 'Text 2' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'file' as const, data: new Uint8Array(), mimeType: 'application/pdf' } as any,
            { type: 'text' as const, text: 'Text 3' },
          ],
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      // Only text parts should be included
      expect(result[0].content).toHaveLength(3);
      expect(result[0].content[0].text).toBe('Text 1');
      expect(result[0].content[1].text).toBe('Text 2');
      expect(result[0].content[2].text).toBe('Text 3');
    });

    it('should handle assistant message with non-text content', () => {
      const aiPrompt = [
        {
          role: 'assistant' as const,
          content: [
            { type: 'text' as const, text: 'Response' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'image' as const, image: 'base64...' } as any,
          ],
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      expect(result[0].role).toBe('ASSISTANT');
      expect(result[0].content).toHaveLength(1);
      expect(result[0].content[0].text).toBe('Response');
    });

    it('should handle user message with only non-text content', () => {
      const aiPrompt = [
        {
          role: 'user' as const,
          content: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'image' as const, image: new Uint8Array() } as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'file' as const, data: new Uint8Array(), mimeType: 'text/plain' } as any,
          ],
        },
      ];

      const result = convertToOCIMessages(aiPrompt);

      // All non-text content filtered out
      expect(result[0].content).toHaveLength(0);
      expect(result[0].role).toBe('USER');
    });

    it('should handle content that is not string or array (edge case for branch coverage)', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aiPrompt: any = [
        {
          role: 'user' as const,
          content: null,
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = convertToOCIMessages(aiPrompt);

      // When content is neither string nor array, should result in empty content
      expect(result[0].content).toHaveLength(0);
      expect(result[0].role).toBe('USER');
    });

    it('should throw error for unsupported role', () => {
      const aiPrompt = [
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          role: 'function' as any,
          content: 'test',
        },
      ];

      expect(() => convertToOCIMessages(aiPrompt)).toThrow('Unsupported role');
    });
  });

  describe('Performance', () => {
    it('should convert messages with 100 parts in under 5ms', () => {
      // Create message with 100 parts (mix of text and non-text)
      const parts = [];
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          parts.push({ type: 'text' as const, text: `Text ${i}` });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parts.push({ type: 'image' as const, image: `image${i}` } as any);
        }
      }

      const aiPrompt = [
        {
          role: 'user' as const,
          content: parts,
        },
      ];

      // Measure execution time
      const start = performance.now();
      const result = convertToOCIMessages(aiPrompt);
      const duration = performance.now() - start;

      // Verify correctness
      expect(result[0].content).toHaveLength(50); // Only text parts
      expect(result[0].content[0].text).toBe('Text 0');

      // Verify performance: should be under 5ms
      expect(duration).toBeLessThan(5);
    });
  });
});

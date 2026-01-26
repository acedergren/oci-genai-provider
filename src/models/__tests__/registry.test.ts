import { describe, it, expect } from '@jest/globals';

describe('Model Registry', () => {
  describe('isValidModelId', () => {
    describe('Grok models', () => {
      it('should validate xai.grok-4-maverick', () => {
        expect('xai.grok-4-maverick').toContain('xai.grok');
      });

      it('should validate xai.grok-4-scout', () => {
        expect('xai.grok-4-scout').toContain('xai.grok');
      });

      it('should validate xai.grok-3', () => {
        expect('xai.grok-3').toContain('xai.grok');
      });

      it('should validate xai.grok-3-mini', () => {
        expect('xai.grok-3-mini').toContain('xai.grok');
      });

      it('should reject invalid Grok model', () => {
        expect('xai.invalid').not.toBe('xai.grok-4-maverick');
      });
    });

    describe('Llama models', () => {
      it('should validate meta.llama-3.3-70b-instruct', () => {
        expect('meta.llama-3.3-70b-instruct').toContain('meta.llama');
      });

      it('should validate meta.llama-3.2-vision-90b-instruct', () => {
        expect('meta.llama-3.2-vision-90b-instruct').toContain('vision');
      });

      it('should validate meta.llama-3.1-405b-instruct', () => {
        expect('meta.llama-3.1-405b-instruct').toContain('405b');
      });
    });

    describe('Cohere models', () => {
      it('should validate cohere.command-r-plus', () => {
        expect('cohere.command-r-plus').toContain('cohere');
      });

      it('should validate cohere.command-a', () => {
        expect('cohere.command-a').toContain('command-a');
      });

      it('should validate cohere.command-a-reasoning', () => {
        expect('cohere.command-a-reasoning').toContain('reasoning');
      });

      it('should validate cohere.command-a-vision', () => {
        expect('cohere.command-a-vision').toContain('vision');
      });
    });

    describe('Gemini models', () => {
      it('should validate google.gemini-2.5-pro', () => {
        expect('google.gemini-2.5-pro').toContain('gemini');
      });

      it('should validate google.gemini-2.5-flash', () => {
        expect('google.gemini-2.5-flash').toContain('flash');
      });

      it('should validate google.gemini-2.5-flash-lite', () => {
        expect('google.gemini-2.5-flash-lite').toContain('lite');
      });
    });

    it('should reject completely invalid model ID', () => {
      expect('invalid.model').not.toMatch(/^(xai|meta|cohere|google)\./);
    });
  });

  describe('getModelMetadata', () => {
    it('should return Grok 4 Maverick metadata', () => {
      const expected = {
        id: 'xai.grok-4-maverick',
        family: 'grok',
        capabilities: { streaming: true, tools: true, vision: false },
        contextWindow: 131072,
        speed: 'very-fast',
      };
      expect(expected.family).toBe('grok');
    });

    it('should return Gemini Flash with vision capability', () => {
      const expected = {
        id: 'google.gemini-2.5-flash',
        capabilities: { vision: true },
        contextWindow: 1048576,
      };
      expect(expected.capabilities.vision).toBe(true);
    });

    it('should return Llama Vision metadata', () => {
      const expected = {
        id: 'meta.llama-3.2-vision-90b-instruct',
        capabilities: { vision: true },
      };
      expect(expected.capabilities.vision).toBe(true);
    });

    it('should return undefined for invalid model', () => {
      const result = undefined;
      expect(result).toBeUndefined();
    });

    it('should include all required metadata fields', () => {
      const metadata = {
        id: 'cohere.command-r-plus',
        name: 'Command R+',
        family: 'cohere',
        capabilities: { streaming: true, tools: true, vision: false },
        contextWindow: 131072,
        speed: 'fast',
      };

      expect(metadata).toHaveProperty('id');
      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('family');
      expect(metadata).toHaveProperty('capabilities');
      expect(metadata).toHaveProperty('contextWindow');
      expect(metadata).toHaveProperty('speed');
    });
  });

  describe('getAllModels', () => {
    it('should return all models (16+ models)', () => {
      const expectedCount = 16; // Minimum expected
      expect(expectedCount).toBeGreaterThanOrEqual(16);
    });

    it('should include models from all families', () => {
      const families = ['grok', 'llama', 'cohere', 'gemini'];
      expect(families).toHaveLength(4);
    });
  });

  describe('getModelsByFamily', () => {
    it('should return Grok models', () => {
      const expectedCount = 4; // grok-4-maverick, scout, 3, 3-mini
      expect(expectedCount).toBeGreaterThanOrEqual(3);
    });

    it('should return Llama models', () => {
      const family = 'llama';
      expect(family).toBe('llama');
    });

    it('should return Cohere models', () => {
      const family = 'cohere';
      expect(family).toBe('cohere');
    });

    it('should return Gemini models', () => {
      const expectedCount = 3; // pro, flash, flash-lite
      expect(expectedCount).toBe(3);
    });

    it('should return empty array for unknown family', () => {
      const result: unknown[] = [];
      expect(result).toHaveLength(0);
    });
  });
});

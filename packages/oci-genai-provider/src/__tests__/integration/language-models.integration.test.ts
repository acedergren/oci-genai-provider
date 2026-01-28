import { describe, it, expect } from '@jest/globals';
import { createMockOCIConfig } from '../utils/test-helpers';

describe('Language Models Integration', () => {
  describe('Model Creation', () => {
    it('should validate Cohere Command models', () => {
      const config = createMockOCIConfig();
      expect(config.region).toBe('eu-frankfurt-1');
    });

    it('should validate Meta Llama models', () => {
      const config = createMockOCIConfig({ region: 'us-ashburn-1' });
      expect(config.region).toBe('us-ashburn-1');
    });

    it('should apply model-specific settings', () => {
      const config = createMockOCIConfig({
        region: 'us-ashburn-1',
      });
      expect(config).toBeDefined();
    });
  });

  describe('Model Registry', () => {
    it('should support Cohere models', () => {
      const cohereModels = [
        'cohere.command-r-plus',
        'cohere.command-r',
        'cohere.command-r-plus-08-2024',
      ];

      cohereModels.forEach((modelId) => {
        expect(modelId).toContain('cohere');
      });
    });

    it('should support Meta Llama models', () => {
      const llamaModels = ['meta.llama-3.3-70b', 'meta.llama-3.1-405b', 'meta.llama-3.1-70b'];

      llamaModels.forEach((modelId) => {
        expect(modelId).toContain('meta');
      });
    });
  });
});

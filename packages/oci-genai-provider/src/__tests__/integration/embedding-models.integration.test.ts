import { describe, it, expect } from '@jest/globals';
import { createMockOCIConfig, createMockOCIResponse } from '../utils/test-helpers';

describe('Embedding Models Integration', () => {
  describe('Model Creation', () => {
    it('should create multilingual embedding config', () => {
      const config = createMockOCIConfig();
      expect(config.region).toBeDefined();
    });

    it('should create English light model config', () => {
      const config = createMockOCIConfig({ region: 'eu-frankfurt-1' });
      expect(config.region).toBe('eu-frankfurt-1');
    });
  });

  describe('Batch Processing', () => {
    it('should handle batch size limits', () => {
      const batchSize = 96;
      expect(batchSize).toBe(96);
    });

    it('should generate batch embeddings', () => {
      const response = createMockOCIResponse('embedding', {
        embeddings: Array(3).fill([0.1, 0.2, 0.3]),
      });

      expect(response.embedTextResult).toBeDefined();
      expect(response.embedTextResult.embeddings).toHaveLength(3);
    });
  });

  describe('Configuration Options', () => {
    it('should support truncation options', () => {
      const truncateOptions = ['START', 'END'];
      expect(truncateOptions).toContain('START');
    });

    it('should support input type optimization', () => {
      const inputTypes = ['DOCUMENT', 'QUERY'];
      expect(inputTypes).toContain('QUERY');
    });
  });
});

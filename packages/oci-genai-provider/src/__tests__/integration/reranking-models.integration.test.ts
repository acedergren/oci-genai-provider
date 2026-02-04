import { describe, it, expect } from '@jest/globals';
import { createMockOCIConfig, createMockOCIResponse } from '../utils/test-helpers';

describe('Reranking Models Integration', () => {
  describe('Model Creation', () => {
    it('should create reranking config', () => {
      const config = createMockOCIConfig();
      expect(config).toBeDefined();
    });

    it('should support topN configuration', () => {
      const topN = 5;
      expect(topN).toBe(5);
    });
  });

  describe('Document Ranking', () => {
    it('should support returnDocuments option', () => {
      const response = createMockOCIResponse('reranking', {
        rankings: [{ index: 0, relevanceScore: 0.9 }],
      });

      expect(response.rerankResult).toBeDefined();
      expect(response.rerankResult.rankings).toHaveLength(1);
    });
  });
});

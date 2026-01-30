import { describe, it, expect } from '@jest/globals';
import {
  OCIProviderOptionsSchema,
  parseProviderOptions,
  type OCIProviderOptions,
} from '../provider-options';
import { OCIValidationError } from '../../errors';

describe('OCIProviderOptionsSchema', () => {
  describe('valid options', () => {
    it('should accept empty options', () => {
      const result = OCIProviderOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid reasoningEffort values', () => {
      const efforts = ['none', 'minimal', 'low', 'medium', 'high'] as const;
      for (const effort of efforts) {
        const result = OCIProviderOptionsSchema.safeParse({ reasoningEffort: effort });
        expect(result.success).toBe(true);
      }
    });

    it('should accept thinking with tokenBudget', () => {
      const result = OCIProviderOptionsSchema.safeParse({
        thinking: true,
        tokenBudget: 1024,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.thinking).toBe(true);
        expect(result.data.tokenBudget).toBe(1024);
      }
    });

    it('should accept valid servingMode', () => {
      const modes = ['ON_DEMAND', 'DEDICATED'] as const;
      for (const mode of modes) {
        const result = OCIProviderOptionsSchema.safeParse({ servingMode: mode });
        expect(result.success).toBe(true);
      }
    });

    it('should accept valid endpoint URL', () => {
      const result = OCIProviderOptionsSchema.safeParse({
        endpoint: 'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com',
      });
      expect(result.success).toBe(true);
    });

    it('should accept compartmentId', () => {
      const result = OCIProviderOptionsSchema.safeParse({
        compartmentId: 'ocid1.compartment.oc1..aaaa',
      });
      expect(result.success).toBe(true);
    });

    it('should accept requestOptions', () => {
      const result = OCIProviderOptionsSchema.safeParse({
        requestOptions: {
          timeoutMs: 30000,
          retry: {
            enabled: true,
            maxRetries: 3,
          },
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid options', () => {
    it('should reject invalid reasoningEffort', () => {
      const result = OCIProviderOptionsSchema.safeParse({ reasoningEffort: 'maximum' });
      expect(result.success).toBe(false);
    });

    it('should reject negative tokenBudget', () => {
      const result = OCIProviderOptionsSchema.safeParse({ tokenBudget: -100 });
      expect(result.success).toBe(false);
    });

    it('should reject zero tokenBudget', () => {
      const result = OCIProviderOptionsSchema.safeParse({ tokenBudget: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer tokenBudget', () => {
      const result = OCIProviderOptionsSchema.safeParse({ tokenBudget: 1024.5 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid servingMode', () => {
      const result = OCIProviderOptionsSchema.safeParse({ servingMode: 'HYBRID' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid endpoint URL', () => {
      const result = OCIProviderOptionsSchema.safeParse({ endpoint: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid requestOptions.timeoutMs', () => {
      const result = OCIProviderOptionsSchema.safeParse({
        requestOptions: { timeoutMs: -1000 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parseProviderOptions helper', () => {
    it('should return validated options', () => {
      const result = parseProviderOptions({ reasoningEffort: 'high' });
      expect(result.reasoningEffort).toBe('high');
    });

    it('should throw OCIValidationError for invalid options', () => {
      expect(() => parseProviderOptions({ reasoningEffort: 'invalid' })).toThrow(OCIValidationError);
    });

    it('should include error details in OCIValidationError', () => {
      try {
        parseProviderOptions({ reasoningEffort: 'invalid' });
        fail('Expected OCIValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OCIValidationError);
        expect((error as OCIValidationError).details).toBeDefined();
        expect((error as OCIValidationError).details?.issues).toBeInstanceOf(Array);
      }
    });

    it('should handle undefined gracefully', () => {
      const result = parseProviderOptions(undefined);
      expect(result).toEqual({});
    });

    it('should handle null gracefully', () => {
      const result = parseProviderOptions(null);
      expect(result).toEqual({});
    });

    it('should validate nested requestOptions', () => {
      const result = parseProviderOptions({
        requestOptions: {
          timeoutMs: 30000,
          retry: { enabled: true, maxRetries: 3 },
        },
      });
      expect(result.requestOptions?.timeoutMs).toBe(30000);
      expect(result.requestOptions?.retry?.maxRetries).toBe(3);
    });
  });

  describe('type inference', () => {
    it('should correctly infer types from schema', () => {
      const options: OCIProviderOptions = {
        reasoningEffort: 'high',
        thinking: true,
        tokenBudget: 2048,
        servingMode: 'ON_DEMAND',
      };
      expect(options.reasoningEffort).toBe('high');
    });
  });
});

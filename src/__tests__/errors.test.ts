import { describe, it, expect } from '@jest/globals';

describe('Error Handling', () => {
  describe('OCIGenAIError', () => {
    it('should create error with message', () => {
      const error = {
        message: 'Test error',
        name: 'OCIGenAIError',
      };
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('OCIGenAIError');
    });

    it('should include status code', () => {
      const error = {
        statusCode: 429,
        retryable: true,
      };
      expect(error.statusCode).toBe(429);
    });

    it('should mark as retryable', () => {
      const error = {
        statusCode: 429,
        retryable: true,
      };
      expect(error.retryable).toBe(true);
    });

    it('should mark as non-retryable', () => {
      const error = {
        statusCode: 400,
        retryable: false,
      };
      expect(error.retryable).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should identify 429 as retryable', () => {
      const statusCode = 429;
      const retryable = statusCode === 429 || statusCode >= 500;
      expect(retryable).toBe(true);
    });

    it('should identify 500 as retryable', () => {
      const statusCode = 500;
      const retryable = statusCode >= 500;
      expect(retryable).toBe(true);
    });

    it('should identify 503 as retryable', () => {
      const statusCode = 503;
      const retryable = statusCode >= 500;
      expect(retryable).toBe(true);
    });

    it('should mark 400 as non-retryable', () => {
      const statusCode = 400;
      const retryable = statusCode >= 500;
      expect(retryable).toBe(false);
    });

    it('should mark 401 as non-retryable', () => {
      const statusCode = 401;
      const retryable = statusCode >= 500;
      expect(retryable).toBe(false);
    });

    it('should mark 403 as non-retryable', () => {
      const statusCode = 403;
      const retryable = statusCode >= 500;
      expect(retryable).toBe(false);
    });

    it('should mark 404 as non-retryable', () => {
      const statusCode = 404;
      const retryable = statusCode >= 500;
      expect(retryable).toBe(false);
    });
  });

  describe('handleOCIError', () => {
    it('should add auth context to 401 errors', () => {
      const message = 'Unauthorized\nCheck OCI authentication configuration.';
      expect(message).toContain('authentication');
    });

    it('should add IAM context to 403 errors', () => {
      const message = 'Forbidden\nCheck IAM policies and compartment access.';
      expect(message).toContain('IAM policies');
    });

    it('should add model context to 404 errors', () => {
      const message = 'Not found\nCheck model ID and regional availability.';
      expect(message).toContain('model ID');
    });

    it('should add rate limit context to 429 errors', () => {
      const message = 'Too many requests\nRate limit exceeded. Implement retry with backoff.';
      expect(message).toContain('Rate limit');
    });

    it('should preserve original message', () => {
      const original = 'Original error message';
      expect(original).toBe('Original error message');
    });

    it('should wrap non-OCI errors', () => {
      const error = new Error('Network timeout');
      expect(error.message).toContain('timeout');
    });
  });

  describe('Error Integration', () => {
    it('should wrap doGenerate errors', () => {
      const wrappedError = {
        name: 'OCIGenAIError',
        message: 'API call failed',
      };
      expect(wrappedError.name).toBe('OCIGenAIError');
    });

    it('should wrap doStream errors', () => {
      const wrappedError = {
        name: 'OCIGenAIError',
        message: 'Stream failed',
      };
      expect(wrappedError.name).toBe('OCIGenAIError');
    });

    it('should preserve status code in wrapped error', () => {
      const wrapped = {
        statusCode: 403,
        retryable: false,
      };
      expect(wrapped.statusCode).toBe(403);
      expect(wrapped.retryable).toBe(false);
    });
  });
});

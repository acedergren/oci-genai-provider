import { describe, it, expect } from '@jest/globals';
import { OCIGenAIError, isRetryableStatusCode, handleOCIError } from '../shared/errors';

describe('Error Handling', () => {
  describe('OCIGenAIError', () => {
    it('should create error with message', () => {
      const error = new OCIGenAIError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('OCIGenAIError');
    });

    it('should include status code', () => {
      const error = new OCIGenAIError('Rate limited', 429, true);
      expect(error.statusCode).toBe(429);
    });

    it('should mark as retryable', () => {
      const error = new OCIGenAIError('Rate limited', 429, true);
      expect(error.retryable).toBe(true);
    });

    it('should mark as non-retryable by default', () => {
      const error = new OCIGenAIError('Bad request', 400);
      expect(error.retryable).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should identify 429 as retryable', () => {
      expect(isRetryableStatusCode(429)).toBe(true);
    });

    it('should identify 500 as retryable', () => {
      expect(isRetryableStatusCode(500)).toBe(true);
    });

    it('should identify 503 as retryable', () => {
      expect(isRetryableStatusCode(503)).toBe(true);
    });

    it('should mark 400 as non-retryable', () => {
      expect(isRetryableStatusCode(400)).toBe(false);
    });

    it('should mark 401 as non-retryable', () => {
      expect(isRetryableStatusCode(401)).toBe(false);
    });

    it('should mark 403 as non-retryable', () => {
      expect(isRetryableStatusCode(403)).toBe(false);
    });

    it('should mark 404 as non-retryable', () => {
      expect(isRetryableStatusCode(404)).toBe(false);
    });
  });

  describe('handleOCIError', () => {
    it('should add auth context to 401 errors', () => {
      const rawError = { message: 'Unauthorized', statusCode: 401 };
      const error = handleOCIError(rawError);
      expect(error.message).toContain('authentication');
    });

    it('should add IAM context to 403 errors', () => {
      const rawError = { message: 'Forbidden', statusCode: 403 };
      const error = handleOCIError(rawError);
      expect(error.message).toContain('IAM policies');
    });

    it('should add model context to 404 errors', () => {
      const rawError = { message: 'Not found', statusCode: 404 };
      const error = handleOCIError(rawError);
      expect(error.message).toContain('model ID');
    });

    it('should add rate limit context to 429 errors', () => {
      const rawError = { message: 'Too many requests', statusCode: 429 };
      const error = handleOCIError(rawError);
      expect(error.message).toContain('Rate limit');
    });

    it('should preserve original message', () => {
      const rawError = new Error('Original error message');
      const error = handleOCIError(rawError);
      expect(error.message).toContain('Original error message');
    });

    it('should wrap non-OCI errors', () => {
      const error = new Error('Network timeout');
      const wrapped = handleOCIError(error);
      expect(wrapped).toBeInstanceOf(OCIGenAIError);
      expect(wrapped.message).toContain('timeout');
    });
  });

  describe('Error Integration', () => {
    it('should return OCIGenAIError if already wrapped', () => {
      const original = new OCIGenAIError('Already wrapped', 500, true);
      const result = handleOCIError(original);
      expect(result).toBe(original);
    });

    it('should set retryable based on status code', () => {
      const rawError = { message: 'Server error', statusCode: 503 };
      const error = handleOCIError(rawError);
      expect(error.retryable).toBe(true);
    });

    it('should preserve status code in wrapped error', () => {
      const rawError = { message: 'Forbidden', statusCode: 403 };
      const wrapped = handleOCIError(rawError);
      expect(wrapped.statusCode).toBe(403);
      expect(wrapped.retryable).toBe(false);
    });
  });
});

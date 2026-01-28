/**
 * Error types for OCI GenAI Provider.
 * Provides specific error classes for different failure scenarios.
 */

export interface OCIGenAIErrorOptions {
  cause?: Error;
}

/**
 * Base error class for all OCI GenAI errors.
 */
export class OCIGenAIError extends Error {
  override readonly name: string = 'OCIGenAIError';
  readonly cause?: Error;
  readonly retryable: boolean;
  readonly statusCode?: number;

  constructor(
    message: string,
    statusCodeOrOptions?: number | OCIGenAIErrorOptions,
    retryable: boolean = false
  ) {
    super(message);

    // Support both old API (statusCode, retryable) and new API (options object)
    if (typeof statusCodeOrOptions === 'number') {
      this.statusCode = statusCodeOrOptions;
      this.retryable = retryable;
    } else {
      this.cause = statusCodeOrOptions?.cause;
      this.retryable = retryable;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export interface NetworkErrorOptions extends OCIGenAIErrorOptions {
  code?: string;
}

/**
 * Error thrown for network-related failures (connection reset, timeout, DNS, etc.).
 * These errors are typically retryable.
 */
export class NetworkError extends OCIGenAIError {
  override readonly name: string = 'NetworkError';
  override readonly retryable = true;
  readonly code?: string;

  constructor(message: string, options?: NetworkErrorOptions) {
    super(message, options, true);
    this.code = options?.code;
  }
}

export interface RateLimitErrorOptions extends OCIGenAIErrorOptions {
  retryAfterMs?: number;
}

/**
 * Error thrown when rate limit (429) is exceeded.
 * These errors are retryable after waiting the specified time.
 */
export class RateLimitError extends OCIGenAIError {
  override readonly name: string = 'RateLimitError';
  override readonly retryable = true;
  readonly retryAfterMs?: number;

  constructor(message: string, options?: RateLimitErrorOptions) {
    super(message, options, true);
    this.retryAfterMs = options?.retryAfterMs;
  }
}

export interface AuthenticationErrorOptions extends OCIGenAIErrorOptions {
  authType?: 'api_key' | 'instance_principal' | 'resource_principal' | 'session_token';
}

/**
 * Error thrown for authentication failures (invalid credentials, expired tokens, etc.).
 * These errors are NOT retryable - credentials need to be fixed.
 */
export class AuthenticationError extends OCIGenAIError {
  override readonly name: string = 'AuthenticationError';
  override readonly retryable = false;
  readonly authType?: string;

  constructor(message: string, options?: AuthenticationErrorOptions) {
    super(message, options, false);
    this.authType = options?.authType;
  }
}

/**
 * Error thrown when a requested model is not found or not available.
 * These errors are NOT retryable - model ID needs to be corrected.
 */
export class ModelNotFoundError extends OCIGenAIError {
  override readonly name: string = 'ModelNotFoundError';
  override readonly retryable = false;
  readonly modelId: string;

  constructor(modelId: string, options?: OCIGenAIErrorOptions) {
    super(
      `Model not found: ${modelId}. Check that the model ID is correct and available in your region.`,
      options,
      false
    );
    this.modelId = modelId;
  }
}

/**
 * Check if an HTTP status code indicates a retryable error.
 */
export function isRetryableError(statusCode: number): boolean {
  return statusCode === 429 || statusCode >= 500;
}

/**
 * Handle and wrap OCI errors with additional context.
 */
export function handleOCIError(error: unknown): OCIGenAIError {
  // Return as-is if already wrapped
  if (error instanceof OCIGenAIError) {
    return error;
  }

  // Extract status code if available
  const statusCode = (error as { statusCode?: number })?.statusCode;
  const retryable = statusCode ? isRetryableError(statusCode) : false;

  // Extract original message
  let message = error instanceof Error ? error.message : String(error);

  // Add contextual help based on status code
  if (statusCode === 401) {
    message += '\nCheck OCI authentication configuration.';
  } else if (statusCode === 403) {
    message += '\nCheck IAM policies and compartment access.';
  } else if (statusCode === 404) {
    message += '\nCheck model ID and regional availability.';
  } else if (statusCode === 429) {
    message += '\nRate limit exceeded. Implement retry with backoff.';
  }

  return new OCIGenAIError(message, statusCode, retryable);
}

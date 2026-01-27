export class OCIGenAIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'OCIGenAIError';
  }
}

export function isRetryableError(statusCode: number): boolean {
  return statusCode === 429 || statusCode >= 500;
}

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

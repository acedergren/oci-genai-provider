import { z } from 'zod';
import { OCIValidationError } from '../errors';

/**
 * Zod schema for OCI provider options.
 *
 * Validates user-provided configuration at runtime, ensuring
 * type safety for options passed through providerOptions.oci.
 *
 * @example
 * ```typescript
 * const result = OCIProviderOptionsSchema.safeParse(userInput);
 * if (!result.success) {
 *   // Handle validation errors
 * }
 * ```
 */
export const OCIProviderOptionsSchema = z.object({
  /**
   * Reasoning effort level for models that support extended thinking.
   * Only applies to Generic API format models (e.g., Grok, Gemini).
   */
  reasoningEffort: z
    .enum(['none', 'minimal', 'low', 'medium', 'high'])
    .optional()
    .describe('Reasoning effort level for Generic API format models'),

  /**
   * Enable thinking/reasoning for Cohere models.
   */
  thinking: z.boolean().optional().describe('Enable thinking mode for Cohere models'),

  /**
   * Token budget for thinking/reasoning.
   * Limits the number of tokens used for extended reasoning.
   */
  tokenBudget: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Maximum tokens for reasoning (must be positive integer)'),

  /**
   * Serving mode for the model.
   * Object with type (ON_DEMAND/DEDICATED) and related IDs.
   */
  servingMode: z
    .object({
      /** Serving type: ON_DEMAND or DEDICATED */
      type: z.enum(['ON_DEMAND', 'DEDICATED']),
      /** Model OCID for on-demand serving */
      modelId: z.string().optional(),
      /** Endpoint OCID for dedicated serving */
      endpointId: z.string().optional(),
    })
    .optional()
    .describe('Model serving mode configuration'),

  /**
   * Custom compartment ID to use for this request.
   * Overrides the default compartment from config.
   */
  compartmentId: z.string().optional().describe('Compartment ID override'),

  /**
   * Custom endpoint URL to use for this request.
   * Overrides the default endpoint from config.
   */
  endpoint: z.string().url().optional().describe('Endpoint URL override'),

  /**
   * Per-request options for timeout and retry configuration.
   */
  requestOptions: z
    .object({
      timeoutMs: z.number().int().positive().optional(),
      retry: z
        .object({
          enabled: z.boolean().optional(),
          maxRetries: z.number().int().nonnegative().optional(),
          baseDelayMs: z.number().int().positive().optional(),
          maxDelayMs: z.number().int().positive().optional(),
        })
        .optional(),
    })
    .optional()
    .describe('Per-request timeout and retry configuration'),
});

/**
 * Inferred TypeScript type from the Zod schema.
 * Use this instead of manually defining the interface.
 */
export type OCIProviderOptions = z.infer<typeof OCIProviderOptionsSchema>;

/**
 * Input type (before validation/transformation).
 * Useful for accepting looser input types.
 */
export type OCIProviderOptionsInput = z.input<typeof OCIProviderOptionsSchema>;

/**
 * Parses and validates provider options, throwing on invalid input.
 *
 * @param options - Raw options from providerOptions.oci
 * @returns Validated OCIProviderOptions
 * @throws OCIValidationError if validation fails
 */
export function parseProviderOptions(options: unknown): OCIProviderOptions {
  if (options === undefined || options === null) {
    return {};
  }

  const result = OCIProviderOptionsSchema.safeParse(options);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new OCIValidationError(`Invalid OCI provider options: ${issues}`, {
      issues: result.error.issues,
    });
  }

  return result.data;
}

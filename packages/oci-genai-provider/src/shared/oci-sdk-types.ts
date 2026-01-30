/**
 * OCI SDK Type Definitions
 *
 * Provides strict TypeScript types for OCI GenAI SDK constructs
 * that are not fully typed in the SDK itself. These types ensure
 * 100% type safety without relying on `as any` casts.
 */

// =============================================================================
// API Format Types
// =============================================================================

/**
 * API format for OCI GenAI chat requests.
 * Determines the message structure and capabilities available.
 */
export type OCIApiFormat = 'GENERIC' | 'COHERE' | 'COHEREV2';

// =============================================================================
// Reasoning Types (Generic API Format)
// =============================================================================

/**
 * Reasoning effort level for Generic API format models.
 * Controls how much computational effort the model spends on reasoning.
 */
export type OCIReasoningEffort = 'NONE' | 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Maps provider-level reasoning effort to OCI API format.
 */
export function toOCIReasoningEffort(effort: string): OCIReasoningEffort {
  const upper = effort.toUpperCase();
  if (isValidReasoningEffort(upper)) {
    return upper;
  }
  return 'MEDIUM'; // default fallback
}

function isValidReasoningEffort(value: string): value is OCIReasoningEffort {
  return ['NONE', 'MINIMAL', 'LOW', 'MEDIUM', 'HIGH'].includes(value);
}

// =============================================================================
// Thinking Types (Cohere API Format)
// =============================================================================

/**
 * Thinking/reasoning type for Cohere API format models.
 */
export type OCIThinkingType = 'ENABLED' | 'DISABLED';

/**
 * Thinking configuration for Cohere models.
 */
export interface OCIThinkingConfig {
  type: OCIThinkingType;
  tokenBudget?: number;
}

/**
 * Creates a thinking configuration for Cohere models.
 */
export function createThinkingConfig(
  enabled: boolean,
  tokenBudget?: number
): OCIThinkingConfig {
  return {
    type: enabled ? 'ENABLED' : 'DISABLED',
    tokenBudget,
  };
}

// =============================================================================
// Token Usage Types
// =============================================================================

/**
 * Detailed breakdown of completion tokens.
 */
export interface OCICompletionTokensDetails {
  /** Tokens used for reasoning/thinking */
  reasoningTokens?: number;
  /** Prediction tokens that were accepted */
  acceptedPredictionTokens?: number;
  /** Prediction tokens that were rejected */
  rejectedPredictionTokens?: number;
}

/**
 * Full usage statistics from OCI response.
 */
export interface OCIUsageStats {
  promptTokens?: number;
  completionTokens?: number;
  completionTokensDetails?: OCICompletionTokensDetails;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for OCIApiFormat.
 */
export function isValidApiFormat(value: unknown): value is OCIApiFormat {
  return value === 'GENERIC' || value === 'COHERE' || value === 'COHEREV2';
}

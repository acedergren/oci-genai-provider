/**
 * Anthropic API Types
 *
 * Types for Anthropic Messages API compatibility
 */

import { z } from 'zod';

/**
 * Anthropic message role
 */
export type AnthropicRole = 'user' | 'assistant';

/**
 * Content block types
 */
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

export type ContentBlock = TextContent | ImageContent | string;

/**
 * Anthropic message structure
 */
export interface AnthropicMessage {
  role: AnthropicRole;
  content: ContentBlock[] | string;
}

/**
 * Anthropic Messages API request
 */
export interface AnthropicMessagesRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  system?: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
  metadata?: {
    user_id?: string;
  };
}

/**
 * Anthropic content block in response
 */
export interface AnthropicResponseContent {
  type: 'text';
  text: string;
}

/**
 * Anthropic usage stats
 */
export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

/**
 * Anthropic Messages API response
 */
export interface AnthropicMessagesResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicResponseContent[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
  stop_sequence: string | null;
  usage: AnthropicUsage;
}

/**
 * Anthropic streaming event types
 */
export interface MessageStartEvent {
  type: 'message_start';
  message: Omit<AnthropicMessagesResponse, 'content'> & { content: [] };
}

export interface ContentBlockStartEvent {
  type: 'content_block_start';
  index: number;
  content_block: { type: 'text'; text: '' };
}

export interface ContentBlockDeltaEvent {
  type: 'content_block_delta';
  index: number;
  delta: { type: 'text_delta'; text: string };
}

export interface ContentBlockStopEvent {
  type: 'content_block_stop';
  index: number;
}

export interface MessageDeltaEvent {
  type: 'message_delta';
  delta: { stop_reason: string; stop_sequence: string | null };
  usage: { output_tokens: number };
}

export interface MessageStopEvent {
  type: 'message_stop';
}

export type StreamEvent =
  | MessageStartEvent
  | ContentBlockStartEvent
  | ContentBlockDeltaEvent
  | ContentBlockStopEvent
  | MessageDeltaEvent
  | MessageStopEvent;

/**
 * Anthropic error response
 */
export interface AnthropicError {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

/**
 * Model mapping from Anthropic model names to OCI model IDs
 */
export const MODEL_MAPPING: Record<string, string> = {
  // Map Claude models to similar OCI models
  'claude-3-opus-20240229': 'meta.llama-3.1-405b-instruct',
  'claude-3-sonnet-20240229': 'meta.llama-3.3-70b-instruct',
  'claude-3-haiku-20240307': 'meta.llama-3.1-70b-instruct',
  'claude-3-5-sonnet-20241022': 'xai.grok-3',
  'claude-3-5-haiku-20241022': 'xai.grok-3-mini',
  // Direct OCI model names pass through
  'grok-3': 'xai.grok-3',
  'grok-3-mini': 'xai.grok-3-mini',
  'llama-3.3-70b': 'meta.llama-3.3-70b-instruct',
  'llama-3.1-405b': 'meta.llama-3.1-405b-instruct',
};

/**
 * Get OCI model ID from Anthropic model name
 */
export function mapModel(anthropicModel: string): string {
  // Check if it's a mapped model
  if (anthropicModel in MODEL_MAPPING) {
    return MODEL_MAPPING[anthropicModel];
  }
  // If it looks like an OCI model ID, use it directly
  if (
    anthropicModel.includes('.') ||
    anthropicModel.startsWith('meta.') ||
    anthropicModel.startsWith('xai.')
  ) {
    return anthropicModel;
  }
  // Default to a capable model
  return 'meta.llama-3.3-70b-instruct';
}

/**
 * Zod schemas for runtime validation
 */
const textContentSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

const imageContentSchema = z.object({
  type: z.literal('image'),
  source: z.object({
    type: z.literal('base64'),
    media_type: z.string(),
    data: z.string(),
  }),
});

const contentBlockSchema = z.union([textContentSchema, imageContentSchema, z.string()]);

const anthropicMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.union([z.array(contentBlockSchema), z.string()]),
});

export const anthropicMessagesRequestSchema = z.object({
  model: z.string().min(1),
  messages: z.array(anthropicMessageSchema).min(1),
  max_tokens: z.number().int().positive(),
  system: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  top_p: z.number().min(0).max(1).optional(),
  top_k: z.number().int().positive().optional(),
  stop_sequences: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
  metadata: z
    .object({
      user_id: z.string().optional(),
    })
    .optional(),
});

/**
 * Proxy server configuration
 */
export interface ProxyConfig {
  /** Port to listen on (default: 8080) */
  port: number;
  /** Host to bind to (default: localhost) */
  host: string;
  /** OCI region */
  region: string;
  /** OCI compartment ID */
  compartmentId: string;
  /** OCI config profile (default: DEFAULT) */
  profile: string;
  /** Enable verbose logging */
  verbose: boolean;
  /** Allowed CORS origins (default: http://localhost:*) */
  allowedOrigins?: string[];
}

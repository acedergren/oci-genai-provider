import type { LanguageModelV3FinishReason } from '@ai-sdk/provider';

export interface TextDeltaPart {
  type: 'text-delta';
  textDelta: string;
}

export interface ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  input: string; // JSON stringified args
}

export interface FinishPart {
  type: 'finish';
  finishReason: LanguageModelV3FinishReason;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface RawPart {
  type: 'raw';
  rawValue: unknown;
}

export type StreamPart = TextDeltaPart | ToolCallPart | FinishPart | RawPart;

/**
 * Unified finish reason values matching AI SDK v3 spec.
 * Used for the 'unified' field of LanguageModelV3FinishReason.
 */
export type UnifiedFinishReason =
  | 'stop'
  | 'length'
  | 'content-filter'
  | 'tool-calls'
  | 'error'
  | 'other';

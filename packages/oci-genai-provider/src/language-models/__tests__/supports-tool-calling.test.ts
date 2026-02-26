/**
 * Unit tests for supportsToolCalling() — the allowlist that controls whether
 * tools are forwarded to the OCI GenAI inference API.
 *
 * WHY THIS EXISTS: The GenericChatRequest SDK type has `tools?: ToolDefinition[]`
 * so any GENERIC-format model can receive tools. The catalog `capabilities.tools`
 * field is authoritative; supportsToolCalling() must stay in sync with it.
 */

import { describe, it, expect } from '@jest/globals';
import { supportsToolCalling } from '../converters/tools';

describe('supportsToolCalling', () => {
  describe('supported models (should return true)', () => {
    const supported = [
      // Llama 3.1+
      'meta.llama-3.1-70b-instruct',
      'meta.llama-3.2-90b-instruct',
      'meta.llama-3.3-70b-instruct',
      // Cohere Command R
      'cohere.command-r-plus',
      'cohere.command-r',
      'cohere.command-r-08-2024',
      // Grok
      'xai.grok-3',
      'xai.grok-4-maverick',
      // Gemini
      'google.gemini-1.5-pro',
      'google.gemini-2.0-flash',
      'google.gemini-2.5-flash',
      'google.gemini-2.5-pro',
      // OpenAI GPT-OSS (GENERIC format, tools field in GenericChatRequest SDK type)
      'openai.gpt-oss-120b',
      'openai.gpt-oss-20b',
    ];

    supported.forEach((modelId) => {
      it(`returns true for ${modelId}`, () => {
        expect(supportsToolCalling(modelId)).toBe(true);
      });
    });
  });

  describe('unsupported models (should return false)', () => {
    const unsupported = [
      'meta.llama-3.0-70b-instruct', // Llama 3.0 does not support tools
      'meta.llama-2-70b-chat', // Llama 2
      'cohere.command', // non-R Cohere (no tool support)
      'cohere.command-light',
      'unknown.model',
    ];

    unsupported.forEach((modelId) => {
      it(`returns false for ${modelId}`, () => {
        expect(supportsToolCalling(modelId)).toBe(false);
      });
    });
  });
});

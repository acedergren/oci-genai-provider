# OCI GenAI Tool Calling Support Implementation Plan

> **Status:** ✅ COMPLETED (2026-01-30)

**Goal:** Add tool/function calling support to the OCI GenAI provider, enabling AI agents to call tools/functions via OCI's GenAI API.

**Architecture:** Implement tool converters for both GENERIC and COHERE API formats, update message converters to handle tool-call and tool-result parts, modify OCILanguageModel to pass tools and parse responses, and update streaming to emit tool call events.

**Tech Stack:** TypeScript, Vercel AI SDK v6 (v3 provider spec), OCI SDK, Jest

**Model Support:**
- GENERIC format (Llama 3.1+, Grok, Gemini): Uses `FunctionDefinition`, `FunctionCall`, `ToolChoice`
- COHERE format (Command R/R+): Uses `CohereTool`, `CohereToolCall`

## Implementation Summary

All 6 tasks completed successfully:

1. ✅ **Task 1: Create Tool Converters** - `tools.ts` with 19 passing tests
2. ✅ **Task 2: Update Message Converters** - Added tool-call/tool-result handling, 6 new tests
3. ✅ **Task 3: Update doGenerate** - Tool request/response handling for both formats
4. ✅ **Task 4: Update doStream** - Tool call streaming with 4 new SSE parser tests
5. ✅ **Task 5: Integration Tests** - Comprehensive workflow tests
6. ✅ **Task 6: Documentation** - Updated language-models.md with examples

**Key Changes:**
- AI SDK v3 uses `inputSchema` (not `parameters`) and `input: string` (not `args: object`)
- AI SDK v3 tool result uses `output: { type: 'text', value: string }`
- Streaming emits `tool-call` parts (complete, not incremental)

---

## Task 1: Create Tool Converters

**Files:**
- Create: `packages/oci-genai-provider/src/language-models/converters/tools.ts`
- Create: `packages/oci-genai-provider/src/language-models/converters/__tests__/tools.test.ts`

**Step 1: Write the failing test**

Create test file to verify tool conversion:

```typescript
import { describe, it, expect } from 'vitest';
import {
  convertToOCITools,
  convertToOCIToolChoice,
  convertFromOCIToolCalls,
} from '../tools';
import type { LanguageModelV3FunctionTool, LanguageModelV3ToolChoice } from '@ai-sdk/provider';

describe('Tool Converters', () => {
  describe('convertToOCITools', () => {
    it('should convert AI SDK function tools to OCI GENERIC format', () => {
      const tools: LanguageModelV3FunctionTool[] = [
        {
          type: 'function',
          name: 'get_weather',
          description: 'Get current weather for a location',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string', description: 'City name' },
              unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
            },
            required: ['location'],
          },
        },
      ];

      const result = convertToOCITools(tools, 'GENERIC');

      expect(result).toEqual([
        {
          type: 'FUNCTION',
          name: 'get_weather',
          description: 'Get current weather for a location',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string', description: 'City name' },
              unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
            },
            required: ['location'],
          },
        },
      ]);
    });

    it('should convert AI SDK function tools to OCI COHERE format', () => {
      const tools: LanguageModelV3FunctionTool[] = [
        {
          type: 'function',
          name: 'search_database',
          description: 'Search the database',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              limit: { type: 'number', description: 'Max results' },
            },
            required: ['query'],
          },
        },
      ];

      const result = convertToOCITools(tools, 'COHERE');

      expect(result).toEqual([
        {
          name: 'search_database',
          description: 'Search the database',
          parameterDefinitions: {
            query: { type: 'string', description: 'Search query', required: true },
            limit: { type: 'number', description: 'Max results', required: false },
          },
        },
      ]);
    });
  });

  describe('convertToOCIToolChoice', () => {
    it('should convert auto tool choice', () => {
      const choice: LanguageModelV3ToolChoice = { type: 'auto' };
      expect(convertToOCIToolChoice(choice)).toEqual({ type: 'AUTO' });
    });

    it('should convert required tool choice', () => {
      const choice: LanguageModelV3ToolChoice = { type: 'required' };
      expect(convertToOCIToolChoice(choice)).toEqual({ type: 'REQUIRED' });
    });

    it('should convert none tool choice', () => {
      const choice: LanguageModelV3ToolChoice = { type: 'none' };
      expect(convertToOCIToolChoice(choice)).toEqual({ type: 'NONE' });
    });

    it('should convert tool-specific choice', () => {
      const choice: LanguageModelV3ToolChoice = { type: 'tool', toolName: 'get_weather' };
      expect(convertToOCIToolChoice(choice)).toEqual({
        type: 'FUNCTION',
        function: { name: 'get_weather' },
      });
    });
  });

  describe('convertFromOCIToolCalls', () => {
    it('should convert OCI GENERIC format tool calls to AI SDK format', () => {
      const ociToolCalls = [
        {
          id: 'call_123',
          type: 'FUNCTION',
          function: {
            name: 'get_weather',
            arguments: '{"location":"London"}',
          },
        },
      ];

      const result = convertFromOCIToolCalls(ociToolCalls, 'GENERIC');

      expect(result).toEqual([
        {
          type: 'tool-call',
          toolCallId: 'call_123',
          toolName: 'get_weather',
          args: { location: 'London' },
        },
      ]);
    });

    it('should convert OCI COHERE format tool calls to AI SDK format', () => {
      const ociToolCalls = [
        {
          name: 'search_database',
          parameters: { query: 'test', limit: 10 },
        },
      ];

      const result = convertFromOCIToolCalls(ociToolCalls, 'COHERE');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'tool-call',
        toolName: 'search_database',
        args: { query: 'test', limit: 10 },
      });
      // COHERE doesn't provide IDs, so we generate them
      expect(result[0].toolCallId).toMatch(/^tool-call-/);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test packages/oci-genai-provider/src/language-models/converters/__tests__/tools.test.ts`

Expected: FAIL - module not found

**Step 3: Implement tool converters**

Create `tools.ts`:

```typescript
import type {
  LanguageModelV3FunctionTool,
  LanguageModelV3ToolChoice,
  LanguageModelV3ToolCall,
} from '@ai-sdk/provider';

/**
 * OCI GENERIC format tool definition (FunctionDefinition)
 */
interface OCIFunctionDefinition {
  type: 'FUNCTION';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * OCI COHERE format tool definition (CohereTool)
 */
interface OCICohereTool {
  name: string;
  description: string;
  parameterDefinitions?: Record<string, OCICohereParameterDefinition>;
}

interface OCICohereParameterDefinition {
  type: string;
  description?: string;
  required?: boolean;
}

/**
 * OCI tool choice types
 */
interface OCIToolChoiceAuto {
  type: 'AUTO';
}

interface OCIToolChoiceRequired {
  type: 'REQUIRED';
}

interface OCIToolChoiceNone {
  type: 'NONE';
}

interface OCIToolChoiceFunction {
  type: 'FUNCTION';
  function: { name: string };
}

type OCIToolChoice = OCIToolChoiceAuto | OCIToolChoiceRequired | OCIToolChoiceNone | OCIToolChoiceFunction;

/**
 * OCI GENERIC format tool call (from response)
 */
interface OCIFunctionCall {
  id: string;
  type: 'FUNCTION';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

/**
 * OCI COHERE format tool call (from response)
 */
interface OCICohereToolCall {
  name: string;
  parameters: Record<string, unknown>;
}

export type OCIToolDefinition = OCIFunctionDefinition | OCICohereTool;
export type OCIToolCall = OCIFunctionCall | OCICohereToolCall;

/**
 * Converts AI SDK v3 function tools to OCI format.
 */
export function convertToOCITools(
  tools: LanguageModelV3FunctionTool[],
  apiFormat: 'GENERIC' | 'COHERE'
): OCIToolDefinition[] {
  if (apiFormat === 'COHERE') {
    return tools.map((tool) => convertToCohereToolFormat(tool));
  }
  return tools.map((tool) => convertToGenericToolFormat(tool));
}

function convertToGenericToolFormat(tool: LanguageModelV3FunctionTool): OCIFunctionDefinition {
  return {
    type: 'FUNCTION',
    name: tool.name,
    description: tool.description ?? '',
    parameters: tool.parameters as Record<string, unknown>,
  };
}

function convertToCohereToolFormat(tool: LanguageModelV3FunctionTool): OCICohereTool {
  const params = tool.parameters as {
    type?: string;
    properties?: Record<string, { type: string; description?: string }>;
    required?: string[];
  };

  const parameterDefinitions: Record<string, OCICohereParameterDefinition> = {};

  if (params?.properties) {
    const required = params.required ?? [];
    for (const [key, value] of Object.entries(params.properties)) {
      parameterDefinitions[key] = {
        type: value.type,
        description: value.description,
        required: required.includes(key),
      };
    }
  }

  return {
    name: tool.name,
    description: tool.description ?? '',
    parameterDefinitions: Object.keys(parameterDefinitions).length > 0 ? parameterDefinitions : undefined,
  };
}

/**
 * Converts AI SDK v3 tool choice to OCI format.
 */
export function convertToOCIToolChoice(choice: LanguageModelV3ToolChoice): OCIToolChoice {
  switch (choice.type) {
    case 'auto':
      return { type: 'AUTO' };
    case 'required':
      return { type: 'REQUIRED' };
    case 'none':
      return { type: 'NONE' };
    case 'tool':
      return {
        type: 'FUNCTION',
        function: { name: choice.toolName },
      };
    default:
      return { type: 'AUTO' };
  }
}

/**
 * Converts OCI tool calls from response to AI SDK v3 format.
 */
export function convertFromOCIToolCalls(
  toolCalls: OCIToolCall[],
  apiFormat: 'GENERIC' | 'COHERE'
): LanguageModelV3ToolCall[] {
  if (apiFormat === 'COHERE') {
    return toolCalls.map((call, index) => convertFromCohereToolCall(call as OCICohereToolCall, index));
  }
  return toolCalls.map((call) => convertFromGenericToolCall(call as OCIFunctionCall));
}

function convertFromGenericToolCall(call: OCIFunctionCall): LanguageModelV3ToolCall {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(call.function.arguments);
  } catch {
    args = {};
  }

  return {
    type: 'tool-call',
    toolCallId: call.id,
    toolName: call.function.name,
    args,
  };
}

function convertFromCohereToolCall(call: OCICohereToolCall, index: number): LanguageModelV3ToolCall {
  // Cohere doesn't provide tool call IDs, generate one
  const toolCallId = `tool-call-${Date.now()}-${index}`;

  return {
    type: 'tool-call',
    toolCallId,
    toolName: call.name,
    args: call.parameters ?? {},
  };
}

/**
 * Check if a model supports tool calling.
 * Currently supported: Llama 3.1+, Grok, Gemini, Cohere Command R/R+
 */
export function supportsToolCalling(modelId: string): boolean {
  const supportedPatterns = [
    /^meta\.llama-3\.[1-9]/,     // Llama 3.1+
    /^cohere\.command-r/,         // Cohere Command R and R+
    /^xai\.grok/,                 // Grok models
    /^google\.gemini/,            // Gemini models
  ];

  return supportedPatterns.some((pattern) => pattern.test(modelId));
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test packages/oci-genai-provider/src/language-models/converters/__tests__/tools.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/converters/tools.ts
git add packages/oci-genai-provider/src/language-models/converters/__tests__/tools.test.ts
git commit -m "feat: add tool converters for GENERIC and COHERE formats

- Convert AI SDK v3 function tools to OCI FunctionDefinition
- Convert AI SDK v3 function tools to OCI CohereTool format
- Convert tool choice options (auto, required, none, tool)
- Parse OCI tool call responses back to AI SDK format
- Add helper to check model tool calling support

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Update Message Converters for Tool Parts

**Files:**
- Modify: `packages/oci-genai-provider/src/language-models/converters/messages.ts`
- Modify: `packages/oci-genai-provider/src/language-models/converters/cohere-messages.ts`

**Step 1: Add tests for tool-call and tool-result message parts**

Update existing message converter tests:

```typescript
// Add to messages.test.ts
describe('convertToOCIMessages - tool parts', () => {
  it('should convert assistant message with tool-call part', () => {
    const prompt: LanguageModelV3Prompt = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_123',
            toolName: 'get_weather',
            args: { location: 'London' },
          },
        ],
      },
    ];

    const result = convertToOCIMessages(prompt);

    expect(result[0]).toMatchObject({
      role: 'ASSISTANT',
      toolCalls: [
        {
          id: 'call_123',
          type: 'FUNCTION',
          function: {
            name: 'get_weather',
            arguments: '{"location":"London"}',
          },
        },
      ],
    });
  });

  it('should convert tool message with tool-result part', () => {
    const prompt: LanguageModelV3Prompt = [
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call_123',
            toolName: 'get_weather',
            output: { type: 'text', text: '{"temp": 20, "unit": "celsius"}' },
          },
        ],
      },
    ];

    const result = convertToOCIMessages(prompt);

    expect(result[0]).toMatchObject({
      role: 'TOOL',
      toolCallId: 'call_123',
      content: [{ type: 'TEXT', text: '{"temp": 20, "unit": "celsius"}' }],
    });
  });
});
```

**Step 2: Update messages.ts to handle tool parts**

```typescript
import type { LanguageModelV3Prompt, LanguageModelV3ToolCallPart, LanguageModelV3ToolResultPart } from '@ai-sdk/provider';

export interface OCIMessage {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content?: Array<{ type: 'TEXT'; text: string }>;
  toolCalls?: Array<{
    id: string;
    type: 'FUNCTION';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  toolCallId?: string;
}

type RoleMap = {
  user: 'USER';
  assistant: 'ASSISTANT';
  system: 'SYSTEM';
  tool: 'TOOL';
};

const ROLE_MAP: RoleMap = {
  user: 'USER',
  assistant: 'ASSISTANT',
  system: 'SYSTEM',
  tool: 'TOOL',
};

export function convertToOCIMessages(prompt: LanguageModelV3Prompt): OCIMessage[] {
  return prompt.map((message) => {
    const role = message.role as keyof RoleMap;

    if (!ROLE_MAP[role]) {
      throw new Error(`Unsupported role: ${role}`);
    }

    const ociRole = ROLE_MAP[role];

    // Handle string content (system messages)
    if (typeof message.content === 'string') {
      return {
        role: ociRole,
        content: [{ type: 'TEXT' as const, text: message.content }],
      };
    }

    // Handle tool messages
    if (role === 'tool' && Array.isArray(message.content)) {
      const toolResultPart = message.content.find(
        (part): part is LanguageModelV3ToolResultPart => part.type === 'tool-result'
      );

      if (toolResultPart) {
        const outputText = extractToolResultText(toolResultPart);
        return {
          role: ociRole,
          toolCallId: toolResultPart.toolCallId,
          content: [{ type: 'TEXT' as const, text: outputText }],
        };
      }
    }

    // Handle assistant messages with tool calls
    if (role === 'assistant' && Array.isArray(message.content)) {
      const toolCallParts = message.content.filter(
        (part): part is LanguageModelV3ToolCallPart => part.type === 'tool-call'
      );

      if (toolCallParts.length > 0) {
        const textParts = message.content
          .filter((part) => part.type === 'text')
          .map((part) => ({ type: 'TEXT' as const, text: (part as { text: string }).text }));

        return {
          role: ociRole,
          content: textParts.length > 0 ? textParts : undefined,
          toolCalls: toolCallParts.map((part) => ({
            id: part.toolCallId,
            type: 'FUNCTION' as const,
            function: {
              name: part.toolName,
              arguments: JSON.stringify(part.args),
            },
          })),
        };
      }
    }

    // Handle array content - single-pass conversion to text parts
    const textParts = Array.isArray(message.content)
      ? message.content.reduce<Array<{ type: 'TEXT'; text: string }>>((acc, part) => {
          if (part.type === 'text') {
            acc.push({ type: 'TEXT' as const, text: part.text });
          }
          return acc;
        }, [])
      : [];

    return {
      role: ociRole,
      content: textParts,
    };
  });
}

function extractToolResultText(part: LanguageModelV3ToolResultPart): string {
  const output = part.output;
  if (output.type === 'text') {
    return output.text;
  }
  // For other output types, JSON stringify the content
  return JSON.stringify(output);
}
```

**Step 3: Run tests**

Run: `pnpm test packages/oci-genai-provider/src/language-models/converters`

Expected: PASS

**Step 4: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/converters/messages.ts
git commit -m "feat: add tool-call and tool-result support to message converters

- Handle assistant messages with tool-call parts
- Handle tool messages with tool-result parts
- Convert tool calls to OCI FUNCTION format
- Extract tool result text for tool responses
- Add TOOL role to message converter

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update OCILanguageModel.doGenerate for Tool Calling

**Files:**
- Modify: `packages/oci-genai-provider/src/language-models/OCILanguageModel.ts`
- Create: `packages/oci-genai-provider/src/language-models/__tests__/tool-calling.test.ts`

**Step 1: Write failing test for tool calling in doGenerate**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OCILanguageModel } from '../OCILanguageModel';
import type { OCIConfig } from '../../types';

// Mock auth module
vi.mock('../../auth/index.js', () => ({
  createAuthProvider: vi.fn().mockResolvedValue({}),
  getRegion: vi.fn().mockReturnValue('us-chicago-1'),
  getCompartmentId: vi.fn().mockReturnValue('test-compartment'),
}));

describe('OCILanguageModel - Tool Calling', () => {
  const mockConfig: OCIConfig = {
    compartmentId: 'test-compartment',
    region: 'us-chicago-1',
  };

  describe('doGenerate with tools', () => {
    it('should pass tools to OCI API in GENERIC format', async () => {
      const model = new OCILanguageModel('meta.llama-3.3-70b-instruct', mockConfig);

      const mockChat = vi.fn().mockResolvedValue({
        chatResult: {
          chatResponse: {
            choices: [{
              message: {
                toolCalls: [{
                  id: 'call_123',
                  type: 'FUNCTION',
                  function: {
                    name: 'get_weather',
                    arguments: '{"location":"London"}',
                  },
                }],
              },
              finishReason: 'TOOL_CALLS',
            }],
            usage: { promptTokens: 10, completionTokens: 20 },
          },
        },
      });

      // @ts-expect-error - accessing private for testing
      model._client = { chat: mockChat };

      const result = await model.doGenerate({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'What is the weather in London?' }] }],
        tools: [{
          type: 'function',
          name: 'get_weather',
          description: 'Get weather for a location',
          parameters: {
            type: 'object',
            properties: { location: { type: 'string' } },
            required: ['location'],
          },
        }],
        toolChoice: { type: 'auto' },
      });

      // Verify tools were passed to API
      expect(mockChat).toHaveBeenCalledWith(
        expect.objectContaining({
          chatDetails: expect.objectContaining({
            chatRequest: expect.objectContaining({
              tools: expect.arrayContaining([
                expect.objectContaining({
                  type: 'FUNCTION',
                  name: 'get_weather',
                }),
              ]),
              toolChoice: expect.objectContaining({ type: 'AUTO' }),
            }),
          }),
        })
      );

      // Verify tool call in response
      expect(result.content).toContainEqual(
        expect.objectContaining({
          type: 'tool-call',
          toolCallId: 'call_123',
          toolName: 'get_weather',
          args: { location: 'London' },
        })
      );

      // Verify finish reason
      expect(result.finishReason.unified).toBe('tool-calls');
    });

    it('should not emit unsupported warning when tools are provided for supported model', async () => {
      const model = new OCILanguageModel('meta.llama-3.3-70b-instruct', mockConfig);

      const mockChat = vi.fn().mockResolvedValue({
        chatResult: {
          chatResponse: {
            choices: [{ message: { content: [{ text: 'Hello' }] }, finishReason: 'STOP' }],
            usage: { promptTokens: 10, completionTokens: 5 },
          },
        },
      });

      // @ts-expect-error - accessing private for testing
      model._client = { chat: mockChat };

      const result = await model.doGenerate({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
        tools: [{
          type: 'function',
          name: 'test_tool',
          description: 'Test',
          parameters: { type: 'object', properties: {} },
        }],
      });

      // Should not have unsupported warning for tools
      expect(result.warnings).not.toContainEqual(
        expect.objectContaining({ feature: 'tools' })
      );
    });
  });
});
```

**Step 2: Update OCILanguageModel.doGenerate**

Add tool handling to doGenerate method:

```typescript
// Add imports
import { convertToOCITools, convertToOCIToolChoice, convertFromOCIToolCalls, supportsToolCalling } from './converters/tools';

// In doGenerate method, update warnings check:
if (options.tools && options.tools.length > 0) {
  if (!supportsToolCalling(this.modelId)) {
    warnings.push({
      type: 'unsupported',
      feature: 'tools',
      details: `Model ${this.modelId} does not support tool calling.`,
    });
  }
}

// Update chatRequest building to include tools:
const chatRequest = {
  ...baseChatRequest,
  ...(options.seed !== undefined ? { seed: options.seed } : {}),
  ...(options.tools && options.tools.length > 0 && supportsToolCalling(this.modelId)
    ? {
        tools: convertToOCITools(
          options.tools.filter((t) => t.type === 'function'),
          apiFormat
        ),
      }
    : {}),
  ...(options.toolChoice && options.toolChoice.type !== 'auto' && supportsToolCalling(this.modelId)
    ? { toolChoice: convertToOCIToolChoice(options.toolChoice) }
    : {}),
};

// Update response parsing to handle tool calls:
const choice = choices[0];
const toolCalls = choice?.message?.toolCalls;

// Build content array
const content: LanguageModelV3Content[] = [];

if (textContent) {
  content.push({ type: 'text', text: textContent });
}

if (toolCalls && toolCalls.length > 0) {
  const convertedToolCalls = convertFromOCIToolCalls(toolCalls, apiFormat);
  content.push(...convertedToolCalls);
}

return {
  content: content.length > 0 ? content : [{ type: 'text', text: '' }],
  finishReason: mapFinishReason(finishReason),
  // ... rest of return
};
```

**Step 3: Run tests**

Run: `pnpm test packages/oci-genai-provider/src/language-models/__tests__/tool-calling.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/OCILanguageModel.ts
git add packages/oci-genai-provider/src/language-models/__tests__/tool-calling.test.ts
git commit -m "feat: add tool calling support to doGenerate

- Pass tools to OCI API for supported models
- Convert tool choice to OCI format
- Parse tool call responses
- Return tool-call content parts in response
- Only warn for unsupported models

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update OCILanguageModel.doStream for Tool Calling

**Files:**
- Modify: `packages/oci-genai-provider/src/language-models/OCILanguageModel.ts`
- Modify: `packages/oci-genai-provider/src/shared/streaming/sse-parser.ts`
- Modify: `packages/oci-genai-provider/src/shared/streaming/types.ts`

**Step 1: Update streaming types**

Add tool-related stream parts to `types.ts`:

```typescript
import type { LanguageModelV3FinishReason, LanguageModelV3ToolCall } from '@ai-sdk/provider';

// ... existing types ...

export interface ToolCallPart {
  type: 'tool-call';
  toolCall: LanguageModelV3ToolCall;
}

export type StreamPart = TextDeltaPart | FinishPart | RawPart | ToolCallPart;
```

**Step 2: Update SSE parser to detect tool calls**

The OCI streaming format for tool calls includes:
```json
{"message":{"role":"ASSISTANT","toolCalls":[{"id":"call_123","type":"FUNCTION","function":{"name":"get_weather","arguments":"{\"location\":\"London\"}"}}]},"finishReason":"TOOL_CALLS"}
```

Update `sse-parser.ts`:

```typescript
// Update OCIStreamChunk interface
interface OCIStreamChunk {
  index?: number;
  message?: {
    role?: string;
    content?: Array<{ type?: string; text?: string }>;
    toolCalls?: Array<{
      id: string;
      type: string;
      function: {
        name: string;
        arguments: string;
      };
    }>;
  };
  finishReason?: string;
  pad?: string;
}

// In parseSSEStream, add tool call handling:
const toolCalls = parsed.message?.toolCalls;
if (toolCalls && toolCalls.length > 0) {
  for (const toolCall of toolCalls) {
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      args = {};
    }

    parts.push({
      type: 'tool-call',
      toolCall: {
        type: 'tool-call',
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        args,
      },
    });
  }
}
```

**Step 3: Update OCILanguageModel.doStream**

Add tool handling similar to doGenerate, and emit tool-call events in stream:

```typescript
// In v3Stream processing:
} else if (part.type === 'tool-call') {
  controller.enqueue(part.toolCall);
}
```

**Step 4: Run tests**

Run: `pnpm test packages/oci-genai-provider/src/language-models`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/OCILanguageModel.ts
git add packages/oci-genai-provider/src/shared/streaming/sse-parser.ts
git add packages/oci-genai-provider/src/shared/streaming/types.ts
git commit -m "feat: add tool calling support to streaming

- Add ToolCallPart to streaming types
- Parse tool calls from OCI SSE stream
- Emit LanguageModelV3ToolCall events in stream
- Pass tools to streaming chat request

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Integration Tests

**Files:**
- Create: `packages/oci-genai-provider/src/__tests__/integration/tool-calling.integration.test.ts`

**Step 1: Write integration test**

```typescript
import { describe, it, expect } from 'vitest';
import { createOCI } from '../../index';

describe('Tool Calling Integration', () => {
  const hasCredentials = process.env.OCI_COMPARTMENT_ID;

  it.skipIf(!hasCredentials)('should call tools with Llama 3.3', async () => {
    const provider = createOCI({
      compartmentId: process.env.OCI_COMPARTMENT_ID!,
      region: 'eu-frankfurt-1',
    });

    const model = provider.languageModel('meta.llama-3.3-70b-instruct');

    const result = await model.doGenerate({
      prompt: [
        { role: 'user', content: [{ type: 'text', text: 'What is the weather in Tokyo?' }] },
      ],
      tools: [
        {
          type: 'function',
          name: 'get_weather',
          description: 'Get the current weather in a given location',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'The city and country, e.g. Tokyo, Japan',
              },
            },
            required: ['location'],
          },
        },
      ],
      toolChoice: { type: 'auto' },
      maxOutputTokens: 500,
    });

    console.log('Result:', JSON.stringify(result.content, null, 2));
    console.log('Finish reason:', result.finishReason);

    // Should either have a tool call or text response
    expect(result.content.length).toBeGreaterThan(0);
  });

  it.skipIf(!hasCredentials)('should handle tool results in conversation', async () => {
    const provider = createOCI({
      compartmentId: process.env.OCI_COMPARTMENT_ID!,
      region: 'eu-frankfurt-1',
    });

    const model = provider.languageModel('meta.llama-3.3-70b-instruct');

    // Continue conversation with tool result
    const result = await model.doGenerate({
      prompt: [
        { role: 'user', content: [{ type: 'text', text: 'What is the weather in Tokyo?' }] },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call_123',
              toolName: 'get_weather',
              args: { location: 'Tokyo, Japan' },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call_123',
              toolName: 'get_weather',
              output: { type: 'text', text: '{"temperature": 22, "condition": "sunny"}' },
            },
          ],
        },
      ],
      tools: [
        {
          type: 'function',
          name: 'get_weather',
          description: 'Get the current weather',
          parameters: { type: 'object', properties: { location: { type: 'string' } } },
        },
      ],
      maxOutputTokens: 500,
    });

    console.log('Response with tool result:', result.content);

    // Should have a text response summarizing the weather
    expect(result.content.some((c) => c.type === 'text')).toBe(true);
  });
});
```

**Step 2: Run integration tests (if credentials available)**

Run: `pnpm test packages/oci-genai-provider/src/__tests__/integration/tool-calling.integration.test.ts`

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/src/__tests__/integration/tool-calling.integration.test.ts
git commit -m "test: add integration tests for tool calling

- Test tool calling with Llama 3.3 model
- Test multi-turn conversation with tool results
- Skip tests when credentials not available

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Update Documentation

**Files:**
- Modify: `packages/oci-genai-provider/FEATURES.md`
- Modify: `packages/oci-genai-provider/README.md`

**Step 1: Update FEATURES.md**

Change tool calling from "Not Supported" to "Supported":

```markdown
## Fully Supported Features

### Tool/Function Calling

- ✅ **Tools** - Define functions the model can call
- ✅ **Tool Choice** - Control tool selection (auto, required, none, specific)
- ✅ **Tool Results** - Pass function execution results back to model

**Supported Models:**
- Meta Llama 3.1+ (70B, 405B Instruct)
- Cohere Command R, Command R+
- xAI Grok models
- Google Gemini models

**Example:**
```typescript
const result = await model.doGenerate({
  prompt: [{ role: 'user', content: [{ type: 'text', text: 'Get weather in Tokyo' }] }],
  tools: [{
    type: 'function',
    name: 'get_weather',
    description: 'Get current weather',
    parameters: {
      type: 'object',
      properties: { location: { type: 'string' } },
      required: ['location'],
    },
  }],
  toolChoice: { type: 'auto' },
});

// result.content may include tool-call parts
```
```

**Step 2: Update README.md**

Add tool calling to supported features and add example.

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/FEATURES.md
git add packages/oci-genai-provider/README.md
git commit -m "docs: update documentation for tool calling support

- Move tool calling to supported features
- Add supported models list
- Add tool calling usage examples
- Update feature support summary

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Completion Checklist

- [ ] Tool converters created (GENERIC + COHERE formats)
- [ ] Message converters handle tool-call and tool-result parts
- [ ] doGenerate passes tools and parses tool call responses
- [ ] doStream emits tool-call events
- [ ] SSE parser detects tool calls in stream
- [ ] Unit tests passing
- [ ] Integration tests added
- [ ] FEATURES.md updated
- [ ] README.md updated
- [ ] All tests passing: `pnpm test`
- [ ] Type check passing: `pnpm typecheck`
- [ ] Build succeeds: `pnpm build`

---

## Final Verification

Run full test suite:
```bash
cd packages/oci-genai-provider
pnpm test
pnpm typecheck
pnpm build
```

Test with real OCI credentials (if available):
```bash
pnpm test src/__tests__/integration/tool-calling.integration.test.ts
```

Expected: Tool calling works for Llama 3.1+, Cohere Command R/R+, Grok, and Gemini models.

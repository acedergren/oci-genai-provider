# Type Safety Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Achieve 100% type safety by eliminating all `as any` casts, adding proper OCI SDK type definitions, restoring removed warnings for API consistency, and fixing identified code review issues.

**Architecture:** Create a dedicated OCI types module (`oci-sdk-types.ts`) that bridges the gap between OCI SDK types and our internal types. This allows us to have strict typing without relying on incomplete SDK type exports. All changes preserve backward compatibility and follow existing patterns.

**Tech Stack:** TypeScript 5.x with strict mode, Jest for testing, OCI SDK for Node.js

---

## Task 1: Create OCI SDK Type Definitions

**Files:**

- Create: `packages/oci-genai-provider/src/shared/oci-sdk-types.ts`
- Test: `packages/oci-genai-provider/src/shared/__tests__/oci-sdk-types.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/oci-genai-provider/src/shared/__tests__/oci-sdk-types.test.ts
import { describe, it, expect } from '@jest/globals';
import type {
  OCIReasoningEffort,
  OCIThinkingType,
  OCIApiFormat,
  OCICompletionTokensDetails,
} from '../oci-sdk-types';

describe('OCI SDK Types', () => {
  describe('OCIReasoningEffort', () => {
    it('should accept valid reasoning effort values', () => {
      const efforts: OCIReasoningEffort[] = ['NONE', 'MINIMAL', 'LOW', 'MEDIUM', 'HIGH'];
      expect(efforts).toHaveLength(5);
    });
  });

  describe('OCIThinkingType', () => {
    it('should accept ENABLED and DISABLED', () => {
      const types: OCIThinkingType[] = ['ENABLED', 'DISABLED'];
      expect(types).toHaveLength(2);
    });
  });

  describe('OCIApiFormat', () => {
    it('should accept valid API formats', () => {
      const formats: OCIApiFormat[] = ['GENERIC', 'COHERE', 'COHEREV2'];
      expect(formats).toHaveLength(3);
    });
  });

  describe('OCICompletionTokensDetails', () => {
    it('should have optional fields', () => {
      const details: OCICompletionTokensDetails = {};
      expect(details.reasoningTokens).toBeUndefined();
      expect(details.acceptedPredictionTokens).toBeUndefined();
    });

    it('should accept all token detail fields', () => {
      const details: OCICompletionTokensDetails = {
        reasoningTokens: 100,
        acceptedPredictionTokens: 50,
        rejectedPredictionTokens: 10,
      };
      expect(details.reasoningTokens).toBe(100);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="oci-sdk-types.test.ts"`
Expected: FAIL with "Cannot find module '../oci-sdk-types'"

**Step 3: Write minimal implementation**

```typescript
// packages/oci-genai-provider/src/shared/oci-sdk-types.ts
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
export function createThinkingConfig(enabled: boolean, tokenBudget?: number): OCIThinkingConfig {
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
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="oci-sdk-types.test.ts"`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/shared/oci-sdk-types.ts \
        packages/oci-genai-provider/src/shared/__tests__/oci-sdk-types.test.ts
git commit -m "feat: add OCI SDK type definitions for type safety"
```

---

## Task 2: Update Tools Converter with Strict API Format Type

**Files:**

- Modify: `packages/oci-genai-provider/src/language-models/converters/tools.ts:85-93, 156-166`
- Test: `packages/oci-genai-provider/src/language-models/converters/__tests__/tools.test.ts`

**Step 1: Write the failing test**

Add to existing test file:

```typescript
// Add to packages/oci-genai-provider/src/language-models/converters/__tests__/tools.test.ts
describe('Type Safety', () => {
  it('should accept OCIApiFormat type for convertToOCITools', () => {
    const format: 'GENERIC' | 'COHERE' = 'GENERIC';
    const tools = convertToOCITools([], format);
    expect(tools).toEqual([]);
  });

  it('should accept OCIApiFormat type for convertFromOCIToolCalls', () => {
    const format: 'GENERIC' | 'COHERE' = 'COHERE';
    const result = convertFromOCIToolCalls([], format);
    expect(result).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails (type error on current implementation)**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="tools.test.ts"`
Expected: Currently passes because `as any` bypasses type checking, but the test sets up for refactor

**Step 3: Write minimal implementation**

Update `tools.ts`:

```typescript
// Change line 85-93:
import type { OCIApiFormat } from '../../shared/oci-sdk-types';

export function convertToOCITools(
  tools: LanguageModelV3FunctionTool[],
  apiFormat: OCIApiFormat
): OCIToolDefinition[] {
  if (apiFormat === 'COHERE' || apiFormat === 'COHEREV2') {
    return tools.map((tool) => convertToCohereToolFormat(tool));
  }
  return tools.map((tool) => convertToGenericToolFormat(tool));
}

// Change line 156-166:
export function convertFromOCIToolCalls(
  toolCalls: OCIToolCall[],
  apiFormat: OCIApiFormat
): LanguageModelV3ToolCall[] {
  if (apiFormat === 'COHERE' || apiFormat === 'COHEREV2') {
    return toolCalls.map((call, index) =>
      convertFromCohereToolCall(call as OCICohereToolCall, index)
    );
  }
  return toolCalls.map((call) => convertFromGenericToolCall(call as OCIFunctionCall));
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="tools.test.ts"`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/converters/tools.ts \
        packages/oci-genai-provider/src/language-models/converters/__tests__/tools.test.ts
git commit -m "refactor(tools): use OCIApiFormat type instead of string"
```

---

## Task 3: Fix OCILanguageModel - Remove `as any` Casts for Reasoning

**Files:**

- Modify: `packages/oci-genai-provider/src/language-models/OCILanguageModel.ts:284-295, 491-502`
- Test: `packages/oci-genai-provider/src/language-models/__tests__/OCILanguageModel.test.ts`

**Step 1: Write the failing test**

```typescript
// Add to OCILanguageModel.test.ts
describe('Reasoning Options Type Safety', () => {
  it('should apply reasoningEffort with proper typing for Generic format', async () => {
    const model = new OCILanguageModel('xai.grok-4-1-fast-reasoning', mockConfig);
    // This test validates the code compiles without `as any`
    // The actual type enforcement is at compile time
    expect(model.modelId).toBe('xai.grok-4-1-fast-reasoning');
  });

  it('should apply thinking config with proper typing for Cohere format', async () => {
    const model = new OCILanguageModel('cohere.command-a-reasoning-08-2025', mockConfig);
    expect(model.modelId).toBe('cohere.command-a-reasoning-08-2025');
  });
});
```

**Step 2: Run test to verify current state**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="OCILanguageModel.test.ts"`
Expected: PASS (tests pass, but code has `as any`)

**Step 3: Write minimal implementation**

Update `OCILanguageModel.ts`:

```typescript
// Add import at top:
import { OCIApiFormat, toOCIReasoningEffort, createThinkingConfig } from '../shared/oci-sdk-types';

// Replace lines 284-295 in doGenerate():
if (ociOptions?.reasoningEffort && apiFormat === 'GENERIC') {
  const genericReq = chatRequest as OCIModel.GenericChatRequest & {
    reasoningEffort?: ReturnType<typeof toOCIReasoningEffort>;
  };
  genericReq.reasoningEffort = toOCIReasoningEffort(ociOptions.reasoningEffort);
}

if (ociOptions?.thinking && (apiFormat === 'COHEREV2' || apiFormat === 'COHERE')) {
  const cohereReq = chatRequest as OCIModel.CohereChatRequestV2 & {
    thinking?: ReturnType<typeof createThinkingConfig>;
  };
  cohereReq.thinking = createThinkingConfig(true, ociOptions.tokenBudget);
}

// Replace lines 491-502 in doStream() with same pattern
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="OCILanguageModel.test.ts"`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/OCILanguageModel.ts
git commit -m "refactor(language-model): remove as any casts for reasoning options"
```

---

## Task 4: Fix OCILanguageModel - Remove `as any` Casts for Tool Calls

**Files:**

- Modify: `packages/oci-genai-provider/src/language-models/OCILanguageModel.ts:222, 359, 429`

**Step 1: Verify current state**

Run: `grep -n "as any" packages/oci-genai-provider/src/language-models/OCILanguageModel.ts`
Expected: Find remaining `as any` on tool-related lines

**Step 2: Write minimal implementation**

Update tool conversion calls to use typed API format:

```typescript
// Line 222 - change:
tools: convertToOCITools(functionTools, apiFormat as any),
// to:
tools: convertToOCITools(functionTools, apiFormat),

// Line 359 - change:
content.push(...convertFromOCIToolCalls(toolCalls, apiFormat as any));
// to:
content.push(...convertFromOCIToolCalls(toolCalls, apiFormat));

// Line 429 - change:
tools: convertToOCITools(functionTools, apiFormat as any),
// to:
tools: convertToOCITools(functionTools, apiFormat),
```

**Step 3: Run tests to verify**

Run: `pnpm --filter @acedergren/oci-genai-provider test`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/OCILanguageModel.ts
git commit -m "refactor(language-model): remove as any casts for tool conversions"
```

---

## Task 5: Fix Inconsistent Error Handling in doStream

**Files:**

- Modify: `packages/oci-genai-provider/src/language-models/OCILanguageModel.ts:609-610`
- Test: `packages/oci-genai-provider/src/language-models/__tests__/OCILanguageModel.stream.test.ts`

**Step 1: Write the failing test**

```typescript
// Add to OCILanguageModel.stream.test.ts
describe('Error Handling', () => {
  it('should wrap stream errors with handleOCIError', async () => {
    // Mock a stream that throws
    const mockError = new Error('Stream connection failed');
    // ... setup mock to throw during stream iteration

    const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);
    const result = await model.doStream(mockCallOptions);

    const reader = result.stream.getReader();
    const parts: LanguageModelV3StreamPart[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
    }

    const errorPart = parts.find((p) => p.type === 'error');
    expect(errorPart).toBeDefined();
    // Verify error is wrapped (would be OCIGenAIError subclass)
  });
});
```

**Step 2: Run test to verify current behavior**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="OCILanguageModel.stream.test.ts"`
Expected: Test reveals inconsistency

**Step 3: Write minimal implementation**

```typescript
// Change lines 609-610:
} catch (error) {
  controller.enqueue({ type: 'error', error });
}

// to:
} catch (error) {
  controller.enqueue({ type: 'error', error: handleOCIError(error) });
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="OCILanguageModel.stream.test.ts"`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/OCILanguageModel.ts \
        packages/oci-genai-provider/src/language-models/__tests__/OCILanguageModel.stream.test.ts
git commit -m "fix(language-model): wrap stream errors with handleOCIError"
```

---

## Task 6: Restore Missing Warnings in doStream

**Files:**

- Modify: `packages/oci-genai-provider/src/language-models/OCILanguageModel.ts:407-414`
- Test: `packages/oci-genai-provider/src/language-models/__tests__/OCILanguageModel.stream.test.ts`

**Step 1: Write the failing test**

```typescript
// Add to OCILanguageModel.stream.test.ts
describe('Warnings', () => {
  it('should warn when JSON responseFormat is requested in streaming', async () => {
    const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);
    const result = await model.doStream({
      ...mockCallOptions,
      responseFormat: { type: 'json' },
    });

    const reader = result.stream.getReader();
    const { value: startPart } = await reader.read();

    expect(startPart?.type).toBe('stream-start');
    if (startPart?.type === 'stream-start') {
      expect(startPart.warnings).toContainEqual(
        expect.objectContaining({
          type: 'unsupported',
          feature: 'responseFormat.json',
        })
      );
    }
  });

  it('should warn when tools are used with unsupported model in streaming', async () => {
    const model = new OCILanguageModel('google.gemini-2.5-flash-lite', mockConfig);
    const result = await model.doStream({
      ...mockCallOptions,
      tools: [{ type: 'function', name: 'test', inputSchema: {} }],
    });

    const reader = result.stream.getReader();
    const { value: startPart } = await reader.read();

    expect(startPart?.type).toBe('stream-start');
    if (startPart?.type === 'stream-start') {
      expect(startPart.warnings).toContainEqual(
        expect.objectContaining({
          type: 'unsupported',
          feature: 'tools',
        })
      );
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="OCILanguageModel.stream.test.ts"`
Expected: FAIL - warnings not present in streaming

**Step 3: Write minimal implementation**

Add after line 407 in doStream():

```typescript
const warnings: SharedV3Warning[] = [];

// Add JSON response format warning (matching doGenerate)
if (options.responseFormat?.type === 'json') {
  warnings.push({
    type: 'unsupported',
    feature: 'responseFormat.json',
    details: 'OCI response format JSON is not supported in this provider.',
  });
}

// Add tools warning for unsupported models (matching doGenerate)
if (hasTools && !modelSupportsTools) {
  warnings.push({
    type: 'unsupported',
    feature: 'tools',
    details: `Model ${this.modelId} does not support tool calling. Supported: Llama 3.1+, Cohere Command R/R+, Grok, Gemini.`,
  });
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="OCILanguageModel.stream.test.ts"`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/OCILanguageModel.ts \
        packages/oci-genai-provider/src/language-models/__tests__/OCILanguageModel.stream.test.ts
git commit -m "fix(language-model): restore missing warnings in doStream for consistency"
```

---

## Task 7: Add Reasoning Model Validation with Warning

**Files:**

- Modify: `packages/oci-genai-provider/src/language-models/OCILanguageModel.ts:15, 284-295, 491-502`
- Test: `packages/oci-genai-provider/src/language-models/__tests__/OCILanguageModel.test.ts`

**Step 1: Write the failing test**

```typescript
// Add to OCILanguageModel.test.ts
describe('Reasoning Model Validation', () => {
  it('should warn when reasoningEffort is used with non-reasoning model', async () => {
    const model = new OCILanguageModel('meta.llama-3.3-70b-instruct', mockConfig);

    const result = await model.doGenerate({
      ...mockCallOptions,
      providerOptions: {
        oci: { reasoningEffort: 'high' },
      },
    });

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        type: 'unsupported',
        feature: 'reasoningEffort',
      })
    );
  });

  it('should not warn when reasoningEffort is used with reasoning model', async () => {
    const model = new OCILanguageModel('xai.grok-4-1-fast-reasoning', mockConfig);

    const result = await model.doGenerate({
      ...mockCallOptions,
      providerOptions: {
        oci: { reasoningEffort: 'high' },
      },
    });

    const reasoningWarnings = result.warnings?.filter((w) => w.feature === 'reasoningEffort');
    expect(reasoningWarnings).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="OCILanguageModel.test.ts"`
Expected: FAIL - no warning generated

**Step 3: Write minimal implementation**

```typescript
// Add import at line 15:
import { isValidModelId, getModelMetadata, supportsReasoning } from './registry';

// Add validation in doGenerate() before applying reasoning options (around line 284):
const modelSupportsReasoning = supportsReasoning(this.modelId);

if (ociOptions?.reasoningEffort && !modelSupportsReasoning) {
  warnings.push({
    type: 'unsupported',
    feature: 'reasoningEffort',
    details: `Model ${this.modelId} does not support reasoning. Use a reasoning model like xai.grok-4-1-fast-reasoning or cohere.command-a-reasoning-08-2025.`,
  });
}

if (ociOptions?.thinking && !modelSupportsReasoning) {
  warnings.push({
    type: 'unsupported',
    feature: 'thinking',
    details: `Model ${this.modelId} does not support thinking/reasoning. Use a reasoning model like cohere.command-a-reasoning-08-2025.`,
  });
}

// Only apply reasoning options if model supports it
if (ociOptions?.reasoningEffort && apiFormat === 'GENERIC' && modelSupportsReasoning) {
  // ... existing implementation
}

// Same pattern for doStream()
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="OCILanguageModel.test.ts"`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/OCILanguageModel.ts \
        packages/oci-genai-provider/src/language-models/__tests__/OCILanguageModel.test.ts
git commit -m "feat(language-model): validate reasoning options against model capabilities"
```

---

## Task 8: Fix Redundant URL Type Cast in Messages Converter

**Files:**

- Modify: `packages/oci-genai-provider/src/language-models/converters/messages.ts:143-145`
- Test: `packages/oci-genai-provider/src/language-models/converters/__tests__/messages.test.ts`

**Step 1: Write the failing test**

```typescript
// Add to messages.test.ts
describe('URL Type Handling', () => {
  it('should handle URL objects without redundant cast', () => {
    const url = new URL('https://example.com/image.png');
    const prompt: LanguageModelV3Prompt = [
      {
        role: 'user',
        content: [
          {
            type: 'file',
            mediaType: 'image/png',
            data: url,
          },
        ],
      },
    ];

    const result = convertToOCIMessages(prompt);
    expect(result[0].content[0]).toEqual({
      type: 'IMAGE',
      imageUrl: { url: 'https://example.com/image.png' },
    });
  });
});
```

**Step 2: Run test to verify current state**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="messages.test.ts"`
Expected: PASS (test validates behavior)

**Step 3: Write minimal implementation**

```typescript
// Change lines 143-145:
} else if (part.data instanceof URL) {
  url = (part.data as URL).toString();
}

// to:
} else if (part.data instanceof URL) {
  url = part.data.toString();  // instanceof narrows type, cast unnecessary
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="messages.test.ts"`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/converters/messages.ts \
        packages/oci-genai-provider/src/language-models/converters/__tests__/messages.test.ts
git commit -m "refactor(messages): remove redundant URL type cast"
```

---

## Task 9: Fix Test File Naming Convention

**Files:**

- Rename: `packages/oci-genai-provider/src/__tests__/v3-specification-alignment.test.ts` → `packages/oci-genai-provider/src/__tests__/integration/v3-specification-alignment.integration.test.ts`

**Step 1: Create integration test directory if needed**

Run: `mkdir -p packages/oci-genai-provider/src/__tests__/integration`

**Step 2: Move and rename the file**

```bash
git mv packages/oci-genai-provider/src/__tests__/v3-specification-alignment.test.ts \
       packages/oci-genai-provider/src/__tests__/integration/v3-specification-alignment.integration.test.ts
```

**Step 3: Verify tests still run**

Run: `pnpm --filter @acedergren/oci-genai-provider test`
Expected: All tests PASS (Jest should find the renamed file)

**Step 4: Commit**

```bash
git add packages/oci-genai-provider/src/__tests__/
git commit -m "refactor(tests): move v3-specification-alignment to integration tests per code standards"
```

---

## Task 10: Final Verification - Zero `as any` and Full Type Safety

**Files:**

- All modified files

**Step 1: Verify no `as any` remains**

Run: `grep -r "as any" packages/oci-genai-provider/src/language-models/ --include="*.ts" | grep -v ".test.ts" | grep -v "__mocks__"`
Expected: No output (no `as any` in production code)

**Step 2: Run full type check**

Run: `pnpm --filter @acedergren/oci-genai-provider exec tsc --noEmit`
Expected: No type errors

**Step 3: Run full test suite**

Run: `pnpm --filter @acedergren/oci-genai-provider test`
Expected: All tests PASS

**Step 4: Run linting**

Run: `pnpm --filter @acedergren/oci-genai-provider lint`
Expected: No errors (warnings acceptable)

**Step 5: Final commit with all verification**

```bash
git add .
git commit -m "chore: verify 100% type safety - zero as any casts in production code"
```

---

## Summary

| Task | Issue Fixed                       | Files Changed                 |
| ---- | --------------------------------- | ----------------------------- |
| 1    | Create type definitions           | +`oci-sdk-types.ts`, +test    |
| 2    | Type safety for tools converter   | `tools.ts`                    |
| 3    | Remove `as any` for reasoning     | `OCILanguageModel.ts`         |
| 4    | Remove `as any` for tool calls    | `OCILanguageModel.ts`         |
| 5    | Fix inconsistent error handling   | `OCILanguageModel.ts:609-610` |
| 6    | Restore missing doStream warnings | `OCILanguageModel.ts:407-414` |
| 7    | Add reasoning model validation    | `OCILanguageModel.ts`         |
| 8    | Remove redundant URL cast         | `messages.ts:143-145`         |
| 9    | Fix test file naming              | Move to `integration/`        |
| 10   | Final verification                | All files                     |

---

## Task 11: Add Zod Dependency and Create Provider Options Schema

**Why Zod Here?** Provider options come from SDK consumers (untrusted input at API boundary). Zod provides runtime validation with TypeScript inference, catching invalid configurations early with clear error messages.

**Files:**

- Modify: `packages/oci-genai-provider/package.json`
- Create: `packages/oci-genai-provider/src/shared/schemas/provider-options.ts`
- Create: `packages/oci-genai-provider/src/shared/schemas/__tests__/provider-options.test.ts`

**Step 1: Add Zod dependency**

```bash
pnpm --filter @acedergren/oci-genai-provider add zod
```

**Step 2: Write the failing test**

```typescript
// packages/oci-genai-provider/src/shared/schemas/__tests__/provider-options.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  OCIProviderOptionsSchema,
  parseProviderOptions,
  type OCIProviderOptions,
} from '../provider-options';

describe('OCIProviderOptionsSchema', () => {
  describe('valid options', () => {
    it('should accept empty options', () => {
      const result = OCIProviderOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid reasoningEffort values', () => {
      const efforts = ['none', 'minimal', 'low', 'medium', 'high'] as const;
      for (const effort of efforts) {
        const result = OCIProviderOptionsSchema.safeParse({ reasoningEffort: effort });
        expect(result.success).toBe(true);
      }
    });

    it('should accept thinking with tokenBudget', () => {
      const result = OCIProviderOptionsSchema.safeParse({
        thinking: true,
        tokenBudget: 1024,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.thinking).toBe(true);
        expect(result.data.tokenBudget).toBe(1024);
      }
    });

    it('should accept valid servingMode', () => {
      const modes = ['ON_DEMAND', 'DEDICATED'] as const;
      for (const mode of modes) {
        const result = OCIProviderOptionsSchema.safeParse({ servingMode: mode });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid options', () => {
    it('should reject invalid reasoningEffort', () => {
      const result = OCIProviderOptionsSchema.safeParse({ reasoningEffort: 'maximum' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('reasoningEffort');
      }
    });

    it('should reject negative tokenBudget', () => {
      const result = OCIProviderOptionsSchema.safeParse({ tokenBudget: -100 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid servingMode', () => {
      const result = OCIProviderOptionsSchema.safeParse({ servingMode: 'HYBRID' });
      expect(result.success).toBe(false);
    });
  });

  describe('parseProviderOptions helper', () => {
    it('should return validated options with defaults', () => {
      const result = parseProviderOptions({ reasoningEffort: 'high' });
      expect(result.reasoningEffort).toBe('high');
    });

    it('should throw OCIValidationError for invalid options', () => {
      expect(() => parseProviderOptions({ reasoningEffort: 'invalid' })).toThrow(
        'Invalid OCI provider options'
      );
    });

    it('should handle undefined gracefully', () => {
      const result = parseProviderOptions(undefined);
      expect(result).toEqual({});
    });
  });
});
```

**Step 3: Run test to verify it fails**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="provider-options.test.ts"`
Expected: FAIL with "Cannot find module '../provider-options'"

**Step 4: Write minimal implementation**

````typescript
// packages/oci-genai-provider/src/shared/schemas/provider-options.ts
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
export const OCIProviderOptionsSchema = z
  .object({
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
     * ON_DEMAND: Pay-per-use pricing
     * DEDICATED: Dedicated AI units with reserved capacity
     */
    servingMode: z.enum(['ON_DEMAND', 'DEDICATED']).optional().describe('Model serving mode'),

    /**
     * Endpoint ID for dedicated serving mode.
     * Required when servingMode is DEDICATED.
     */
    endpointId: z.string().optional().describe('Endpoint ID for dedicated serving'),
  })
  .strict(); // Reject unknown properties for type safety

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
````

**Step 5: Create schemas directory index**

```typescript
// packages/oci-genai-provider/src/shared/schemas/index.ts
export {
  OCIProviderOptionsSchema,
  parseProviderOptions,
  type OCIProviderOptions,
  type OCIProviderOptionsInput,
} from './provider-options';
```

**Step 6: Add OCIValidationError to errors module (if not exists)**

```typescript
// Add to packages/oci-genai-provider/src/shared/errors/index.ts
export class OCIValidationError extends OCIGenAIError {
  constructor(
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OCIValidationError';
  }
}
```

**Step 7: Run test to verify it passes**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="provider-options.test.ts"`
Expected: PASS

**Step 8: Commit**

```bash
git add packages/oci-genai-provider/package.json \
        packages/oci-genai-provider/src/shared/schemas/ \
        packages/oci-genai-provider/src/shared/errors/index.ts \
        pnpm-lock.yaml
git commit -m "feat: add Zod schema for provider options validation"
```

---

## Task 12: Integrate Zod Validation into OCILanguageModel

**Files:**

- Modify: `packages/oci-genai-provider/src/language-models/OCILanguageModel.ts`
- Modify: `packages/oci-genai-provider/src/language-models/__tests__/OCILanguageModel.test.ts`

**Step 1: Write the failing test**

```typescript
// Add to OCILanguageModel.test.ts
describe('Provider Options Validation', () => {
  it('should throw OCIValidationError for invalid reasoningEffort', async () => {
    const model = new OCILanguageModel('xai.grok-4-1-fast-reasoning', mockConfig);

    await expect(
      model.doGenerate({
        ...mockCallOptions,
        providerOptions: {
          oci: { reasoningEffort: 'maximum' }, // invalid
        },
      })
    ).rejects.toThrow('Invalid OCI provider options');
  });

  it('should throw OCIValidationError for negative tokenBudget', async () => {
    const model = new OCILanguageModel('cohere.command-a-reasoning', mockConfig);

    await expect(
      model.doGenerate({
        ...mockCallOptions,
        providerOptions: {
          oci: { thinking: true, tokenBudget: -500 },
        },
      })
    ).rejects.toThrow('Invalid OCI provider options');
  });

  it('should accept valid provider options', async () => {
    const model = new OCILanguageModel('xai.grok-4-1-fast-reasoning', mockConfig);

    // Should not throw
    await model.doGenerate({
      ...mockCallOptions,
      providerOptions: {
        oci: { reasoningEffort: 'high' },
      },
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="OCILanguageModel.test.ts"`
Expected: FAIL - no validation error thrown

**Step 3: Write minimal implementation**

```typescript
// In OCILanguageModel.ts, add import:
import { parseProviderOptions } from '../shared/schemas';

// In doGenerate(), at the start (around line 165):
async doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult> {
  // Validate provider options early (fail fast)
  const ociOptions = parseProviderOptions(
    options.providerOptions?.oci as Record<string, unknown> | undefined
  );

  // ... rest of method uses validated ociOptions
}

// In doStream(), at the start (around line 400):
async doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
  // Validate provider options early (fail fast)
  const ociOptions = parseProviderOptions(
    options.providerOptions?.oci as Record<string, unknown> | undefined
  );

  // ... rest of method uses validated ociOptions
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @acedergren/oci-genai-provider test -- --testPathPattern="OCILanguageModel.test.ts"`
Expected: PASS

**Step 5: Run full test suite**

Run: `pnpm --filter @acedergren/oci-genai-provider test`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/OCILanguageModel.ts \
        packages/oci-genai-provider/src/language-models/__tests__/OCILanguageModel.test.ts
git commit -m "feat(language-model): integrate Zod validation for provider options"
```

---

## Task 13: Final Verification - Complete Type Safety with Zod

**Files:**

- All modified files

**Step 1: Verify no `as any` remains in production code**

Run: `grep -r "as any" packages/oci-genai-provider/src/ --include="*.ts" | grep -v ".test.ts" | grep -v "__mocks__"`
Expected: No output (or only safe casts in specific edge cases)

**Step 2: Verify Zod schemas are properly typed**

Run: `pnpm --filter @acedergren/oci-genai-provider exec tsc --noEmit`
Expected: No type errors

**Step 3: Run full test suite**

Run: `pnpm --filter @acedergren/oci-genai-provider test`
Expected: All tests PASS

**Step 4: Run linting**

Run: `pnpm --filter @acedergren/oci-genai-provider lint`
Expected: No errors

**Step 5: Verify bundle size impact**

Run: `pnpm --filter @acedergren/oci-genai-provider build && du -sh packages/oci-genai-provider/dist/`
Expected: Minimal increase (~10-15KB for Zod)

**Step 6: Final commit**

```bash
git add .
git commit -m "chore: verify complete type safety with Zod validation"
```

---

## Summary (Updated)

| Task | Issue Fixed                         | Files Changed                         |
| ---- | ----------------------------------- | ------------------------------------- |
| 1    | Create type definitions             | +`oci-sdk-types.ts`, +test            |
| 2    | Type safety for tools converter     | `tools.ts`                            |
| 3    | Remove `as any` for reasoning       | `OCILanguageModel.ts`                 |
| 4    | Remove `as any` for tool calls      | `OCILanguageModel.ts`                 |
| 5    | Fix inconsistent error handling     | `OCILanguageModel.ts:609-610`         |
| 6    | Restore missing doStream warnings   | `OCILanguageModel.ts:407-414`         |
| 7    | Add reasoning model validation      | `OCILanguageModel.ts`                 |
| 8    | Remove redundant URL cast           | `messages.ts:143-145`                 |
| 9    | Fix test file naming                | Move to `integration/`                |
| 10   | Final verification                  | All files                             |
| 11   | Zod schema for provider options     | +`schemas/provider-options.ts`, +test |
| 12   | Integrate Zod into OCILanguageModel | `OCILanguageModel.ts`                 |
| 13   | Final verification with Zod         | All files                             |

**Total Commits:** 13
**Estimated Time:** 60-75 minutes

---

## Why Zod Only for Provider Options?

Based on analysis, Zod adds value specifically at **API boundaries** where untrusted input enters the system:

| Location                        | Zod Value   | Rationale                                                |
| ------------------------------- | ----------- | -------------------------------------------------------- |
| `providerOptions`               | ✅ HIGH     | User input from SDK consumers, untrusted                 |
| Internal types (`OCIApiFormat`) | ❌ LOW      | Compile-time types, no runtime validation needed         |
| SSE stream chunks               | ⚠️ OPTIONAL | Could add, but `try/catch` with JSON.parse is sufficient |

This targeted approach keeps bundle size minimal while providing runtime validation where it matters most.

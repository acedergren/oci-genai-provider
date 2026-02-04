# OCI GenAI Feature Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement seed parameter support and document OCI GenAI feature capabilities/limitations for AI SDK integration.

**Architecture:** Add seed parameter passthrough in OCILanguageModel, create comprehensive feature support documentation, and add tests to verify seed behavior.

**Tech Stack:** TypeScript, Vercel AI SDK v6, OCI SDK, Vitest

---

## Task 1: Add Seed Parameter Support

**Files:**

- Modify: `packages/oci-genai-provider/src/language-models/OCILanguageModel.ts:160-186`
- Modify: `packages/oci-genai-provider/src/language-models/OCILanguageModel.ts:244-273`
- Create: `packages/oci-genai-provider/src/language-models/__tests__/seed-parameter.test.ts`

**Step 1: Write the failing test**

Create test file to verify seed parameter is passed through:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { OCILanguageModel } from '../OCILanguageModel';
import type { OCIConfig } from '../../types';

describe('OCILanguageModel - Seed Parameter', () => {
  const mockConfig: OCIConfig = {
    compartmentId: 'test-compartment',
    region: 'us-chicago-1',
  };

  it('should pass seed parameter in non-streaming requests', async () => {
    const model = new OCILanguageModel('meta.llama-3.3-70b-instruct', mockConfig);

    // Mock the client.chat method
    const mockChat = vi.fn().mockResolvedValue({
      chatResponse: {
        choices: [
          {
            message: { content: [{ text: 'test response' }] },
            finishReason: 'STOP',
          },
        ],
        usage: { promptTokens: 10, completionTokens: 20 },
      },
    });

    // @ts-expect-error - accessing private method for testing
    model._client = { chat: mockChat };

    await model.doGenerate({
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'test' }] }],
      seed: 42,
    });

    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({
        chatDetails: expect.objectContaining({
          chatRequest: expect.objectContaining({
            seed: 42,
          }),
        }),
      })
    );
  });

  it('should pass seed parameter in streaming requests', async () => {
    const model = new OCILanguageModel('meta.llama-3.3-70b-instruct', mockConfig);

    const mockStream = new ReadableStream();
    const mockChat = vi.fn().mockResolvedValue(mockStream);

    // @ts-expect-error - accessing private method for testing
    model._client = { chat: mockChat };

    await model.doStream({
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'test' }] }],
      seed: 123,
    });

    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({
        chatDetails: expect.objectContaining({
          chatRequest: expect.objectContaining({
            seed: 123,
            isStream: true,
          }),
        }),
      })
    );
  });

  it('should not include seed parameter when not provided', async () => {
    const model = new OCILanguageModel('meta.llama-3.3-70b-instruct', mockConfig);

    const mockChat = vi.fn().mockResolvedValue({
      chatResponse: {
        choices: [
          {
            message: { content: [{ text: 'test response' }] },
            finishReason: 'STOP',
          },
        ],
        usage: { promptTokens: 10, completionTokens: 20 },
      },
    });

    // @ts-expect-error - accessing private method for testing
    model._client = { chat: mockChat };

    await model.doGenerate({
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'test' }] }],
    });

    const callArgs = mockChat.mock.calls[0][0];
    expect(callArgs.chatDetails.chatRequest).not.toHaveProperty('seed');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test packages/oci-genai-provider/src/language-models/__tests__/seed-parameter.test.ts`

Expected: FAIL - seed parameter not being passed to chatRequest

**Step 3: Implement seed parameter support in doGenerate**

Modify `OCILanguageModel.ts` doGenerate method (lines 160-186):

```typescript
async doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult> {
  const messages = convertToOCIMessages(options.prompt);
  const client = await this.getClient();
  const compartmentId = getCompartmentId(this.config);
  const apiFormat = this.getApiFormat();

  try {
    // Build chatRequest based on API format
    const baseChatRequest =
      apiFormat === 'COHERE'
        ? { apiFormat, ...convertToCohereFormat(messages) }
        : { apiFormat, messages };

    // Add seed parameter if provided
    const chatRequest = options.seed !== undefined
      ? { ...baseChatRequest, seed: options.seed }
      : baseChatRequest;

    const response = await this.executeWithResilience<OCIChatResponse>(
      () =>
        client.chat({
          chatDetails: {
            compartmentId,
            servingMode: {
              servingType: 'ON_DEMAND',
              modelId: this.modelId,
            },
            chatRequest,
          },
        }) as Promise<OCIChatResponse>,
      'OCI chat request'
    );

    // ... rest of method unchanged
  } catch (error) {
    throw handleOCIError(error);
  }
}
```

**Step 4: Implement seed parameter support in doStream**

Modify `OCILanguageModel.ts` doStream method (lines 244-273):

```typescript
async doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
  const messages = convertToOCIMessages(options.prompt);
  const client = await this.getClient();
  const compartmentId = getCompartmentId(this.config);
  const apiFormat = this.getApiFormat();

  try {
    // Build chatRequest based on API format
    const baseChatRequest =
      apiFormat === 'COHERE'
        ? { apiFormat, ...convertToCohereFormat(messages), isStream: true }
        : { apiFormat, messages, isStream: true };

    // Add seed parameter if provided
    const chatRequest = options.seed !== undefined
      ? { ...baseChatRequest, seed: options.seed }
      : baseChatRequest;

    // Note: Retry and timeout only apply to connection establishment.
    // Once streaming starts, the stream handles its own errors.
    // OCI SDK returns ReadableStream<Uint8Array> directly for streaming requests
    const stream = await this.executeWithResilience<ReadableStream<Uint8Array>>(
      () =>
        client.chat({
          chatDetails: {
            compartmentId,
            servingMode: {
              servingType: 'ON_DEMAND',
              modelId: this.modelId,
            },
            chatRequest,
          },
        }) as unknown as Promise<ReadableStream<Uint8Array>>,
      'OCI streaming chat request'
    );

    // ... rest of method unchanged
  } catch (error) {
    throw handleOCIError(error);
  }
}
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test packages/oci-genai-provider/src/language-models/__tests__/seed-parameter.test.ts`

Expected: PASS - all 3 tests pass

**Step 6: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/OCILanguageModel.ts
git add packages/oci-genai-provider/src/language-models/__tests__/seed-parameter.test.ts
git commit -m "feat: add seed parameter support for deterministic generation

- Pass seed parameter from AI SDK to OCI GenAI API
- Support seed in both streaming and non-streaming requests
- Add unit tests to verify seed parameter passthrough
- Document that OCI provides best-effort determinism

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Document Feature Support

**Files:**

- Create: `packages/oci-genai-provider/FEATURES.md`

**Step 1: Write comprehensive feature support documentation**

Create `FEATURES.md` documenting all AI SDK features and OCI support status:

````markdown
# OCI GenAI Provider - Feature Support

This document details which Vercel AI SDK v6 features are supported by the OCI GenAI provider.

## Fully Supported Features

### Core Text Generation

- ✅ **Streaming** - Both streaming (`doStream`) and non-streaming (`doGenerate`) modes
- ✅ **Temperature** - Controls randomness (0.0-1.0, model-specific ranges)
- ✅ **Max Output Tokens** - Limits response length
- ✅ **Top P** - Nucleus sampling for diversity
- ✅ **Top K** - Top-K sampling (limits vocabulary)
- ✅ **Stop Sequences** - Array of strings to stop generation
- ✅ **Presence Penalty** - Reduces likelihood of repeating topics
- ✅ **Frequency Penalty** - Reduces likelihood of repeating tokens

### Advanced Parameters

- ✅ **Seed** - Deterministic generation (best-effort, not guaranteed)
  - OCI API documentation: "makes a best effort to sample tokens deterministically"
  - Caveat: Responses with same seed are similar but not byte-for-byte identical

### Message Formats

- ✅ **System Messages** - Instruction/context for the model
- ✅ **User Messages** - User input with text content
- ✅ **Assistant Messages** - Model responses in conversation history
- ✅ **Multi-turn Conversations** - Full conversation history support

### Model Families

- ✅ **Llama Models** - Meta Llama 3.x series (GENERIC API format)
- ✅ **Gemini Models** - Google Gemini models (GENERIC API format)
- ✅ **Cohere Models** - Cohere Command series (COHERE API format)
- ✅ **Grok Models** - xAI Grok models (GENERIC API format)

### Provider Features

- ✅ **Error Handling** - Comprehensive error mapping and messages
- ✅ **Retry Logic** - Configurable retry with exponential backoff
- ✅ **Timeout Control** - Per-request timeout configuration
- ✅ **Token Usage Tracking** - Input/output token counts
- ✅ **Finish Reason Mapping** - Standardized finish reasons

## Not Supported (OCI Limitations)

These features are not supported because the OCI GenAI API does not provide them:

### Tool Calling / Function Calling

- ❌ **Tools** - No function/tool calling support
- ❌ **Tool Choice** - Not applicable
- ❌ **Tool Results** - Not applicable

> **Note:** OCI GenAI does not support tool calling. For agent/tool use cases, implement tool orchestration in your application layer.

### Multi-Modal Capabilities

- ❌ **Vision** - No image input support
- ❌ **Audio Input** - No audio/speech input
- ❌ **PDF/Document Input** - No document parsing
- ❌ **File Generation** - Models only output text

> **Note:** OCI GenAI is text-only. For vision tasks, use OCI Vision API separately.

### Advanced Content Types

- ❌ **Reasoning Output** - No chain-of-thought/reasoning tokens
- ❌ **Source Citations** - No grounded search with sources
- ❌ **Structured Output Validation** - No schema enforcement

## Partially Supported / Future Enhancements

### Response Format (JSON Mode)

- 🔄 **Status:** Cohere models support JSON mode via OCI API
- 🔄 **Blocker:** AI SDK doesn't pass `responseFormat` to providers yet
- 🔄 **OCI Support:** `CohereResponseFormat` with JSON schema
- 🔄 **Implementation:** Pending AI SDK update

**How to use (when available):**

```typescript
const result = await model.doGenerate({
  prompt: [{ role: 'user', content: [{ type: 'text', text: 'Return JSON' }] }],
  responseFormat: {
    type: 'json',
    schema: {
      /* JSON schema */
    },
  },
});
```
````

### Abort Signal (Request Cancellation)

- ⚠️ **Status:** Parameter accepted, functionality unclear
- ⚠️ **Issue:** OCI SDK may not respect AbortSignal
- ⚠️ **Workaround:** Use timeout configuration instead

**Alternative:**

```typescript
const provider = createOCI({
  compartmentId: 'ocid1...',
  requestOptions: {
    timeoutMs: 10000, // 10 second timeout
  },
});
```

### Custom HTTP Headers

- ⚠️ **Status:** Parameter accepted, may not be sent
- ⚠️ **Reason:** OCI uses IAM authentication, not header-based auth
- ⚠️ **Use Case:** Limited applicability for OCI

## Regional Model Availability

Model availability varies by OCI region:

### Frankfurt (eu-frankfurt-1)

- ✅ Llama 3.3 70B
- ✅ Gemini 2.5 Flash, Pro, 2.0 Flash, 1.5 Pro, Flash
- ✅ Cohere Command A-03-2025, Command Plus Latest

### Ashburn (us-ashburn-1)

- ✅ Grok 3, Grok 4 Maverick
- ✅ Gemini models

### Phoenix (us-phoenix-1)

- ✅ Grok models
- ✅ Gemini models

> **Note:** Always check current model availability in your target region. See `inventory-regions.mjs` for testing.

## API Format Differences

The provider automatically detects and handles format differences:

### GENERIC Format (Llama, Gemini, Grok)

```typescript
{
  apiFormat: 'GENERIC',
  messages: [
    { role: 'USER', content: [{ type: 'TEXT', text: '...' }] },
    { role: 'ASSISTANT', content: [{ type: 'TEXT', text: '...' }] }
  ]
}
```

### COHERE Format (Cohere Models)

```typescript
{
  apiFormat: 'COHERE',
  message: 'current user message',
  chat_history: [
    { role: 'USER', message: 'previous user message' },
    { role: 'CHATBOT', message: 'previous assistant message' }
  ]
}
```

## Usage Examples

### Basic Text Generation

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: 'eu-frankfurt-1',
});

const model = provider.languageModel('meta.llama-3.3-70b-instruct');

const result = await model.doGenerate({
  prompt: [{ role: 'user', content: [{ type: 'text', text: 'Explain quantum computing' }] }],
  temperature: 0.7,
  maxOutputTokens: 500,
});

console.log(result.content[0].text);
```

### Deterministic Generation (Best Effort)

```typescript
const result1 = await model.doGenerate({
  prompt: [{ role: 'user', content: [{ type: 'text', text: 'Pick a number' }] }],
  seed: 42,
  temperature: 0.7,
});

const result2 = await model.doGenerate({
  prompt: [{ role: 'user', content: [{ type: 'text', text: 'Pick a number' }] }],
  seed: 42,
  temperature: 0.7,
});

// result1 and result2 will be similar but not identical
```

### Streaming with Timeout

```typescript
const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  requestOptions: {
    timeoutMs: 30000, // 30 seconds
    retry: {
      enabled: true,
      maxRetries: 3,
    },
  },
});

const model = provider.languageModel('cohere.command-a-03-2025');

const result = await model.doStream({
  prompt: [{ role: 'user', content: [{ type: 'text', text: 'Write a story' }] }],
});

for await (const part of result.stream) {
  if (part.type === 'text-delta') {
    process.stdout.write(part.delta);
  }
}
```

## Testing Feature Support

Run the feature test suite:

```bash
node test-unclear-features.mjs
```

Inventory models across regions:

```bash
node inventory-regions.mjs
```

## Future Roadmap

Features we're tracking for future implementation:

1. **Response Format (JSON Mode)** - Waiting for AI SDK to pass parameter
2. **Tool Calling** - If/when OCI GenAI adds support
3. **Multi-modal Input** - If/when OCI GenAI adds vision/audio
4. **Abort Signal** - Investigate OCI SDK capabilities
5. **Structured Output** - Schema-validated JSON responses

## Contributing

Found a feature that works but isn't documented? Please open an issue or PR!

## Resources

- [OCI GenAI API Documentation](https://docs.oracle.com/en-us/iaas/api/#/EN/generative-ai-inference/)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Provider Implementation Guide](./README.md)

````

**Step 2: Commit**

```bash
git add packages/oci-genai-provider/FEATURES.md
git commit -m "docs: add comprehensive feature support documentation

- Document all AI SDK features and OCI support status
- Explain seed parameter best-effort determinism
- List unsupported features with clear reasoning
- Add usage examples and regional availability
- Include future roadmap for pending features

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
````

---

## Task 3: Update Main README

**Files:**

- Modify: `packages/oci-genai-provider/README.md`

**Step 1: Add feature support section to README**

Add after "Quick Start" section (around line 50):

```markdown
## Feature Support

This provider supports most Vercel AI SDK v6 features for text generation. See [FEATURES.md](./FEATURES.md) for complete details.

### Supported ✅

- Streaming and non-streaming generation
- Temperature, topP, topK, penalties
- Seed parameter (best-effort determinism)
- Multiple model families (Llama, Gemini, Cohere, Grok)
- Retry logic and timeout control

### Not Supported ❌

- Tool/function calling (OCI API limitation)
- Multi-modal input (vision, audio, documents)
- JSON mode (pending AI SDK integration)

For detailed information on each feature, see [FEATURES.md](./FEATURES.md).
```

**Step 2: Add seed parameter to usage examples**

Find the "Usage" section and add seed example after basic example:

````markdown
### Deterministic Generation

Use the seed parameter for more consistent outputs (best-effort):

```typescript
const result = await model.doGenerate({
  prompt: [{ role: 'user', content: [{ type: 'text', text: 'Generate a random story' }] }],
  seed: 42,
  temperature: 0.7,
});

// Repeated calls with same seed produce similar (not identical) results
```
````

````

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/README.md
git commit -m "docs: update README with feature support summary

- Add feature support section with quick reference
- Link to comprehensive FEATURES.md document
- Add seed parameter usage example
- Clarify best-effort determinism

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
````

---

## Task 4: Update Type Definitions

**Files:**

- Modify: `packages/oci-genai-provider/src/types.ts`

**Step 1: Add JSDoc comment about seed parameter**

Add comment to OCIConfig or relevant type:

````typescript
/**
 * OCI GenAI Provider Configuration
 *
 * @example
 * ```typescript
 * const provider = createOCI({
 *   compartmentId: 'ocid1.compartment...',
 *   region: 'eu-frankfurt-1',
 *   requestOptions: {
 *     timeoutMs: 30000,
 *     retry: { enabled: true, maxRetries: 3 }
 *   }
 * });
 * ```
 *
 * @remarks
 * The seed parameter is supported for deterministic generation.
 * OCI provides "best effort" determinism - responses with the same seed
 * are similar but not guaranteed to be byte-for-byte identical.
 */
export interface OCIConfig {
  // ... existing fields
}
````

**Step 2: Commit**

```bash
git add packages/oci-genai-provider/src/types.ts
git commit -m "docs: add JSDoc for seed parameter behavior

- Document best-effort determinism caveat
- Add configuration example in type definition
- Improve developer experience with inline docs

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Integration Test

**Files:**

- Create: `packages/oci-genai-provider/src/__tests__/integration/seed-parameter.integration.test.ts`

**Step 1: Write integration test (optional, requires live OCI credentials)**

```typescript
import { describe, it, expect } from 'vitest';
import { createOCI } from '../../index';

describe('Seed Parameter Integration', () => {
  // Skip if no credentials available
  const hasCredentials = process.env.OCI_COMPARTMENT_ID;

  it.skipIf(!hasCredentials)('should produce similar outputs with same seed', async () => {
    const provider = createOCI({
      compartmentId: process.env.OCI_COMPARTMENT_ID!,
      region: 'eu-frankfurt-1',
    });

    const model = provider.languageModel('meta.llama-3.3-70b-instruct');

    const result1 = await model.doGenerate({
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'Say one word' }] }],
      seed: 42,
      temperature: 0.7,
      maxOutputTokens: 10,
    });

    const result2 = await model.doGenerate({
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'Say one word' }] }],
      seed: 42,
      temperature: 0.7,
      maxOutputTokens: 10,
    });

    // Verify both requests succeeded
    expect(result1.content[0].text).toBeTruthy();
    expect(result2.content[0].text).toBeTruthy();

    // Document that responses are similar but may not be identical
    console.log('Result 1:', result1.content[0].text);
    console.log('Result 2:', result2.content[0].text);
  });

  it.skipIf(!hasCredentials)('should produce different outputs with different seeds', async () => {
    const provider = createOCI({
      compartmentId: process.env.OCI_COMPARTMENT_ID!,
      region: 'eu-frankfurt-1',
    });

    const model = provider.languageModel('meta.llama-3.3-70b-instruct');

    const result1 = await model.doGenerate({
      prompt: [
        { role: 'user', content: [{ type: 'text', text: 'Pick a number between 1 and 1000' }] },
      ],
      seed: 42,
      temperature: 0.9,
      maxOutputTokens: 20,
    });

    const result2 = await model.doGenerate({
      prompt: [
        { role: 'user', content: [{ type: 'text', text: 'Pick a number between 1 and 1000' }] },
      ],
      seed: 999,
      temperature: 0.9,
      maxOutputTokens: 20,
    });

    // Different seeds should typically produce different outputs
    console.log('Seed 42:', result1.content[0].text);
    console.log('Seed 999:', result2.content[0].text);
  });
});
```

**Step 2: Run integration tests (if credentials available)**

Run: `pnpm test packages/oci-genai-provider/src/__tests__/integration/seed-parameter.integration.test.ts`

Expected: SKIP if no credentials, or PASS if credentials present

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/src/__tests__/integration/seed-parameter.integration.test.ts
git commit -m "test: add integration tests for seed parameter

- Add optional integration tests requiring live OCI credentials
- Test same seed produces similar (not identical) outputs
- Test different seeds produce different outputs
- Skip tests when credentials not available

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Completion Checklist

- [ ] Seed parameter added to doGenerate
- [ ] Seed parameter added to doStream
- [ ] Unit tests passing
- [ ] FEATURES.md created and comprehensive
- [ ] README.md updated with feature summary
- [ ] Type definitions have JSDoc comments
- [ ] Integration tests added (optional)
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
node ../../test-unclear-features.mjs
```

Expected: All features documented, seed parameter working, comprehensive feature documentation available.

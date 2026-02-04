# Vercel AI SDK v3 - Provider Interface Reference

Complete reference for implementing custom providers for the Vercel AI SDK v3 using the `LanguageModelV3` interface.

## Overview

The Vercel AI SDK v3 provides a standardized interface (`LanguageModelV3`) for integrating custom language model providers. This enables applications to use different LLM services through a unified API.

**Key Features:**

- Unified provider API across all models
- Streaming support with async iterators
- Function/tool calling integration
- Framework-agnostic design
- TypeScript-first with full type safety

**Sources:**

- [AI SDK Documentation](https://ai-sdk.dev)
- [Vercel AI Repository](https://github.com/vercel/ai)
- [Custom Providers Guide](https://ai-sdk.dev/providers/community-providers/custom-providers)

---

## Core Interfaces

### LanguageModelV3

The primary interface that all language model implementations must implement.

```typescript
interface LanguageModelV3 {
  /**
   * Specification version identifier
   */
  readonly specificationVersion: 'V3';

  /**
   * Provider identifier (e.g., 'oci-genai', 'openai')
   */
  readonly provider: string;

  /**
   * Model identifier (e.g., 'cohere.command-r-plus')
   */
  readonly modelId: string;

  /**
   * URL patterns the provider can handle natively for file parts
   * Maps MIME type patterns to regex patterns
   */
  readonly supportedUrls: Record<string, RegExp[]>;

  /**
   * Generate text without streaming
   */
  doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult>;

  /**
   * Generate text with streaming
   */
  doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult>;
}
```

---

## LanguageModelV3CallOptions

Options passed to `doGenerate` and `doStream` methods.

```typescript
interface LanguageModelV3CallOptions {
  /**
   * Standardized prompt with messages
   */
  prompt: LanguageModelV3Prompt;

  /**
   * Maximum number of tokens to generate
   */
  maxOutputTokens?: number;

  /**
   * Temperature for sampling (0-1)
   */
  temperature?: number;

  /**
   * Top-p sampling parameter
   */
  topP?: number;

  /**
   * Top-k sampling parameter
   */
  topK?: number;

  /**
   * Frequency penalty
   */
  frequencyPenalty?: number;

  /**
   * Presence penalty
   */
  presencePenalty?: number;

  /**
   * Stop sequences
   */
  stopSequences?: string[];

  /**
   * Tools/functions available for the model to call
   */
  tools?: LanguageModelV3Tool[];

  /**
   * Tool choice strategy
   */
  toolChoice?: LanguageModelV3ToolChoice;

  /**
   * Provider-specific options
   */
  providerOptions?: Record<string, unknown>;

  /**
   * Abort signal for cancellation
   */
  abortSignal?: AbortSignal;

  /**
   * Request headers
   */
  headers?: Record<string, string>;
}
```

---

## LanguageModelV3Prompt

Standardized prompt format with messages and content parts.

```typescript
interface LanguageModelV3Prompt {
  /**
   * Array of messages
   */
  messages: LanguageModelV3Message[];
}

interface LanguageModelV3Message {
  /**
   * Message role
   */
  role: 'system' | 'user' | 'assistant' | 'tool';

  /**
   * Message content parts
   */
  content: LanguageModelV3ContentPart[];
}

type LanguageModelV3ContentPart =
  | LanguageModelV3TextPart
  | LanguageModelV3FilePart
  | LanguageModelV3ReasoningPart
  | LanguageModelV3ToolCallPart
  | LanguageModelV3ToolResultPart;

interface LanguageModelV3TextPart {
  type: 'text';
  text: string;
}

interface LanguageModelV3FilePart {
  type: 'file';
  data: Uint8Array | URL;
  mimeType: string;
}

interface LanguageModelV3ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: unknown; // Parsed JSON
}

interface LanguageModelV3ToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  result: unknown;
}
```

---

## Tool/Function Calling

### LanguageModelV3FunctionTool

User-defined function tools with JSON Schema validation.

```typescript
interface LanguageModelV3FunctionTool {
  /**
   * Tool type identifier
   */
  type: 'function';

  /**
   * Unique tool name
   */
  name: string;

  /**
   * Human-readable description of what the tool does
   */
  description?: string;

  /**
   * JSON Schema for function parameters
   */
  parameters: JSONSchema7;
}
```

**Example:**

```typescript
const weatherTool: LanguageModelV3FunctionTool = {
  type: 'function',
  name: 'get_weather',
  description: 'Get the current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city and state, e.g., San Francisco, CA',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature unit',
      },
    },
    required: ['location'],
  },
};
```

### LanguageModelV3ToolChoice

Controls how the model selects tools.

```typescript
type LanguageModelV3ToolChoice =
  | { type: 'auto' } // Model decides
  | { type: 'none' } // No tool calling
  | { type: 'required' } // Must call a tool
  | { type: 'function'; name: string }; // Call specific function
```

---

## Non-Streaming Response (doGenerate)

### LanguageModelV3GenerateResult

Result returned from `doGenerate`.

```typescript
interface LanguageModelV3GenerateResult {
  /**
   * Generated content (text and/or tool calls)
   */
  content: LanguageModelV3Content[];

  /**
   * Reason for completion
   */
  finishReason: LanguageModelV3FinishReason;

  /**
   * Token usage statistics
   */
  usage: LanguageModelV3Usage;

  /**
   * Original request (for debugging)
   */
  request: { body: unknown };

  /**
   * Raw response (for debugging)
   */
  response: { body: unknown };

  /**
   * Warnings from provider
   */
  warnings?: SharedV3Warning[];

  /**
   * Provider-specific metadata
   */
  providerMetadata?: SharedV2ProviderMetadata;
}

type LanguageModelV3Content =
  | { type: 'text'; text: string }
  | {
      type: 'tool-call';
      toolCallType: 'function';
      toolCallId: string;
      toolName: string;
      args: string; // JSON string
    };

type LanguageModelV3FinishReason =
  | 'stop' // Natural completion
  | 'length' // Max tokens reached
  | 'content-filter' // Content filtered
  | 'tool-calls' // Tool calling
  | 'error' // Error occurred
  | 'other' // Other/unknown
  | 'unknown'; // Unknown reason
```

### LanguageModelV3Usage

Token usage information.

```typescript
interface LanguageModelV3Usage {
  /**
   * Number of input tokens
   */
  inputTokens: number;

  /**
   * Number of output tokens
   */
  outputTokens: number;

  /**
   * Total tokens (input + output)
   */
  totalTokens: number;
}
```

---

## Streaming Response (doStream)

### LanguageModelV3StreamResult

Result returned from `doStream`.

```typescript
interface LanguageModelV3StreamResult {
  /**
   * Readable stream of typed parts
   */
  stream: ReadableStream<LanguageModelV3StreamPart>;

  /**
   * Warnings from provider
   */
  warnings?: SharedV3Warning[];
}
```

### LanguageModelV3StreamPart

Typed stream events with lifecycle patterns.

```typescript
type LanguageModelV3StreamPart =
  // Stream lifecycle
  | { type: 'stream-start'; warnings: SharedV3Warning[] }
  | {
      type: 'finish';
      usage: LanguageModelV3Usage;
      finishReason: LanguageModelV3FinishReason;
      providerMetadata?: SharedV2ProviderMetadata;
    }
  | { type: 'error'; error: Error }

  // Text streaming (start/delta/end pattern)
  | {
      type: 'text-start';
      id: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }
  | {
      type: 'text-delta';
      id: string;
      delta: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }
  | {
      type: 'text-end';
      id: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }

  // Reasoning streaming (for o1/o3 models)
  | {
      type: 'reasoning-start';
      id: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }
  | {
      type: 'reasoning-delta';
      id: string;
      delta: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }
  | {
      type: 'reasoning-end';
      id: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }

  // Tool input streaming
  | {
      type: 'tool-input-start';
      id: string;
      toolName: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }
  | {
      type: 'tool-input-delta';
      id: string;
      delta: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }
  | {
      type: 'tool-input-end';
      id: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }

  // Completed tool call
  | {
      type: 'tool-call';
      toolCallId: string;
      toolName: string;
      input: string; // Complete JSON string
      providerMetadata?: SharedV2ProviderMetadata;
    }

  // Legacy delta format (deprecated)
  | {
      type: 'tool-call-delta';
      toolCallId: string;
      toolName: string;
      argsTextDelta: string;
    };
```

---

## Implementation Pattern

### Basic Provider Structure

```typescript
import {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamResult,
} from '@ai-sdk/provider';
import { postJsonToApi } from '@ai-sdk/provider-utils';

export class CustomLanguageModel implements LanguageModelV3 {
  readonly specificationVersion = 'V3';
  readonly provider: string;
  readonly modelId: string;

  constructor(
    modelId: string,
    private config: {
      baseURL: string;
      headers: () => Record<string, string>;
    }
  ) {
    this.provider = 'custom-provider';
    this.modelId = modelId;
  }

  get supportedUrls() {
    return {
      // Example: Support image URLs from specific domain
      'image/*': [/^https:\/\/cdn\.example\.com\/.*/],
    };
  }

  async doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult> {
    // 1. Convert AI SDK prompt to provider format
    const { args, warnings } = this.prepareRequest(options);

    // 2. Make API call
    const response = await postJsonToApi({
      url: `${this.config.baseURL}/chat/completions`,
      headers: this.config.headers(),
      body: args,
      abortSignal: options.abortSignal,
    });

    // 3. Convert provider response to AI SDK format
    return this.processResponse(response, args, warnings);
  }

  async doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
    // 1. Convert AI SDK prompt to provider format
    const { args, warnings } = this.prepareRequest(options);

    // 2. Make streaming API call
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        ...this.config.headers(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...args, stream: true }),
      signal: options.abortSignal,
    });

    // 3. Transform stream to AI SDK format
    const stream = response
      .body!.pipeThrough(new TextDecoderStream())
      .pipeThrough(this.createSSEParser())
      .pipeThrough(this.createStreamTransformer(warnings));

    return { stream, warnings };
  }

  private prepareRequest(options: LanguageModelV3CallOptions) {
    const warnings: SharedV3Warning[] = [];

    // Convert messages
    const messages = this.convertMessages(options.prompt.messages);

    // Convert tools
    const tools = options.tools ? this.convertTools(options.tools) : undefined;

    const args = {
      model: this.modelId,
      messages,
      max_tokens: options.maxOutputTokens,
      temperature: options.temperature,
      top_p: options.topP,
      stop: options.stopSequences,
      tools,
    };

    return { args, warnings };
  }

  private processResponse(
    response: any,
    request: any,
    warnings: SharedV3Warning[]
  ): LanguageModelV3GenerateResult {
    const content: LanguageModelV3Content[] = [];

    // Extract text
    if (response.choices[0].message.content) {
      content.push({
        type: 'text',
        text: response.choices[0].message.content,
      });
    }

    // Extract tool calls
    if (response.choices[0].message.tool_calls) {
      for (const toolCall of response.choices[0].message.tool_calls) {
        content.push({
          type: 'tool-call',
          toolCallType: 'function',
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          args: toolCall.function.arguments,
        });
      }
    }

    return {
      content,
      finishReason: this.mapFinishReason(response.choices[0].finish_reason),
      usage: {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      request: { body: request },
      response: { body: response },
      warnings,
    };
  }

  private createStreamTransformer(warnings: SharedV3Warning[]) {
    let isFirstChunk = true;

    return new TransformStream<any, LanguageModelV3StreamPart>({
      async transform(chunk, controller) {
        // Send warnings with first chunk
        if (isFirstChunk) {
          controller.enqueue({ type: 'stream-start', warnings });
          isFirstChunk = false;
        }

        // Handle text delta
        if (chunk.choices?.[0]?.delta?.content) {
          controller.enqueue({
            type: 'text-delta',
            id: 'text-0',
            delta: chunk.choices[0].delta.content,
          });
        }

        // Handle tool call delta
        if (chunk.choices?.[0]?.delta?.tool_calls) {
          for (const toolCall of chunk.choices[0].delta.tool_calls) {
            controller.enqueue({
              type: 'tool-call-delta',
              toolCallId: toolCall.id,
              toolName: toolCall.function.name,
              argsTextDelta: toolCall.function.arguments,
            });
          }
        }

        // Handle finish
        if (chunk.choices?.[0]?.finish_reason) {
          controller.enqueue({
            type: 'finish',
            finishReason: this.mapFinishReason(chunk.choices[0].finish_reason),
            usage: {
              inputTokens: chunk.usage?.prompt_tokens || 0,
              outputTokens: chunk.usage?.completion_tokens || 0,
              totalTokens: chunk.usage?.total_tokens || 0,
            },
          });
        }
      },
    });
  }

  private mapFinishReason(reason: string): LanguageModelV3FinishReason {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'tool_calls':
        return 'tool-calls';
      case 'content_filter':
        return 'content-filter';
      default:
        return 'unknown';
    }
  }
}
```

---

## Provider Factory Pattern

```typescript
import { ProviderV3 } from '@ai-sdk/provider';

export interface CustomProviderSettings {
  baseURL?: string;
  apiKey?: string;
}

export function createCustom(settings: CustomProviderSettings = {}): ProviderV3 {
  const config = {
    baseURL: settings.baseURL ?? 'https://api.example.com',
    headers: () => ({
      Authorization: `Bearer ${settings.apiKey ?? process.env.CUSTOM_API_KEY}`,
    }),
  };

  return {
    languageModel(modelId: string) {
      return new CustomLanguageModel(modelId, config);
    },

    // Optional: Embedding model support
    embeddingModel(modelId: string) {
      return new CustomEmbeddingModel(modelId, config);
    },

    // Optional: Image model support
    imageModel(modelId: string) {
      return new CustomImageModel(modelId, config);
    },
  };
}

// Usage
const provider = createCustom({ apiKey: 'sk-...' });
const model = provider.languageModel('custom-model-name');
```

---

## Error Handling

```typescript
import { NoSuchToolError, InvalidToolInputError } from '@ai-sdk/provider';

try {
  const result = await generateText({
    model,
    prompt: 'Hello',
  });
} catch (error) {
  if (NoSuchToolError.isInstance(error)) {
    // Handle missing tool error
    console.error('Tool not found:', error.toolName);
  } else if (InvalidToolInputError.isInstance(error)) {
    // Handle invalid tool input
    console.error('Invalid tool input:', error.toolInput);
  } else {
    // Handle other errors
    console.error('Generation error:', error);
  }
}
```

---

## Reference Implementations

The AI SDK provides several reference implementations:

- **OpenAI Provider**: Comprehensive example with all features
- **Cohere Provider**: Streaming and tool calling patterns
- **Mistral Provider**: Simpler implementation reference

**Repository**: [vercel/ai](https://github.com/vercel/ai)

---

## Next Steps

- **[OCI Provider Implementation](../provider-api/)** - Our OCI-specific provider
- **[Streaming Guide](../../guides/streaming/)** - Implementing SSE streaming
- **[Tool Calling Guide](../../guides/tool-calling/)** - Function integration
- **[Architecture](../../architecture/)** - Provider architecture details

---

**Sources:**

- [AI SDK Documentation](https://ai-sdk.dev/providers/community-providers/custom-providers)
- [Vercel AI Repository](https://github.com/vercel/ai) via DeepWiki
- Context7 Library Query Results (2026-01-26)
- [AI SDK Migration Guide v5.0](https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0)

**Last Updated**: 2026-01-26
**AI SDK Version**: v3 (v5.0+)

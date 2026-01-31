# Core Provider API & Module Structure

## Public API (src/index.ts)

### Factory Function

```typescript
function createOCI(config?: OCIConfig): OCIProvider

// Returns:
{
  provider: 'oci-genai',
  model: (modelId: string) => LanguageModelV3
}
```

### Convenience Function

```typescript
function oci(modelId: string, config?: OCIConfig): LanguageModelV3;

// Equivalent to:
const provider = createOCI(config);
return provider.model(modelId);
```

### Exports

```typescript
// Factory functions
export { createOCI, oci };

// Types
export type { OCIConfig, OCIProvider, ModelMetadata };

// Utility functions
export {
  isValidModelId,
  getModelMetadata,
  getAllModels,
  getModelsByFamily,
} from './models/registry';
```

## Module Structure

### src/types.ts

**Purpose**: Core type definitions

```typescript
interface OCIConfig {
  region?: string; // OCI region (eu-frankfurt-1, etc.)
  compartmentId?: string; // OCI compartment OCID
  profile?: string; // OCI config profile name
  auth?: 'config_file' | 'instance_principal' | 'resource_principal';
  configFile?: string; // Path to OCI config file
  endpoint?: string; // Custom endpoint URL
}

interface ModelMetadata {
  id: string; // Model ID (e.g., 'cohere.command-r-plus')
  name: string; // Display name
  family: 'grok' | 'llama' | 'cohere' | 'gemini' | 'openai';
  capabilities: {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
  };
  contextWindow: number; // Max tokens
  speed: 'very-fast' | 'fast' | 'medium' | 'slow';
}

interface OCIProvider {
  provider: 'oci-genai';
  model: (modelId: string) => LanguageModelV3;
}
```

### src/auth/index.ts

**Purpose**: Authentication provider creation

```typescript
async function createAuthProvider(config: OCIConfig): Promise<AuthProvider>;

function getRegion(config: OCIConfig): string;
function getCompartmentId(config: OCIConfig): string;
```

**Authentication Methods**:

1. **Config File** (default): Reads from ~/.oci/config
2. **Instance Principal**: For OCI Compute instances
3. **Resource Principal**: For OCI Functions

**Configuration Cascade**:

1. Explicit config parameter (highest priority)
2. Environment variables (OCI_REGION, OCI_COMPARTMENT_ID, etc.)
3. Defaults (eu-frankfurt-1, DEFAULT profile)

### src/models/registry.ts

**Purpose**: Model catalog and validation

```typescript
const MODEL_CATALOG: ModelMetadata[] = [
  // 16+ models from Grok, Llama, Cohere, Gemini
];

function isValidModelId(modelId: string): boolean;
function getModelMetadata(modelId: string): ModelMetadata | undefined;
function getAllModels(): ModelMetadata[];
function getModelsByFamily(family: ModelFamily): ModelMetadata[];
```

**Supported Models**:

- **Grok**: xai.grok-4, xai.grok-4-fast-reasoning, xai.grok-4-fast-non-reasoning, xai.grok-4-1-fast-reasoning, xai.grok-4-1-fast-non-reasoning, xai.grok-code-fast-1, xai.grok-3, xai.grok-3-fast, xai.grok-3-mini, xai.grok-3-mini-fast
- **Llama**: meta.llama-4-maverick-17b-128e-instruct-fp8, meta.llama-4-scout-17b-16e-instruct, meta.llama-3.3-70b-instruct, meta.llama-3.2-90b-vision-instruct, meta.llama-3.2-11b-vision-instruct, meta.llama-3.1-405b-instruct, meta.llama-3.1-70b-instruct
- **Cohere**: cohere.command-a-03-2025, cohere.command-a-reasoning, cohere.command-a-vision, cohere.command-plus-latest, cohere.command-latest, cohere.command-r-plus-08-2024, cohere.command-r-08-2024, cohere.command-r-plus, cohere.command-r-16k
- **Gemini**: google.gemini-2.5-pro, google.gemini-2.5-flash, google.gemini-2.5-flash-lite
- **OpenAI**: openai.gpt-oss-120b, openai.gpt-oss-20b

**Registry Notes**:

- Model IDs are verified against OCI CLI outputs.
- Grok models are currently listed only in `us-chicago-1` and `us-ashburn-1`.

### src/models/oci-language-model.ts

**Purpose**: LanguageModelV3 implementation

```typescript
class OCILanguageModel implements LanguageModelV3 {
  readonly specificationVersion = 'v3';
  readonly provider = 'oci-genai';
  readonly defaultObjectGenerationMode = 'tool';

  constructor(modelId: string, config: OCIConfig);

  async doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult>;
  async doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult>;
}
```

**doGenerate Flow**:

1. Convert AI SDK messages → OCI format
2. Create authenticated OCI client
3. Call OCI chat API (isStream: false)
4. Parse response (text, finishReason, usage)
5. Return LanguageModelV3GenerateResult

**doStream Flow**:

1. Convert AI SDK messages → OCI format
2. Create authenticated OCI client
3. Call OCI chat API (isStream: true)
4. Parse SSE stream → async generator
5. Convert to LanguageModelV3StreamPart format
6. Return ReadableStream

### src/converters/messages.ts

**Purpose**: AI SDK ↔ OCI message format conversion

```typescript
interface OCIMessage {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: Array<{ type: 'TEXT'; text: string }>;
}

function convertToOCIMessages(prompt: LanguageModelV1Prompt): OCIMessage[];
```

**Role Mapping**:

- `user` → `USER`
- `assistant` → `ASSISTANT`
- `system` → `SYSTEM`

**Content Handling**:

- String content → [{ type: 'TEXT', text: string }]
- Array content → filter text parts only (ignore images for now)

### src/streaming/sse-parser.ts

**Purpose**: Server-Sent Events parsing

```typescript
import type { LanguageModelV3FinishReason } from '@ai-sdk/provider';

function mapFinishReason(reason: string): LanguageModelV3FinishReason
// Returns: { unified: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other', raw: string }

async function* parseSSEStream(response: Response): AsyncGenerator<StreamPart>
```

**Stream Part Types**:

```typescript
type TextDeltaPart = {
  type: 'text-delta';
  textDelta: string;
};

type FinishPart = {
  type: 'finish';
  finishReason: LanguageModelV3FinishReason; // { unified, raw } object
  usage: { promptTokens: number; completionTokens: number };
};

type StreamPart = TextDeltaPart | FinishPart;
```

**Using eventsource-parser**:

- Parses OCI SSE format
- Extracts text deltas from chatChoice
- Detects finish events with usage stats
- Handles [DONE] marker and errors

### src/errors/index.ts

**Purpose**: Error handling and retry logic

```typescript
class OCIGenAIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  )
}

function isRetryableError(statusCode: number): boolean
function handleOCIError(error: unknown): OCIGenAIError
```

**Error Context**:

- 401 → "Check OCI authentication configuration."
- 403 → "Check IAM policies and compartment access."
- 404 → "Check model ID and regional availability."
- 429 → "Rate limit exceeded. Implement retry with backoff."

**Retryable Errors**:

- 429 (Rate Limiting)
- 500+ (Server Errors)

**Non-Retryable Errors**:

- 400 (Bad Request)
- 401 (Unauthorized)
- 403 (Forbidden)
- 404 (Not Found)

## Usage Examples

### Basic Text Generation

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const result = await generateText({
  model: oci('cohere.command-r-plus', {
    region: 'eu-frankfurt-1',
    compartmentId: process.env.OCI_COMPARTMENT_ID,
  }),
  prompt: 'Explain quantum computing',
});

console.log(result.text);
```

### Streaming

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const result = await streamText({
  model: oci('xai.grok-4'),
  prompt: 'Write a story about AI',
});

for await (const delta of result.textStream) {
  process.stdout.write(delta);
}
```

### With Environment Variables

```typescript
// Set OCI_REGION, OCI_COMPARTMENT_ID in .env

import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

// Uses environment variables automatically
const result = await generateText({
  model: oci('meta.llama-3.3-70b-instruct'),
  prompt: 'Hello!',
});
```

### Factory Pattern

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const oci = createOCI({
  region: 'eu-frankfurt-1',
  profile: 'PRODUCTION',
});

// Reuse provider for multiple models
const cohereModel = oci.model('cohere.command-r-plus');
const grokModel = oci.model('xai.grok-4');
```

## Related Documentation

- Type Definitions: `packages/oci-genai-provider/src/types.ts`
- README: `packages/oci-genai-provider/README.md`
- Testing Guide: `docs/testing/README.md`
- Architecture: `docs/architecture/README.md`

# OCI GenAI Provider for OpenCode - Complete Requirements Specification

**Date:** 2026-01-26
**Author:** Requirements Discovery Session
**Status:** Ready for Implementation
**Target:** OpenCode AI SDK v6 Provider

---

## Executive Summary

This document specifies the complete requirements for building an OCI (Oracle Cloud Infrastructure) Generative AI provider for OpenCode, implementing the Vercel AI SDK v6 LanguageModelV3 interface. The provider will enable OpenCode users to access OCI's GenAI models (Grok, Llama, Cohere, Gemini) with full streaming, tool calling, and authentication support.

**Key Decision:** Use **native OCI SDK** (not OpenAI-compatible wrapper) for maximum model access and feature support.

---

## 1. Architecture Overview

### 1.1 Provider Pattern

```
OpenCode → AI SDK v6 → OCI GenAI Provider → OCI TypeScript SDK → OCI GenAI API
```

**Components:**

1. **Provider Factory** (`createOCIGenAI`) - Initializes provider with auth
2. **Chat Model** (`OCIGenAIChatModel`) - Implements LanguageModelV3
3. **Authentication Layer** - Cascading auth (config → instance → resource principal)
4. **Stream Parser** - Converts SSE to async iterables
5. **Tool Converter** - Bidirectional AI SDK ↔ OCI format conversion

### 1.2 Technology Stack

**Runtime:**

- Node.js 20+ (OpenCode uses Bun, but provider runs in Node context)
- TypeScript 5.9+
- Package manager: pnpm

**Core Dependencies:**

```json
{
  "@ai-sdk/provider": "^3.0.2",
  "@ai-sdk/provider-utils": "^3.0.0",
  "oci-common": "^2.122.2",
  "oci-generativeaiinference": "^2.122.2",
  "eventsource-parser": "^3.0.0",
  "zod": "^4.3.6"
}
```

**Peer Dependencies:**

```json
{
  "ai": "^6.0.0"
}
```

---

## 2. OCI GenAI Service Capabilities

### 2.1 Available Models (as of Jan 2026)

**xAI Grok Models:**

- `xai.grok-4` - Latest flagship
- `xai.grok-4-fast-reasoning` - Optimized variant
- `xai.grok-3` (70B) - Previous generation
- `xai.grok-3-mini` - Lightweight

**Meta Llama Models:**

- `meta.llama-3.3-70b-instruct` - **Supports fine-tuning**
- `meta.llama-3.2-90b-vision-instruct` - Vision capable
- `meta.llama-3.2-11b-vision-instruct` - Smaller vision model
- `meta.llama-3.1-405b-instruct` - Largest context
- `meta.llama-3-70b-instruct` - Production stable

**Cohere Command Models:**

- `cohere.command-a-reasoning` - Reasoning optimized
- `cohere.command-a-vision` - Vision capable
- `cohere.command-a-03-2025` - General purpose
- `cohere.command-r-08-2024` - Latest R series
- `cohere.command-r-plus-08-2024` - Extended capabilities

**Google Gemini Models:**

- `google.gemini-2.5-pro` - Flagship
- `google.gemini-2.5-flash` - Fast inference
- `google.gemini-2.5-flash-lite` - Lightweight

**OpenAI gpt-oss Models:**

- Reasoning and agentic task optimized

### 2.2 Deployment Modes

**On-Demand Serving:**

- **Infrastructure**: Shared multi-tenant
- **Pricing**: Pay-per-transaction (tokens)
- **Availability**: Instant access
- **Use Cases**: Experimentation, variable workloads, most users
- **Limitations**: Subject to dynamic throttling

**Dedicated AI Clusters:**

- **Infrastructure**: Isolated single-tenant compute
- **Pricing**: Per unit-hour
- **Availability**: Requires cluster provisioning
- **Use Cases**: Fine-tuning, production, guaranteed capacity
- **Benefits**: No throttling, persistent custom models
- **Required for**: Fine-tuning custom models, hosting imported models

**Important (2026):** All on-demand text generation/summarization API models have been retired. Use the chat API instead.

**Provider Implications:**

- Support both modes via `servingMode.servingType`
- On-demand: just `modelId`
- Dedicated: requires `modelId` + `endpointId`

### 2.3 API Capabilities

- ✅ Chat Completions API
- ✅ Streaming (Server-Sent Events)
- ✅ Tool/Function Calling (via GenAI Agents platform)
- ✅ Embeddings API (384-dim light, 1024-dim standard)
- ❌ Vision API (handled via multimodal chat)

### 2.4 Regional Availability

**Available Regions (10 total):**

- US Midwest (Chicago) - `us-chicago-1`
- US East (Ashburn) - `us-ashburn-1`
- US West (Phoenix) - `us-phoenix-1`
- UK South (London) - `uk-london-1`
- Germany Central (Frankfurt) - `eu-frankfurt-1`
- EU Sovereign Central (Frankfurt) - `eu-frankfurt-2`
- UAE East (Dubai) - `me-dubai-1`
- Saudi Arabia Central (Riyadh) - `me-jeddah-1`
- Japan Central (Osaka) - `ap-osaka-1`
- India South (Hyderabad) - `ap-hyderabad-1`
- Brazil East (Sao Paulo) - `sa-saopaulo-1`

**Endpoint Format:**

```
https://inference.generativeai.{region}.oci.oraclecloud.com
```

**Note:** Different regions for EU sovereign cloud use `.oci.oraclecloud.eu` domain.

**Model Availability Across Regions:**

- ✅ **All pretrained models available in ALL regions** (as of Jan 2026)
- Llama 3.3 70B, Llama 3.2 Vision (90B/11B), Grok models, Cohere, Gemini - no region restrictions
- **No model-to-region mapping needed** in provider implementation
- Exception: Dedicated AI clusters are region-specific infrastructure resources

**Provider Simplification:**

- User can use any model in their configured region
- No need for model availability lookup tables
- Region only affects endpoint URL, not model access

---

## 3. Authentication Requirements

### 3.1 Authentication Methods (Priority Order)

**1. Config File Authentication** (Recommended for dev)

- Location: `~/.oci/config`
- Profile: `DEFAULT` or custom
- Implementation: `ConfigFileAuthenticationDetailsProvider`

**Config File Format:**

```ini
[DEFAULT]
user=ocid1.user.oc1..<unique_id>
fingerprint=<key_fingerprint>
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..<unique_id>
region=us-ashburn-1
```

**TypeScript Implementation:**

```typescript
import common = require('oci-common');

const provider = new common.ConfigFileAuthenticationDetailsProvider(
  '~/.oci/config', // optional, defaults to ~/.oci/config
  'DEFAULT' // optional, defaults to DEFAULT
);
```

**2. Instance Principal Authentication** (For OCI Compute)

- Auto-detected when running on OCI instances
- Uses instance metadata service
- No configuration required

**3. Resource Principal Authentication** (For OCI Functions)

- Auto-detected when `OCI_RESOURCE_PRINCIPAL_VERSION` env var set
- Uses resource metadata
- No configuration required

**4. IDCS OAuth (Future Enhancement)**

- Browser-based SSO flow
- Session token management
- Requires IDCS domain, client ID, tenancy

### 3.2 IAM Policy Requirements

**Minimum Required Policies:**

```hcl
# Allow GenAI inference
Allow group <YOUR_GROUP> to use generative-ai-family in compartment <COMPARTMENT>

# Allow reading compartment metadata
Allow group <YOUR_GROUP> to read compartments in compartment <COMPARTMENT>
```

**Optional for Dedicated Endpoints:**

```hcl
Allow group <YOUR_GROUP> to manage generative-ai-dedicated-ai-cluster in compartment <COMPARTMENT>
Allow group <YOUR_GROUP> to manage generative-ai-endpoint in compartment <COMPARTMENT>
```

---

## 4. AI SDK v3 Interface Implementation

### 4.1 LanguageModelV3 Interface

The provider must implement this interface from `@ai-sdk/provider`:

```typescript
interface LanguageModelV3 {
  // Required properties
  readonly specificationVersion: 'v3';
  readonly provider: string;
  readonly modelId: string;
  readonly supportedUrls: Record<string, RegExp[]>;

  // Required methods
  doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult>;
  doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult>;
}
```

### 4.2 Provider Factory Pattern

**Function Signature:**

```typescript
export function createOCIGenAI(settings: OCIGenAISettings): Promise<OCIGenAIProvider>;

interface OCIGenAIProvider {
  // Creates a chat model instance
  chat(modelId: string, settings?: ModelSettings): LanguageModelV3;

  // Provider metadata
  readonly provider: string;
  readonly defaultModel?: string;
}
```

**Settings Interface:**

```typescript
interface OCIGenAISettings {
  // Required
  compartmentId: string;

  // Authentication (one of)
  configProfile?: string; // Default: "DEFAULT"
  configFile?: string; // Default: "~/.oci/config"

  // Optional overrides
  region?: string; // Auto-detected from config

  // Future: OAuth
  idcs?: {
    domain: string;
    clientId: string;
    tenancy: string;
    region?: string;
  };
}
```

### 4.3 Message Format Mapping

**AI SDK V3 → OCI GenAI:**

| AI SDK Role | OCI Role       | Content Types               |
| ----------- | -------------- | --------------------------- |
| `system`    | System message | Text only                   |
| `user`      | `USER`         | Text, files (vision models) |
| `assistant` | `ASSISTANT`    | Text, tool calls            |
| `tool`      | Tool result    | JSON                        |

**Content Conversion:**

```typescript
// AI SDK V3 format
type LanguageModelV3Prompt = Array<{
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: Array<{
    type: 'text' | 'file' | 'tool-call' | 'tool-result';
    text?: string;
    data?: Uint8Array;
    mimeType?: string;
    toolCallId?: string;
    toolName?: string;
    args?: unknown;
  }>;
}>;

// OCI GenAI format (Generic API)
interface Message {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: Array<{
    type: 'TEXT' | 'IMAGE';
    text?: string;
    imageUrl?: string; // Base64 data URL
  }>;
}
```

### 4.4 Tool Calling Support

**AI SDK V3 Tool Format:**

```typescript
interface LanguageModelV3FunctionTool {
  type: 'function';
  name: string;
  description?: string;
  parameters: JSONSchema;
}
```

**OCI GenAI Tool Format (JSON Schema):**

OCI GenAI Agents platform (March 2025) uses standard JSON Schema for tool definitions:

```typescript
interface OCIFunctionTool {
  name: string; // Function name
  description: string; // What the function does
  parameters: {
    type: 'object';
    properties: {
      [key: string]: {
        type: string; // "string", "number", "boolean", etc.
        description: string; // Parameter description
        enum?: string[]; // Optional allowed values
      };
    };
    required: string[]; // Required parameter names
    additionalProperties: false;
  };
}
```

**Naming Rules:**

- Must start with letter or underscore
- Can contain: letters, numbers, hyphens, underscores
- Length: 1-255 characters

**Tool Types Supported:**

1. **Function Calling Tools** - Custom user-defined functions (use this)
2. **API Endpoint Calling Tools** - OpenAPI schema-based (advanced)

**Conversion Strategy:**
Since both AI SDK and OCI use JSON Schema, conversion is **straightforward**:

- ✅ AI SDK `parameters` → OCI `parameters` (1:1 mapping)
- ✅ AI SDK `name` → OCI `name` (validate naming rules)
- ✅ AI SDK `description` → OCI `description`
- ⚠️ Minimal transformation needed

**Tool Call Response Mapping:**

```typescript
// AI SDK expects
{
  type: 'tool-call',
  toolCallId: string,
  toolName: string,
  args: Record<string, unknown>
}

// OCI returns (to be mapped)
{
  toolName: string,
  parameters: Record<string, unknown>
}
```

**Tool Call Output Format:**

- Must be JSON string
- ADK (Agent Development Kit) auto-generates schema

---

## 5. OCI TypeScript SDK Integration

### 5.1 Chat API Request Structure

**Request Interface:**

```typescript
import { GenerativeAiInferenceClient, requests, models } from 'oci-generativeaiinference';

const chatRequest: requests.ChatRequest = {
  chatDetails: {
    compartmentId: "ocid1.compartment.oc1...",
    servingMode: {
      servingType: "ON_DEMAND",  // or "DEDICATED"
      modelId: "meta.llama-3.3-70b-instruct"
    },
    chatRequest: {
      // For Generic API (Llama, Grok, Gemini)
      apiFormat: "GENERIC",
      messages: [
        {
          role: "USER",
          content: [{ type: "TEXT", text: "Hello!" }]
        }
      ],
      maxTokens: 600,
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
      isStream: false,  // or true for streaming

      // Tool support (if applicable)
      tools: [...],  // Function calling tools
    }
  },
  opcRequestId: "optional-trace-id",
  opcRetryToken: "optional-idempotency-token"
};
```

**API Format Selection:**

- `"COHERE"` - For Cohere Command models
- `"GENERIC"` - For all other models (Llama, Grok, Gemini, OpenAI)

### 5.2 Response Structure

**Non-Streaming Response:**

```typescript
interface ChatResult {
  chatResponse: {
    choices: Array<{
      message: {
        role: 'ASSISTANT';
        content: Array<{
          type: 'TEXT';
          text: string;
        }>;
      };
      finishReason: 'STOP' | 'LENGTH' | 'CONTENT_FILTER';
      index: number;
    }>;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    modelId: string;
    modelVersion: string;
  };
}
```

**Streaming Response:**

When `isStream: true`, OCI returns Server-Sent Events (SSE):

```
event: message
data: {"choices":[{"delta":{"content":[{"type":"TEXT","text":"Hello"}]},"index":0}]}

event: message
data: {"choices":[{"delta":{"content":[{"type":"TEXT","text":" there"}]},"index":0}]}

event: message
data: {"choices":[{"finishReason":"STOP","index":0}],"usage":{"promptTokens":10,"completionTokens":5}}
```

**Parsing Strategy:**
Use `eventsource-parser` to parse SSE stream:

```typescript
import { createParser } from 'eventsource-parser';

const parser = createParser((event) => {
  if (event.type === 'event') {
    const data = JSON.parse(event.data);
    // Yield AI SDK stream parts
  }
});

// Feed chunks to parser
for await (const chunk of streamResponse) {
  parser.feed(chunk);
}
```

### 5.3 Vision/Multimodal Support

**Supported Vision Models:**

- `cohere.command-a-vision` - Vision + text understanding
- `meta.llama-3.2-90b-vision-instruct` - 90B vision model
- `meta.llama-3.2-11b-vision-instruct` - Lightweight vision model
- `cohere.embed-v4.0` - Multimodal embeddings (text OR image, not both)

**Image Requirements:**

- **Format**: PNG or JPG
- **Size Limit**: 5 MB maximum
- **Encoding**: Base64 for API usage (console accepts direct upload)
- **Data URI Scheme**: `data:image/{mime};base64,{encoded_data}`

**Token Conversion:**

- 512x512 image ≈ **1,610 tokens**

**Message Format with Images:**

```typescript
{
  role: "USER",
  content: [
    { type: "TEXT", text: "What's in this image?" },
    {
      type: "IMAGE",
      imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANS..."
    }
  ]
}
```

**AI SDK V3 → OCI Conversion:**

```typescript
// AI SDK file part
{
  type: 'file',
  data: Uint8Array,
  mimeType: 'image/png'
}

// Convert to OCI format
const base64 = Buffer.from(data).toString('base64');
const imageUrl = `data:${mimeType};base64,${base64}`;
```

**Provider Implications:**

- Detect vision models by ID pattern (`*-vision`, `embed-v4`)
- Convert AI SDK file parts to base64 data URIs
- Account for image tokens in usage tracking
- Validate image size (< 5MB) before encoding

### 5.4 Client Initialization

```typescript
import common = require('oci-common');
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';

// 1. Create auth provider
const authProvider = new common.ConfigFileAuthenticationDetailsProvider();

// 2. Create client
const client = new GenerativeAiInferenceClient({
  authenticationDetailsProvider: authProvider,
});

// 3. Set region-specific endpoint
client.endpoint = `https://inference.generativeai.${region}.oci.oraclecloud.com`;

// 4. Make chat request
const response = await client.chat(chatRequest);
```

---

## 6. Streaming Implementation

### 6.1 Stream Flow

```
OCI API (SSE) → eventsource-parser → AI SDK Stream Parts → OpenCode
```

### 6.2 AI SDK V3 Stream Part Types

```typescript
type LanguageModelV3StreamPart =
  | { type: 'stream-start'; warnings?: SharedV3Warning[] }
  | { type: 'text-delta'; textDelta: string }
  | { type: 'tool-call-delta'; toolCallId: string; toolName: string; argsTextDelta: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; args: unknown }
  | { type: 'response-metadata'; id?: string; modelId?: string; timestamp?: Date }
  | { type: 'finish'; finishReason: LanguageModelV3FinishReason; usage: LanguageModelV3Usage }
  | { type: 'error'; error: unknown };
```

### 6.3 Streaming Example

```typescript
async doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
  const response = await this.client.chat({
    chatDetails: {
      // ... config
      chatRequest: {
        // ...
        isStream: true
      }
    }
  });

  const stream = new ReadableStream<LanguageModelV3StreamPart>({
    async start(controller) {
      const parser = createParser((event) => {
        if (event.type === 'event') {
          const data = JSON.parse(event.data);

          // Extract delta
          if (data.choices?.[0]?.delta?.content) {
            controller.enqueue({
              type: 'text-delta',
              textDelta: data.choices[0].delta.content[0].text
            });
          }

          // Extract finish
          if (data.choices?.[0]?.finishReason) {
            controller.enqueue({
              type: 'finish',
              finishReason: mapFinishReason(data.choices[0].finishReason),
              usage: {
                promptTokens: data.usage.promptTokens,
                completionTokens: data.usage.completionTokens,
                totalTokens: data.usage.totalTokens
              }
            });
            controller.close();
          }
        }
      });

      // Feed response body to parser
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(new TextDecoder().decode(value));
      }
    }
  });

  return { stream, rawCall: { rawPrompt: null, rawSettings: {} } };
}
```

---

## 7. Error Handling & Resilience

### 7.1 OCI API Error Responses

**HTTP Status Codes:**

- `400` - Bad Request (invalid parameters, malformed request)
- `401` - Unauthorized (invalid auth credentials)
- `403` - Forbidden (insufficient IAM permissions)
- `404` - Not Found (invalid model ID, endpoint)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error (OCI service error)
- `503` - Service Unavailable (temporary outage)

**Error Response Structure:**

```typescript
{
  code: string;
  message: string;
  status: number;
}
```

### 7.2 Rate Limits & Dynamic Throttling

**OCI's Dynamic Throttling System:**

⚠️ **CRITICAL**: OCI GenAI **does NOT publish fixed rate limits**. Instead, it uses dynamic throttling that adjusts in real-time.

**How Dynamic Throttling Works:**

- Limits adjust based on:
  - Current model demand
  - Available system capacity
  - Your tenancy's historical usage patterns
  - Any override limits configured for your tenancy
- Limits can **change at any time** to meet system-wide demand
- Different limits per model, per region, per tenancy

**Oracle's Official Recommendation:**

> "Implement a backoff strategy which involves delaying requests after a rejection"

**Provider Implications:**

- ❌ Cannot hardcode rate limits (e.g., "10 req/sec")
- ✅ MUST implement exponential backoff with jitter
- ✅ MUST handle 429 errors gracefully
- ✅ Circuit breakers critical for protection
- ✅ Monitor retry counts to detect capacity issues

### 7.3 Retry Strategy

**Retryable Errors:**

- `429` - Rate limit exceeded (exponential backoff with jitter)
- `500`, `502`, `503` - Server errors (exponential backoff)
- Network timeouts
- Connection errors

**Non-Retryable Errors:**

- `400` - Bad request (client error - fix parameters)
- `401`, `403` - Auth errors (fix credentials)
- `404` - Not found (fix model ID/endpoint)

**Retry Configuration (Updated for Dynamic Throttling):**

```typescript
{
  maxRetries: 5,           // Increased due to dynamic limits
  baseDelay: 1000,         // 1 second
  maxDelay: 30000,         // 30 seconds (longer for dynamic system)
  backoffFactor: 2,        // Exponential: 1s, 2s, 4s, 8s, 16s
  jitter: true             // Add randomness to prevent thundering herd
}
```

**Jitter Implementation:**

```typescript
const delay = baseDelay * Math.pow(backoffFactor, attemptNumber);
const jitteredDelay = delay * (0.5 + Math.random() * 0.5); // ±50% jitter
await sleep(Math.min(jitteredDelay, maxDelay));
```

**Why Jitter Matters:**

- Prevents many clients from retrying simultaneously
- Spreads load over time after capacity issues
- Critical for CI/CD use case (many PRs at once)

### 7.4 Circuit Breaker Pattern

**Implementation:** Use `opossum` library

```typescript
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(asyncAction, {
  timeout: 120000, // 2 minutes (LLM generation is slow)
  errorThresholdPercentage: 50, // Open after 50% errors
  resetTimeout: 30000, // Try again after 30s
  volumeThreshold: 10, // Min requests before calculating error rate
});

breaker.fire(request);
```

**Use Case Specific Timeouts:**

```typescript
// Code generation (long outputs)
timeout: 180000; // 3 minutes

// Office automation (medium tasks)
timeout: 120000; // 2 minutes

// CI/CD (short outputs)
timeout: 30000; // 30 seconds
```

**Circuit Breaker States:**

- **Closed**: Normal operation, requests pass through
- **Open**: Too many failures, fail fast (don't call OCI API)
- **Half-Open**: Testing if service recovered

**Why Critical for Your Use Cases:**

- **UC2 (Office Automation)**: Protect unattended batch jobs from cascading failures
- **UC3 (CI/CD)**: Prevent blocking all PRs when OCI has capacity issues
- **UC1 (Code Generation)**: Fast feedback when service is degraded

### 7.5 Idempotency Tokens

**Use Case: CI/CD GitHub Bot**

OCI supports idempotency tokens via `opcRetryToken` to prevent duplicate operations:

```typescript
const chatRequest = {
  chatDetails: {
    /* ... */
  },
  opcRetryToken: `pr-${prNumber}-${commitSha}`, // Unique per PR + commit
};
```

**Benefits:**

- Safe retries in CI/CD pipelines
- Prevents duplicate commit messages
- Prevents duplicate PR comments
- Tokens expire after 24 hours

**Implementation:**

- Generate deterministic token from: PR ID + commit SHA + operation type
- Include in every CI/CD request
- OCI deduplicates within 24-hour window

---

## 8. Use Case-Specific Configurations

### 8.1 Use Case 1: Code Generation with OpenCode Agent Harness

**Objectives:**

- Interactive coding assistance
- Full file generation
- Multi-file refactoring
- Test generation
- Screenshot-based debugging

**Recommended Models:**
| Model | Best For | Context | Output |
|-------|----------|---------|--------|
| `xai.grok-4-code-fast-1` | **Primary** - Code generation | 131K | 8K |
| `meta.llama-3.3-70b-instruct` | Fine-tuning for your codebase | 128K | 4K |
| `meta.llama-3.1-405b-instruct` | Very large codebases | 128K | 4K |

**Configuration:**

```typescript
{
  modelId: 'xai.grok-4-code-fast-1',
  temperature: 0.2,        // Low for deterministic code
  maxTokens: 4096,         // Full files
  topP: 0.9,
  isStream: true,          // Real-time feedback
  tools: [/* file ops, git, test runner */]
}
```

**Critical Features:**

- ✅ Streaming (Phase 2) - **HIGH PRIORITY**
- ✅ Tool calling (Phase 2) - **CRITICAL**
- ✅ Vision support (Phase 5) - Screenshots, diagrams
- ⚠️ Context window warnings - Alert when approaching limit

### 8.2 Use Case 2: Office Task Automation with OpenWork

**What is OpenWork:**

- Extensible, open-source "Claude Work"-style system for knowledge workers
- Built on OpenCode - provides GUI for non-technical users
- Transforms developer workflows into accessible desktop experiences
- **Uses OpenCode's provider system** - OCI GenAI provider works automatically

**Objectives:**

- Guided automated workflows
- Email drafting
- Document generation
- Knowledge work automation
- Multi-step business processes

**Recommended Models:**
| Model | Best For | Why |
|-------|----------|-----|
| `cohere.command-a-reasoning` | **Primary** - Structured tasks | Reasoning, JSON output |
| `google.gemini-2.5-flash` | High-volume batch | Fast + affordable |
| `meta.llama-3.3-70b-instruct` | Custom workflows | Fine-tunable |

**Configuration:**

```typescript
{
  modelId: 'cohere.command-a-reasoning',
  temperature: 0.0,        // Deterministic
  maxTokens: 1024,         // Concise outputs
  topP: 1.0,
  isStream: false,         // Batch processing
  tools: [/* email API, calendar API, CRM API */]
}
```

**Critical Features:**

- ✅ Tool calling (Phase 2) - **CRITICAL** for API integrations
- ✅ Circuit breakers (Phase 4) - **CRITICAL** for reliability
- ✅ Retry logic with jitter (Phase 4) - **CRITICAL** for unattended ops
- ✅ Error logging - Audit trail for failures
- ⚠️ Cost tracking - Monitor batch job expenses

### 8.3 Use Case 3: CI/CD Integration (GitHub Bot)

**Objectives:**

- Commit message generation
- PR description generation
- Code review summaries
- Automated PR comments
- Release note generation

**Recommended Models:**
| Model | Best For | Why |
|-------|----------|-----|
| `google.gemini-2.5-flash` | **Primary** - CI/CD | Fast + cheap |
| `xai.grok-4-fast-reasoning` | Code understanding | Fast with code context |
| `meta.llama-3.3-70b-instruct` | Higher quality | Better summaries |

**Configuration:**

```typescript
{
  modelId: 'google.gemini-2.5-flash',
  temperature: 0.0,        // Deterministic
  maxTokens: 256,          // Short outputs
  isStream: false,         // Batch
  opcRetryToken: `pr-${prNumber}-${commitSha}`,  // Idempotency
  tools: [] // Minimal tooling
}
```

**Critical Features:**

- ✅ Rate limit handling (Phase 4) - **CRITICAL**
- ✅ Exponential backoff + jitter (Phase 4) - **CRITICAL**
- ✅ Circuit breakers (Phase 4) - **CRITICAL**
- ✅ Idempotency tokens - Prevent duplicate operations
- ✅ Parallel request batching - Handle multiple PRs
- ⚠️ Fast model selection - Don't block CI pipelines

**GitHub Bot Workflow Example:**

```typescript
// PR opened - generate description
const description = await oci.chat('google.gemini-2.5-flash').doGenerate({
  prompt: [
    {
      role: 'user',
      content: `Generate PR description for:\n${diffContent}`,
    },
  ],
  temperature: 0.0,
  maxTokens: 256,
});

// Use idempotency token to prevent duplicates on retry
const token = `pr-${pr.number}-${pr.head.sha}-description`;
```

---

## 9. Testing Strategy

### 8.1 Test Types

**1. Unit Tests** (`vitest`)

- Message format conversion
- Tool format conversion
- Stream parsing logic
- Error handling

**2. Contract Tests**

- OCI API response schema validation
- AI SDK V3 interface compliance

**3. Integration Tests**

- Live OCI API calls (requires credentials)
- End-to-end streaming
- Tool calling workflows

**4. Property-Based Tests** (`fast-check`)

- Message conversion round-trips
- Stream parser robustness

### 8.2 Mocking Strategy

Use `msw` (Mock Service Worker) for API mocking:

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.post('https://inference.generativeai.*/20231130/actions/chat', () => {
    return HttpResponse.json({
      chatResponse: {
        choices: [
          {
            message: { role: 'ASSISTANT', content: [{ type: 'TEXT', text: 'Mock response' }] },
            finishReason: 'STOP',
            index: 0,
          },
        ],
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      },
    });
  })
);
```

### 8.3 Coverage Requirements

- Lines: 80%
- Functions: 80%
- Branches: 75%

---

## 9. Security Considerations

### 9.1 Credential Management

- **Never hardcode** API keys or credentials
- Use environment variables or config files
- Config file permissions: `0o600` (owner read/write only)
- Session tokens: encrypted at rest
- Audit logging for auth failures

### 9.2 Input Validation

- Validate all user inputs with `zod` schemas
- Sanitize prompts (no injection attacks)
- Validate model IDs against whitelist
- Validate tool call parameters

### 9.3 Secure Dependencies

**Preferred Libraries:**

- `zod` - Schema validation (safe-by-default)
- `jose` - JWT handling (if needed for OAuth)
- Use TypeScript strict mode
- Avoid dynamic code execution

---

## 10. OpenCode Integration

### 10.1 Package Structure

```
@acedergren/opencode-oci-genai/
├── src/
│   ├── index.ts                    # Main exports
│   ├── oci-genai-provider.ts       # Provider factory
│   ├── oci-genai-chat-model.ts     # LanguageModelV3 implementation
│   ├── auth/
│   │   ├── index.ts                # Auth cascade
│   │   ├── config-file.ts          # Config file auth
│   │   ├── instance-principal.ts   # Instance principal
│   │   └── resource-principal.ts   # Resource principal
│   ├── utils/
│   │   ├── tool-converter.ts       # AI SDK ↔ OCI tool conversion
│   │   ├── stream-parser.ts        # SSE parsing
│   │   └── resilience.ts           # Circuit breaker, retry
│   └── types/
│       └── oci-responses.ts        # OCI API type definitions
├── test/
├── package.json
└── tsconfig.json
```

### 10.2 Main Export

```typescript
// src/index.ts
export { createOCIGenAI } from './oci-genai-provider.js';
export type { OCIGenAISettings } from './oci-genai-provider.js';

// Pre-initialized singleton for OpenCode
export const ociGenAI = await createOCIGenAI({
  compartmentId: process.env.OCI_COMPARTMENT_ID!,
  configProfile: process.env.OCI_CONFIG_PROFILE,
  configFile: process.env.OCI_CONFIG_FILE,
  region: process.env.OCI_REGION,
});
```

### 10.3 OpenCode Configuration

**Project `opencode.json`:**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai",
      "name": "OCI GenAI",
      "models": {
        "meta.llama-3.3-70b-instruct": {
          "name": "Llama 3.3 70B",
          "attachment": true,
          "limit": { "context": 128000, "output": 4096 }
        },
        "xai.grok-4-fast-reasoning": {
          "name": "Grok 4 Scout",
          "attachment": true,
          "limit": { "context": 131072, "output": 8192 }
        }
      }
    }
  },
  "env": {
    "OCI_COMPARTMENT_ID": "ocid1.compartment.oc1...",
    "OCI_CONFIG_PROFILE": "DEFAULT",
    "OCI_REGION": "us-ashburn-1"
  }
}
```

### 10.4 Environment Variables

```bash
# Required
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaaaaaa...

# Optional (defaults)
OCI_CONFIG_PROFILE=DEFAULT
OCI_CONFIG_FILE=~/.oci/config
OCI_REGION=us-ashburn-1

# Future: OAuth
OCI_IDCS_DOMAIN=https://idcs-xxx.identity.oraclecloud.com
OCI_IDCS_CLIENT_ID=your-client-id
OCI_IDCS_TENANCY=ocid1.tenancy...
```

---

## 11. Implementation Phases (Prioritized for Use Cases)

### Phase 1: Core Provider (MVP)

**Timeline:** Week 1
**Priority:** CRITICAL - Foundation for all use cases

- [ ] Provider factory with config file auth
- [ ] Chat model implementing LanguageModelV3
- [ ] Non-streaming generation
- [ ] Message format conversion (AI SDK ↔ OCI)
- [ ] Basic error handling
- [ ] Unit tests (message conversion, error handling)

**Deliverable:** Working provider for simple chat completions
**Blocks:** All other phases
**Use Cases Enabled:** UC2 (basic), UC3 (basic)

---

### Phase 2: Tool Calling Support

**Timeline:** Week 2
**Priority:** CRITICAL - Required for UC1, UC2

- [ ] JSON Schema validation (tool parameters)
- [ ] Tool format conversion (AI SDK ↔ OCI)
- [ ] Tool call execution flow
- [ ] Tool result handling
- [ ] Tool naming validation (letter/underscore start, 1-255 chars)
- [ ] Integration tests (file ops, git commands, API calls)

**Deliverable:** Function calling support
**Blocks:** Production use of UC1, UC2
**Use Cases Enabled:** UC1 (code gen with tools), UC2 (API integrations)

**Critical for:**

- File operations (code generation)
- Git commands (code generation)
- Email/Calendar APIs (office automation)
- CRM integrations (office automation)

---

### Phase 3: Production Resilience

**Timeline:** Week 3
**Priority:** CRITICAL - Required for UC2, UC3

- [ ] Dynamic throttling handler (429 errors)
- [ ] Exponential backoff with jitter
- [ ] Circuit breaker pattern (opossum)
- [ ] Idempotency token support (`opcRetryToken`)
- [ ] Comprehensive error logging
- [ ] Integration tests (resilience scenarios)

**Deliverable:** Production-ready error handling
**Blocks:** UC2 (unattended ops), UC3 (CI/CD)
**Use Cases Enabled:** UC2 (reliable automation), UC3 (CI/CD reliability)

**Critical for:**

- Unattended batch operations (office automation)
- CI/CD spikes (many PRs at once)
- Dynamic rate limit handling
- Safe retries in GitHub workflows

---

### Phase 4: Streaming Support

**Timeline:** Week 4
**Priority:** HIGH - Important for UC1

- [ ] SSE stream parser (eventsource-parser)
- [ ] Streaming generation (doStream)
- [ ] Stream error handling
- [ ] Text delta aggregation
- [ ] Usage tracking in streams
- [ ] Integration tests (streaming scenarios)

**Deliverable:** Real-time streaming responses
**Blocks:** Interactive code generation
**Use Cases Enabled:** UC1 (real-time code generation)

**Critical for:**

- Interactive coding assistance
- Real-time feedback
- Long file generation with progress

---

### Phase 5: Vision/Multimodal Support

**Timeline:** Week 5
**Priority:** MEDIUM - Enhancement for UC1

- [ ] Base64 image encoding
- [ ] Data URI generation
- [ ] Vision model detection (`*-vision`, `embed-v4`)
- [ ] Image size validation (< 5MB)
- [ ] Token calculation for images (512x512 = 1,610 tokens)
- [ ] Integration tests (screenshot-based debugging)

**Deliverable:** Vision support for code generation
**Blocks:** Screenshot-based debugging
**Use Cases Enabled:** UC1 (screenshot debugging)

---

### Phase 6: Advanced Auth & Embeddings

**Timeline:** Week 6+
**Priority:** LOW - Future enhancements

- [ ] Instance principal support (OCI Compute)
- [ ] Resource principal support (OCI Functions)
- [ ] Auth cascade logic
- [ ] IDCS OAuth browser flow
- [ ] Embeddings API support
- [ ] Fine-tuned model support
- [ ] Caching layer

**Deliverable:** Advanced features
**Use Cases Enabled:** Enterprise deployments, semantic search

---

## 12. Resolved Questions

All initial open questions have been researched and resolved:

1. **Model-specific regions** ✅ RESOLVED
   - **Answer:** All pretrained models available in ALL regions (as of Jan 2026)
   - **Source:** [Llama 3.2 Regional Availability](https://docs.oracle.com/en-us/iaas/releasenotes/generative-ai/llama-3-2-new-regions.htm)
   - **Impact:** No model-to-region mapping needed

2. **Tool calling format** ✅ RESOLVED
   - **Answer:** Standard JSON Schema format (same as AI SDK)
   - **Source:** [Function Calling Tool Creation](https://docs.public.oneportal.content.oci.oraclecloud.com/en-us/iaas/Content/generative-ai-agents/function-calling-tool-create.htm)
   - **Impact:** Minimal conversion needed

3. **Vision support** ✅ RESOLVED
   - **Answer:** Base64-encoded data URIs in message content
   - **Source:** [Meta Llama 3.2 11B Vision](https://docs.oracle.com/en-us/iaas/Content/generative-ai/meta-llama-3-2-11b.htm)
   - **Impact:** AI SDK file parts → base64 data URIs

4. **Rate limits** ✅ RESOLVED
   - **Answer:** Dynamic throttling - NO fixed published limits
   - **Source:** [Model Limitations](https://docs.oracle.com/en-us/iaas/Content/generative-ai/limitations.htm)
   - **Impact:** MUST implement exponential backoff + jitter

5. **Dedicated endpoints** ✅ RESOLVED
   - **Answer:** Dedicated = isolated compute for fine-tuning/custom models
   - **Source:** [Managing Dedicated AI Clusters](https://docs.oracle.com/en-us/iaas/Content/generative-ai/ai-cluster.htm)
   - **Impact:** Support both via `servingMode.servingType`

## 13. Remaining Questions

1. **OpenWork-specific requirements**: Any custom workflow patterns that need provider-level support?
2. **GitHub bot deployment**: Preferred hosting (OCI Functions, GitHub Actions, dedicated server)?
3. **Cost monitoring**: Need provider-level usage tracking/reporting for budgeting?
4. **Model fine-tuning**: Plan to fine-tune Llama 3.3 for your codebase/workflows?
5. **Fallback strategies**: Secondary provider if OCI capacity issues (e.g., fallback to OpenAI)?

---

## 14. Success Criteria (Use Case Driven)

### UC1: Code Generation Success Criteria

✅ **Functional:**

- All code models accessible (Grok, Llama 3.3, Llama 3.1 405B)
- Streaming responses with real-time feedback
- Tool calling works (file ops, git, test runner)
- Vision support for screenshot-based debugging
- Context window warnings

✅ **Performance:**

- First token latency < 2s
- Stream chunks with < 100ms latency
- Full file generation (4K tokens) < 30s

### UC2: Office Automation Success Criteria

✅ **Functional:**

- Reasoning models work (Cohere Command A Reasoning)
- Tool calling for API integrations (email, calendar, CRM)
- Batch processing without streaming overhead
- Error logging for audit trails

✅ **Reliability:**

- Circuit breakers prevent cascading failures
- Exponential backoff handles dynamic throttling
- Unattended operations complete successfully
- Retry logic with < 5% false negatives

### UC3: CI/CD Integration Success Criteria

✅ **Functional:**

- Fast models work (Gemini 2.5 Flash, Grok 4 Fast)
- Idempotency tokens prevent duplicate operations
- Parallel request handling (multiple PRs)
- Deterministic outputs (temp=0.0)

✅ **Performance:**

- Commit message generation < 10s
- PR description generation < 15s
- No CI pipeline blocking (< 30s timeout)

✅ **Reliability:**

- Handles rate limit spikes (many PRs at once)
- Jittered backoff prevents thundering herd
- Circuit breakers protect GitHub workflows
- 99.9% success rate after retries

### Overall Quality Criteria

✅ **Code Quality:**

- 80%+ test coverage (unit, contract, integration)
- All security scans pass (semgrep, CodeRabbit)
- Type-safe (no `any` types)
- TSDoc comments for public APIs

✅ **Documentation:**

- README with quick start
- API reference (generated from TSDoc)
- Use case guides (UC1, UC2, UC3)
- Troubleshooting guide

✅ **OpenCode/OpenWork Integration:**

- Works in OpenCode without modification
- Works in OpenWork automatically
- Environment variable configuration
- Proper error messages in UI
- Model metadata accurate

---

## 15. References

**OpenCode & AI SDK:**

- [OpenCode Providers Documentation](https://opencode.ai/docs/providers/)
- [AI SDK v6 Documentation](https://sdk.vercel.ai)
- [AI SDK Custom Provider Guide](https://ai-sdk.dev/providers/community-providers/custom-providers)
- [LanguageModelV3 Specification](https://sdk.vercel.ai/docs/advanced/providers-and-models)
- [GitHub - OpenWork](https://github.com/different-ai/openwork)

**OCI Generative AI - General:**

- [OCI GenAI Overview](https://docs.oracle.com/en-us/iaas/Content/generative-ai/overview.htm)
- [Pretrained Models](https://docs.oracle.com/en-us/iaas/Content/generative-ai/pretrained-models.htm)
- [OCI GenAI Release Notes](https://docs.oracle.com/en-us/iaas/releasenotes/services/generative-ai/)
- [Model Limitations](https://docs.oracle.com/en-us/iaas/Content/generative-ai/limitations.htm)
- [Service Limits](https://docs.oracle.com/en-us/iaas/Content/generative-ai/limits.htm)

**OCI Generative AI - Models & Regions:**

- [Llama 3.3 70B Availability](https://docs.oracle.com/en-us/iaas/releasenotes/generative-ai/llama-3-3.htm)
- [Llama 3.2 Vision Regional Availability](https://docs.oracle.com/en-us/iaas/releasenotes/generative-ai/llama-3-2-new-regions.htm)
- [Grok 4 Announcement](https://docs.oracle.com/en-us/iaas/releasenotes/generative-ai/grok-4.htm)
- [Meta Llama 3.2 11B Vision](https://docs.oracle.com/en-us/iaas/Content/generative-ai/meta-llama-3-2-11b.htm)
- [Cohere Command A Vision](https://docs.oracle.com/es-ww/iaas/Content/generative-ai/cohere-command-a-vision-07-2025.htm)

**OCI Generative AI - Tool Calling:**

- [GenAI Agents Function Calling](https://docs.oracle.com/en-us/iaas/Content/generative-ai-agents/function-calling-tool.htm)
- [Creating Function Calling Tools](https://docs.public.oneportal.content.oci.oraclecloud.com/en-us/iaas/Content/generative-ai-agents/function-calling-tool-create.htm)
- [Building AI Agent with Function Calling (Java)](https://www.ateam-oracle.com/building-a-generative-ai-agent-with-function-calling-in-java)
- [API Endpoint Calling Tools](https://docs.public.content.oci.oraclecloud.com/en-us/iaas/Content/generative-ai-agents/api-calling-tool.htm)

**OCI Generative AI - Dedicated Clusters:**

- [Managing Dedicated AI Clusters](https://docs.oracle.com/en-us/iaas/Content/generative-ai/ai-cluster.htm)
- [Creating Dedicated AI Clusters](https://docs.oracle.com/en-us/iaas/Content/generative-ai/create-ai-cluster-hosting.htm)
- [Dedicated AI Cluster Pricing](https://docs.public.content.oci.oraclecloud.com/en-us/iaas/Content/generative-ai/pay-dedicated.htm)
- [Managing Endpoints](https://docs.oracle.com/en-us/iaas/Content/generative-ai/endpoint.htm)

**OCI TypeScript SDK:**

- [OCI TypeScript SDK](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/typescriptsdk.htm)
- [Getting Started Guide](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/typescriptsdkgettingstarted.htm)
- [ChatRequest Interface](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/interfaces/_generativeaiinference_lib_request_chat_request_.chatrequest.html)
- [GitHub - OCI TypeScript SDK](https://github.com/oracle/oci-typescript-sdk)
- [npm - oci-generativeaiinference](https://www.npmjs.com/package/oci-generativeaiinference)

**Authentication:**

- [OCI Authentication Methods](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdk_authentication_methods.htm)
- [SDK Configuration File](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdkconfig.htm)
- [API Signing Keys](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/apisigningkey.htm)

---

## 16. Document Summary

**Target Use Cases:**

1. **Code Generation** - OpenCode agent harness with tool calling, streaming, vision
2. **Office Automation** - OpenWork (built on OpenCode) for knowledge work
3. **CI/CD Integration** - GitHub bot for commits, PRs, code review

**Critical Features (Priority Order):**

1. Tool calling (Phase 2) - **CRITICAL** for all use cases
2. Resilience (Phase 3) - **CRITICAL** for UC2, UC3
3. Streaming (Phase 4) - Important for UC1
4. Vision (Phase 5) - Enhancement for UC1

**Key Technical Decisions:**

- ✅ Native OCI SDK (not OpenAI-compatible wrapper)
- ✅ Bun/pnpm compatible (OpenCode uses Bun)
- ✅ Dynamic throttling handling (no fixed rate limits)
- ✅ Tool calling uses JSON Schema (minimal conversion)
- ✅ Vision via base64 data URIs
- ✅ All models available in all regions

**Recommended Models by Use Case:**

- UC1: `xai.grok-4-code-fast-1`
- UC2: `cohere.command-a-reasoning` or `google.gemini-2.5-flash`
- UC3: `google.gemini-2.5-flash`

---

**Document Version:** 2.0 (Use Case Driven)
**Last Updated:** 2026-01-26 (Refined with use case priorities)
**Next Review:** After Phase 1 implementation
**Status:** ✅ **Ready for Implementation**

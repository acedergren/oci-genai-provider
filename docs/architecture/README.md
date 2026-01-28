# Architecture

Technical architecture of the OCI Generative AI provider for Vercel AI SDK.

## Overview

This provider connects the Vercel AI SDK to Oracle Cloud Infrastructure's Generative AI service. It translates AI SDK requests into OCI API calls and converts responses back into the AI SDK format.

```
┌─────────────────────────────────────────────────┐
│     Your Application                            │
│     (Next.js, Remix, SvelteKit, Node.js)       │
└─────────────┬───────────────────────────────────┘
              │
              │ Vercel AI SDK
              ▼
┌─────────────────────────────────────────────────┐
│     @acedergren/oci-genai-provider              │
│     • Request transformation                    │
│     • Authentication                            │
│     • Streaming                                 │
│     • Error handling                            │
└─────────────┬───────────────────────────────────┘
              │
              │ OCI TypeScript SDK
              ▼
┌─────────────────────────────────────────────────┐
│     OCI Generative AI Service                   │
│     (Grok, Llama, Cohere, Gemini)              │
└─────────────────────────────────────────────────┘
```

## Package Structure

The project is a pnpm workspace monorepo with three packages:

```
packages/
├── oci-genai-provider/         # Core provider (published)
│   └── src/
│       ├── index.ts            # Public API
│       ├── types.ts            # Type definitions
│       ├── auth/               # Authentication
│       ├── models/             # Model registry
│       ├── converters/         # Message conversion
│       ├── streaming/          # SSE parsing
│       └── errors/             # Error handling
│
├── opencode-integration/       # OpenCode wrapper (published)
│   └── src/
│       ├── index.ts            # Re-exports + helpers
│       └── register.ts         # Provider registration
│
└── test-utils/                 # Shared test utilities (private)
    └── src/
        ├── index.ts            # Test fixtures
        └── oci-*.ts            # OCI SDK mocks
```

### Dependencies

```
test-utils (mocks)
    ↑ devDependencies
oci-genai-provider (core)
    ↑ dependencies
opencode-integration (wrapper)
```

The core provider has no runtime dependencies on OpenCode. OpenCode users who want convenience features install the wrapper, which delegates to the core provider.

## Core Components

### Provider Factory

`createOCI()` returns a provider instance with a `model()` method:

```typescript
const oci = createOCI({
  region: 'us-ashburn-1',
  profile: 'DEFAULT',
});

const model = oci('cohere.command-r-plus');
```

### Language Model

Each model instance implements the Vercel AI SDK's `LanguageModelV3` interface:

- **doGenerate**: Complete response generation
- **doStream**: Streaming response generation
- **metadata**: Model capabilities and settings

### Authentication

Authentication initializes lazily on the first API call:

```typescript
private async getClient(): Promise<GenerativeAiInferenceClient> {
  if (!this._client) {
    const authProvider = await createAuthProvider(this.config);
    this._client = new GenerativeAiInferenceClient({
      authenticationDetailsProvider: authProvider
    });
  }
  return this._client;
}
```

This allows synchronous model construction while deferring async credential loading.

### Streaming

The stream processor converts OCI Server-Sent Events into AI SDK async iterators:

1. OCI returns SSE stream
2. Parser (`eventsource-parser`) extracts events
3. Converter transforms OCI format to AI SDK format
4. Async iterator yields tokens

### Error Handling

All OCI errors pass through `handleOCIError()`:

- Wraps errors with contextual messages
- Detects retry-able conditions
- Provides actionable guidance

## Request Flow

### Non-Streaming

```
1. User calls generateText()
2. Provider validates configuration
3. Model transforms request to OCI format
4. Client sends authenticated request
5. Model transforms response to AI SDK format
6. Result returned
```

### Streaming

```
1. User calls streamText()
2. Provider validates configuration
3. Model transforms request, enables streaming
4. Client establishes SSE connection
5. Stream processor converts events
6. Tokens yield incrementally
7. Stream closes on completion
```

### Tool Calling

```
1. User defines tools
2. Adapter converts tools to OCI format
3. Model includes tools in request
4. OCI returns tool call
5. Adapter converts to AI SDK format
6. User executes tool
7. Result sent in next request
8. Model generates final response
```

## Authentication Flow

Configuration resolves in priority order:

1. **Environment variables** (highest priority)
   - `OCI_CONFIG_FILE`, `OCI_CONFIG_PROFILE`, `OCI_REGION`

2. **Constructor options**
   - `configFile`, `profile`, `region`

3. **Defaults**
   - `~/.oci/config`, `DEFAULT` profile

Supported authentication methods:
- API Key (config file)
- Instance Principal (OCI Compute)
- Resource Principal (OCI Functions)

## Error Handling

### Retry-able Errors

| Error | Strategy |
|-------|----------|
| 429 Rate Limit | Exponential backoff, respect Retry-After |
| 500 Server Error | Retry up to 3 times |
| 503 Unavailable | Retry up to 3 times |
| Network timeout | Retry with increased timeout |

### Non-Retry-able Errors

| Error | Meaning |
|-------|---------|
| 401 Unauthorized | Authentication configuration issue |
| 403 Forbidden | IAM policy issue |
| 404 Not Found | Model or endpoint not found |
| 400 Bad Request | Invalid request parameters |

## Testing

The project uses test-driven development with comprehensive coverage:

- **121 tests** across all modules
- **80%+ coverage** target
- **Shared mocks** in `@acedergren/test-utils`

Test categories:
- Type definitions
- Authentication
- Model registry
- Message conversion
- Generation (streaming and non-streaming)
- Error handling

## Further Reading

- [Design Decisions](design-decisions.md) — Why we made specific choices
- [Technology Stack](technology-stack.md) — Dependencies and versions
- [Code Conventions](code-conventions.md) — Style and patterns

---

**Last Updated**: 2026-01-28

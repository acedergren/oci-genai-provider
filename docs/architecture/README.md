# Architecture Overview

This section documents the architecture, design decisions, and technical foundations of the OCI GenAI provider for Vercel AI SDK.

## Monorepo Architecture

This project uses a **pnpm workspace monorepo** with three distinct packages:

### Package Separation

```
packages/
├── oci-genai-provider/          # @acedergren/oci-genai-provider
│   ├── src/                     # Core implementation
│   │   ├── types.ts             # Type definitions
│   │   ├── auth/                # Authentication
│   │   ├── models/              # Model registry & implementation
│   │   ├── converters/          # Message conversion
│   │   ├── streaming/           # SSE parsing
│   │   ├── errors/              # Error handling
│   │   └── index.ts             # Public API
│   ├── __tests__/               # Unit & integration tests
│   └── package.json             # Published to npm
│
├── opencode-integration/        # @acedergren/opencode-oci-genai
│   ├── src/                     # OpenCode-specific wrappers
│   │   ├── types.ts             # OpenCode config types
│   │   ├── register.ts          # Provider registration
│   │   ├── config.ts            # Config helpers
│   │   └── utils.ts             # Utilities
│   └── package.json             # Published to npm
│
└── test-utils/                  # @acedergren/test-utils (private)
    ├── src/
    │   ├── index.ts             # Test fixtures
    │   ├── oci-common.ts        # OCI auth mocks
    │   └── oci-generativeaiinference.ts  # GenAI mocks
    └── package.json             # Not published
```

### Package Dependencies

```
@acedergren/opencode-oci-genai
    └─ workspace:* → @acedergren/oci-genai-provider

@acedergren/oci-genai-provider
    └─ devDependencies → @acedergren/test-utils (workspace:*)

@acedergren/test-utils
    └─ (no dependencies)
```

## Architecture Documents

### [Design Decisions](design-decisions.md)

Comprehensive analysis of architectural choices, including:

- Provider architecture and implementation patterns
- Monorepo structure and package separation
- Authentication and authorization strategies
- Streaming protocol design
- Error handling and resilience
- Tool calling integration

### [Technology Stack](technology-stack.md)

Complete technical stack documentation:

- Core dependencies and versions
- OCI SDK components
- Vercel AI SDK integration
- Development and testing tools
- Build and deployment tooling
- Monorepo tooling (pnpm workspaces)

### [Code Conventions](code-conventions.md)

Project coding standards and patterns:

- TypeScript conventions
- File organization
- Naming conventions
- Documentation standards
- Testing patterns
- Monorepo commit conventions

## System Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────┐
│         Any Application Layer                 │
├──────────────────────────────────────────────┤
│  Next.js │ Remix │ SvelteKit │ Node.js │ ... │
│          │ (All use Vercel AI SDK)           │
└──────────────┬───────────────────────────────┘
               │
               │ Vercel AI SDK
               │
┌──────────────▼───────────────────────────────┐
│     @acedergren/oci-genai-provider            │
│     (Core Vercel AI SDK Provider)            │
│     ✅ Universal - Works Everywhere           │
├──────────────────────────────────────────────┤
│  • Model Registry       • Message Conversion │
│  • Request Adapter      • SSE Stream Parser  │
│  • Response Transformer • Error Handling     │
│  • Authentication       • Tool Converter     │
└──────────────┬───────────────────────────────┘
               │
               │ OCI TypeScript SDK
               │
┌──────────────▼───────────────────────────────┐
│      OCI GenAI Service (Cloud)               │
│  Grok, Llama, Cohere, Gemini Models          │
└──────────────────────────────────────────────┘
```

**Optional OpenCode Convenience Layer**:

```
┌──────────────────────────────────────────────┐
│         OpenCode (TUI / Desktop)             │
└──────────────┬───────────────────────────────┘
               │
               │ Optional convenience
               ▼
┌──────────────────────────────────────────────┐
│   @acedergren/opencode-oci-genai             │
│   (Thin Wrapper - Optional)                  │
│   • Config helpers                           │
│   • Model registry                           │
│   • Validation                               │
└──────────────┬───────────────────────────────┘
               │
               │ Re-exports and wraps
               ▼
┌──────────────────────────────────────────────┐
│   @acedergren/oci-genai-provider             │
│   (Core Provider)                            │
└──────────────────────────────────────────────┘
```

### Workspace Dependency Flow

```
test-utils (mocks)
    ↑
    │ devDependencies (workspace:*)
    │
oci-genai-provider (core)
    ↑
    │ dependencies (workspace:*)
    │
opencode-integration (wrapper)
```

### Package Separation

**Why separate packages?**

1. **Universal Core** - `oci-genai-provider` works with ANY Vercel AI SDK application
2. **Optional Enhancement** - `opencode-oci-genai` only for OpenCode users who want convenience
3. **Clear Boundaries** - Core provider has zero OpenCode dependencies
4. **Independent Usage** - Can use core provider in Next.js, Remix, Node.js without OpenCode package
5. **OpenCode Isolation** - OpenCode-specific features don't bloat the core provider
6. **Shared Testing** - `test-utils` provides consistent mocks across packages
7. **Versioning Flexibility** - Packages can be versioned independently
8. **Clear Boundaries** - Explicit dependency graph prevents circular dependencies

**Testing Architecture:**

- **121 comprehensive tests** across all modules
- **80%+ coverage target** for all packages
- **Shared mocks** in `test-utils` for consistency
- **TDD workflow** with RED-GREEN-REFACTOR cycles

### Key Components

#### 1. Provider Interface (`OCIGenAIProvider`)

Implements Vercel AI SDK's `LanguageModelV3` interface to expose OCI models.

**Responsibilities:**

- Model catalog management
- Configuration validation
- Client initialization

#### 2. Model Implementation (`OCIGenAILanguageModel`)

Individual model instances that handle generation requests.

**Responsibilities:**

- Request transformation (AI SDK → OCI format)
- Response transformation (OCI → AI SDK format)
- Streaming protocol conversion
- Tool/function calling translation
- Error handling and retry logic

#### 3. OCI Client Wrapper

Manages OCI SDK authentication and API calls.

**Responsibilities:**

- Authentication (API key, instance principal, resource principal)
- Regional endpoint management
- Request/response logging
- Rate limiting and backoff

#### 4. Stream Processor

Converts OCI Server-Sent Events (SSE) to AI SDK async iterators.

**Responsibilities:**

- SSE parsing (`eventsource-parser`)
- Token-by-token streaming
- Error event handling
- Stream completion detection

#### 5. Tool Adapter

Translates between AI SDK and OCI tool calling formats.

**Responsibilities:**

- Tool definition conversion
- Tool call execution coordination
- Result formatting
- Error propagation

## Request Flow

### Non-Streaming Request

```
1. User calls generateText() with OCI model
   ↓
2. Provider validates configuration
   ↓
3. Model transforms AI SDK request → OCI format
   ↓
4. OCI Client sends authenticated request
   ↓
5. Model transforms OCI response → AI SDK format
   ↓
6. Result returned to user
```

### Streaming Request

```
1. User calls streamText() with OCI model
   ↓
2. Provider validates configuration
   ↓
3. Model transforms request + enables streaming
   ↓
4. OCI Client establishes SSE connection
   ↓
5. Stream Processor converts SSE → async iterator
   ↓
6. Tokens yielded incrementally to user
   ↓
7. Stream completion detected and closed
```

### Tool Calling Request

```
1. User defines tools in generateText()
   ↓
2. Tool Adapter converts AI SDK tools → OCI format
   ↓
3. Model includes tools in OCI request
   ↓
4. OCI returns tool call in response
   ↓
5. Tool Adapter converts OCI tool call → AI SDK format
   ↓
6. User executes tool function
   ↓
7. Tool result sent back in next request
   ↓
8. Model generates final response
```

## Authentication Flow

```
┌─────────────────────┐
│  Configuration      │
│  Priority (cascade) │
└──────┬──────────────┘
       │
       ├─ 1. Environment Variables (OCI_CONFIG_FILE, OCI_PROFILE)
       ├─ 2. Constructor Options (configFile, profile)
       ├─ 3. Default (~/.oci/config, profile: DEFAULT)
       │
┌──────▼──────────────┐
│  OCI Config Parser  │
└──────┬──────────────┘
       │
       ├─ API Key (user, tenancy, fingerprint, key_file)
       ├─ Instance Principal (for OCI Compute)
       ├─ Resource Principal (for OCI Functions)
       │
┌──────▼──────────────┐
│  OCI SDK Client     │
│  (Authenticated)    │
└─────────────────────┘
```

## Error Handling Strategy

### Retry-able Errors

- **429 Rate Limiting**: Exponential backoff (2^n seconds)
- **500 Internal Server Error**: Retry up to 3 times
- **503 Service Unavailable**: Retry up to 3 times
- **Network timeouts**: Retry with increasing timeout

### Non-Retry-able Errors

- **401 Unauthorized**: Authentication configuration issue
- **403 Forbidden**: IAM policy issue
- **404 Not Found**: Model or endpoint not found
- **400 Bad Request**: Invalid request parameters

### Error Propagation

All errors include:

- Original OCI error message
- HTTP status code
- Request ID (for OCI support)
- Suggested remediation steps

## Security Considerations

See [Security Best Practices](../security/README.md) for comprehensive security documentation.

### Key Security Measures

- **No credentials in code**: All auth via OCI config
- **Secure credential storage**: Keys in `~/.oci/` with 600 permissions
- **TLS for all API calls**: HTTPS only, no plain HTTP
- **Rate limiting**: Built-in backoff prevents abuse
- **Input validation**: All user input sanitized
- **Audit logging**: All API calls logged (optional)

## Performance Optimization

### Caching Strategy

- **Model metadata**: Cached for session duration
- **Configuration**: Parsed once per provider instance
- **OCI client**: Reused across requests (connection pooling)

### Streaming Optimization

- **Buffering**: Minimal buffering for low latency
- **Backpressure**: Handled via async iterators
- **Cancellation**: Supports request cancellation

### Resource Management

- **Connection pooling**: Enabled by default
- **Memory limits**: Configurable max response size
- **Timeout configuration**: Per-request and global timeouts

## Monitoring and Observability

### Logging

- **Debug logging**: `DEBUG=oci-genai:*` environment variable
- **Request/response logging**: Optional, disabled by default
- **Error logging**: Always enabled

### Metrics

- Request count (by model)
- Response latency (by model)
- Token usage (input/output)
- Error rate (by type)
- Stream duration

### Health Checks

- OCI API connectivity
- Authentication validity
- Model availability

## Deployment Patterns

### Development

```typescript
const oci = createOCI({
  profile: 'DEV',
  debug: true,
});
```

### Production (Compute Instance)

```typescript
const oci = createOCI({
  auth: 'instance_principal',
  region: process.env.OCI_REGION,
});
```

### Production (OCI Functions)

```typescript
const oci = createOCI({
  auth: 'resource_principal',
});
```

## Testing Strategy

Comprehensive testing is a core architectural principle. See [Testing Guide](../testing/README.md) for full details.

### Test Suite Overview

**121 tests across 14 test files:**

- Type definitions (3 tests)
- Authentication (4 tests)
- Model registry (28 tests)
- Message conversion (9 tests)
- Language model doGenerate (22 tests)
- Streaming (SSE parser: 11 tests, doStream: 8 tests)
- Provider factory (16 tests)
- Error handling (20 tests)

### Test Organization

**Unit Tests:**

- Located in `src/__tests__/` and module `__tests__/` directories
- Mock OCI SDK using `@acedergren/test-utils`
- Fast execution (milliseconds)
- 80%+ coverage target

**Integration Tests:**

- End-to-end workflows (planned)
- Real OCI SDK without network calls
- Moderate execution time

**Test-Driven Development:**

- Follow [TDD Implementation Plan](../plans/2026-01-27-core-provider-tdd-implementation.md)
- RED → GREEN → COMMIT cycles
- Atomic commits after each passing test batch

### Shared Test Utilities

`@acedergren/test-utils` provides:

- OCI Common mocks (`ConfigFileAuthenticationDetailsProvider`, etc.)
- OCI GenAI Inference mocks (`GenerativeAiInferenceClient`)
- Test fixtures (`TEST_CONFIG`, `TEST_MODEL_IDS`, `TEST_OCIDS`)

### Running Tests

```bash
# All packages
pnpm test

# Specific package
pnpm --filter @acedergren/oci-genai-provider test

# Watch mode
pnpm --filter @acedergren/oci-genai-provider test -- --watch

# Coverage
pnpm test:coverage
```

## Further Reading

- [Design Decisions](design-decisions.md) - Why we made specific choices
- [Technology Stack](technology-stack.md) - What we're built with
- [Code Conventions](code-conventions.md) - How we write code
- [Provider Flow](provider-flow.md) - Detailed request/response flow

---

**Architecture Version**: 1.0.0
**Last Updated**: 2026-01-27
**Monorepo**: pnpm workspaces with 3 packages
**Test Coverage**: 121 tests (80%+ target)

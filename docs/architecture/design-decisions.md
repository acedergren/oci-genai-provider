# Architecture

**Analysis Date:** 2026-01-26

## Pattern Overview

**Overall:** Monorepo with a provider-plugin architecture. Three packages implement a unified OCI GenAI integration:
- Core provider package implementing AI SDK's LanguageModelV3 interface
- Auth plugin for OpenCode integration with IDCS OAuth
- RAG (Retrieval-Augmented Generation) MCP server for knowledge retrieval

**Key Characteristics:**
- LanguageModelV3 interface compliance for seamless AI SDK 6.x integration
- Flexible multi-method authentication (config file → instance principal → resource principal → OAuth)
- Pluggable RAG backends (HTTP, direct database, MCP-based)
- OCI-native integration with multi-region support
- Resilience patterns: circuit breakers, retries, timeouts for fault tolerance

## Layers

**Provider Layer (`opencode-oci-genai`):**
- Purpose: Implements AI SDK interface and orchestrates chat model creation
- Location: `packages/opencode-oci-genai/src/oci-genai-provider.ts`, `packages/opencode-oci-genai/src/oci-genai-chat-model.ts`
- Contains: Factory functions, model instantiation, RAG context injection orchestration
- Depends on: Auth layer, RAG clients, utilities
- Used by: OpenCode, AI SDK consumers

**Chat Model Layer:**
- Purpose: Implements LanguageModelV3 interface with streaming, tool calling, and vision support
- Location: `packages/opencode-oci-genai/src/oci-genai-chat-model.ts`
- Contains: Request/response handling, tool conversion, SSE parsing, streaming logic
- Depends on: OCI GenerativeAI client, stream parser, tool converter
- Used by: Provider layer

**Authentication Layer:**
- Purpose: Cascading authentication strategy for various OCI deployment contexts
- Location: `packages/opencode-oci-genai/src/auth/`
- Contains: Config file reader, instance principal, resource principal, IDCS OAuth, session store
- Depends on: OCI SDK, file system, environment variables
- Used by: Provider layer

**RAG Layer:**
- Purpose: Knowledge retrieval via multiple backends for context injection
- Location: `packages/opencode-oci-genai/src/rag/`
- Contains: DB RAG client (Oracle ADB), HTTP RAG client, MCP RAG client
- Depends on: oracledb, fetch API, MCP SDK
- Used by: Provider layer during context injection

**Utilities Layer:**
- Purpose: Reusable logic for conversion, parsing, resilience, and context management
- Location: `packages/opencode-oci-genai/src/utils/`
- Contains: Tool converter, stream parser, context cleaner, resilience (circuit breaker/retry), coding tailor
- Depends on: None (self-contained)
- Used by: Chat model layer, RAG layer

**Plugin Layer (`opencode-oci-genai-auth`):**
- Purpose: OpenCode integration for OAuth-based authentication
- Location: `packages/opencode-oci-genai-auth/src/`
- Contains: Plugin hooks, auth config loading
- Depends on: Provider package auth exports, OpenCode plugin interface
- Used by: OpenCode

**RAG MCP Server (`opencode-oci-genai-rag`):**
- Purpose: Exposes RAG capabilities as MCP tools for Claude Code and other MCP clients
- Location: `packages/opencode-oci-genai-rag/src/index.ts`, `packages/opencode-oci-genai-rag/src/tools.ts`
- Contains: MCP server setup, tool handlers, backend factories
- Depends on: MCP SDK, RAG backends, provider package exports
- Used by: Claude Code, OpenCode

## Data Flow

**Chat Request Flow:**

1. Consumer imports from `@acedergren/opencode-oci-genai` (provider package)
2. Calls `createOCIGenAI()` to create provider instance or uses pre-initialized `ociGenAI` export
3. Provider's `createModel()` instantiates `OCIGenAIChatModel` with lazy auth initialization
4. Model's `doGenerate()` or `doStream()` called with chat messages
5. Auth provider resolved (lazy init, cached after first call)
6. RAG context injected if enabled (extracts latest user message, queries RAG client)
7. Tools converted from AI SDK format to OCI format via `convertToolsToOCI()`
8. OCI API request sent with context, tools, messages
9. Response parsed: text parts, tool calls, usage stats
10. Stream handling (if enabled): SSE parsing via `parseSSEStream()`, yielding parts
11. Tool calls converted back to AI SDK format via `parseToolCalls()`
12. Final result returned with combined usage tracking

**RAG Context Injection Flow (DB Mode):**

1. Provider checks `ragConfig.mode` (db/http/mcp)
2. If db mode and not initialized: calls `createDBRAGClient()` with DB config
3. Creates connection pool to Oracle ADB 26ai
4. Extracts latest user message text
5. Queries via `DBMS_HYBRID_VECTOR.SEARCHPIPELINE` with hybrid search
6. Applies persona filtering (shared + domain tiers)
7. Returns formatted context string with citations
8. Context injected as system message before API call

**State Management:**

- **Auth Provider**: Cached promise in provider factory, resolved once per provider instance
- **RAG Configuration**: Resolved at provider creation time from settings or environment variables
- **RAG Clients**: Initialized lazily on first use (async init guarded by `ragInitialized` flag)
- **Connection Pools**: Maintained by oracledb for DB RAG client
- **Circuit Breakers**: Per-operation instances in resilience utilities (isolated by operation type)

## Key Abstractions

**LanguageModelV3 Interface:**
- Purpose: AI SDK standard for language models
- Examples: `OCIGenAIChatModel` implements this interface
- Pattern: Standard interface with `doGenerate()` and `doStream()` methods

**OCIGenAIProvider Interface:**
- Purpose: Factory interface for creating chat models
- Examples: `createOCIGenAI()` returns this interface
- Pattern: Callable object with `.chat()` method and `.provider` property

**RAG Context Injector:**
- Purpose: Pluggable function for retrieving and formatting context
- Examples: `createHTTPRAGInjector()`, `createDBRAGInjector()`
- Pattern: `(messages: ProviderMessage[]) => Promise<string | null>`

**Authentication Cascade:**
- Purpose: Automatic auth method selection based on environment
- Examples: `getAuthProvider()` tries methods in order
- Pattern: Each method has `isXxxEnvironment()` check before attempting auth

**Stream Parser:**
- Purpose: Converts OCI's EventSource format to async iterable
- Examples: `parseSSEStream()` handles Server-Sent Events
- Pattern: Stateful parser yielding parsed events

**Tool Converter:**
- Purpose: Bidirectional format conversion between AI SDK and OCI
- Examples: `convertToolsToOCI()`, `parseToolCalls()`
- Pattern: Mirror functions for seamless integration

## Entry Points

**Provider Creation:**
- Location: `packages/opencode-oci-genai/src/index.ts`
- Triggers: Explicit import of `createOCIGenAI()` or use of `ociGenAI` singleton
- Responsibilities: Initialize provider with auth caching, RAG config resolution, model factory setup

**Pre-initialized Singleton:**
- Location: `packages/opencode-oci-genai/src/index.ts` - `ociGenAI` export
- Triggers: Direct import without calling factory
- Responsibilities: Read OCI_COMPARTMENT_ID and related env vars, provide immediate provider instance

**Chat Model Generation:**
- Location: `OCIGenAIChatModel.doGenerate()` and `doStream()`
- Triggers: AI SDK calls after consumer invokes `model.generateText()` or similar
- Responsibilities: Request formatting, auth resolution, RAG context injection, OCI API call, response parsing

**MCP Server Entry:**
- Location: `packages/opencode-oci-genai-rag/src/index.ts`
- Triggers: Process execution with MCP stdio transport
- Responsibilities: Tool registration, request routing, backend initialization

**Auth Plugin Entry:**
- Location: `packages/opencode-oci-genai-auth/src/index.ts`
- Triggers: OpenCode plugin system load
- Responsibilities: Register auth provider, handle OAuth flow

## Error Handling

**Strategy:** Layered error handling with circuit breakers, retries, and graceful degradation

**Patterns:**

- **Auth Cascade with Fallthrough**: If config file auth fails, try instance principal. If all fail, provide helpful error message with next steps (`getAuthProvider()` in `packages/opencode-oci-genai/src/auth/index.ts`)

- **RAG Graceful Degradation**: RAG initialization failures logged but don't block chat (`ensureRAGInitialized()` in `packages/opencode-oci-genai/src/oci-genai-provider.ts` catches and logs)

- **Circuit Breaker Pattern**: Resilience utilities in `packages/opencode-oci-genai/src/utils/resilience.ts` prevent cascading failures for repeated DB/API failures

- **Timeout Protection**: RAG context injection and DB operations wrapped with timeout (5000ms HTTP, 30000ms DB by default)

- **Stream Error Recovery**: SSE parser handles incomplete events and connection failures gracefully

- **API Response Validation**: Type guards on discriminated unions prevent invalid state propagation

## Cross-Cutting Concerns

**Logging:** Structured logging with prefixes ([OCI Auth], [RAG HTTP], [OCI RAG MCP], etc.) sent to console.error. Silent initialization for normal operation, errors logged on failure.

**Validation:**
- Runtime schema validation with zod in test files (`packages/opencode-oci-genai/test/schemas/`)
- Type guards for API response discriminated unions
- Environment variable validation in settings loading

**Authentication:**
- Cascade strategy with multiple fallback methods
- Lazy initialization with caching to avoid repeated auth attempts
- Session token management with TTL and refresh for OAuth
- File permission enforcement (0o600) for sensitive credential files

**Configuration:**
- Environment variable priority over explicit settings
- Settings merge in provider factory (explicit settings override env vars)
- RAG mode auto-detection based on available configuration

**Resilience:**
- Circuit breaker for high-failure operations
- Exponential backoff retry strategy for transient failures
- Timeout wrappers for network operations
- DB connection pooling for RAG

---

*Architecture analysis: 2026-01-26*

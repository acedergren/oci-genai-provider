# Monorepo Architecture

## Overview

This is a **pnpm workspace monorepo** with three packages implementing an OCI Generative AI provider for Vercel AI SDK v3.

## Package Structure

### Packages (packages/)

#### 1. @acedergren/oci-genai-provider (Core Package)

**Location**: `packages/oci-genai-provider/`
**Purpose**: Standalone core provider that works with any Vercel AI SDK project
**Published**: Yes (to npm)

**Key Modules**:

- `src/types.ts` - Type definitions (OCIConfig, ModelMetadata, etc.)
- `src/auth/` - Authentication providers (ConfigFile, InstancePrincipal, ResourcePrincipal)
- `src/models/registry.ts` - Model catalog (16+ models: Grok, Llama, Cohere, Gemini)
- `src/models/oci-language-model.ts` - LanguageModelV3 implementation
- `src/converters/messages.ts` - AI SDK → OCI message format conversion
- `src/streaming/sse-parser.ts` - Server-Sent Events parsing with eventsource-parser
- `src/errors/` - Error handling (OCIGenAIError, retryable detection)
- `src/index.ts` - Public API exports (createOCI, oci)

**Build**:

- tsup for CJS + ESM bundles
- Outputs: dist/index.js (ESM), dist/index.cjs (CJS), dist/index.d.ts

#### 2. @acedergren/oci-genai-provider (OpenCode Integration)

**Location**: `packages/oci-openai-compatible/`
**Purpose**: OpenCode-specific wrapper and utilities
**Published**: Yes (to npm)
**Status**: Placeholder (implementation pending)

**Planned Modules**:

- `src/types.ts` - OpenCode config types (displayName, description, enabled, priority)
- `src/register.ts` - Provider registration functions
- `src/config.ts` - Configuration helpers
- `src/utils.ts` - OpenCode-specific utilities
- `src/index.ts` - Re-exports core provider + OpenCode features

**Dependencies**:

- `workspace:*` → @acedergren/oci-genai-provider

#### 3. @acedergren/test-utils (Test Infrastructure)

**Location**: `packages/test-utils/`
**Purpose**: Shared test mocks and fixtures
**Published**: No (private package)

**Exports**:

- OCI SDK mocks:
  - `oci-common` mocks (ConfigFileAuthenticationDetailsProvider, InstancePrincipals, ResourcePrincipal)
  - `oci-generativeaiinference` mocks (GenerativeAiInferenceClient)
- Test fixtures:
  - `TEST_CONFIG` - Standard test configuration
  - `TEST_MODEL_IDS` - Model IDs for each family (grok, llama, cohere, gemini)
  - `TEST_OCIDS` - Common OCI resource identifiers

### Examples (examples/)

Demonstration applications showcasing different use cases:

#### 1. chatbot-demo (SvelteKit)

**Location**: `examples/chatbot-demo/`
**Tech**: SvelteKit + Vercel AI SDK
**Purpose**: Interactive chatbot with streaming responses

#### 2. nextjs-chatbot (Next.js)

**Location**: `examples/nextjs-chatbot/`
**Tech**: Next.js App Router + Vercel AI SDK
**Purpose**: Next.js-based chatbot implementation

#### 3. cli-tool (Node.js)

**Location**: `examples/cli-tool/`
**Tech**: Node.js terminal REPL
**Purpose**: Command-line chat interface

#### 4. rag-demo (Semantic Search)

**Location**: `examples/rag-demo/`
**Tech**: Document embeddings + semantic retrieval
**Purpose**: RAG (Retrieval-Augmented Generation) demo

#### 5. rag-reranking-demo

**Location**: `examples/rag-reranking-demo/`
**Tech**: RAG with reranking
**Purpose**: Enhanced RAG with result reranking

#### 6. stt-demo (Speech-to-Text)

**Location**: `examples/stt-demo/`
**Tech**: OCI Speech-to-Text API
**Purpose**: Audio transcription demo

### Configuration & Documentation (.claude/)

**Location**: `.claude/`
**Purpose**: AI agent instructions and project documentation

**Key Files**:

- `oci-setup.md` - OCI configuration guide
- `ci-cd.md` - CI/CD and deployment
- `security.md` - Security best practices
- `code-standards.md` - Naming conventions and patterns
- `credentials.md` - Credentials guide (local only, not in git)
- `dependency-compatibility-matrix.md` - Dependency version tracking

## Dependency Graph

```
oci-openai-compatible (wrapper)
    └─ workspace:* → oci-genai-provider (core)
                         └─ devDependencies → test-utils (mocks)

examples/* (demos)
    └─ workspace:* → oci-genai-provider (core)
```

## Why Monorepo?

1. **Core Independence** - oci-genai-provider can be used standalone
2. **OpenCode Isolation** - OpenCode features don't bloat core
3. **Shared Testing** - Consistent mocks across all packages
4. **Versioning Flexibility** - Independent package versioning
5. **Clear Boundaries** - Explicit dependency graph prevents circular deps

## Workspace Commands

```bash
pnpm install              # Install all dependencies
pnpm build                # Build all packages
pnpm test                 # Run all tests
pnpm test:coverage        # Coverage report
pnpm type-check          # TypeScript validation
pnpm lint                # ESLint all packages

# Package-specific:
pnpm --filter @acedergren/oci-genai-provider test
pnpm --filter @acedergren/oci-genai-provider build
```

## Publishing

- **Registry**: GitHub Packages (`@acedergren` scope)
- **Published Packages**:
  - `@acedergren/oci-genai-provider` (core provider)
  - `@acedergren/oci-genai-provider` (OpenCode integration)
- **Private Packages**:
  - `@acedergren/test-utils` (internal test utilities)

## Key Files

- `pnpm-workspace.yaml` - Workspace definition
- `package.json` (root) - Workspace scripts
- `packages/*/package.json` - Package definitions
- `packages/*/tsup.config.ts` - Build configurations
- `.claude/` - AI agent documentation and guides
- `CLAUDE.md` - Main project instructions (root)

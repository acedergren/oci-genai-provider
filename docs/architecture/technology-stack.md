# Technology Stack

**Analysis Date:** 2026-01-26

## Languages

**Primary:**

- TypeScript ^5.9.3 - Full codebase implementation
- JavaScript - Test utilities and workflow scripts

**Secondary:**

- Python - Optional MCP RAG server integration

## Runtime

**Environment:**

- Node.js ^22.0.0 (required for monorepo root, individual packages require >=20)
- pnpm ^10.28.0 (workspace package manager)

**Package Manager:**

- pnpm 10.28.0
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**

- @ai-sdk/provider ^3.0.2 - AI SDK v6 provider interface implementation
- @ai-sdk/provider-utils ^3.0.0 - Provider utility helpers
- ai ^6.0.49 - AI SDK runtime (peer dependency)

**Testing:**

- vitest ^4.0.17 - Test runner and framework
- @vitest/coverage-v8 ^2.1.0 - Code coverage provider

**Build/Dev:**

- turbo ^2.3.0 - Monorepo task orchestration
- tsx ^4.21.0 - TypeScript execution for scripts
- typescript ^5.9.3 - TypeScript compiler
- eslint ^9.15.0 - Linting
- @typescript-eslint/eslint-plugin ^8.50.0 - TypeScript linting rules
- @typescript-eslint/parser ^8.50.0 - TypeScript parser for ESLint
- prettier ^3.7.4 - Code formatter

## Key Dependencies

**Critical:**

- oci-common ^2.122.2 - OCI SDK authentication and common utilities
- oci-generativeaiinference ^2.122.2 - OCI GenAI API client
- oci-secrets ^2.122.2 - OCI Secrets Manager integration
- oracledb ^6.10.0 - Oracle database driver (for RAG)

**Infrastructure:**

- eventsource-parser ^3.0.0 - Server-Sent Events (SSE) parsing for streaming responses
- @modelcontextprotocol/sdk ^1.0.0 - MCP (Model Context Protocol) SDK for RAG servers
- open ^10.0.0 - Cross-platform browser opener for IDCS OAuth flow
- zod ^4.3.6 - Runtime type validation
- fast-check ^3.15.0 - Property-based testing
- msw ^2.0.0 - Mock Service Worker for API mocking in tests

**Utilities:**

- @changesets/cli ^2.27.0 - Changelog and versioning management
- yaml ^2.8.2 - YAML parsing
- globals ^17.1.0 - ESLint globals configuration

## Configuration

**Environment:**

- Configured via environment variables (see INTEGRATIONS.md for complete list)
- Settings can be overridden programmatically via `createOCIGenAI()` factory function
- Defaults read from `~/.oci/config` (OCI CLI configuration file)

**Build:**

- TypeScript: `tsconfig.json` per package with strict mode enabled
- ESLint: `.eslintrc.js` (inherited from root)
- Prettier: `.prettierrc` with 2-space indentation, 100-char line width
- Test Coverage: 80% lines/functions, 75% branches (vitest thresholds)

**Workspace:**

- pnpm-workspace.yaml defines packages and shared dependency catalog
- Five packages: `oci-genai-provider` (core provider), `oci-openai-compatible` (OpenAI wrapper), `oci-anthropic-compatible` (Anthropic wrapper), `oci-genai-setup` (CLI tool), `test-utils` (shared testing)
- Turbo auto-detects tasks from npm scripts

## Platform Requirements

**Development:**

- Node.js 22+ (root) / 20+ (packages)
- pnpm 10.28.0
- Optional: Python 3.8+ (for MCP RAG integration)
- Optional: Oracle Instant Client (for Oracle ADB RAG mode)

**Production:**

- Node.js 20+
- OCI CLI credentials (~/.oci/config) OR IDCS OAuth credentials
- Optional: Oracle ADB connection credentials (for DB RAG mode)
- Optional: HTTP RAG endpoint or MCP server (for RAG modes)

---

_Stack analysis: 2026-01-26_

# Coding Conventions

**Analysis Date:** 2026-01-26

## Naming Patterns

**Files:**
- Kebab-case for source files: `oci-genai-provider.ts`, `stream-parser.ts`, `instance-principal.ts`
- Kebab-case for test files: `auth.test.ts`, `tool-converter.test.ts`
- Specification tests: `.spec.ts` suffix in `test/spec/` subdirectories
- Contract tests: `.contract.ts` suffix in `test/contract/` subdirectories
- Property-based tests: `.property.ts` suffix in `test/property/` subdirectories

**Functions:**
- camelCase for regular functions: `getAuthProvider`, `parseSSEStream`, `convertToolsToOCI`, `createOCIGenAI`
- camelCase for exports: `createDBRAGClient` (exported as `makeDBRAGClient` to avoid OpenCode provider detection)
- Private functions use camelCase with underscore prefix for internal-only: `_resetForTesting`

**Variables:**
- camelCase for all variables: `compartmentId`, `resolvedSettings`, `authProvider`, `ragContextInjector`
- Uppercase for constants: `DEFAULT_RETRY_OPTIONS`, `OCI_MODELS`
- Environment variable names uppercase with underscores: `OCI_COMPARTMENT_ID`, `OCI_CONFIG_PROFILE`, `OCI_REGION`

**Types:**
- PascalCase for interface and type names: `OCIGenAIProvider`, `OCIGenAIChatModel`, `AuthResult`, `StreamEvent`
- Type aliases in file exports: `type OCIModelSpec`, `type RAGSource`, `type AuthOptions`

## Code Style

**Formatting:**
- Tool: Prettier with ESLint
- Configuration: `.prettierrc` at repository root
- Key settings:
  - Semi-colons: true
  - Single quotes: true
  - Tab width: 2 spaces
  - No tabs, use spaces
  - Trailing comma: es5
  - Print width: 100 characters
  - Arrow parens: always

**Linting:**
- Tool: ESLint (flat config in `eslint.config.js`)
- TypeScript parser: `@typescript-eslint/parser`
- Key rules:
  - `@typescript-eslint/no-explicit-any`: warn (avoid `any` types)
  - `@typescript-eslint/no-unused-vars`: error with pattern `^_` (unused params ok if prefixed with `_`)
  - `no-console`: warn with allow list for `warn` and `error`
  - Disabled in files with `/* eslint-disable */` at top (used for large/complex files)

**Import Organization:**
```typescript
// Order: type imports, then node/external, then internal relative
import type { TypeName } from '@ai-sdk/provider';
import { Class } from 'oci-common';
import { getAuthProvider } from './auth/index.js';
```

**Path Aliases:**
- None explicitly configured; files use `.js` extensions in imports (ESM)
- Workspace imports reference full package names: `@acedergren/opencode-oci-genai`

## Error Handling

**Patterns:**
- Errors logged to console with prefixed context: `[OCI Auth]`, `[OCI Session]`, `[OCI OAuth]`
- Example: `console.error('[OCI Auth] Failed to load config file: ${error}')`
- Use `Error` constructor for custom errors: `throw new Error('No authentication method available')`
- Errors include helpful messages for debugging

**Error Categories:**
- Authentication errors: logged then rethrown or handled gracefully
- Network errors: caught in auth modules and logged at `console.error`
- Parsing errors: gracefully handled in stream parser (no crash on malformed JSON)
- Type validation: uses `zod` schemas in test directory for validation

## Logging

**Framework:** Native `console` (no dedicated logger library)

**Patterns:**
- `console.log()` for informational messages
- `console.error()` for errors
- Only console.log and console.error allowed (no debug/info/warn)
- Prefix all logs with module context: `[OCI Auth]`, `[OCI Session]`, `[OCI OAuth]`
- Informational logs in auth flow: session status, auth method selection
- Error logs for failures with minimal context

**Examples:**
```typescript
console.log('[OCI Auth] No existing auth found, starting browser OAuth flow...');
console.error('[OCI Auth] Failed to load config file: ${error}');
console.log('[OCI Session] Session saved successfully');
```

## Comments

**When to Comment:**
- JSDoc comments required for exported functions and interfaces
- Explanation of WHY, not WHAT (code should be self-documenting)
- Complex logic: e.g., SSE parsing comments explain format and behavior
- Warnings about side effects or env var trimming for safety

**JSDoc/TSDoc:**
- All exported functions have JSDoc blocks
- Parameters documented with `@param`
- Return values documented with `@returns`
- Errors documented with `@throws`
- Example usage in JSDoc for complex functions

**Example:**
```typescript
/**
 * Get authentication provider using the best available method.
 * Throws if no authentication method is available.
 *
 * Priority order:
 * 1. Config file (if exists)
 * 2. Instance principal (if in OCI Compute)
 * 3. Resource principal (if in OCI Functions)
 * 4. OAuth flow (if IDCS config available)
 *
 * @param options - Authentication options
 * @returns Authentication result with provider and method used
 * @throws Error if no auth method available
 */
export async function getAuthProvider(options: AuthOptions = {}): Promise<AuthResult>
```

## Function Design

**Size:**
- Typical functions 50-150 lines
- Large files (>300 lines) allowed for complex models: `oci-genai-chat-model.ts` (20K+ bytes), `oci-genai-settings.ts` (24K+ bytes)
- Functions broken into logical sections with comments for complex files

**Parameters:**
- Prefer object parameter patterns: `config: OCIGenAIChatModelConfig`
- Optional parameters in interfaces with `?` operator
- Type all parameters explicitly

**Return Values:**
- Functions return typed results: `Promise<AuthResult>`, `AsyncGenerator<StreamEvent>`
- No implicit `undefined` returns; explicit `void` or `null` for empty returns
- Streaming functions use async generators: `async function* parseSSEStream()`

## Module Design

**Exports:**
- Each module exports main functionality plus types
- Example from `index.ts`: main provider, settings types, RAG exports, resilience utilities
- Re-exports from sub-modules for convenience: `export { getConfigFileAuth } from './config-file.js'`

**Barrel Files:**
- `index.ts` files at directory levels aggregate exports
- `auth/index.ts` re-exports all auth functions and types
- `rag/index.ts` aggregates RAG client exports

**Module Structure Example:**
```typescript
// src/auth/index.ts - aggregates auth functions
export { getConfigFileAuth } from './config-file.js';
export { getAuthProvider } from './index.js';
export type { AuthResult } from './index.js';
```

---

*Convention analysis: 2026-01-26*

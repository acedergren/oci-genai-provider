# AGENTS.md

This file provides AI coding agents with essential context and guidelines for working with the OpenCode OCI GenAI monorepo.

## Project Overview

Vercel AI SDK v3 provider for Oracle Cloud Infrastructure (OCI) Generative AI, organized as a pnpm workspace monorepo with three packages:

- **@acedergren/oci-genai-provider** - Core provider (standalone)
- **@acedergren/opencode-oci-genai** - OpenCode integration
- **@acedergren/test-utils** - Shared test infrastructure (private)

## Setup Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Format code
pnpm format
```

### Package-Specific Commands

```bash
# Test specific package
pnpm --filter @acedergren/oci-genai-provider test

# Build specific package
pnpm --filter @acedergren/oci-genai-provider build

# Watch mode for tests
pnpm --filter @acedergren/oci-genai-provider test -- --watch

# Run specific test file
pnpm --filter @acedergren/oci-genai-provider test -- <test-file>
```

## Code Style Guidelines

### TypeScript Standards

- **Strict mode enabled** - No `any` types, use `unknown` instead
- **ESM modules** - Use `.js` extensions in imports even for `.ts` files
- **Explicit return types** - All functions must have return types
- **Naming conventions**:
  - Classes: PascalCase (`OCILanguageModel`)
  - Functions: camelCase (`generateText`)
  - Constants: UPPER_SNAKE_CASE (`DEFAULT_REGION`)
  - Files: kebab-case (`oci-language-model.ts`)

### Common Patterns

```typescript
// Import order: external first, then internal
import { LanguageModelV3 } from '@ai-sdk/provider';
import { createAuth } from './auth/index.js';

// Async functions without await
// DON'T: async doStream() { throw new Error() }
// DO: doStream() { return Promise.reject(new Error()) }

// Unused parameters
// Prefix with underscore: _options, _config
```

## Testing Strategy

### Test-Driven Development (TDD)

**Follow strict RED-GREEN-REFACTOR-COMMIT cycles:**

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass test
3. **REFACTOR**: Improve code while keeping tests passing
4. **COMMIT**: Create atomic commit

### Test Organization

- **121 comprehensive tests** across 14 test files
- **80%+ coverage target** (branches, functions, lines, statements)
- **Shared test utilities** in `@acedergren/test-utils`

### Test Utilities

```typescript
import { TEST_CONFIG, TEST_MODEL_IDS, TEST_OCIDS } from '@acedergren/test-utils';

// OCI SDK mocks automatically available via jest.mock()
const model = oci(TEST_MODEL_IDS.cohere, TEST_CONFIG);
```

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm --filter @acedergren/oci-genai-provider test -- --watch

# Specific file
pnpm --filter @acedergren/oci-genai-provider test -- __tests__/provider.test.ts

# Coverage report
pnpm test:coverage
```

## Git Conventions

### Commit Messages

Follow conventional commits format:

```
type(scope): description

Body with details
- Detail 1
- Detail 2

<test count> tests passing.

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
**Scopes**: `provider`, `models`, `auth`, `streaming`, `converters`, `errors`

### Pre-Commit Hooks

Pre-commit hooks automatically run:

1. Linting (ESLint)
2. Type checking (TypeScript)
3. Format checking (Prettier)
4. Security scanning (secret detection)
5. Tests (if TypeScript files changed)

**Common linting fixes**:

- Remove `async` from functions without `await`
- Prefix unused parameters with `_`
- Add explicit return types

## PR Conventions

### PR Requirements

- [ ] All tests passing (`pnpm test`)
- [ ] Type checking passing (`pnpm type-check`)
- [ ] Lint passing (`pnpm lint`)
- [ ] 80%+ test coverage maintained
- [ ] Atomic commits with clear messages
- [ ] Documentation updated if API changed
- [ ] No security vulnerabilities introduced

### PR Description Template

```markdown
## Summary

[Brief description of changes]

## Changes

- Change 1
- Change 2

## Test Plan

[How to test the changes]

## Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All checks passing
```

## Architecture Guidelines

### Monorepo Structure

```
packages/
├── oci-genai-provider/          # Core provider
│   ├── src/
│   │   ├── index.ts             # Public API exports
│   │   ├── types.ts             # Type definitions
│   │   ├── auth/                # Authentication
│   │   ├── models/              # Model registry & implementation
│   │   ├── converters/          # Message conversion
│   │   ├── streaming/           # SSE parsing
│   │   └── errors/              # Error handling
│   └── __tests__/               # 121 tests
│
├── opencode-integration/        # OpenCode wrapper
│   └── src/
│       ├── index.ts             # Re-exports + OpenCode utils
│       └── register.ts          # Provider registration
│
└── test-utils/                  # Shared test infrastructure
    └── src/
        ├── index.ts             # Test fixtures
        ├── oci-common.ts        # Auth mocks
        └── oci-generativeaiinference.ts  # GenAI mocks
```

### Package Dependencies

```
test-utils (mocks)
    ↑ devDependencies
oci-genai-provider (core)
    ↑ dependencies
opencode-integration (wrapper)
```

### Key Design Patterns

1. **Provider Factory Pattern**: `createOCI()` returns provider with `model()` method
2. **Authentication Cascade**: Environment → Constructor → Config file → Defaults
3. **Streaming Architecture**: SSE parser → Async iterator
4. **Tool Calling**: Zod schema → JSON Schema → OCI format

## Project-Specific Context

### OCI Configuration

**Required Environment Variables**:

```bash
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..xxxxx
OCI_REGION=eu-frankfurt-1
OCI_CONFIG_PROFILE=FRANKFURT
```

**Authentication Methods**:

- API Key (from `~/.oci/config`)
- Instance Principal (OCI Compute)
- Resource Principal (OCI Functions)

### Supported Models

**Model Families**:

- xAI Grok (4-maverick, 4-scout, 3, 3-mini)
- Meta Llama (3.3-70b, 3.2-vision, 3.1-405b)
- Cohere Command (R+, A, A-reasoning, A-vision)
- Google Gemini (2.5-pro, 2.5-flash, 2.5-flash-lite)

### Key Technical Decisions

1. **Vercel AI SDK v3**: Using `LanguageModelV3` interface for streaming and tool calling
2. **ESM Modules**: Using ES modules with `.js` extensions in imports
3. **Monorepo**: Separation allows core provider to be used standalone
4. **TDD Workflow**: All features developed with test-first approach
5. **Shared Test Utils**: Centralized mocks avoid duplication

## Documentation

**Key Documentation Files**:

- `docs/README.md` - Documentation index
- `docs/architecture/README.md` - Architecture overview
- `docs/testing/README.md` - Testing guide
- `docs/plans/2026-01-27-core-provider-tdd-implementation.md` - TDD implementation plan
- `CLAUDE.md` - Claude Code specific context
- `llms.txt` - LLM context files

**Serena Memories** (project context):

- `monorepo-architecture` - Package structure, dependencies
- `testing-strategy-tdd` - 121 tests, TDD workflow
- `implementation-status` - Current status, pending tasks
- `core-provider-api` - Public API, usage examples

## Common Tasks

### Adding a New Model

1. Add to `packages/oci-genai-provider/src/models/registry.ts`
2. Add test in `packages/oci-genai-provider/src/models/__tests__/registry.test.ts`
3. Update `docs/reference/oci-genai-models/README.md`
4. Update `llms-models.txt`

### Updating OCI SDK Mocks

1. Update mocks in `packages/test-utils/src/oci-*.ts`
2. Run all tests to verify: `pnpm test`
3. Update `packages/test-utils/README.md` if exports changed

### Adding a New Test

1. Follow TDD workflow: RED → GREEN → REFACTOR → COMMIT
2. Use shared fixtures from `@acedergren/test-utils`
3. Ensure 80%+ coverage maintained
4. Run specific test file to verify

## Troubleshooting

### Tests Failing

```bash
# Run specific test file
pnpm --filter @acedergren/oci-genai-provider test -- __tests__/provider.test.ts

# Run with verbose output
pnpm --filter @acedergren/oci-genai-provider test -- --verbose

# Run in watch mode for debugging
pnpm --filter @acedergren/oci-genai-provider test -- --watch
```

### Linting Errors

```bash
# Check lint errors
pnpm lint

# Auto-fix where possible
pnpm lint -- --fix

# Format code
pnpm format
```

### Type Errors

```bash
# Check types
pnpm type-check

# Check specific package
pnpm --filter @acedergren/oci-genai-provider type-check
```

### Pre-Commit Hook Failures

Pre-commit hooks run automatically. To fix:

1. Review the error output
2. Fix the issue (lint/type/test)
3. Stage the fix: `git add .`
4. Commit again

To skip hooks (NOT recommended):

```bash
git commit --no-verify
```

## Contact and Support

- **Repository**: `/Users/acedergr/Projects/opencode-oci-genai`
- **Documentation**: `docs/README.md`
- **Issues**: Use descriptive commit messages for traceability

---

**Last Updated**: 2026-01-27
**Maintained By**: AI Coding Agents Working Group

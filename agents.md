# AGENTS.md

Context and guidelines for AI coding agents working with this repository.

## Project Summary

OCI Generative AI provider for Vercel AI SDK. A pnpm workspace monorepo with three packages:

| Package                          | Purpose                      | Published |
| -------------------------------- | ---------------------------- | --------- |
| `@acedergren/oci-genai-provider` | Core Vercel AI SDK provider  | Yes       |
| `@acedergren/opencode-oci-genai` | OpenCode convenience wrapper | Yes       |
| `@acedergren/test-utils`         | Shared test infrastructure   | No        |

## Essential Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run all tests (121 tests)
pnpm test:coverage    # Run with coverage report
pnpm type-check       # TypeScript validation
pnpm lint             # ESLint
pnpm format           # Prettier
```

### Package-Specific

```bash
pnpm --filter @acedergren/oci-genai-provider test
pnpm --filter @acedergren/oci-genai-provider build
pnpm --filter @acedergren/oci-genai-provider test -- --watch
```

## Code Standards

### TypeScript

- Strict mode, no `any` types
- Explicit return types on all functions
- ESM imports with `.js` extensions
- PascalCase for classes, camelCase for functions, UPPER_SNAKE_CASE for constants

### Testing

- TDD workflow: RED → GREEN → REFACTOR → COMMIT
- 80%+ coverage target
- Tests in `__tests__/` directories alongside source
- Use fixtures from `@acedergren/test-utils`

### Commits

Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
Scopes: `provider`, `models`, `auth`, `streaming`, `converters`, `errors`

```bash
git commit -m "feat(provider): add embedding support"
```

## Architecture

```
packages/
├── oci-genai-provider/          # Core provider
│   └── src/
│       ├── index.ts             # Public exports
│       ├── types.ts             # Type definitions
│       ├── auth/                # Authentication
│       ├── models/              # Model registry
│       ├── converters/          # Message conversion
│       ├── streaming/           # SSE parsing
│       └── errors/              # Error handling
├── opencode-integration/        # OpenCode wrapper
└── test-utils/                  # Shared mocks
```

### Dependency Graph

```
test-utils (mocks)
    ↑ devDependencies
oci-genai-provider (core)
    ↑ dependencies
opencode-integration (wrapper)
```

## Key Patterns

### Authentication

```typescript
// Lazy initialization - auth created on first API call
private async getClient(): Promise<GenerativeAiInferenceClient> {
  if (!this._client) {
    const authProvider = await createAuthProvider(this.config);
    this._client = new GenerativeAiInferenceClient({ authenticationDetailsProvider: authProvider });
  }
  return this._client;
}
```

### Error Handling

All OCI errors wrapped with `handleOCIError()` for contextual messages and retry detection.

### Async Functions

```typescript
// DON'T: async without await
async doStream() { throw new Error() }

// DO: return Promise directly
doStream() { return Promise.reject(new Error()) }
```

## Environment Variables

```bash
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..xxxxx  # Required
OCI_REGION=eu-frankfurt-1                         # Optional
OCI_CONFIG_PROFILE=FRANKFURT                      # Optional
```

## Supported Models

- **xAI Grok**: xai.grok-4, xai.grok-4-fast-reasoning, xai.grok-4-fast-non-reasoning, xai.grok-3, xai.grok-3-mini
- **Meta Llama**: llama-3.3-70b, llama-3.2-vision, llama-3.1-405b
- **Cohere**: command-r-plus, command-a, command-a-reasoning
- **Google Gemini**: gemini-2.5-pro, gemini-2.5-flash

## Common Tasks

### Adding a Model

1. Add to `packages/oci-genai-provider/src/models/registry.ts`
2. Add test in `packages/oci-genai-provider/src/models/__tests__/registry.test.ts`
3. Update `docs/reference/oci-genai-models/README.md`

### Adding a Test

1. Write failing test (RED)
2. Write minimal code to pass (GREEN)
3. Refactor while passing (REFACTOR)
4. Commit

### Updating Mocks

1. Edit `packages/test-utils/src/oci-*.ts`
2. Run `pnpm test` to verify
3. Update README if exports changed

## Troubleshooting

### Test Failures

```bash
pnpm --filter @acedergren/oci-genai-provider test -- --verbose
```

### Lint Errors

```bash
pnpm lint -- --fix
```

### Type Errors

```bash
rm -rf packages/*/dist && pnpm build && pnpm type-check
```

## Documentation

- `docs/README.md` - Documentation index
- `docs/architecture/README.md` - Architecture overview
- `docs/testing/README.md` - Testing guide
- `CLAUDE.md` - Claude Code specific context

---

**Last Updated**: 2026-01-28

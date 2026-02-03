# Development Guide

Everything you need to work on this project locally.

## Requirements

- **Node.js** 20.0.0 or higher
- **pnpm** 8.0.0 or higher (`npm install -g pnpm`)
- **Git**

Optional but recommended:

- **OCI account** with Generative AI access for integration testing
- **VS Code** with TypeScript and Prettier extensions

## Quick Start

```bash
git clone https://github.com/acedergren/oci-genai-provider.git
cd oci-genai-provider
pnpm install
pnpm build
pnpm test
```

If tests pass, you're ready to develop.

## Project Structure

This is a pnpm workspace monorepo:

```
packages/
├── oci-genai-provider/     # Core provider (published)
├── oci-openai-compatible/  # OpenAI-compatible wrapper (published)
├── oci-genai-setup/        # CLI setup tool (published)
├── agent-state/            # Agent state management (private)
└── test-utils/             # Shared test utilities (private)

docs/                       # Documentation
```

## Common Commands

| Command              | Purpose                    |
| -------------------- | -------------------------- |
| `pnpm install`       | Install all dependencies   |
| `pnpm build`         | Build all packages         |
| `pnpm test`          | Run all tests              |
| `pnpm test:watch`    | Run tests in watch mode    |
| `pnpm test:coverage` | Generate coverage report   |
| `pnpm type-check`    | TypeScript validation      |
| `pnpm lint`          | Run ESLint                 |
| `pnpm format`        | Format code with Prettier  |
| `pnpm dev`           | Watch mode for development |

### Working with Specific Packages

```bash
# Build one package
pnpm --filter @acedergren/oci-genai-provider build

# Test one package
pnpm --filter @acedergren/oci-genai-provider test

# Watch tests for one package
pnpm --filter @acedergren/oci-genai-provider test -- --watch
```

## Development Workflow

### 1. Make Your Changes

Edit files in the appropriate package under `packages/`.

### 2. Run Tests

```bash
pnpm test
```

For faster feedback during development:

```bash
pnpm --filter @acedergren/oci-genai-provider test -- --watch
```

### 3. Check Types and Lint

```bash
pnpm type-check
pnpm lint
```

### 4. Format Code

```bash
pnpm format
```

### 5. Commit

Pre-commit hooks automatically run linting, type checking, and tests. If they fail:

```bash
# Fix formatting
pnpm format

# Fix lint issues
pnpm lint -- --fix

# Re-run tests
pnpm test
```

## OCI Configuration (Optional)

For integration testing with real OCI services, configure your credentials:

### 1. Create OCI Config

```ini
# ~/.oci/config
[DEFAULT]
user=ocid1.user.oc1..your_user_id
fingerprint=your_fingerprint
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..your_tenancy_id
region=eu-frankfurt-1
```

### 2. Set Environment Variables

Create `.env.local` in the project root:

```bash
OCI_REGION=eu-frankfurt-1
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your_compartment_id
OCI_CONFIG_PROFILE=DEFAULT
```

This file is git-ignored. Never commit credentials.

### 3. Verify Setup

```bash
oci iam region list
```

If this works, your OCI configuration is correct.

## Testing

### Test Organization

Tests live alongside source code in `__tests__` directories:

```
packages/oci-genai-provider/src/
├── auth/
│   ├── index.ts
│   └── __tests__/
│       └── auth.test.ts
├── models/
│   ├── registry.ts
│   └── __tests__/
│       └── registry.test.ts
```

### Running Specific Tests

```bash
# Run one test file
pnpm --filter @acedergren/oci-genai-provider test -- auth.test.ts

# Run tests matching a pattern
pnpm --filter @acedergren/oci-genai-provider test -- --testNamePattern="should create"

# Run with verbose output
pnpm --filter @acedergren/oci-genai-provider test -- --verbose
```

### Coverage

```bash
pnpm test:coverage
```

Target: 80%+ coverage for all packages.

### Test Utilities

Shared mocks and fixtures are in `@acedergren/test-utils`:

```typescript
import { TEST_CONFIG, TEST_MODEL_IDS, TEST_OCIDS } from '@acedergren/test-utils';
```

## Debugging

### VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["--run", "--no-file-parallelism"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Console Debugging

```typescript
// Add debug output
console.log('Debug:', variable);

// Use debugger statement
debugger; // Then run with node --inspect
```

### Debug Logging

```bash
DEBUG=oci-genai:* pnpm test
```

## Building

### Build All Packages

```bash
pnpm build
```

### Build Order

Packages build in dependency order:

1. `test-utils` (no dependencies)
2. `oci-genai-provider` (depends on test-utils for dev)
3. `oci-openai-compatible` (standalone)
4. `oci-genai-setup` (depends on oci-genai-provider)
5. `agent-state` (standalone)

### Clean Build

```bash
rm -rf packages/*/dist
pnpm build
```

## Publishing

### Automated (Recommended)

1. Update version in `packages/*/package.json`
2. Update `CHANGELOG.md`
3. Commit changes
4. Create and push tag:
   ```bash
   git tag v0.2.0
   git push origin main --tags
   ```
5. GitHub Actions publishes to npm automatically

### Manual

```bash
pnpm --filter @acedergren/oci-genai-provider publish
```

## Troubleshooting

### "Cannot find module" after install

```bash
rm -rf node_modules packages/*/node_modules
pnpm install
pnpm build
```

### Tests fail with timeout

```bash
# Increase timeout
pnpm test -- --testTimeout=30000
```

### Pre-commit hook fails

```bash
# See what's failing
pnpm lint
pnpm type-check
pnpm test

# Fix and retry
pnpm format
git add .
git commit
```

### Type errors after dependency update

```bash
rm -rf packages/*/dist
pnpm build
pnpm type-check
```

## Code Style

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` instead)
- Explicit return types on functions
- ESM imports with `.js` extensions

### Naming

- Classes: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

### Imports

```typescript
// External imports first
import { LanguageModelV3 } from '@ai-sdk/provider';

// Internal imports second
import { createAuth } from './auth/index.js';
```

## Getting Help

- **Development questions**: Open a [discussion](https://github.com/acedergren/oci-genai-provider/discussions)
- **Bug reports**: Open an [issue](https://github.com/acedergren/oci-genai-provider/issues)
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)

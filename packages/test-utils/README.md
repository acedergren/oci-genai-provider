# @acedergren/test-utils

Shared test utilities for the OCI GenAI monorepo.

> **Private Package:** This package is not published to npm. It's only used within the monorepo for testing.

> **Community Project** — This is part of an independent, community-maintained project with no official affiliation with Oracle Corporation.

## Purpose

This package provides common test mocks, fixtures, and helpers used across all packages in the monorepo. By centralizing test utilities, we ensure:

- **Consistency** - Same mocks across all packages
- **Reusability** - Both core and OpenCode packages use the same fixtures
- **Maintainability** - Single place to update when OCI SDK changes
- **Clarity** - Clear separation between production and test code

## Contents

### OCI SDK Mocks

Located in `src/`:

- **`oci-common.ts`** - Mock implementations of OCI authentication providers
  - `ConfigFileAuthenticationDetailsProvider`
  - `InstancePrincipalsAuthenticationDetailsProviderBuilder`
  - `ResourcePrincipalAuthenticationDetailsProvider`
  - `Region`

- **`oci-generativeaiinference.ts`** - Mock implementations of GenAI client
  - `GenerativeAiInferenceClient`
  - Mock chat responses for testing

### Test Fixtures

Exported from `src/index.ts`:

```typescript
export const TEST_CONFIG = {
  region: 'eu-frankfurt-1',
  compartmentId: 'ocid1.compartment.oc1..test',
  profile: 'DEFAULT',
} as const;

export const TEST_MODEL_IDS = {
  grok: 'xai.grok-4',
  llama: 'meta.llama-3.3-70b-instruct',
  cohere: 'cohere.command-r-plus',
  gemini: 'google.gemini-2.5-flash',
} as const;

export const TEST_OCIDS = {
  compartment: 'ocid1.compartment.oc1..test',
  user: 'ocid1.user.oc1..test',
  tenancy: 'ocid1.tenancy.oc1..test',
} as const;
```

## Usage

### In Tests

```typescript
import { describe, it, expect, jest } from '@jest/globals';
import { TEST_CONFIG, TEST_MODEL_IDS } from '@acedergren/test-utils';
import { createOCI } from '../index';

// Mocks are automatically available via jest.mock()
jest.mock('oci-common');
jest.mock('oci-generativeaiinference');

describe('My Test Suite', () => {
  it('should create provider with test config', () => {
    const provider = createOCI(TEST_CONFIG);
    const model = provider.model(TEST_MODEL_IDS.cohere);

    expect(model.modelId).toBe(TEST_MODEL_IDS.cohere);
    expect(model.provider).toBe('oci-genai');
  });
});
```

### Workspace Dependencies

Add to your package's `package.json`:

```json
{
  "devDependencies": {
    "@acedergren/test-utils": "workspace:*"
  }
}
```

## Development

### Adding New Fixtures

1. Add to `src/index.ts`
2. Export as const
3. Document in this README
4. Update tests in all packages that need it

### Updating Mocks

When OCI SDK changes:

1. Update mock implementation in `src/oci-*.ts`
2. Run all tests: `pnpm test` (from root)
3. Fix any breakages in dependent packages

## Structure

```
packages/test-utils/
├── src/
│   ├── index.ts                      # Exported fixtures
│   ├── oci-common.ts                 # Auth mocks
│   └── oci-generativeaiinference.ts  # GenAI client mocks
├── package.json                      # Private package config
├── tsconfig.json                     # TypeScript config
└── README.md                         # This file
```

## Testing the Test Utils

This package doesn't have its own tests (it IS the test infrastructure). However:

- **Type checking**: Runs with `pnpm type-check`
- **Integration**: Verified by all 121 tests in dependent packages
- **Coverage**: Indirectly tested by core provider and OpenCode integration

## Links

- [Testing Guide](../../docs/testing/README.md) - Comprehensive testing documentation
- [Test Suite Specification](../../docs/plans/2026-01-26-test-suite-specification.md) - All 121 tests
- [TDD Plan](../../docs/plans/2026-01-27-core-provider-tdd-implementation.md) - Implementation workflow

# @acedergren/test-utils

Shared test utilities for the OCI GenAI monorepo.

## Purpose

This package provides common test mocks, fixtures, and helpers used across all packages in the monorepo.

## Contents

### OCI SDK Mocks

- `oci-common` - Mock implementations of OCI authentication providers
- `oci-generativeaiinference` - Mock implementations of GenAI client and models

### Test Fixtures

- `TEST_CONFIG` - Standard test configuration object
- `TEST_MODEL_IDS` - Model IDs for each provider family
- `TEST_OCIDS` - Common OCI resource identifiers

## Usage

```typescript
import { TEST_CONFIG, TEST_MODEL_IDS } from '@acedergren/test-utils';

describe('My Test', () => {
  it('should use test config', () => {
    expect(TEST_CONFIG.region).toBe('eu-frankfurt-1');
  });
});
```

## Note

This package is private and not published to npm. It's only used within the monorepo for testing.

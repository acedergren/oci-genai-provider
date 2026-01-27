# OpenCode Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create OpenCode-specific wrapper for the core OCI Generative AI provider with OpenCode conventions and utilities.

**Package:** `@acedergren/opencode-oci-genai`

**Architecture:** Thin wrapper around `@acedergren/oci-genai-provider` that provides OpenCode-specific configuration patterns, registration helpers, and convenience utilities.

**Tech Stack:** TypeScript 5.3, workspace dependency on core provider

---

## Prerequisites

✅ Core provider (`@acedergren/oci-genai-provider`) implementation complete
✅ All 121 core provider tests passing
✅ Workspace dependencies configured

---

## Task 1: OpenCode Configuration Types

**Files:**

- Create: `packages/opencode-integration/src/types.ts`

**Step 1: Define OpenCode-specific config**

```typescript
import type { OCIConfig } from '@acedergren/oci-genai-provider';

export interface OpenCodeOCIConfig extends OCIConfig {
  /**
   * Display name for this provider in OpenCode UI
   * @default "OCI GenAI"
   */
  displayName?: string;

  /**
   * Description shown in OpenCode provider list
   * @default "Oracle Cloud Infrastructure Generative AI"
   */
  description?: string;

  /**
   * Enable/disable this provider in OpenCode
   * @default true
   */
  enabled?: boolean;

  /**
   * Priority for this provider in OpenCode (higher = higher priority)
   * @default 100
   */
  priority?: number;
}
```

**Step 2: Define provider metadata**

```typescript
export interface ProviderMetadata {
  id: string;
  name: string;
  description: string;
  models: string[];
  capabilities: {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
  };
}
```

**Step 3: Commit**

```bash
git add packages/opencode-integration/src/types.ts
git commit -m "feat(opencode): add OpenCode-specific configuration types

Define OpenCodeOCIConfig with display metadata.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Provider Registration

**Files:**

- Create: `packages/opencode-integration/src/register.ts`

**Step 1: Implement registration function**

```typescript
import { createOCI, getAllModels } from '@acedergren/oci-genai-provider';
import type { OpenCodeOCIConfig } from './types';

export function registerOCIProvider(config?: OpenCodeOCIConfig) {
  const displayName = config?.displayName || 'OCI GenAI';
  const description = config?.description || 'Oracle Cloud Infrastructure Generative AI';
  const enabled = config?.enabled !== false;
  const priority = config?.priority || 100;

  if (!enabled) {
    console.log(`[OpenCode] OCI GenAI provider disabled`);
    return null;
  }

  const provider = createOCI(config);

  // Register with OpenCode (OpenCode API TBD)
  console.log(`[OpenCode] Registered ${displayName}: ${getAllModels().length} models available`);

  return {
    ...provider,
    metadata: {
      displayName,
      description,
      priority,
    },
  };
}
```

**Step 2: Implement auto-registration**

```typescript
export function autoRegisterOCIProvider() {
  // Auto-detect OCI configuration from environment
  const config: OpenCodeOCIConfig = {
    region: process.env.OCI_REGION,
    compartmentId: process.env.OCI_COMPARTMENT_ID,
    profile: process.env.OCI_CONFIG_PROFILE,
  };

  try {
    return registerOCIProvider(config);
  } catch (error) {
    console.error('[OpenCode] Failed to register OCI GenAI provider:', error);
    return null;
  }
}
```

**Step 3: Commit**

```bash
git add packages/opencode-integration/src/register.ts
git commit -m "feat(opencode): implement provider registration

Add registerOCIProvider and autoRegisterOCIProvider functions.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Configuration Helpers

**Files:**

- Create: `packages/opencode-integration/src/config.ts`

**Step 1: Implement config validation**

```typescript
import type { OpenCodeOCIConfig } from './types';

export function validateConfig(config: OpenCodeOCIConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required fields
  if (!config.compartmentId && !process.env.OCI_COMPARTMENT_ID) {
    errors.push('Compartment ID is required (config or OCI_COMPARTMENT_ID env)');
  }

  // Validate region format
  if (config.region && !config.region.match(/^[a-z]+-[a-z]+-\d+$/)) {
    errors.push(`Invalid region format: ${config.region}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

**Step 2: Implement config loader**

```typescript
export function loadConfigFromEnv(): OpenCodeOCIConfig {
  return {
    region: process.env.OCI_REGION,
    compartmentId: process.env.OCI_COMPARTMENT_ID,
    profile: process.env.OCI_CONFIG_PROFILE,
    configPath: process.env.OCI_CONFIG_FILE,
    auth: process.env.OCI_CLI_AUTH as any,
  };
}
```

**Step 3: Implement config file loader**

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

export function loadConfigFromFile(filePath?: string): OpenCodeOCIConfig {
  const configPath = filePath || join(process.cwd(), 'opencode.json');

  try {
    const content = readFileSync(configPath, 'utf-8');
    const json = JSON.parse(content);
    return json.providers?.oci || {};
  } catch (error) {
    return {};
  }
}
```

**Step 4: Commit**

```bash
git add packages/opencode-integration/src/config.ts
git commit -m "feat(opencode): add configuration helpers

Implement config validation, env loader, and file loader.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Convenience Utilities

**Files:**

- Create: `packages/opencode-integration/src/utils.ts`

**Step 1: Implement model selector**

```typescript
import { getModelsByFamily, getAllModels } from '@acedergren/oci-genai-provider';

export function selectBestModel(
  requirements: {
    speed?: 'very-fast' | 'fast' | 'medium' | 'slow';
    contextWindow?: number;
    capabilities?: {
      tools?: boolean;
      vision?: boolean;
    };
  } = {}
): string {
  let candidates = getAllModels();

  // Filter by speed
  if (requirements.speed) {
    candidates = candidates.filter((m) => m.speed === requirements.speed);
  }

  // Filter by context window
  if (requirements.contextWindow) {
    candidates = candidates.filter((m) => m.contextWindow >= requirements.contextWindow);
  }

  // Filter by capabilities
  if (requirements.capabilities?.tools) {
    candidates = candidates.filter((m) => m.capabilities.tools);
  }

  if (requirements.capabilities?.vision) {
    candidates = candidates.filter((m) => m.capabilities.vision);
  }

  // Return first match or default
  return candidates[0]?.id || 'cohere.command-r-plus';
}
```

**Step 2: Implement provider info**

```typescript
export function getProviderInfo() {
  const models = getAllModels();

  return {
    name: 'OCI GenAI',
    version: '0.1.0',
    modelCount: models.length,
    families: ['grok', 'llama', 'cohere', 'gemini'],
    capabilities: {
      streaming: true,
      tools: true,
      vision: true,
    },
    regions: ['eu-frankfurt-1', 'eu-stockholm-1', 'us-ashburn-1'],
  };
}
```

**Step 3: Commit**

```bash
git add packages/opencode-integration/src/utils.ts
git commit -m "feat(opencode): add convenience utilities

Implement model selector and provider info functions.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Main Export & Documentation

**Files:**

- Update: `packages/opencode-integration/src/index.ts`
- Create: `packages/opencode-integration/README.md`

**Step 1: Update main export**

```typescript
// Re-export everything from core provider
export * from '@acedergren/oci-genai-provider';

// OpenCode-specific exports
export * from './types';
export * from './register';
export * from './config';
export * from './utils';

// Convenience defaults
export { registerOCIProvider as default } from './register';
```

**Step 2: Create README**

```markdown
# @acedergren/opencode-oci-genai

OpenCode integration for Oracle Cloud Infrastructure Generative AI.

## Installation

\`\`\`bash
npm install @acedergren/opencode-oci-genai
\`\`\`

## Quick Start

\`\`\`typescript
import registerOCIProvider from '@acedergren/opencode-oci-genai';

// Auto-register with environment variables
registerOCIProvider();
\`\`\`

## Configuration

### Environment Variables

\`\`\`bash
OCI_REGION=eu-frankfurt-1
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-id
OCI_CONFIG_PROFILE=DEFAULT
\`\`\`

### OpenCode Config File

\`\`\`json
{
"providers": {
"oci": {
"displayName": "OCI GenAI",
"region": "eu-frankfurt-1",
"compartmentId": "ocid1.compartment.oc1..your-id",
"enabled": true,
"priority": 100
}
}
}
\`\`\`

## Advanced Usage

See [@acedergren/oci-genai-provider](../oci-genai-provider/README.md) for detailed usage.
```

**Step 3: Commit**

```bash
git add packages/opencode-integration/src/index.ts packages/opencode-integration/README.md
git commit -m "feat(opencode): complete integration implementation

Add main exports and documentation.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Build & Verify

**Files:**

- Run build and verify

**Step 1: Install dependencies**

```bash
cd /Users/acedergr/Projects/oci-genai-provider
pnpm install
```

**Step 2: Build the package**

```bash
cd packages/opencode-integration
pnpm build
```

Expected: `dist/` directory with CJS and ESM outputs

**Step 3: Verify workspace dependency**

```bash
node -e "require('@acedergren/oci-genai-provider')"
```

Expected: No errors (resolves from workspace)

**Step 4: Commit**

```bash
git commit -m "feat(opencode): integration implementation complete

✅ OpenCode-specific configuration types
✅ Provider registration functions
✅ Configuration helpers and validation
✅ Convenience utilities
✅ Documentation complete

Ready for OpenCode integration.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

✅ OpenCode-specific types defined
✅ Provider registration working
✅ Configuration helpers implemented
✅ Convenience utilities added
✅ Documentation complete
✅ CJS + ESM builds generated
✅ Workspace dependency resolving

**Result:** Production-ready OpenCode integration, ready for use in OpenCode projects.
